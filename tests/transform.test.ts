// T015 (test first) — pattern ops & XOR transform (FR-009/FR-010, data-model §3, C-6)
import { test } from "node:test";
import assert from "node:assert/strict";
import { patternFromLines, changingMask, relatedPattern } from "../src/core/pattern.ts";
import type { CastLine } from "../src/core/pattern.ts";

const yangLine = (position: number, value: 7 | 9 = 7): CastLine => ({
  position, value, changing: value === 9
});
const yinLine = (position: number, value: 6 | 8 = 8): CastLine => ({
  position, value, changing: value === 6
});

test("patternFromLines sets bit p-1 when position p is yang (bit 0 = bottom)", () => {
  // Six young yang: all bits set.
  const all = [1, 2, 3, 4, 5, 6].map((p) => yangLine(p));
  assert.equal(patternFromLines(all), 0b111111);
  // Only bottom young yang: bit 0.
  const bottom = [yangLine(1), yinLine(2), yinLine(3), yinLine(4), yinLine(5), yinLine(6)];
  assert.equal(patternFromLines(bottom), 0b000001);
  // Changing lines still count as their polarity for the ORIGINAL pattern.
  const oldYangBottom = [yangLine(1, 9), ...[2, 3, 4, 5, 6].map((p) => yinLine(p))];
  assert.equal(patternFromLines(oldYangBottom), 0b000001);
  const oldYinTop = [...[1, 2, 3, 4, 5].map((p) => yangLine(p)), yinLine(6, 6)];
  assert.equal(patternFromLines(oldYinTop), 0b011111);
});

test("changingMask marks changing positions only", () => {
  const lines = [
    yangLine(1, 9), yinLine(2, 8), yangLine(3, 7), yinLine(4, 6),
    yangLine(5, 7), yinLine(6, 8)
  ];
  assert.equal(changingMask(lines), 0b001001);
  assert.equal(changingMask(lines.map((l) => ({ ...l, changing: false, value: l.value === 9 || l.value === 7 ? 7 : 8 }))), 0);
});

test("exhaustive: all 64 patterns × all 64 masks — relatedPattern is XOR, independently derived", () => {
  for (let pattern = 0; pattern < 64; pattern++) {
    for (let mask = 0; mask < 64; mask++) {
      const related = relatedPattern(pattern, mask);
      // Independent derivation: per-bit flip.
      let expected = 0;
      for (let b = 0; b < 6; b++) {
        const bit = (pattern >> b) & 1;
        const flip = (mask >> b) & 1;
        expected |= (bit ^ flip) << b;
      }
      assert.equal(related, expected, `pattern ${pattern} mask ${mask}`);
      // Related pattern never retains the changing bits: flipping mask bits moves them.
      if (mask !== 0) {
        assert.notEqual(related, pattern);
      }
      // Related is in range.
      assert.ok(related >= 0 && related <= 63);
    }
  }
});

test("documented full flips: hexagram 1 <-> 2, 63 <-> 64 patterns", () => {
  // 1 (all yang, pattern 63) with all lines changing (mask 63) -> 2 (pattern 0).
  assert.equal(relatedPattern(0b111111, 0b111111), 0);
  // 63 (pattern 0b010101 = 21) all changing -> 64 (pattern 0b101010 = 42).
  assert.equal(relatedPattern(0b010101, 0b111111), 0b101010);
  // and back
  assert.equal(relatedPattern(0b101010, 0b111111), 0b010101);
});

test("mask === 0 => stable: pattern unchanged when flipped with zero mask", () => {
  for (let pattern = 0; pattern < 64; pattern++) {
    assert.equal(relatedPattern(pattern, 0), pattern);
  }
});
