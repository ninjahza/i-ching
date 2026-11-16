// T018 (test first) — Consultation aggregate & state machine
// (data-model §7, C-1..C-3, C-8, C-11, FR-002, FR-012, FR-023, R-11)
import { test } from "node:test";
import assert from "node:assert/strict";
import { createConsultation, createManualConsultation } from "../src/core/consultation.ts";
import { COINS, YARROW } from "../src/core/casting.ts";
import type { RandomSource } from "../src/core/casting.ts";
import { PATTERN_TO_KW } from "../src/data/king-wen.ts";

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

// ---- Feature 004: User Cast manual consultation tests (T005) ----

test("manual consultation constructs without random source and normalises question", () => {
  const c = createManualConsultation({ question: "  " });
  assert.equal(c.mode, "manual");
  assert.equal(c.method, "user");
  assert.equal(c.state, "asking");
  assert.equal(c.revealedCount, 0);
  assert.equal(c.question, null);
  assert.equal(c.questionTruncated, false);

  const viaOverload = createConsultation({ mode: "manual", question: "x".repeat(525) });
  assert.equal(viaOverload.mode, "manual");
  assert.equal(viaOverload.question?.length, 500);
  assert.equal(viaOverload.questionTruncated, true);
});

test("manual addLine appends bottom-up (1..6), guards premature derivation and seventh line", () => {
  const c = createManualConsultation({ question: "What is unfolding?" });
  const seq = [6, 7, 8, 9, 7, 8] as const;
  for (let idx = 0; idx < seq.length; idx++) {
    assert.throws(() => c.pattern, `pattern must throw at count ${idx}`);
    assert.throws(() => c.changingMask, `changingMask must throw at count ${idx}`);
    assert.throws(() => c.hexagram, `hexagram must throw at count ${idx}`);
    assert.throws(() => c.related, `related must throw at count ${idx}`);

    const v = seq[idx] as number;
    const line = c.addLine(v);
    assert.equal(line.position, idx + 1);
    assert.equal(line.value, v);
    assert.equal(line.changing, v === 6 || v === 9);
    assert.equal(c.revealedCount, idx + 1);
    assert.equal(c.state, idx + 1 < 6 ? "casting" : "complete");
  }

  // Seventh line rejected; completed state unchanged.
  assert.throws(() => c.addLine(7));
  assert.equal(c.revealedCount, 6);
  assert.deepEqual(c.lines.map((l) => l.value), [6, 7, 8, 9, 7, 8]);

  const again = c.castAgain();
  assert.equal(again.mode, "manual");
  assert.equal(again.method, "user");
  assert.equal(again.question, null);
  assert.equal(again.revealedCount, 0);
  assert.equal(again.state, "asking");
});

test("manual addLine rejects missing, out-of-range, fractional, and non-numeric values without mutating state", () => {
  const c = createManualConsultation({ question: null });
  c.addLine(7);
  const badValues: unknown[] = [
    undefined,
    null,
    NaN,
    Infinity,
    -Infinity,
    0,
    5,
    10,
    -7,
    6.5,
    7.0001,
    "6",
    "7",
    "",
    {},
    [6],
  ];
  for (const bad of badValues) {
    assert.throws(
      () => c.addLine(bad as number),
      /not a line value/i,
      `expected addLine(${String(bad)}) to throw`,
    );
  }
  assert.equal(c.revealedCount, 1);
  assert.deepEqual(c.lines.map((l) => l.value), [7]);
  assert.equal(c.state, "casting");
});

test("wrong-mode calls are rejected explicitly without side effects", () => {
  let randomReads = 0;
  const spyRandom: RandomSource = {
    randomBytes(out: Uint8Array): Uint8Array {
      randomReads++;
      out[0] = 1;
      return out;
    },
  };
  const auto = createConsultation({ method: COINS, random: spyRandom, question: null });
  assert.equal(auto.mode, "automatic");
  assert.throws(() => (auto as unknown as { addLine(v: number): unknown }).addLine(7));
  assert.equal(auto.revealedCount, 0);
  assert.equal(randomReads, 0);

  const manual = createManualConsultation({ question: null });
  assert.throws(() => (manual as unknown as { castNextLine(): unknown }).castNextLine());
  assert.equal(manual.revealedCount, 0);
});

