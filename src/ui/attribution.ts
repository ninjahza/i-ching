// FR-008 — footer credit rendered with a link to the Wikipedia article on
// Legge's 1882 translation, opening in a new tab. The anchored text is the
// exact LEGGE_WIKI_MARKER substring of CORPUS_ATTRIBUTION, so the sentence
// reads unchanged whether or not the link is followed (single copy source).
// rel="noopener noreferrer" + the document's Referrer-Policy: no-referrer
// means no referrer and no window.opener channel to the opened tab.
// Only createElement / textContent — no markup parsing (B-6).
import { CORPUS_ATTRIBUTION } from "../data/texts.ts";
import {
  FOOTER_NOTE,
  LEGGE_WIKI_HINT,
  LEGGE_WIKI_MARKER,
  LEGGE_WIKI_URL
} from "../data/app-strings.ts";

export function renderAttribution(into: HTMLElement): void {
  into.replaceChildren();
  const parts = CORPUS_ATTRIBUTION.split(LEGGE_WIKI_MARKER);
  const [before, after] = parts;
  if (parts.length !== 2 || before === undefined || after === undefined) {
    // Copy drifted from the marker in source review: fall back to plain text.
    into.textContent = CORPUS_ATTRIBUTION + FOOTER_NOTE;
    return;
  }
  const link = document.createElement("a");
  link.href = LEGGE_WIKI_URL;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.title = LEGGE_WIKI_HINT;
  link.textContent = LEGGE_WIKI_MARKER;
  into.appendChild(document.createTextNode(before));
  into.appendChild(link);
  into.appendChild(document.createTextNode(after + FOOTER_NOTE));
}
