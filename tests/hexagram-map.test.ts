// T009 — King Wen mapping & trigram composition (FR-007, NFR-005, SC-002; data-model §5; C-5)
import { test } from "node:test";
import assert from "node:assert/strict";
import { PATTERN_TO_KW, KW_TO_PATTERN } from "../src/data/king-wen.ts";
import { TRIGRAMS } from "../src/data/trigrams.ts";
import { HEXAGRAM_NAMES } from "../src/data/hexagram-names.ts";
import { hexagramSymbol, hexagramByPattern, relatedHexagram, patternOfKw } from "../src/core/hexagram.ts";
import { CORPUS } from "../src/data/texts.ts";
import { chineseName } from "../src/data/hexagram-chinese.ts";

test("primary and related hexagrams expose their own corpus summaries", () => {
  for (let n = 1; n <= 64; n++) {
    const pattern = patternOfKw(n);
    const primary = hexagramByPattern(pattern);
    assert.equal(primary.summary, CORPUS[n]?.summary);
    const related = relatedHexagram(pattern, 63);
    assert.ok(related);
    assert.equal(related.summary, CORPUS[related.kwNumber]?.summary);
    assert.equal(relatedHexagram(pattern, 0), null);
  }
});

test("PATTERN_TO_KW is a bijection onto {1..64}", () => {
  assert.equal(PATTERN_TO_KW.length, 64);
  const seen = new Set<number>();
  for (let p = 0; p < 64; p++) {
    const kw = PATTERN_TO_KW[p];
    assert.ok(kw !== undefined, `pattern ${p} has no King Wen number`);
    assert.ok(kw >= 1 && kw <= 64, `pattern ${p} -> ${kw} out of range`);
    assert.ok(!seen.has(kw), `duplicate King Wen number ${kw}`);
    seen.add(kw);
  }
  assert.equal(seen.size, 64);
});

test("the two tables are strict mutual inverses", () => {
  assert.equal(KW_TO_PATTERN.length, 64);
  for (let n = 1; n <= 64; n++) {
    const pattern = KW_TO_PATTERN[n - 1];
    assert.ok(pattern !== undefined, `KW ${n} has no pattern`);
    assert.equal(PATTERN_TO_KW[pattern], n, `PATTERN_TO_KW[KW_TO_PATTERN[${n}]] != ${n}`);
  }
  for (let p = 0; p < 64; p++) {
    const kw = PATTERN_TO_KW[p];
    assert.ok(kw !== undefined, `pattern ${p} has no King Wen number`);
    const pattern = KW_TO_PATTERN[kw - 1];
    assert.ok(pattern !== undefined, `KW ${kw} has no pattern`);
    assert.equal(pattern, p, `KW_TO_PATTERN[PATTERN_TO_KW[${p}]] != ${p}`);
  }
});

test("eight trigrams have unique bits and cover 0..7", () => {
  assert.equal(TRIGRAMS.length, 8);
  const bits = new Set<number>();
  for (const t of TRIGRAMS) {
    assert.ok(t.bits >= 0 && t.bits <= 7, `trigram ${t.name}: bits ${t.bits} out of range`);
    assert.ok(!bits.has(t.bits), `duplicate trigram bits ${t.bits}`);
    assert.ok(t.name.trim().length > 0);
    assert.ok(t.nature.trim().length > 0);
    bits.add(t.bits);
  }
  assert.equal(bits.size, 8);
});

test("trigram composition derivable from every pattern (lower=bits 0-2, upper=bits 3-5)", () => {
  for (let p = 0; p < 64; p++) {
    const lowerBits = p & 0b111;
    const upperBits = (p >> 3) & 0b111;
    const lower = TRIGRAMS.find((t) => t.bits === lowerBits);
    const upper = TRIGRAMS.find((t) => t.bits === upperBits);
    assert.ok(lower !== undefined, `no trigram for lower bits of pattern ${p}`);
    assert.ok(upper !== undefined, `no trigram for upper bits of pattern ${p}`);
  }
});

test("C-5 identity: hexagram identity is PATTERN_TO_KW[bitpattern], bit 0 = bottom line", () => {
  // Hexagram 1 (Ch'ien / The Creative) is six yang lines: pattern 0b111111 = 63.
  assert.equal(PATTERN_TO_KW[0b111111], 1);
  // Hexagram 2 (K'un / The Field) is six yin lines: pattern 0.
  assert.equal(PATTERN_TO_KW[0], 2);
  // Known full flip pairs (C-6): 1 <-> 2, 63 <-> 64 identities via the map.
  const kw63 = PATTERN_TO_KW[62]; // placeholder check that mapping is total
  assert.ok(kw63 !== undefined && kw63 >= 1 && kw63 <= 64);
  // Hexagram 63 (Chi Chi, water over fire) = lower Li (fire, bits 101=5), upper K'an (water, yin-yang-yin = 0b010=2) => pattern 0b010101 = 21
  assert.equal(PATTERN_TO_KW[0b010101], 63);
  // Hexagram 64 (Wei Chi / Before Completion) = fire over water:
  // lower K'an (0b010 = 2), upper Li (0b101 = 5) => pattern 0b101010 = 42.
  assert.equal(PATTERN_TO_KW[0b101010], 64);
});

test("HEXAGRAM_NAMES indexed by King Wen number with 0 unused", () => {
  assert.equal(HEXAGRAM_NAMES.length, 65);
  assert.equal(HEXAGRAM_NAMES[0], null);
  for (let n = 1; n <= 64; n++) {
    const name = HEXAGRAM_NAMES[n];
    assert.ok(name !== null && name !== undefined && name.trim().length > 0, `name missing for KW ${n}`);
  }
});

// --- Unicode hexagram symbol (presentation only) --------------------------------

test("hexagramSymbol maps King Wen order onto U+4DC0..U+4DFF", () => {
  assert.equal(hexagramSymbol(1), "\u4dc0"); // ䷀ Qian
  assert.equal(hexagramSymbol(2), "\u4dc1"); // ䷁ Kun
  assert.equal(hexagramSymbol(63), "\u4dfe"); // ䷾ Ji Jì (After Completion); #64 fills the block to U+4DFF
  assert.equal(hexagramSymbol(64), "\u4dff"); // ䷿ Wei Jì (Before Completion)
});

test("hexagramSymbol rejects out-of-range numbers", () => {
  for (const bad of [0, 65, -1, 3.5, Number.NaN]) {
    assert.throws(() => hexagramSymbol(bad));
  }
});

// --- Classical Chinese hexagram names -------------------------------------------

test("every hexagram has a Chinese name in CJK range", () => {
  for (let kw = 1; kw <= 64; kw++) {
    const n = chineseName(kw);
    assert.match(n, /^[\u4e00-\u9fff]{1,3}$/, `KW ${kw} -> ${n}`);
  }
});

test("Chinese names spot-check the canon", () => {
  assert.equal(chineseName(1), "乾");
  assert.equal(chineseName(2), "坤");
  assert.equal(chineseName(29), "坎");
  assert.equal(chineseName(30), "離");
  assert.equal(chineseName(53), "漸");
  assert.equal(chineseName(63), "既濟");
  assert.equal(chineseName(64), "未濟");
});

test("chineseName rejects out-of-range numbers", () => {
  for (const bad of [0, 65, -1, 2.5, Number.NaN]) {
    assert.throws(() => chineseName(bad));
  }
});
