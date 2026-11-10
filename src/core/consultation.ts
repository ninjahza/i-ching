// T018 — Consultation aggregate + flow state machine (data-model §7; C-1..C-3,
// C-8, C-11; FR-002, FR-012, FR-023; R-11). Transient, in-memory only; pure.

import type { CastLine } from "./pattern.ts";
import { patternFromLines, changingMask } from "./pattern.ts";
import { isChanging } from "./line-values.ts";
import type { CastingMethod, RandomSource } from "./casting.ts";
import { castLine } from "./casting.ts";
import type { Hexagram } from "./hexagram.ts";
import { hexagramByPattern, relatedHexagram } from "./hexagram.ts";

export type ConsultationState = "asking" | "casting" | "complete";

export const QUESTION_MAX = 500; // R-11

export interface ConsultationOptions {
  readonly method: CastingMethod;
  readonly random: RandomSource;
  readonly question: string | null;
}

export interface Consultation {
  readonly state: ConsultationState;
  readonly method: CastingMethod;
  /** Normalised question: null when absent/whitespace; ≤ 500 chars (R-11). */
  readonly question: string | null;
  readonly questionTruncated: boolean;
  readonly lines: readonly CastLine[];
  readonly revealedCount: number;
  /** Derived fields — available ONLY when complete (C-11). */
  readonly pattern: number;
  readonly changingMask: number;
  readonly hexagram: Hexagram;
  readonly related: Hexagram | null;
  /** Reveal the next line bottom-up. Throws after completion. */
  castNextLine(): CastLine;
  /** Fresh consultation: question null, no lines, same in-session method (C-8/C-9). */
  castAgain(): Consultation;
}

export function createConsultation(options: ConsultationOptions): Consultation {
  const { method, random } = options;
  const raw = options.question;
  let question: string | null = null;
  let questionTruncated = false;
  if (raw !== null && raw.trim() !== "") {
    question = raw.length > QUESTION_MAX ? raw.slice(0, QUESTION_MAX) : raw;
    questionTruncated = raw.length > QUESTION_MAX;
  }

  const lines: CastLine[] = [];

  function complete(): boolean {
    return lines.length === 6;
  }

  function derivePattern(): number {
    if (!complete()) {
      // C-11: a half cast can never present as a result.
      throw new Error("consultation not complete: derived fields unavailable");
    }
    return patternFromLines(lines);
  }

  function derive(): { hexagram: Hexagram; related: Hexagram | null } {
    const pattern = derivePattern();
    const mask = changingMask(lines);
    return {
      hexagram: hexagramByPattern(pattern),
      related: relatedHexagram(pattern, mask)
    };
  }

  const self: Consultation = {
    get state(): ConsultationState {
      return complete() ? "complete" : lines.length > 0 ? "casting" : "asking";
    },
    method,
    get question() {
      return question;
    },
    get questionTruncated() {
      return questionTruncated;
    },
    get lines(): readonly CastLine[] {
      return lines.slice();
    },
    get revealedCount(): number {
      return lines.length;
    },
    get pattern(): number {
      return derivePattern();
    },
    get changingMask(): number {
      derivePattern(); // completion guard
      return changingMask(lines);
    },
    get hexagram(): Hexagram {
      return derive().hexagram;
    },
    get related(): Hexagram | null {
      return derive().related;
    },
    castNextLine(): CastLine {
      if (complete()) throw new Error("consultation already complete");
      const position = lines.length + 1; // bottom-up, 004
      const value = castLine(method, random);
      const line: CastLine = { position, value, changing: isChanging(value) };
      lines.push(line);
      return line;
    },
    castAgain(): Consultation {
      // FR-012/FR-023: discard this object's question and lines entirely.
      return createConsultation({ method, random, question: null });
    }
  };
  return self;
}
