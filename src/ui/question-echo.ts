// T023 — inert question echo (FR-013, C-10, R-11). textContent only: angle
// brackets, quotes and script-like sequences display literally and cannot
// alter structure; container uses white-space: pre-wrap for newlines.
export function echoQuestion(target: HTMLElement, card: HTMLElement, question: string | null): void {
  target.textContent = question ?? "";
  card.hidden = question === null;
}

/** C-8: remove any trace of the previous cast's echo (cleared, not hidden). */
export function clearQuestionEcho(target: HTMLElement, card: HTMLElement): void {
  target.textContent = "";
  card.hidden = true;
}
