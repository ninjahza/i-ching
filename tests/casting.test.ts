// T016 (test first) — casting methods (FR-004, FR-005, SC-003; data-model §6; C-3)
import { test } from "node:test";
import assert from "node:assert/strict";
import { COINS, YARROW, castLine } from "../src/core/casting.ts";
import type { RandomSource } from "../src/core/casting.ts";

const METHODS = [COINS, YARROW] as const;

test("declared probability profiles", () => {
  assert.deepEqual(COINS.probs, { 6: 1 / 8, 7: 3 / 8, 8: 3 / 8, 9: 1 / 8 });
  assert.deepEqual(YARROW.probs, { 6: 1 / 16, 7: 5 / 16, 8: 7 / 16, 9: 3 / 16 });
  for (const m of METHODS) {
    const sum = (Object.values(m.probs) as number[]).reduce((a, b) => a + b, 0);
    assert.equal(sum, 1, `${m.id}: probs must sum to 1`);
  }
});

test("exact byte-partition: every byte 0..255 maps with the declared counts — coins (popcount)", () => {
  const counts: Record<number, number> = { 6: 0, 7: 0, 8: 0, 9: 0 };
  for (let byte = 0; byte < 256; byte++) {
    const v = COINS.draw(byte);
    assert.ok(v === 6 || v === 7 || v === 8 || v === 9, `coins byte ${byte} -> ${v}`);
    counts[v] = (counts[v] ?? 0) + 1;
  }
  // Out of 256 bytes: 9:32, 7:96, 8:96, 6:32
  assert.equal(counts[9], 32);
  assert.equal(counts[7], 96);
  assert.equal(counts[8], 96);
  assert.equal(counts[6], 32);
});

test("exact byte-partition: yarrow (byte & 15 map) over all 256 bytes", () => {
  const counts: Record<number, number> = { 6: 0, 7: 0, 8: 0, 9: 0 };
  for (let byte = 0; byte < 256; byte++) {
    const v = YARROW.draw(byte);
    assert.ok(v === 6 || v === 7 || v === 8 || v === 9, `yarrow byte ${byte} -> ${v}`);
    counts[v] = (counts[v] ?? 0) + 1;
  }
  // Out of 256: 9:48 (3/16), 7:80 (5/16), 8:112 (7/16), 6:16 (1/16)
  assert.equal(counts[9], 48);
  assert.equal(counts[7], 80);
  assert.equal(counts[8], 112);
  assert.equal(counts[6], 16);
});

// Deterministic injected source: xorshift PRNG seeded from a fixed constant,
// returning bytes. Used only for the statistical pass (the test source itself
// needs no entropy per R-4's note that getRandomValues seeds the harness).
function makeSeededSource(seed: number): RandomSource {
  let s = seed >>> 0;
  return {
    randomBytes(out: Uint8Array): Uint8Array {
      for (let i = 0; i < out.length; i++) {
        s ^= s << 13; s >>>= 0;
        s ^= s >>> 17;
        s ^= s << 5; s >>>= 0;
        out[i] = s & 0xff;
      }
      return out;
    }
  };
}

test("statistical: >=100,000 draws per method within 0.5pp of declared profile (SC-003)", () => {
  const N = 100_000;
  for (const m of METHODS) {
    const src = makeSeededSource(0x9e3779b9);
    const counts: Record<number, number> = { 6: 0, 7: 0, 8: 0, 9: 0 };
    for (let i = 0; i < N; i++) {
      const v = castLine(m, src);
      counts[v] = (counts[v] ?? 0) + 1;
    }
    for (const k of [6, 7, 8, 9] as const) {
      const observed = (counts[k] ?? 0) / N;
      const declared = m.probs[k];
      const drift = Math.abs(observed - declared) * 100; // percentage points
      assert.ok(drift < 0.5, `${m.id}: value ${k} observed ${(observed * 100).toFixed(2)}% vs declared ${(declared * 100).toFixed(2)}% (drift ${drift.toFixed(2)}pp)`);
    }
  }
});

test("yarrow old-yang > old-yin asymmetry present; coins symmetric", () => {
  const n9 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].filter((r) => YARROW.draw(r) === 9).length;
  const n6 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].filter((r) => YARROW.draw(r) === 6).length;
  assert.ok(n9 > n6, "yarrow must favour old yang over old yin (3/16 vs 1/16)");
  const c9 = Array.from({ length: 8 }, (_, i) => i).filter((r) => COINS.draw(r) === 9).length;
  const c6 = Array.from({ length: 8 }, (_, i) => i).filter((r) => COINS.draw(r) === 6).length;
  assert.equal(c9, c6, "coins old yang and old yin counts must match");
});

test("castLine consumes exactly one byte per draw and decodes it correctly", () => {
  let reads = 0;
  const src: RandomSource = {
    randomBytes(out: Uint8Array): Uint8Array {
      reads += 1;
      for (let i = 0; i < out.length; i++) out[i] = 15;
      return out;
    }
  };
  // byte 15 -> low3 bits 111 -> popcount 3 -> 6 + 3 = 9 (old yang)
  assert.equal(castLine(COINS, src), 9);
  assert.equal(reads, 1, "exactly one randomBytes call per draw");
});
