// T030 — all app-authored copy in one audited place (C-7, FR-011, T034 review gate).
// Every string here was reviewed against the US3 content checklist: sober and
// neutral, no predictions, no guarantees, no medical/legal/financial advice,
// neutral across beliefs; corpus quotations and summaries are attributed.
// Pure data: no DOM (purity.test.ts covers src/data/**).
import type { LineValue } from "../core/line-values.ts";

export const APP_TITLE = "I Ching — a consultation for reflection";

export const SUMMARY_READ_MORE = "Read more";
export const SUMMARY_SHOW_LESS = "Show less";

/** One paragraph of the FR-014 explanation (rendered as <p>, <strong> if flagged). */
export interface ExplanationParagraph {
  readonly text: string;
  /** The reviewed disclaimer paragraph is emphasised (was <strong> in the shell). */
  readonly strong?: boolean;
}

/** The FR-014 explanation: what a consultation is and is not.
 * Single source for both the landing intro card and the result-page
 * "What is this about?" toggle — they must never drift apart. */
export const EXPLANATION: readonly ExplanationParagraph[] = [
  {
    text:
      "This is a single-purpose meditation on the I Ching, the ancient Chinese " +
      "Book of Changes. You may hold a question in mind — or not — and cast six " +
      "lines to arrive at one of the sixty-four hexagrams."
  },
  {
    text:
      "Each hexagram carries a classical judgement and image, quoted here from " +
      "James Legge's 1882 public-domain translation, offered as a mirror for " +
      "your own reflection."
  },
  {
    text:
      "This app makes no predictions, gives no advice on medical, legal or " +
      "financial matters, and claims to know nothing about your future.",
    strong: true
  },
  {
    text: "What you read is an old text; what it means to you is yours to decide."
  }
];

/** C-3 / FR-003 / FR-012: method-specific messaging when no secure random source exists. */
export const DECLINE_NO_RANDOM =
  "Automatic casting (Three coins and Yarrow stalks) is unavailable on this device: " +
  "it offers no secure random source (crypto.getRandomValues), and this app will not " +
  "cast from a weaker one. Select User cast above to record lines cast by hand.";

/** C-2: notice when a question longer than the bound was shortened. */
export const TRUNCATION_NOTICE =
  "Your question was shortened to the first 500 characters for this cast.";

/** C-6: stable-cast message — neutral, never implies a lesser cast. */
export const STABLE_MESSAGE =
  "No changing lines — the hexagram is stable. Nothing is missing from this " +
  "cast; stillness is its own text.";

/** Footer line appended under the corpus attribution (visible, static). */
export const FOOTER_NOTE = " Rendered for reflection only; this app makes no predictions.";

/** FR-008 footer credit: the exact attributed phrase in CORPUS_ATTRIBUTION that
 * is linkified, and the Wikipedia article about Legge's 1882 translation it
 * links to. Label === the attributed phrase, so the link adds no new copy. */
export const LEGGE_WIKI_MARKER = "James Legge, \"The Yi King\"";
export const LEGGE_WIKI_URL = "https://en.wikipedia.org/wiki/James_Legge";
export const LEGGE_WIKI_HINT = "Opens in a new tab: Wikipedia article on James Legge, translator of \"The Yi King\"";

/** The standalone feature 003 publication, deliberately linked without consultation state. */
export const MODERN_GUIDE_URL = "modern-guide.html";
export const MODERN_GUIDE_LINK_LABEL = "Read the modern guide (opens separately)";

/** Consent disclosures announced when the toggle flips (FR-022 plain language). */
export const CONSENT_ON = "Your method choice will be remembered on this device.";
export const CONSENT_OFF = "Your stored method choice has been deleted from this device.";

/** aria-live and figure-label builders (formats fixed by C-4). */
export function announceLineText(pos: number, lineName: string, yang: boolean, changing: boolean): string {
  const kind = yang ? "unbroken line" : "broken line";
  return `Line ${String(pos)}: ${lineName} - ${kind}${changing ? ", changing" : ""}.`;
}

export function announceCastingBegins(): string {
  return "Casting begins. The bottom line arrives first.";
}

export function primaryFigureLabel(num: number, name: string, changingPositions: readonly number[]): string {
  const ps = changingPositions.map(String).join(", ");
  const clause =
    changingPositions.length === 1
      ? `changing line in position ${ps}`
      : `changing lines in positions ${ps}`;
  return `Hexagram ${String(num)} - ${name}; ${clause}.`;
}

export function relatedFigureLabel(num: number, name: string): string {
  return `Hexagram ${String(num)} - ${name}.`;
}

export function announceResultText(
  num: number,
  name: string,
  related: { readonly num: number; readonly name: string } | null,
): string {
  return related === null
    ? `Hexagram ${String(num)} - ${name}, stable.`
    : `Hexagram ${String(num)} - ${name}, becoming hexagram ${String(related.num)} - ${related.name}.`;
}

export function identityText(num: number, name: string): string {
  return `${String(num)} · ${name}`;
}

export function trigramsText(upperName: string, lowerName: string): string {
  return `Trigrams: ${upperName} above · ${lowerName} below`;
}

/** Feature 004: User cast reviewed copy and accessible builders (FR-002..FR-008, FR-016). */
export const AUTOMATIC_CAST_SUBTITLE =
  "Six lines arrive from the bottom up, as they were always cast.";

export const USER_CAST_SUBTITLE =
  "Record six lines from the bottom up, one throw at a time.";

