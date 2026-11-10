// T017 — Hexagram lookup & trigram derivation (data-model §5, R-3).

import { PATTERN_TO_KW, KW_TO_PATTERN } from "../data/king-wen.ts";
import { TRIGRAMS } from "../data/trigrams.ts";
import type { Trigram } from "../data/trigrams.ts";
import { HEXAGRAM_NAMES } from "../data/hexagram-names.ts";
import { CORPUS } from "../data/texts.ts";
import type { HexagramTexts } from "../data/texts.ts";

export interface Hexagram {
  readonly kwNumber: number; // 1..64 (primary display id)
  readonly pattern: number;  // 0..63 bottom-up
  readonly name: string;     // Legge's name
  readonly upper: Trigram;
  readonly lower: Trigram;
  readonly judgement: string;
  readonly image: string;
}

function byPattern(pattern: number): Hexagram {
  if (!Number.isInteger(pattern) || pattern < 0 || pattern > 63) {
    throw new Error(`bad pattern: ${String(pattern)}`);
  }
  const kw = PATTERN_TO_KW[pattern];
  if (kw === undefined || kw < 1 || kw > 64) throw new Error(`no King Wen number for pattern ${pattern}`);
  const name = HEXAGRAM_NAMES[kw];
  const texts: HexagramTexts | null = CORPUS[kw] ?? null;
  if (name === null || name === undefined || texts === null) {
    throw new Error(`missing static data for hexagram ${kw}`);
  }
  return {
    kwNumber: kw,
    pattern,
    name,
    lower: trigramByBits(pattern & 0b111),
    upper: trigramByBits((pattern >> 3) & 0b111),
    judgement: texts.judgement,
    image: texts.image
  };
}

function trigramByBits(bits: number): Trigram {
  for (const t of TRIGRAMS) {
    if (t.bits === bits) return t;
  }
  throw new Error(`no trigram for bits ${bits}`);
}

/** Hexagram identity per C-5: PATTERN_TO_KW[bitpattern], bit 0 = bottom line. */
export const hexagramByPattern = byPattern;

/** Trigram pair derived from a pattern (data-model §4). */
export function trigramsOf(pattern: number): { upper: Trigram; lower: Trigram } {
  return { upper: trigramByBits((pattern >> 3) & 0b111), lower: trigramByBits(pattern & 0b111) };
}

/**
 * Related hexagram = pattern ^ mask; null when mask === 0 (FR-009/FR-010,
 * data-model §3 — a stable cast has no related hexagram).
 */
export function relatedHexagram(pattern: number, mask: number): Hexagram | null {
  if (mask === 0) return null;
  return byPattern((pattern ^ mask) & 0b111111);
}

/** Pattern lookup from a King Wen number (inverse, used by the spot-check test). */
export function patternOfKw(kw: number): number {
  const p = KW_TO_PATTERN[kw - 1];
  if (p === undefined) throw new Error(`no pattern for KW ${kw}`);
  return p;
}

/**
 * Unicode Yijing hexagram character (block U+4DC0..U+4DFF) for a King Wen
 * number. U+4DC0 is hexagram 1 (Qian) and the block runs in King Wen order
 * across all 64 hexagrams, so the mapping is positional. Presentation-only:
 * never used for identity.
 */
export function hexagramSymbol(kwNumber: number): string {
  if (!Number.isInteger(kwNumber) || kwNumber < 1 || kwNumber > 64) {
    throw new Error(`kw out of range: ${kwNumber}`);
  }
  return String.fromCodePoint(0x4dc0 + kwNumber - 1);
}
