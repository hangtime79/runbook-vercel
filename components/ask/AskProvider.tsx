"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type ChatStatus, type UIMessage } from "ai";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

type AskContextValue = {
  messages: UIMessage[];
  status: ChatStatus;
  error: Error | undefined;
  busy: boolean;
  /** Send a question and open the panel. Ignored while an answer is streaming. */
  ask: (text: string) => void;
  /** Model switch: null options when the server has it off (ASK_DEMO_MODEL_SWITCH unset). */
  modelChoice: { models: { id: string; label: string }[]; selected: string; select: (id: string) => void } | null;
  panelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
};

const AskContext = createContext<AskContextValue | null>(null);

// The panel starts open on wide screens and collapsed under 1240px; a click overrides that.
const WIDE = "(min-width: 1240px)";
function subscribeWide(cb: () => void) {
  const mq = window.matchMedia(WIDE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/**
 * One conversation for the whole app. It lives in the root layout, so the side panel and the /ask
 * page show the same messages and the chat survives navigation.
 */
export function AskProvider({ children }: { children: ReactNode }) {
  // useChat defaults to POST /api/chat; the route in this app is /api/ask.
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/ask" }), []);
  const { messages, sendMessage, status, error } = useChat({ transport });
  const busy = status === "submitted" || status === "streaming";

  const wide = useSyncExternalStore(
    subscribeWide,
    () => window.matchMedia(WIDE).matches,
    () => false
  );
  const [manual, setManual] = useState<boolean | null>(null);
  const panelOpen = manual ?? wide;

  // Server-owned config: whether the model switch is on, and the allowlist. The server re-checks
  // the chosen id, so this only draws the control.
  const [config, setConfig] = useState<{
    switchEnabled: boolean;
    models: { id: string; label: string }[];
    defaultModel: string;
  } | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/ask")
      .then((r) => (r.ok ? r.json() : null))
      .then(setConfig)
      .catch(() => setConfig(null));
  }, []);
  const selected = chosen ?? config?.defaultModel ?? "";

  const ask = useCallback(
    (text: string) => {
      const q = text.trim();
      if (!q || busy) return;
      setManual(true);
      sendMessage({ text: q }, config?.switchEnabled && selected ? { body: { model: selected } } : undefined);
    },
    [busy, sendMessage, config, selected]
  );

  const modelChoice = config?.switchEnabled
    ? { models: config.models, selected, select: setChosen }
    : null;

  const value = useMemo(
    () => ({ messages, status, error, busy, ask, modelChoice, panelOpen, setPanelOpen: setManual }),
    [messages, status, error, busy, ask, modelChoice, panelOpen]
  );
  return <AskContext.Provider value={value}>{children}</AskContext.Provider>;
}

export function useAsk(): AskContextValue {
  const ctx = useContext(AskContext);
  if (!ctx) throw new Error("useAsk must be used inside <AskProvider>");
  return ctx;
}