test("manual canonical edge cases: all 7s, all 8s, all 9s, all 6s, and asymmetric order-sensitive sequences", () => {
  const run = (vals: readonly number[]) => {
    const c = createManualConsultation({ question: null });
    for (const v of vals) c.addLine(v);
    return c;
  };

  const all7 = run([7, 7, 7, 7, 7, 7]);
  assert.equal(all7.hexagram.kwNumber, 1);
  assert.equal(all7.changingMask, 0);
  assert.equal(all7.related, null);

  const all8 = run([8, 8, 8, 8, 8, 8]);
  assert.equal(all8.hexagram.kwNumber, 2);
  assert.equal(all8.changingMask, 0);
  assert.equal(all8.related, null);

  const all9 = run([9, 9, 9, 9, 9, 9]);
  assert.equal(all9.hexagram.kwNumber, 1);
  assert.equal(all9.changingMask, 0b111111);
  assert.equal(all9.related?.kwNumber, 2);

  const all6 = run([6, 6, 6, 6, 6, 6]);
  assert.equal(all6.hexagram.kwNumber, 2);
  assert.equal(all6.changingMask, 0b111111);
  assert.equal(all6.related?.kwNumber, 1);

  // Order-sensitive: bottom yang only (Fu, KW 24) vs top yang only (Po, KW 23).
  const bottomYang = run([7, 8, 8, 8, 8, 8]);
  const topYang = run([8, 8, 8, 8, 8, 7]);
  assert.equal(bottomYang.pattern, 0b000001);
  assert.equal(bottomYang.hexagram.kwNumber, 24);
  assert.equal(topYang.pattern, 0b100000);
  assert.equal(topYang.hexagram.kwNumber, 23);
  assert.notEqual(bottomYang.hexagram.kwNumber, topYang.hexagram.kwNumber);
});

test("exhaustive 4,096 manual six-value sequences match independent bit/mask oracle and King Wen lookup (SC-002)", () => {
  const digits = [6, 7, 8, 9] as const;
  let checked = 0;
  for (let n = 0; n < 4096; n++) {
    let code = n;
    let expectedPrimary = 0;
    let expectedMask = 0;
    const c = createManualConsultation({ question: null });

    for (let pos = 0; pos < 6; pos++) {
      const v = digits[code & 3] as number;
      code >>= 2;
      if (v === 7 || v === 9) expectedPrimary |= 1 << pos;
      if (v === 6 || v === 9) expectedMask |= 1 << pos;
      c.addLine(v);
    }

    const expectedTransformed = expectedPrimary ^ expectedMask;
    assert.equal(c.pattern, expectedPrimary);
    assert.equal(c.changingMask, expectedMask);
    assert.equal(c.hexagram.kwNumber, PATTERN_TO_KW[expectedPrimary]);
    if (expectedMask === 0) {
      assert.equal(c.related, null);
    } else {
      assert.notEqual(c.related, null);
      assert.equal(c.related?.pattern, expectedTransformed);
      assert.equal(c.related?.kwNumber, PATTERN_TO_KW[expectedTransformed]);
    }
    checked++;
  }
  assert.equal(checked, 4096);
});

// ---- Feature 004: User Story 2 manual undo tests (T014) ----

test("manual undoLastLine removes LIFO, recalculates positions on replacement, stops at empty, rejects after completion, and has no effect on automatic casts", () => {
  const c = createManualConsultation({ question: null });
  // Cannot undo at zero.
  assert.throws(() => c.undoLastLine());
  assert.equal(c.state, "asking");

  c.addLine(6);
  c.addLine(7);
  c.addLine(9); // mistaken third line
  assert.equal(c.revealedCount, 3);
  assert.equal(c.state, "casting");

  const removed3 = c.undoLastLine();
  assert.equal(removed3.position, 3);
  assert.equal(removed3.value, 9);
  assert.equal(c.revealedCount, 2);
  assert.equal(c.state, "casting");
  assert.deepEqual(c.lines.map((l) => [l.position, l.value]), [[1, 6], [2, 7]]);

  // Replace line 3 with 8 and verify position is recalculated as 3.
  const replaced3 = c.addLine(8);
  assert.equal(replaced3.position, 3);
  assert.equal(replaced3.value, 8);

  // Undo repeatedly all the way to empty.
  assert.equal(c.undoLastLine().position, 3);
  assert.equal(c.undoLastLine().position, 2);
  assert.equal(c.undoLastLine().position, 1);
  assert.equal(c.revealedCount, 0);
  assert.equal(c.state, "asking");
  assert.throws(() => c.undoLastLine());

  // Complete a full 6-line cast using a replacement and verify replacement governs result.
  c.addLine(7);
  c.addLine(7);
  c.addLine(6); // mistake at pos 3
  c.undoLastLine();
  c.addLine(7); // replaced with 7 (all stable yang)
  c.addLine(7);
  c.addLine(7);
  c.addLine(7);
  assert.equal(c.state, "complete");
  assert.equal(c.hexagram.kwNumber, 1);
  assert.equal(c.changingMask, 0);
  assert.equal(c.related, null);

  // Cannot undo after completion; completed data stays intact.
  assert.throws(() => c.undoLastLine());
  assert.equal(c.revealedCount, 6);
  assert.equal(c.hexagram.kwNumber, 1);

  // Automatic consultation rejects undo without altering its lines.
  const auto = createConsultation({ method: COINS, random: scripted([1, 1, 1]), question: null });
  auto.castNextLine();
  auto.castNextLine();
  assert.throws(() => (auto as unknown as { undoLastLine(): unknown }).undoLastLine());
  assert.equal(auto.revealedCount, 2);
});


