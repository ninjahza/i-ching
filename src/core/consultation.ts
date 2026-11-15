// T018 / T007 — Consultation aggregate + flow state machine (automatic & manual modes).
// Transient, in-memory only; pure (no DOM or storage).

import type { CastLine } from "./pattern.ts";
import { patternFromLines, changingMask } from "./pattern.ts";
import { assertLineValue, isChanging } from "./line-values.ts";
import type { CastingMethod, RandomSource } from "./casting.ts";
import { castLine } from "./casting.ts";
import type { Hexagram } from "./hexagram.ts";
import { hexagramByPattern, relatedHexagram } from "./hexagram.ts";

export type ConsultationState = "asking" | "casting" | "complete";
export type ConsultationMode = "automatic" | "manual";

export const QUESTION_MAX = 500; // R-11

export interface AutomaticConsultationOptions {
  readonly mode?: "automatic";
  readonly method: CastingMethod;
  readonly random: RandomSource;
  readonly question: string | null;
}

export interface ManualConsultationOptions {
  readonly mode?: "manual";
  readonly question: string | null;
}

export type ConsultationOptions = AutomaticConsultationOptions;

export interface BaseConsultation {
  readonly mode: ConsultationMode;
  readonly state: ConsultationState;
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
}

export interface AutomaticConsultation extends BaseConsultation {
  readonly mode: "automatic";
  readonly method: CastingMethod;
  /** Reveal the next line bottom-up. Throws after completion. */
  castNextLine(): CastLine;
  /** Fresh consultation: question null, no lines, same in-session method (C-8/C-9). */
  castAgain(): AutomaticConsultation;
}

export interface ManualConsultation extends BaseConsultation {
  readonly mode: "manual";
  readonly method: "user";
  /** Append one validated line value (6..9) bottom-up. Throws on invalid value or after completion. */
  addLine(value: number): CastLine;
  /** Remove and return the most recent confirmed line before completion. Throws at 0 or 6 lines. */
  undoLastLine(): CastLine;
  /** Fresh manual consultation: question null, no lines, manual mode preserved. */
  castAgain(): ManualConsultation;
}

export type Consultation = AutomaticConsultation | ManualConsultation;

function normalizeQuestion(raw: string | null): { question: string | null; questionTruncated: boolean } {
  if (raw !== null && raw.trim() !== "") {
    return {
      question: raw.length > QUESTION_MAX ? raw.slice(0, QUESTION_MAX) : raw,
      questionTruncated: raw.length > QUESTION_MAX,
    };
  }
  return { question: null, questionTruncated: false };
}

function appendValidatedLine(lines: CastLine[], rawValue: number): CastLine {
  if (lines.length === 6) {
    throw new Error("consultation already complete");
  }
  const value = assertLineValue(rawValue);
  const position = lines.length + 1;
  const line: CastLine = { position, value, changing: isChanging(value) };
  lines.push(line);
  return line;
}

function derivePatternFrom(lines: readonly CastLine[]): number {
  if (lines.length !== 6) {
    // C-11: a half cast can never present as a result.
    throw new Error("consultation not complete: derived fields unavailable");
  }
  return patternFromLines(lines);
}

function deriveHexagrams(lines: readonly CastLine[]): { hexagram: Hexagram; related: Hexagram | null } {
  const pattern = derivePatternFrom(lines);
  const mask = changingMask(lines);
  return {
    hexagram: hexagramByPattern(pattern),
    related: relatedHexagram(pattern, mask),
  };
}

export function createManualConsultation(options: ManualConsultationOptions): ManualConsultation {
  const { question, questionTruncated } = normalizeQuestion(options.question);
  const lines: CastLine[] = [];

  const self = {
    mode: "manual" as const,
    method: "user" as const,
    get state(): ConsultationState {
      return lines.length === 6 ? "complete" : lines.length > 0 ? "casting" : "asking";
    },
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
      return derivePatternFrom(lines);
    },
    get changingMask(): number {
      derivePatternFrom(lines);
      return changingMask(lines);
    },
    get hexagram(): Hexagram {
      return deriveHexagrams(lines).hexagram;
    },
    get related(): Hexagram | null {
      return deriveHexagrams(lines).related;
    },
    addLine(value: number): CastLine {
      return appendValidatedLine(lines, value);
    },
    undoLastLine(): CastLine {
      if (lines.length === 6) {
        throw new Error("consultation already complete: cannot undo");
      }
      if (lines.length === 0) {
        throw new Error("no confirmed line to undo");
      }
      return lines.pop() as CastLine;
    },
    castNextLine(): never {
      throw new Error("manual consultation cannot draw automatic lines");
    },
    castAgain(): ManualConsultation {
      return createManualConsultation({ question: null });
    },
  };
  return self;
}

export function createConsultation(options: AutomaticConsultationOptions): AutomaticConsultation;
export function createConsultation(options: { readonly mode: "manual"; readonly question: string | null }): ManualConsultation;
export function createConsultation(
  options: AutomaticConsultationOptions | { readonly mode: "manual"; readonly question: string | null },
): AutomaticConsultation | ManualConsultation {
  if (options.mode === "manual") {
    return createManualConsultation({ question: options.question });
  }
  const { method, random } = options;
  if (!random || typeof random.randomBytes !== "function") {
    throw new Error("automatic consultation requires a secure random source");
  }
  const { question, questionTruncated } = normalizeQuestion(options.question);
  const lines: CastLine[] = [];

  const self = {
    mode: "automatic" as const,
    method,
    get state(): ConsultationState {
      return lines.length === 6 ? "complete" : lines.length > 0 ? "casting" : "asking";
    },
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
      return derivePatternFrom(lines);
    },
    get changingMask(): number {
      derivePatternFrom(lines);
      return changingMask(lines);
    },
    get hexagram(): Hexagram {
      return deriveHexagrams(lines).hexagram;
    },
    get related(): Hexagram | null {
      return deriveHexagrams(lines).related;
    },
    castNextLine(): CastLine {
      if (lines.length === 6) throw new Error("consultation already complete");
      const drawn = castLine(method, random);
      return appendValidatedLine(lines, drawn);
    },
    addLine(): never {
      throw new Error("automatic consultation cannot accept manual lines");
    },
    undoLastLine(): never {
      throw new Error("automatic consultation cannot undo lines");
    },
    castAgain(): AutomaticConsultation {
      return createConsultation({ method, random, question: null });
    },
  };
  return self;
}
