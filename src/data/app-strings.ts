// T030 — all app-authored copy in one audited place (C-7, FR-011, T034 review gate).
// Every string here was reviewed against the US3 content checklist: sober and
// neutral, no predictions, no guarantees, no medical/legal/financial advice,
// neutral across beliefs; corpus texts appear only as attributed quotations.
// Pure data: no DOM (purity.test.ts covers src/data/**).

export const APP_TITLE = "I Ching — a consultation for reflection";

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

/** C-3 / FR-003: honest decline when no secure random source exists. */
export const DECLINE_NO_RANDOM =
  "Casting is unavailable on this device: it offers no secure random source " +
  "(crypto.getRandomValues), and this app will not cast from a weaker one. " +
  "Nothing else about the page is affected.";

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
