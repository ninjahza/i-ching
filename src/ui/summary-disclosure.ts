import { SUMMARY_READ_MORE, SUMMARY_SHOW_LESS } from "../data/app-strings.ts";
import type { SummaryElements } from "./shell-bind.ts";

function setExpanded(elements: SummaryElements, expanded: boolean, number: number | null): void {
  const label = expanded ? SUMMARY_SHOW_LESS : SUMMARY_READ_MORE;
  elements.region.hidden = !expanded;
  elements.toggle.textContent = label;
  elements.toggle.setAttribute("aria-expanded", String(expanded));
  if (number === null) elements.toggle.removeAttribute("aria-label");
  else elements.toggle.setAttribute("aria-label", `${label}: hexagram ${String(number)}`);
}

export function presentSummary(elements: SummaryElements, text: string, number: number): void {
  const paragraphs = text.split("\n\n");
  elements.first.textContent = paragraphs[0] ?? "";
  elements.second.textContent = paragraphs[1] ?? "";
  elements.second.hidden = paragraphs.length < 2;
  setExpanded(elements, false, number);
}

export function toggleSummary(elements: SummaryElements, number: number): void {
  setExpanded(elements, Boolean(elements.region.hidden), number);
}

export function clearSummary(elements: SummaryElements): void {
  elements.first.textContent = "";
  elements.second.textContent = "";
  elements.second.hidden = true;
  setExpanded(elements, false, null);
}
