"use client";

import {
  CornerDownLeft,
  LoaderCircle,
  RotateCcw,
  Sparkles,
  Undo2,
  X,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import {
  getThemeStyleOverrides,
  hasThemeStyleOverrides,
} from "@/lib/theme-ai/capabilities";
import { cn } from "@/lib/utils";
import type { ThemeConfig, ThemeStyleOverrides } from "@/types/theme";

import {
  customizePortfolioTheme,
  resetPortfolioThemeCustomization,
  undoPortfolioThemeCustomization,
} from "./theme-studio-actions";
import styles from "./ThemeStudio.module.css";

const SUGGESTIONS = [
  "Dark & modern",
  "Professional blue",
  "Minimal & clean",
  "Larger headings",
  "More rounded",
  "More spacious",
] as const;

type StudioMessage = {
  id: number;
  role: "assistant" | "user";
  text: string;
  tone?: "error";
};

export function ThemeStudio({
  config,
  layoutKey,
  onClose,
  onConfigSaved,
  open,
  portfolioId,
}: {
  config: ThemeConfig;
  layoutKey: string;
  onClose: () => void;
  onConfigSaved: (config: ThemeConfig) => void;
  open: boolean;
  portfolioId: string;
}) {
  const nextMessageId = useRef(1);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<StudioMessage[]>([
    {
      id: 0,
      role: "assistant",
      text: "How would you like to customize this theme? I'll update only its visual design.",
    },
  ]);
  const [undoSnapshot, setUndoSnapshot] = useState<{
    styleOverrides: ThemeStyleOverrides | null;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const hasCustomization = hasThemeStyleOverrides(config);

  useEffect(() => {
    if (open) closeButtonRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const element = messagesRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [messages, isPending]);

  function addMessage(message: Omit<StudioMessage, "id">) {
    setMessages((current) => [
      ...current,
      { ...message, id: nextMessageId.current++ },
    ]);
  }

  function sendInstruction(value: string) {
    const instruction = value.trim();
    if (!instruction || isPending) return;

    const previousConfig = config;
    setInput("");
    addMessage({ role: "user", text: instruction });

    startTransition(async () => {
      try {
        const result = await customizePortfolioTheme(
          portfolioId,
          layoutKey,
          instruction,
          previousConfig,
        );

        if (!result.success) {
          addMessage({ role: "assistant", text: result.message, tone: "error" });
          return;
        }

        if (result.applied) {
          setUndoSnapshot({
            styleOverrides: getThemeStyleOverrides(previousConfig),
          });
          onConfigSaved(result.themeConfig);
        }
        addMessage({ role: "assistant", text: result.message });
      } catch {
        addMessage({
          role: "assistant",
          tone: "error",
          text: "I couldn't update the theme just now. Please try again.",
        });
      }
    });
  }

  function submitInstruction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendInstruction(input);
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    ) {
      return;
    }

    event.preventDefault();
    sendInstruction(input);
  }

  function undoLastChange() {
    if (!undoSnapshot || isPending) return;

    const snapshot = undoSnapshot;
    startTransition(async () => {
      try {
        const result = await undoPortfolioThemeCustomization(
          portfolioId,
          layoutKey,
          config,
          snapshot.styleOverrides,
        );

        if (!result.success) {
          addMessage({ role: "assistant", text: result.message, tone: "error" });
          return;
        }

        onConfigSaved(result.themeConfig);
        setUndoSnapshot(null);
        addMessage({ role: "assistant", text: result.message });
      } catch {
        addMessage({
          role: "assistant",
          tone: "error",
          text: "The previous style could not be restored. Your current theme has not been changed.",
        });
      }
    });
  }

  function resetCustomization() {
    if (isPending) return;

    const previousConfig = config;
    startTransition(async () => {
      try {
        const result = await resetPortfolioThemeCustomization(
          portfolioId,
          layoutKey,
          previousConfig,
        );

        if (!result.success) {
          addMessage({ role: "assistant", text: result.message, tone: "error" });
          return;
        }

        if (result.applied) {
          setUndoSnapshot({
            styleOverrides: getThemeStyleOverrides(previousConfig),
          });
          onConfigSaved(result.themeConfig);
        }
        addMessage({ role: "assistant", text: result.message });
      } catch {
        addMessage({
          role: "assistant",
          tone: "error",
          text: "The customization could not be reset. Your current theme has not been changed.",
        });
      }
    });
  }

  return (
    <aside
      aria-labelledby="ai-theme-engine-title"
      className={cn(styles.studio, open && styles.studioOpen)}
      hidden={!open}
      id="ai-theme-engine-drawer"
    >
      <header className={styles.header}>
        <div>
          <span className={styles.badge}>
            <Sparkles aria-hidden="true" />
            Customize with AI
          </span>
          <h3 id="ai-theme-engine-title">AI Theme Engine</h3>
        </div>
        <button
          aria-label="Close AI Theme Engine"
          className={styles.closeButton}
          onClick={onClose}
          ref={closeButtonRef}
          type="button"
        >
          <X aria-hidden="true" />
        </button>
        <p>Customize the look of this theme with AI. Content and publishing stay untouched.</p>
      </header>

      <div
        aria-label="AI Theme Engine conversation"
        aria-live="polite"
        className={styles.messages}
        ref={messagesRef}
        role="log"
      >
        {messages.map((message) => (
          <div
            className={
              message.role === "user"
                ? styles.userMessage
                : message.tone === "error"
                  ? styles.errorMessage
                  : styles.assistantMessage
            }
            key={message.id}
          >
            <span>{message.role === "user" ? "You" : "AI"}</span>
            <p>{message.text}</p>
          </div>
        ))}
      </div>

      <div className={styles.suggestions}>
        {SUGGESTIONS.map((suggestion) => (
          <button
            disabled={isPending}
            key={suggestion}
            onClick={() => sendInstruction(suggestion)}
            type="button"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <form className={styles.form} onSubmit={submitInstruction}>
        <label htmlFor="theme-studio-instruction">Describe a design change</label>
        <div className={styles.composer}>
          <textarea
            disabled={isPending}
            id="theme-studio-instruction"
            maxLength={500}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleComposerKeyDown}
            placeholder="Describe how you'd like this theme to look..."
            rows={3}
            value={input}
          />
          <button
            aria-label="Send theme customization request"
            disabled={isPending || !input.trim()}
            type="submit"
          >
            {isPending ? (
              <LoaderCircle aria-hidden="true" className={styles.spinner} />
            ) : (
              <CornerDownLeft aria-hidden="true" />
            )}
            <span>{isPending ? "Updating…" : "Send"}</span>
          </button>
        </div>
      </form>

      <div aria-live="polite" className={styles.status} role="status">
        {isPending ? "Updating theme… Current preview remains visible." : ""}
      </div>

      <div className={styles.utilities}>
        <button
          disabled={isPending || !undoSnapshot}
          onClick={undoLastChange}
          type="button"
        >
          <Undo2 aria-hidden="true" />
          Undo last change
        </button>
        <button
          disabled={isPending || !hasCustomization}
          onClick={resetCustomization}
          type="button"
        >
          <RotateCcw aria-hidden="true" />
          Reset customization
        </button>
      </div>
    </aside>
  );
}
