// T016 — Casting methods & byte-partition draws (data-model §6, R-4; C-3; SC-003).
// Rejection-free and modulo-free: exactly one byte per line, partitioned map.

import type { LineValue } from "./line-values.ts";
import { assertLineValue } from "./line-values.ts";

/**
 * Injected byte source. In the browser it is backed ONLY by
 * crypto.getRandomValues (constitution IV); tests inject deterministic
 * sources. Core never touches window/crypto directly.
 */
export interface RandomSource {
  randomBytes(out: Uint8Array): Uint8Array;
}

export interface CastingMethod {
  readonly id: "coins" | "yarrow";
  readonly label: string;
  /** Declared probability profile; must sum to 1 (validated by test). */
  readonly probs: Readonly<Record<LineValue, number>>;
  /** Pure byte-partition map: a byte (0..255) in, a line value out. */
  draw(byte: number): LineValue;
}

function popcount3(low3: number): number {
  // low3 is 0..7
  return ((low3 & 1) + ((low3 >> 1) & 1) + ((low3 >> 2) & 1)) | 0;
}

/**
 * Three-coin method (default, FR-005): low 3 bits = three virtual coins,
 * head=3/tail=2, sum = 6 + popcount ∈ {6..9}: 1/8, 3/8, 3/8, 1/8.
 */
export const COINS: CastingMethod = {
  id: "coins",
  label: "Three coins",
  probs: { 6: 1 / 8, 7: 3 / 8, 8: 3 / 8, 9: 1 / 8 },
  draw(byte: number): LineValue {
    return assertLineValue(6 + popcount3(byte & 0b111));
  }
};

/**
 * Classical yarrow-stalk method: r = byte & 15 (uniform 0..15);
 * r 0..2 → 9 (3/16) · 3..7 → 7 (5/16) · 8..14 → 8 (7/16) · 15 → 6 (1/16).
 */
export const YARROW: CastingMethod = {
  id: "yarrow",
  label: "Yarrow stalks",
  probs: { 6: 1 / 16, 7: 5 / 16, 8: 7 / 16, 9: 3 / 16 },
  draw(byte: number): LineValue {
    const r = byte & 0b1111;
    const v = r <= 2 ? 9 : r <= 7 ? 7 : r <= 14 ? 8 : 6;
    return assertLineValue(v);
  }
};

/** Draw one line value, consuming exactly one byte from the source (FR-004). */
export function castLine(method: CastingMethod, source: RandomSource): LineValue {
  const buf = new Uint8Array(1);
  source.randomBytes(buf);
  const byte = buf[0] as number;
  return method.draw(byte);
}

/** Registry used by the UI method selector (US2). */
export const METHODS: readonly CastingMethod[] = [COINS, YARROW];
