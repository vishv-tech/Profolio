# Resume processing pipeline

The upload action validates and stores one private PDF. The processing action
keeps the existing ownership-scoped claim, downloads the file once, validates
the stored bytes once, and shares the same immutable `Uint8Array` between two
branches.

## Parallel extraction

The deterministic PDF.js parser and the Gemini fallback chain start in the same
turn. Gemini receives the PDF immediately; it never waits for local text
extraction. The local parser extracts text only and builds conservative
`PortfolioData` from explicit contact details, headings, labels, bullets, and
visible text URLs. Unknown facts remain empty. Text must pass character, line,
page-density, and garbage checks, and the resulting portfolio must contain an
identity/contact signal plus a substantive resume section.

Gemini has priority. Any schema-valid Gemini result is selected unchanged. The
deterministic result is consulted only after the entire bounded Gemini chain
fails. If both branches fail, processing is marked failed with a truthful
readability message. Selection happens before optional profile-media work and
before the single completion database write.

PDF.js is listed in Next.js `serverExternalPackages`. In the Node build PDF.js
uses its supported fake-worker path, whose dynamic `./pdf.worker.mjs` import
must resolve beside the installed package instead of beside a Turbopack server
chunk. No `.next` paths or copied worker assets are required.

## Gemini budget

The configured order remains:

1. `gemini-3.7-flash`
2. `gemini-3.6-flash`
3. `gemini-3.5-flash`

Models run sequentially. Each attempt is limited to 12 seconds, and the initial
request plus its optional one-time schema repair share a 30-second total
budget. SDK retries are disabled (`attempts: 1`), and there is no added
backoff: retryable capacity, 5xx, timeout, and recognized network failures move
directly to the next configured model. Quota-only 429 responses, authentication
failures, invalid configuration, and malformed requests stop the AI branch
immediately so the ready deterministic result can be selected.

For safe local fallback QA, set `RESUME_DEV_FORCE_AI_UNAVAILABLE=1` while
running `next dev`. Production ignores this flag.

## Diagnostics

Development logs contain stage names, safe outcomes, model names, rounded
durations, the parallel branch start gap, and the selected source. They never
contain filenames, storage paths, resume text, contact information, URLs, API
responses, raw bytes, or credentials. The Review fallback notice appears only
when the deterministic source wins the active processing request.