export interface ManualGuideItem {
  readonly lead: string;
  readonly body: string;
}

export const USER_CAST_GUIDE_HEADING = "How to count a throw (6–9)";

export const USER_CAST_GUIDE: readonly ManualGuideItem[] = [
  {
    lead: "Three coins: ",
    body:
      "Toss 3 coins together. Count heads = 3 and tails = 2, then add them up — " +
      "3 tails = 6 · 2 tails + 1 head = 7 · 2 heads + 1 tail = 8 · 3 heads = 9.",
  },
  {
    lead: "Yarrow stalks: ",
    body:
      "Start with 50 stalks and set 1 aside. Do 3 rounds: split into two piles, hold 1 " +
      "from the right, clear groups of 4 from each pile, and put the leftovers aside. " +
      "Divide the stalks left in your hand by 4 — 24 = 6 · 28 = 7 · 32 = 8 · 36 = 9.",
  },
  {
    lead: "Six lines, bottom to top: ",
    body:
      "Pick that final 6–9 number (not a raw coin or stalk count) and press Add line " +
      "six times. This app simply records what you choose.",
  },
];

export interface ManualValueChoice {
  readonly value: LineValue;
  readonly name: string;
  readonly lineKind: string;
  readonly stability: string;
  readonly summary: string;
  readonly accessibleLabel: string;
}

export const MANUAL_VALUE_CHOICES: readonly ManualValueChoice[] = [
  {
    value: 6,
    name: "Old yin",
    lineKind: "broken line",
    stability: "changing",
    summary: "Old yin — broken, changing",
    accessibleLabel: "6: Old yin, broken line, changing",
  },
  {
    value: 7,
    name: "Young yang",
    lineKind: "solid line",
    stability: "stable",
    summary: "Young yang — solid, stable",
    accessibleLabel: "7: Young yang, solid line, stable",
  },
  {
    value: 8,
    name: "Young yin",
    lineKind: "broken line",
    stability: "stable",
    summary: "Young yin — broken, stable",
    accessibleLabel: "8: Young yin, broken line, stable",
  },
  {
    value: 9,
    name: "Old yang",
    lineKind: "solid line",
    stability: "changing",
    summary: "Old yang — solid, changing",
    accessibleLabel: "9: Old yang, solid line, changing",
  },
];

export function manualChoiceFor(value: LineValue): ManualValueChoice {
  for (const choice of MANUAL_VALUE_CHOICES) {
    if (choice.value === value) return choice;
  }
  throw new Error(`unknown manual line value: ${String(value)}`);
}

const POSITION_ORIENTATIONS = [
  "bottom line",
  "second from bottom",
  "third from bottom",
  "fourth from bottom",
  "fifth from bottom",
  "top line",
] as const;

export function manualPositionPhrase(position: number): string {
  const orientation = POSITION_ORIENTATIONS[position - 1] ?? "line";
  return `line ${String(position)} of 6 (${orientation})`;
}

export function manualProgressText(confirmedCount: number): string {
  if (confirmedCount >= 6) {
    return "All 6 of 6 lines recorded (bottom to top).";
  }
  const nextPos = confirmedCount + 1;
  const orientation = POSITION_ORIENTATIONS[nextPos - 1] ?? "line";
  const noun = confirmedCount === 1 ? "line" : "lines";
  return `Line ${String(nextPos)} of 6 (${orientation}) — ${String(confirmedCount)} of 6 ${noun} recorded.`;
}

export const MANUAL_SELECTION_NONE =
  "No line value selected yet. Choose 6, 7, 8, or 9, then activate Add line.";

export function manualSelectionText(value: LineValue, position: number): string {
  const choice = manualChoiceFor(value);
  return `Selected for ${manualPositionPhrase(position)}: ${choice.accessibleLabel}. Activate Add line to record it.`;
}

export const MANUAL_INVALID_VALUE_ERROR =
  "Choose one of the final line values — 6, 7, 8, or 9 — before adding a line. Recorded lines and progress were not changed.";

export const MANUAL_CANCEL_ANNOUNCEMENT =
  "Returned to casting method selection. Unfinished lines were discarded.";

export function announceManualCastingBegins(): string {
  return "User cast begins. Choose 6, 7, 8, or 9 for line 1 of 6 (bottom line), then activate Add line.";
}

export function announceManualSelection(value: LineValue, position: number): string {
  const choice = manualChoiceFor(value);
  return `Selected ${choice.accessibleLabel} for ${manualPositionPhrase(position)}. Activate Add line to record it.`;
}

export function announceManualLineAdded(position: number, value: LineValue, lineName: string): string {
  const choice = manualChoiceFor(value);
  return `Recorded line ${String(position)} of 6: ${lineName} (${choice.accessibleLabel}). Next: ${manualPositionPhrase(position + 1)}.`;
}

export function announceManualFinalLineAndResult(
  value: LineValue,
  lineName: string,
  num: number,
  name: string,
  related: { readonly num: number; readonly name: string } | null,
): string {
  const choice = manualChoiceFor(value);
  return `Recorded line 6 of 6 (top line): ${lineName} (${choice.accessibleLabel}). ${announceResultText(num, name, related)}`;
}

export function announceManualUndo(removedPosition: number, removedValue: LineValue): string {
  const choice = manualChoiceFor(removedValue);
  return `Removed line ${String(removedPosition)} of 6 (${choice.accessibleLabel}). Now on ${manualPositionPhrase(removedPosition)}.`;
}

