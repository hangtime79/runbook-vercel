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

export const OBJECTION_SECTIONS = ["They say", "Why they ask", "Answer", "Show", "Don't say", "Sources"] as const;
export type ObjectionSection = (typeof OBJECTION_SECTIONS)[number];
export const OBJECTION_WHO = ["CIO", "Head of Fraud", "Either"] as const;
export const OBJECTION_THEMES = ["sovereignty", "cost-lockin", "ai-risk", "shadow-it", "competitor"] as const;

export type XrayObjection = {
  id: string;
  title: string;
  who: (typeof OBJECTION_WHO)[number];
  theme: (typeof OBJECTION_THEMES)[number];
  /** The id of the x-ray stop whose element carries this objection's marker. */
  anchor: string;
  sections: Partial<Record<ObjectionSection, string>>;
};
