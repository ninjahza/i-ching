// T012 — King Wen sequence tables (R-3, FR-007).
// Encoding: pattern is a 6-bit int; bit 0 = position 1 = BOTTOM line; yang = 1.
// PATTERN_TO_KW[pattern] = King Wen number (1..64) — the C-5 identity.
// KW_TO_PATTERN[kw - 1] = pattern. The two tables are validated as strict
// mutual inverses by tests/hexagram-map.test.ts — facts, not trust.
//
// Each pair lists [King Wen number, UPPER trigram bits (lines 4-6),
// LOWER trigram bits (lines 1-3)]; bits per src/data/trigrams.ts. The King Wen
// sequence is a public-domain ordering (not copyrightable expression, R-3).
const PAIRS: readonly (readonly [kw: number, upper: number, lower: number])[] = [
  [1, 7, 7], [2, 0, 0], [3, 2, 1], [4, 4, 2], [5, 2, 7], [6, 7, 2],
  [7, 0, 2], [8, 2, 0], [9, 6, 7], [10, 7, 3], [11, 0, 7], [12, 7, 0],
  [13, 7, 5], [14, 5, 7], [15, 0, 4], [16, 1, 0], [17, 3, 1], [18, 4, 6],
  [19, 0, 3], [20, 6, 0], [21, 5, 1], [22, 4, 5], [23, 4, 0], [24, 0, 1],
  [25, 7, 1], [26, 4, 7], [27, 4, 1], [28, 3, 6], [29, 2, 2], [30, 5, 5],
  [31, 3, 4], [32, 1, 6], [33, 7, 4], [34, 1, 7], [35, 5, 0], [36, 0, 5],
  [37, 6, 5], [38, 5, 3], [39, 2, 4], [40, 1, 2], [41, 4, 3], [42, 6, 1],
  [43, 3, 7], [44, 7, 6], [45, 3, 0], [46, 0, 6], [47, 3, 2], [48, 2, 6],
  [49, 3, 5], [50, 5, 6], [51, 1, 1], [52, 4, 4], [53, 6, 4], [54, 1, 3],
  [55, 1, 5], [56, 5, 4], [57, 6, 6], [58, 3, 3], [59, 6, 2], [60, 2, 3],
  [61, 6, 3], [62, 1, 4], [63, 2, 5], [64, 5, 2]
];

function build(): { p2k: number[]; k2p: number[] } {
  const p2k: number[] = new Array<number>(64);
  const k2p: number[] = new Array<number>(64);
  for (const [kw, upper, lower] of PAIRS) {
    const pattern = ((upper << 3) | lower) & 0b111111;
    p2k[pattern] = kw;
    k2p[kw - 1] = pattern;
  }
  // Fail-fast self-check (the external test suite repeats this).
  if (new Set(p2k).size !== 64 || p2k.some((v) => v === undefined || v < 1 || v > 64)) {
    throw new Error("king-wen table malformed: not a bijection");
  }
  return { p2k, k2p };
}

const built = build();

export const PATTERN_TO_KW: readonly number[] = Object.freeze(built.p2k);
export const KW_TO_PATTERN: readonly number[] = Object.freeze(built.k2p);
