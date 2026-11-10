// FR-014 — renders the reviewed EXPLANATION copy into a prepared container.
// The landing intro card and the result-page "What is this about?" toggle both
// render from EXPLANATION (src/data/app-strings.ts), so they never drift apart.
// Only createElement / textContent — no markup parsing (B-6).
import type { ExplanationParagraph } from "../data/app-strings.ts";

export function renderExplanation(into: HTMLElement, paragraphs: readonly ExplanationParagraph[]): void {
  into.replaceChildren();
  for (const p of paragraphs) {
    const para = document.createElement("p");
    if (p.strong === true) {
      const strong = document.createElement("strong");
      strong.textContent = p.text;
      para.appendChild(strong);
    } else {
      para.textContent = p.text;
    }
    into.appendChild(para);
  }
}
