// T022 — CSS-figure line rendering (R-6, FR-006, FR-017).
// Only createElement / textContent / setAttribute — no markup parsing (B-6).
import type { CastLine } from "../core/pattern.ts";
import { MARKER_OLD_YANG, MARKER_OLD_YIN } from "../core/line-values.ts";

/**
 * Pre-create six hidden row slots in a figure container, top line first
 * (position 6 at the top), bottom last; returns the slot elements. The reveal
 * loop fills slot for position p (bottom-up) so the DOM never reorders.
 */
export function prepareFigureSlots(container: HTMLElement): void {
  container.textContent = "";
  for (let position = 6; position >= 1; position--) {
    const row = document.createElement("div");
    row.className = "hex-row";
    row.dataset["position"] = String(position);
    row.hidden = true;
    container.appendChild(row);
  }
}

function barFor(isYangLine: boolean): HTMLElement {
  const bar = document.createElement("div");
  bar.className = `hex-bar ${isYangLine ? "yang" : "yin"}`;
  const segCount = isYangLine ? 1 : 2;
  for (let i = 0; i < segCount; i++) {
    const seg = document.createElement("div");
    seg.className = "seg";
    bar.appendChild(seg);
  }
  return bar;
}

/** Reveal one line into its prepared slot: bars + (if changing) marker + word. */
export function fillSlot(container: HTMLElement, line: CastLine): void {
  const slot = container.querySelector(`.hex-row[data-position="${String(line.position)}"]`);
  if (!(slot instanceof HTMLElement)) return;
  slot.textContent = "";
  slot.appendChild(barFor(line.value === 7 || line.value === 9));
  if (line.changing) {
    const mark = document.createElement("span");
    mark.className = "changing-mark";
    const glyph = document.createElement("span");
    glyph.setAttribute("aria-hidden", "true");
    glyph.textContent = line.value === 9 ? MARKER_OLD_YANG : MARKER_OLD_YIN;
    mark.appendChild(glyph);
    const word = document.createElement("span");
    word.textContent = "changing"; // shape + word, never colour alone (C-4)
    mark.appendChild(word);
    slot.appendChild(mark);
  }
  slot.hidden = false;
}

/**
 * Whole-figure labelling (R-6): bars stay decorative (aria-hidden on rows is
 * unnecessary since the figure exposes role=img + aria-label text), and the
 * label states number, name and changing positions as text.
 */
export function labelFigure(container: HTMLElement, kwNumber: number, name: string, changingPositions: readonly number[]): void {
  container.setAttribute("aria-label", figureLabel(kwNumber, name, changingPositions));
}

export function figureLabel(kwNumber: number, name: string, changingPositions: readonly number[]): string {
  const changingText = changingPositions.length === 0
    ? ""
    : `; changing ${changingPositions.length === 1 ? "line" : "lines"} in position${changingPositions.length === 1 ? "" : "s"} ${changingPositions.join(", ")}`;
  return `Hexagram ${String(kwNumber)} - ${name}${changingText}.`;
}

