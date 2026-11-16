// T025 / T010 / T012 — step controllers: question / casting / result (automatic & manual).
// The composition root (src/ui/main.ts) supplies the consultation factory and
// the announcer; this module owns reveal pacing, manual entry state, and result rendering.

import type { Shell } from "./shell-bind.ts";
import { showStep } from "./shell-bind.ts";
import type { Announcer } from "./announce.ts";
import { prepareFigureSlots, fillSlot, clearSlot, labelFigure } from "./line-view.ts";
import { echoQuestion, clearQuestionEcho } from "./question-echo.ts";
import { presentSummary, toggleSummary, clearSummary } from "./summary-disclosure.ts";
import type { Consultation } from "../core/consultation.ts";
import { QUESTION_MAX } from "../core/consultation.ts";
import type { CastLine } from "../core/pattern.ts";
import type { LineValue } from "../core/line-values.ts";
import { hexagramSymbol } from "../core/hexagram.ts";
import { chineseName } from "../data/hexagram-chinese.ts";
import {
  AUTOMATIC_CAST_SUBTITLE,
  DECLINE_NO_RANDOM,
  MANUAL_CANCEL_ANNOUNCEMENT,
  MANUAL_INVALID_VALUE_ERROR,
  MANUAL_SELECTION_NONE,
  STABLE_MESSAGE,
  TRUNCATION_NOTICE,
  USER_CAST_GUIDE,
  USER_CAST_GUIDE_HEADING,
  USER_CAST_SUBTITLE,
  announceCastingBegins,
  announceManualCastingBegins,
  announceResultText,
  identityText,
  manualPositionPhrase,
  manualProgressText,
  manualSelectionText,
  trigramsText,
} from "../data/app-strings.ts";
import type { Hexagram } from "../core/hexagram.ts";

const REVEAL_INTERVAL_MS = 400; // R-5

export interface StepsDeps {
  shell: Shell;
  announcer: Announcer;
  /** Method-aware start availability: true always for User cast; requires secure random only for automatic methods. */
  canStartCast(): boolean;
  /** Starts a fresh Consultation (question captured here, null on re-cast). */
  beginConsultation(question: string | null): Consultation;
}

export interface Steps {
  showQuestion(): void;
  startCast(): void;
  selectLineValue(raw: unknown): boolean;
  addLine(...args: readonly unknown[]): boolean;
  undoLastLine(): boolean;
  cancelManualCast(): void;
  revealAll(): void;
  castAgain(): void;
  toggleExplanation(): void;
  togglePrimarySummary(): void;
  toggleRelatedSummary(): void;
}

function parseStrictLineValue(raw: unknown): LineValue | null {
  if (typeof raw === "number") {
    return raw === 6 || raw === 7 || raw === 8 || raw === 9 ? raw : null;
  }
  if (typeof raw === "string") {
    if (raw === "6") return 6;
    if (raw === "7") return 7;
    if (raw === "8") return 8;
    if (raw === "9") return 9;
  }
  return null;
}

