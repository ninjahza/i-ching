// T015 — Canonical 6-bit bottom-up pattern & transformation (data-model §3, R-3; C-6).

import type { LineValue } from "./line-values.ts";
import { isYang, isChanging } from "./line-values.ts";

export interface CastLine {
  readonly position: number; // 1..6, 1 = bottom (FR-004)
  readonly value: LineValue;
  readonly changing: boolean; // derived cache: isChanging(value)
}

export type Pattern = number; // 0..63; bit 0 = position 1 (bottom); yang = 1

/** Sets bit p−1 when position p is yang (data-model §3). */
export function patternFromLines(lines: readonly CastLine[]): Pattern {
  let pattern = 0;
  for (const line of lines) {
    if (isYang(line.value)) pattern |= 1 << (line.position - 1);
  }
  return pattern;
}

/** Bitmask of changing positions; bit p−1 when position p is changing. */
export function changingMask(lines: readonly CastLine[]): number {
  let mask = 0;
  for (const line of lines) {
    if (isChanging(line.value)) mask |= 1 << (line.position - 1);
  }
  return mask;
}

/**
 * Related pattern = pattern XOR mask (R-3): flips exactly the changing
 * positions. mask === 0 ⇒ stable (no related hexagram, FR-010).
 */
export function relatedPattern(pattern: Pattern, mask: number): Pattern {
  return (pattern ^ mask) & 0b111111;
}
