// T025 — step controllers: question / casting / result (C-1..C-6, C-8; FR-001..FR-013).
// The composition root (src/ui/main.ts) supplies the consultation factory and
// the announcer; this module owns reveal pacing and result rendering only.

import type { Shell } from "./shell-bind.ts";
import { showStep } from "./shell-bind.ts";
import type { Announcer } from "./announce.ts";
import { prepareFigureSlots, fillSlot, labelFigure } from "./line-view.ts";
import { echoQuestion, clearQuestionEcho } from "./question-echo.ts";
import type { Consultation } from "../core/consultation.ts";
import { QUESTION_MAX } from "../core/consultation.ts";
import { hexagramSymbol } from "../core/hexagram.ts";
import { chineseName } from "../data/hexagram-chinese.ts";
import { STABLE_MESSAGE, TRUNCATION_NOTICE, announceCastingBegins, announceResultText, identityText, trigramsText } from "../data/app-strings.ts";
import type { Hexagram } from "../core/hexagram.ts";

const REVEAL_INTERVAL_MS = 400; // R-5

export interface StepsDeps {
  shell: Shell;
  announcer: Announcer;
  /** Starts a fresh Consultation (question captured here, null on re-cast). */
  beginConsultation(question: string | null): Consultation;
}

export interface Steps {
  showQuestion(): void;
  startCast(): void;
  revealAll(): void;
  castAgain(): void;
  toggleExplanation(): void;
}

export function createSteps(deps: StepsDeps): Steps {
  const { shell, announcer } = deps;
  let consultation: Consultation | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;

  function stopTimer(): void {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }

  function revealNext(): boolean {
    if (consultation === null || consultation.state === "complete") return false;
    const line = consultation.castNextLine();
    fillSlot(shell.castingFigure, line);
    announcer.announceLine(line.position, line.value);
    return consultation.revealedCount < 6;
  }

  function presentResult(): void {
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
      labelFigure(shell.relatedFigure, related.kwNumber, related.name, []);
      shell.relatedSymbol.textContent = hexagramSymbol(related.kwNumber);
      shell.relatedChinese.textContent = chineseName(related.kwNumber);
      announcer.announceStatus(announceResultText(primary.kwNumber, primary.name, { num: related.kwNumber, name: related.name }));
    } else {
      // FR-010: neutral stable message; no related section.
      shell.relatedSymbol.textContent = "";
      shell.relatedChinese.textContent = "";
      shell.relatedCard.hidden = true;
      shell.stableMessage.hidden = false;
      shell.stableMessage.textContent = STABLE_MESSAGE;
      announcer.announceStatus(announceResultText(primary.kwNumber, primary.name, null));
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
      // C-2: nothing editable mid-cast is guaranteed by C-1 step visibility.
      shell.castButton.disabled = !randomAvailable();
      showStep(shell, "question");
    },

    startCast(): void {
      if (!randomAvailable()) return;
      const raw = shell.questionInput.value;
      if (raw.length > QUESTION_MAX) {
        // defensive: maxlength normally enforces this (C-2 notice)
        shell.truncationNotice.textContent = TRUNCATION_NOTICE;
        shell.truncationNotice.hidden = false;
      } else {
        shell.truncationNotice.hidden = true;
      }
      consultation = deps.beginConsultation(raw);
      prepareFigureSlots(shell.castingFigure);
      shell.castingFigure.removeAttribute("aria-label");
      showStep(shell, "casting");
      announcer.announceStatus(announceCastingBegins());
      // first line immediately, then paced reveals
      const more = revealNext();
      if (more) startTimer();
      else presentResult();
    },

    revealAll(): void {
      // C-4: immediate completion, keyboard operable.
      stopTimer();
      while (consultation !== null && consultation.state !== "complete") {
        revealNext();
      }
      presentResult();
    },

    castAgain(): void {
      // C-8 / FR-012: discard the Consultation, clear (not hide) result DOM.
      stopTimer();
      consultation = null;
      shell.questionInput.value = "";
      shell.truncationNotice.textContent = "";
      shell.truncationNotice.hidden = true;
      shell.primarySymbol.textContent = "";
      shell.primaryChinese.textContent = "";
      shell.primaryIdentity.textContent = "";
      shell.primaryTrigrams.textContent = "";
      setQuote(shell.primaryJudgement, "");
      setQuote(shell.primaryImage, "");
      shell.relatedSymbol.textContent = "";
      shell.relatedChinese.textContent = "";
      shell.relatedIdentity.textContent = "";
      shell.relatedTrigrams.textContent = "";
      setQuote(shell.relatedJudgement, "");
      setQuote(shell.relatedImage, "");
      shell.relatedCard.hidden = true;
      shell.stableMessage.textContent = "";
      shell.stableMessage.hidden = true;
      clearQuestionEcho(shell.questionEcho, shell.echoCard);
      shell.reExplanation.hidden = true;
      shell.explainToggle.setAttribute("aria-expanded", "false");
      announcer.announceStatus("");
      steps.showQuestion();
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

function setQuote(blockquote: HTMLElement, text: string): void {
  const first = blockquote.firstElementChild;
  if (first instanceof HTMLParagraphElement) {
    first.textContent = text;
  }
}

function randomAvailable(): boolean {
  return typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function";
}

function positionsOfMask(positions: readonly number[]): readonly number[] {
  return positions.filter((n) => Number.isInteger(n) && n >= 1 && n <= 6).sort((a, b) => a - b);
}

export type { Hexagram };
