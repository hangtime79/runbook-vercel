// Shared by lib/content.ts (server, reads the files) and the x-ray components (client). No node imports here.

export const STOP_SECTIONS = ["What", "Tell", "Say", "Head of Fraud", "CIO", "Show", "Leave the app", "Craft", "Watch out"] as const;
export type StopSection = (typeof STOP_SECTIONS)[number];

export type XrayStop = {
  /** Order, from the filename's number prefix. */
  n: number;
  id: string;
  title: string;
  act: string;
  beat: string;
  route: string;
  fast: "keep" | "skip";
  /** Bridge stops: the demo leaves the app here. */
  bridge: boolean;
  sections: Partial<Record<StopSection, string>>;
};