export function createSteps(deps: StepsDeps): Steps {
  const { shell, announcer } = deps;
  let consultation: Consultation | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;
  let pendingValue: LineValue | null = null;

  renderManualGuide(shell.manualInstructions);

  function canStart(): boolean {
    return deps.canStartCast();
  }

  function stopTimer(): void {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }

  function clearManualError(): void {
    shell.manualError.textContent = "";
    shell.manualError.hidden = true;
  }

  function showManualError(message: string): void {
    shell.manualError.textContent = message;
    shell.manualError.hidden = false;
    announcer.announceStatus(message);
  }

  function clearManualSelectionUi(): void {
    pendingValue = null;
    for (const radio of shell.lineValueRadios) {
      radio.checked = false;
    }
    shell.addLineButton.disabled = true;
    shell.manualSelection.textContent = MANUAL_SELECTION_NONE;
  }

  function syncManualProgressUi(confirmedCount: number): void {
    shell.manualProgress.textContent = manualProgressText(confirmedCount);
    shell.undoLineButton.disabled = confirmedCount === 0 || confirmedCount >= 6;
    shell.castingFigure.setAttribute(
      "aria-label",
      `The emerging hexagram, ${String(confirmedCount)} of 6 lines recorded.`,
    );
    shell.manualValuesLegend.textContent =
      confirmedCount < 6
        ? `Final line value for ${manualPositionPhrase(confirmedCount + 1)}`
        : "Final line value (6–9)";
  }

  function revealNext(): boolean {
    if (consultation === null || consultation.mode !== "automatic" || consultation.state === "complete") {
      return false;
    }
    const line = consultation.castNextLine();
    fillSlot(shell.castingFigure, line);
    announcer.announceLine(line.position, line.value);
    return consultation.revealedCount < 6;
  }

  function presentResult(finalManualLine?: CastLine): void {
    if (consultation === null) return;
    const primary = consultation.hexagram;
    const related = consultation.related;
    const mask = consultation.changingMask;

    // identity (C-5)
    shell.primaryIdentity.textContent = identityText(primary.kwNumber, primary.name);
    shell.primaryTrigrams.textContent = trigramsText(
      `${primary.upper.name} (${primary.upper.nature})`,
      `${primary.lower.name} (${primary.lower.nature})`);
    setQuote(shell.primaryJudgement, primary.judgement);
    setQuote(shell.primaryImage, primary.image);
    presentSummary(shell.primarySummary, primary.summary, primary.kwNumber);
    // The result's visual is the Unicode hexagram itself (clearer than redrawing
    // the bars); the accessible label still names the lines and changes (C-8).
    shell.primarySymbol.textContent = hexagramSymbol(primary.kwNumber);
    shell.primaryChinese.textContent = chineseName(primary.kwNumber);
    const primaryChanging = positionsOfMask(consultation.lines.flatMap((l) => (l.changing ? [l.position] : [])));
    labelFigure(shell.primaryFigure, primary.kwNumber, primary.name, primaryChanging);

    // related iff mask !== 0 (C-6 / FR-009) — full flips included
    if (related !== null && mask !== 0) {
      shell.relatedCard.hidden = false;
      shell.stableMessage.hidden = true;
      shell.relatedIdentity.textContent = identityText(related.kwNumber, related.name);
      shell.relatedTrigrams.textContent = trigramsText(
        `${related.upper.name} (${related.upper.nature})`,
        `${related.lower.name} (${related.lower.nature})`);
      setQuote(shell.relatedJudgement, related.judgement);
      setQuote(shell.relatedImage, related.image);
      presentSummary(shell.relatedSummary, related.summary, related.kwNumber);
      labelFigure(shell.relatedFigure, related.kwNumber, related.name, []);
      shell.relatedSymbol.textContent = hexagramSymbol(related.kwNumber);
      shell.relatedChinese.textContent = chineseName(related.kwNumber);
      const relatedInfo = { num: related.kwNumber, name: related.name };
      if (finalManualLine !== undefined) {
        announcer.announceManualCompletion(finalManualLine.value, primary.kwNumber, primary.name, relatedInfo);
      } else {
        announcer.announceStatus(announceResultText(primary.kwNumber, primary.name, relatedInfo));
      }
    } else {
      clearSummary(shell.relatedSummary);
      // FR-010: neutral stable message; no related section.
      shell.relatedSymbol.textContent = "";
      shell.relatedChinese.textContent = "";
      shell.relatedCard.hidden = true;
      shell.stableMessage.hidden = false;
      shell.stableMessage.textContent = STABLE_MESSAGE;
      if (finalManualLine !== undefined) {
        announcer.announceManualCompletion(finalManualLine.value, primary.kwNumber, primary.name, null);
      } else {
        announcer.announceStatus(announceResultText(primary.kwNumber, primary.name, null));
      }
    }

    // inert echo (C-10)
    echoQuestion(shell.questionEcho, shell.echoCard, consultation.question);

    showStep(shell, "result");
  }

  function startTimer(): void {
    stopTimer();
    timer = setInterval(() => {
      const more = revealNext();
      if (!more) {
        stopTimer();
        presentResult();
      }
    }, REVEAL_INTERVAL_MS);
  }

  const steps: Steps = {
    showQuestion(): void {
      stopTimer();
      consultation = null;
      pendingValue = null;
      // C-2: nothing editable mid-cast is guaranteed by C-1 step visibility.
      const allowed = canStart();
      shell.castButton.disabled = !allowed;
      if (allowed) {
        shell.noRandom.textContent = "";
        shell.noRandom.hidden = true;
      } else {
        shell.noRandom.textContent = DECLINE_NO_RANDOM;
        shell.noRandom.hidden = false;
      }
      showStep(shell, "question");
    },

    startCast(): void {
      if (!canStart()) return;
      const raw = shell.questionInput.value;
      if (raw.length > QUESTION_MAX) {
        // defensive: maxlength normally enforces this (C-2 notice)
        shell.truncationNotice.textContent = TRUNCATION_NOTICE;
        shell.truncationNotice.hidden = false;
      } else {
        shell.truncationNotice.hidden = true;
      }
      consultation = deps.beginConsultation(raw);
      echoQuestion(shell.castingQuestionEcho, shell.castingEchoCard, consultation.question);
      prepareFigureSlots(shell.castingFigure);

      if (consultation.mode === "manual") {
        stopTimer();
        shell.castingSub.textContent = USER_CAST_SUBTITLE;
        shell.autoControls.hidden = true;
        shell.revealAllButton.hidden = true;
        shell.manualCasting.hidden = false;
        clearManualError();
        clearManualSelectionUi();
        syncManualProgressUi(0);
        showStep(shell, "casting");
        announcer.announceStatus(announceManualCastingBegins());
        return;
      }

      shell.castingSub.textContent = AUTOMATIC_CAST_SUBTITLE;
      shell.manualCasting.hidden = true;
      shell.autoControls.hidden = false;
      shell.revealAllButton.hidden = false;
      shell.castingFigure.removeAttribute("aria-label");
      showStep(shell, "casting");
      announcer.announceStatus(announceCastingBegins());
      // first line immediately, then paced reveals
      const more = revealNext();
      if (more) startTimer();
      else presentResult();
    },

    selectLineValue(raw: unknown): boolean {
      if (consultation === null || consultation.mode !== "manual" || consultation.state === "complete") {
        return false;
      }
      const parsed = parseStrictLineValue(raw);
      if (parsed === null) {
        clearManualSelectionUi();
        showManualError(MANUAL_INVALID_VALUE_ERROR);
        return false;
      }
      let matchedRadio = false;
      for (const radio of shell.lineValueRadios) {
        const matches = parseStrictLineValue(radio.value) === parsed;
        radio.checked = matches;
        if (matches) matchedRadio = true;
      }
      if (!matchedRadio) {
        clearManualSelectionUi();
        showManualError(MANUAL_INVALID_VALUE_ERROR);
        return false;
      }
      pendingValue = parsed;
      clearManualError();
      shell.addLineButton.disabled = false;
      const nextPos = consultation.revealedCount + 1;
      shell.manualSelection.textContent = manualSelectionText(parsed, nextPos);
      announcer.announceManualSelection(parsed, nextPos);
      return true;
    },

    addLine(...args: readonly unknown[]): boolean {
      if (consultation === null || consultation.mode !== "manual" || consultation.state === "complete") {
        return false;
      }
      let chosen: LineValue | null = null;
      if (args.length > 0) {
        chosen = parseStrictLineValue(args[0]);
        if (chosen === null) {
          showManualError(MANUAL_INVALID_VALUE_ERROR);
          return false;
        }
      } else {
        const checkedRadios = shell.lineValueRadios.filter((r) => r.checked);
        if (checkedRadios.length !== 1 || pendingValue === null) {
          clearManualSelectionUi();
          showManualError(MANUAL_INVALID_VALUE_ERROR);
          return false;
        }
        const checkedVal = parseStrictLineValue(checkedRadios[0]?.value);
        if (checkedVal === null || checkedVal !== pendingValue) {
          clearManualSelectionUi();
          showManualError(MANUAL_INVALID_VALUE_ERROR);
          return false;
        }
        chosen = checkedVal;
      }

      const line = consultation.addLine(chosen);
      clearManualError();
      clearManualSelectionUi();
      fillSlot(shell.castingFigure, line);
      syncManualProgressUi(consultation.revealedCount);

      if (consultation.revealedCount === 6) {
        presentResult(line);
      } else {
        announcer.announceManualLine(line.position, line.value);
        shell.lineValueRadios[0].focus();
      }
      return true;
    },

    undoLastLine(): boolean {
      if (
        consultation === null ||
        consultation.mode !== "manual" ||
        consultation.state === "complete" ||
        consultation.revealedCount === 0
      ) {
        return false;
      }
      const removed = consultation.undoLastLine();
      clearManualError();
      clearManualSelectionUi();
      clearSlot(shell.castingFigure, removed.position);
      syncManualProgressUi(consultation.revealedCount);
      announcer.announceManualUndo(removed.position, removed.value);
      shell.lineValueRadios[0].focus();
      return true;
    },

    cancelManualCast(): void {
      if (consultation === null || consultation.mode !== "manual" || consultation.state === "complete") {
        return;
      }
      stopTimer();
      consultation = null;
      clearManualError();
      clearManualSelectionUi();
      shell.manualSelection.textContent = "";
      shell.undoLineButton.disabled = true;
      shell.castingFigure.textContent = "";
      shell.castingFigure.setAttribute("aria-label", "The emerging hexagram");
      clearQuestionEcho(shell.castingQuestionEcho, shell.castingEchoCard);
      shell.manualProgress.textContent = "";
      shell.manualCasting.hidden = true;
      shell.autoControls.hidden = false;
      shell.revealAllButton.hidden = false;
      steps.showQuestion();
      const activeMethodRadio = shell.methodUser.checked
        ? shell.methodUser
        : shell.methodYarrow.checked
          ? shell.methodYarrow
          : shell.methodCoins;
      activeMethodRadio.focus();
      announcer.announceStatus(MANUAL_CANCEL_ANNOUNCEMENT);
    },

    revealAll(): void {
      if (consultation === null || consultation.mode !== "automatic") return;
      // C-4: immediate completion, keyboard operable.
      stopTimer();
      while (consultation !== null && consultation.state !== "complete") {
        revealNext();
      }
      presentResult();
    },

    castAgain(): void {
      // C-8 / FR-012 / FR-014: discard the Consultation, clear (not hide) result & manual DOM.
      stopTimer();
      consultation = null;
      clearManualError();
      clearManualSelectionUi();
      shell.manualSelection.textContent = "";
      shell.undoLineButton.disabled = true;
      shell.castingFigure.textContent = "";
      shell.castingFigure.setAttribute("aria-label", "The emerging hexagram");
      clearQuestionEcho(shell.castingQuestionEcho, shell.castingEchoCard);
      shell.manualProgress.textContent = "";
      shell.manualCasting.hidden = true;
      shell.autoControls.hidden = false;
      shell.revealAllButton.hidden = false;
      shell.questionInput.value = "";
      shell.truncationNotice.textContent = "";
      shell.truncationNotice.hidden = true;
      shell.primaryFigure.setAttribute("aria-label", "");
      shell.primarySymbol.textContent = "";
      shell.primaryChinese.textContent = "";
      shell.primaryIdentity.textContent = "";
      shell.primaryTrigrams.textContent = "";
      setQuote(shell.primaryJudgement, "");
      setQuote(shell.primaryImage, "");
      clearSummary(shell.primarySummary);
      shell.relatedFigure.setAttribute("aria-label", "");
      shell.relatedSymbol.textContent = "";
      shell.relatedChinese.textContent = "";
      shell.relatedIdentity.textContent = "";
      shell.relatedTrigrams.textContent = "";
      setQuote(shell.relatedJudgement, "");
      setQuote(shell.relatedImage, "");
      clearSummary(shell.relatedSummary);
      shell.relatedCard.hidden = true;
      shell.stableMessage.textContent = "";
      shell.stableMessage.hidden = true;
      clearQuestionEcho(shell.questionEcho, shell.echoCard);
      shell.reExplanation.hidden = true;
      shell.explainToggle.setAttribute("aria-expanded", "false");
      announcer.announceStatus("");
      steps.showQuestion();
    },

    togglePrimarySummary(): void {
      if (consultation !== null && consultation.state === "complete") {
        toggleSummary(shell.primarySummary, consultation.hexagram.kwNumber);
      }
    },

    toggleRelatedSummary(): void {
      if (consultation !== null && consultation.state === "complete") {
        const related = consultation.related;
        if (related !== null) toggleSummary(shell.relatedSummary, related.kwNumber);
      }
    },

    toggleExplanation(): void {
      // Copy is rendered once at boot (ui/explanation.ts); this only opens/closes.
      const open = shell.reExplanation.hidden;
      shell.reExplanation.hidden = !open;
      shell.explainToggle.setAttribute("aria-expanded", open ? "true" : "false");
    }
  };
  return steps;
}

function renderManualGuide(container: HTMLElement): void {
  container.replaceChildren();
  const heading = document.createElement("h3");
  heading.textContent = USER_CAST_GUIDE_HEADING;
  container.appendChild(heading);
  for (const item of USER_CAST_GUIDE) {
    const p = document.createElement("p");
    const strong = document.createElement("strong");
    strong.textContent = item.lead;
    p.appendChild(strong);
    p.appendChild(document.createTextNode(item.body));
    container.appendChild(p);
  }
}

function setQuote(blockquote: HTMLElement, text: string): void {
  const first = blockquote.firstElementChild;
  if (first instanceof HTMLParagraphElement) {
    first.textContent = text;
  }
}

function positionsOfMask(positions: readonly number[]): readonly number[] {
  return positions.filter((n) => Number.isInteger(n) && n >= 1 && n <= 6).sort((a, b) => a - b);
}

export type { Hexagram };
