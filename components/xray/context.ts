"use client";

import { createContext, useContext } from "react";
import type { XrayObjection, XrayStop } from "@/lib/xrayTypes";

export type XrayContextValue = {
  stops: XrayStop[];
  objections: XrayObjection[];
  /** Objection markers are shown (on by default; resets on reload like the mode itself). */
  objectionsOn: boolean;
  setObjectionsOn: (on: boolean) => void;
  /** The mode is switched on. */
  on: boolean;
  /** The screen is wide enough for the mode (768px and up). */
  enabled: boolean;
  setOn: (on: boolean) => void;
  toggle: () => void;
};

export const XrayContext = createContext<XrayContextValue | null>(null);

export function useXray(): XrayContextValue {
  const ctx = useContext(XrayContext);
  if (!ctx) throw new Error("useXray must be used inside <XrayProvider>");
  return ctx;
}
