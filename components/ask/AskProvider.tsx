"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type ChatStatus, type UIMessage } from "ai";
import {
  createContext,
  useCallback,
  useContext,
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

  const ask = useCallback(
    (text: string) => {
      const q = text.trim();
      if (!q || busy) return;
      setManual(true);
      sendMessage({ text: q });
    },
    [busy, sendMessage]
  );

  const value = useMemo(
    () => ({ messages, status, error, busy, ask, panelOpen, setPanelOpen: setManual }),
    [messages, status, error, busy, ask, panelOpen]
  );
  return <AskContext.Provider value={value}>{children}</AskContext.Provider>;
}

export function useAsk(): AskContextValue {
  const ctx = useContext(AskContext);
  if (!ctx) throw new Error("useAsk must be used inside <AskProvider>");
  return ctx;
}
