// Shared by lib/content.ts (server, reads the files) and the x-ray components (client). No node imports here.

export const STOP_SECTIONS = ["What", "Tell", "On Vercel", "Say", "Head of Fraud", "CIO", "Show", "Leave the app", "Craft", "Watch out"] as const;
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
  /** The stop's element lives in the Ask panel, so goTo opens the panel (it starts closed under 1240px). */
  panel: boolean;
  /** Ghost stop: the element to sit on until the stop's own element exists (a stop id or a data-xray-standin id). */
  standIn?: string;
  /** Ghost stop: the stop number that makes the real element appear. */
  appearsAfter?: number;
  /** Ghost stop: what to do first, shown after "Appears after stop N:". */
  appearsHint?: string;
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
