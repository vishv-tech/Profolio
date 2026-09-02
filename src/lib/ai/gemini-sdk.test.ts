import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { GoogleGenAI } from "@google/genai";

test("shared Gemini availability order starts with 3.5 and keeps both fallbacks", () => {
  const source = readFileSync(
    fileURLToPath(new URL("./gemini.ts", import.meta.url)),
    "utf8",
  );
  const configuredModels = source.match(
    /GEMINI_RESUME_MODELS\s*=\s*\[([\s\S]*?)\]\s*as const/u,
  );

  assert.ok(configuredModels);
  assert.deepEqual(
    [...configuredModels[1].matchAll(/"([^"]+)"/gu)].map((match) => match[1]),
    ["gemini-3.5-flash", "gemini-3.6-flash", "gemini-3.7-flash"],
  );
});

function rejectWhenAborted(signal: AbortSignal | null | undefined) {
  return new Promise<Response>((_, reject) => {
    if (!signal) {
      reject(new Error("The Gemini SDK did not pass a signal to fetch."));
      return;
    }

    const rejectAbort = () =>
      reject(new DOMException("This operation was aborted", "AbortError"));

    if (signal.aborted) {
      rejectAbort();
      return;
    }

    signal.addEventListener("abort", rejectAbort, { once: true });
  });
}

test("installed Gemini SDK forwards caller aborts and its HTTP timeout to fetch", async () => {
  const originalFetch = globalThis.fetch;
  const receivedSignals: AbortSignal[] = [];
  globalThis.fetch = async (_input, init) => {
    const signal = init?.signal;

    if (signal) {
      receivedSignals.push(signal);
    }

    return rejectWhenAborted(signal);
  };

  try {
    const client = new GoogleGenAI({ apiKey: "test-only-key" });
    const callerController = new AbortController();
    const callerRequest = client.models.generateContent({
      model: "gemini-test",
      contents: "test",
      config: {
        abortSignal: callerController.signal,
        httpOptions: { retryOptions: { attempts: 1 }, timeout: 1_000 },
      },
    });
    callerController.abort();

    await assert.rejects(callerRequest, { name: "AbortError" });

    const timeoutStartedAt = performance.now();
    await assert.rejects(
      client.models.generateContent({
        model: "gemini-test",
        contents: "test",
        config: {
          httpOptions: { retryOptions: { attempts: 1 }, timeout: 20 },
        },
      }),
      { name: "AbortError" },
    );

    assert.equal(receivedSignals.length, 2);
    assert.equal(receivedSignals.every((signal) => signal.aborted), true);
    assert.ok(performance.now() - timeoutStartedAt < 500);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
