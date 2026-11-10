// T018 (test first) — Consultation aggregate & state machine
// (data-model §7, C-1..C-3, C-8, C-11, FR-002, FR-012, FR-023, R-11)
import { test } from "node:test";
import assert from "node:assert/strict";
import { createConsultation } from "../src/core/consultation.ts";
import { COINS, YARROW } from "../src/core/casting.ts";
import type { RandomSource } from "../src/core/casting.ts";

// Fixed-sequence source: bytes cycle through the given list (deterministic casting).
function scripted(bytes: number[]): RandomSource {
  let i = 0;
  return {
    randomBytes(out: Uint8Array): Uint8Array {
      for (let k = 0; k < out.length; k++) {
        out[k] = bytes[i % bytes.length] as number;
        i++;
      }
      return out;
    }
  };
}

test("state machine: empty/asking -> casting(k) -> complete, lines revealed bottom-up", () => {
  // Six young-yang bytes (coins popcount 1 -> 7 each? use byte 5 = 0b101 -> popcount 2 -> 8? choose 0 -> popcount 0 -> 6? Use bytes producing young yang 7: popcount 1: e.g. 1)
  const c = createConsultation({ method: COINS, random: scripted([1, 1, 1, 1, 1, 1]), question: null });
  assert.equal(c.state, "asking");
  assert.equal(c.revealedCount, 0);
  const l1 = c.castNextLine();
  assert.equal(l1.position, 1); // bottom-up
  assert.equal(c.revealedCount, 1);
  assert.equal(c.state, "casting");
  const rest = [c.castNextLine(), c.castNextLine(), c.castNextLine(), c.castNextLine(), c.castNextLine()];
  assert.deepEqual(rest.map((l) => l.position), [2, 3, 4, 5, 6]);
  assert.equal(c.state, "complete");
  // all values 7 => young yang => pattern all yang = 63 => hexagram 1
  assert.equal(c.pattern, 0b111111);
  assert.equal(c.changingMask, 0);
  assert.equal(c.hexagram.kwNumber, 1);
  assert.equal(c.related, null); // stable: FR-010
});

test("castNextLine after completion throws — no seventh line", () => {
  const c = createConsultation({ method: COINS, random: scripted([1]), question: null });
  for (let i = 0; i < 6; i++) c.castNextLine();
  assert.throws(() => c.castNextLine());
});

test("derived fields unavailable before completion — a half cast cannot present as a result (C-11)", () => {
  const c = createConsultation({ method: COINS, random: scripted([1]), question: null });
  c.castNextLine();
  assert.throws(() => c.pattern);
  assert.throws(() => c.hexagram);
  assert.equal(c.state, "casting");
});

test("question optional; truncated defensively at 500 chars with flag (FR-002, R-11)", () => {
  const none = createConsultation({ method: COINS, random: scripted([1]), question: null });
  assert.equal(none.question, null);
  const empty = createConsultation({ method: COINS, random: scripted([1]), question: "   " });
  assert.equal(empty.question, null, "whitespace-only question normalises to null");
  const long = "q".repeat(600);
  const c = createConsultation({ method: COINS, random: scripted([1]), question: long });
  assert.ok(c.question !== null && c.question.length === 500);
  assert.equal(c.questionTruncated, true);
  const short = createConsultation({ method: COINS, random: scripted([1]), question: "still water?" });
  assert.equal(short.question, "still water?");
  assert.equal(short.questionTruncated, false);
});

test("changing lines: mask, related hexagram, and full-flip of all six (C-6)", () => {
  // coins: old yang 9 from low3 popcount 3 (byte 7); old yin 6 from popcount 0 (byte 0)
  // Script: alternating byte 7 (9) and 0 (6) -> all six lines changing.
  const c = createConsultation({ method: YARROW, random: scripted([9, 15, 9, 15, 9, 15]), question: null });
  for (let i = 0; i < 6; i++) c.castNextLine();
  // yarrow: r=9&15=9 -> 8 (young yin); 15 -> 6 old yin; pattern: pos1 8(yin) pos2 6(yin ch) ...
  assert.equal(c.state, "complete");
  const lines = c.lines;
  assert.equal(lines.length, 6);
  assert.equal(c.changingMask, 0b101010); // even positions old yin (bit p-1)
  assert.equal(c.pattern, 0);
  assert.equal(c.hexagram.kwNumber, 2);
  const rel = c.related;
  assert.ok(rel !== null);
  assert.equal(rel.pattern, 0 ^ 0b101010);
});

test("stable cast (mask 0): related === null, never a lesser cast (FR-010, C-6)", () => {
  const c = createConsultation({ method: COINS, random: scripted([1, 4, 2, 1, 4, 2]), question: null });
  for (let i = 0; i < 6; i++) c.castNextLine();
  if (c.changingMask === 0) {
    assert.equal(c.related, null);
  } else {
    // scripted bytes 1,4,2 are popcount 1 -> young yang; ensure none changing
    throw new Error("script unexpectedly produced changing lines");
  }
});

test("castAgain: fresh instance, question null/unreachable, no lines, no derived data (FR-012/FR-023)", () => {
  const first = createConsultation({ method: YARROW, random: scripted([1, 1, 1, 1, 1, 1]), question: "How should I proceed?" });
  for (let i = 0; i < 6; i++) first.castNextLine();
  assert.equal(first.hexagram.kwNumber, 1);
  const again = first.castAgain();
  assert.notEqual(again, first);
  assert.equal(again.question, null, "old question must be unreachable (FR-023)");
  assert.equal(again.revealedCount, 0);
  assert.equal(again.state, "asking");
  assert.equal(again.method.id, "yarrow", "method carries over within the session (C-9)");
  assert.throws(() => again.hexagram);
  // and the old object keeps its own data (we do not mutate, we discard)
  assert.equal(first.question, "How should I proceed?");
});

test("method used for the whole cast is fixed at construction (FR-005)", () => {
  const c = createConsultation({ method: YARROW, random: scripted([9]), question: null });
  assert.equal(c.method.id, "yarrow");
});
