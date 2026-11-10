// T008 — corpus completeness + attribution + no-Wilhelm guard (FR-015, FR-008, SC-002, A-3)
import { test } from "node:test";
import assert from "node:assert/strict";
import { CORPUS, CORPUS_ATTRIBUTION } from "../src/data/texts.ts";

test("CORPUS has 65 slots: null sentinel at 0, texts at 1..64", () => {
  assert.equal(CORPUS.length, 65);
  assert.equal(CORPUS[0], null);
  for (let n = 1; n <= 64; n++) {
    const entry = CORPUS[n];
    assert.ok(entry != null, `hexagram ${n}: entry missing`);
  }
});

test("every hexagram has a non-empty judgement and image after trim (FR-015)", () => {
  for (let n = 1; n <= 64; n++) {
    const entry = CORPUS[n];
    assert.ok(entry != null);
    assert.ok(entry.judgement.trim().length > 0, `hexagram ${n}: empty judgement`);
    assert.ok(entry.image.trim().length > 0, `hexagram ${n}: empty image`);
  }
});

test("attribution names Legge, SBE, and public domain (FR-008)", () => {
  assert.match(CORPUS_ATTRIBUTION, /Legge/);
  assert.match(CORPUS_ATTRIBUTION, /Sacred Books of the East/);
  assert.match(CORPUS_ATTRIBUTION, /public domain/i);
});

test("no Wilhelm/Baynes signature strings anywhere in the corpus (A-3)", () => {
  // Wilhelm/Baynes (1950) distinctives that Legge does not use. Legge writes
  // "Abysmic"/"Dangerous", "Keep-still", "Exciting"; Baynes writes "Abysmal",
  // "Keeping Still", "Arousing", and signs the book "Wilhelm / Baynes".
  const signatures = [
    "wilhelm", "baynes", "abysmal", "keeping still", "the arousing",
    "the joyous (lake)", "the abyss (", "the alchemist", "wu hsin"
  ];
  const allParts: string[] = [CORPUS_ATTRIBUTION];
  for (const e of CORPUS) {
    if (e !== null) allParts.push(e.judgement, e.image);
  }
  const all = allParts.join("\n").toLowerCase();
  for (const sig of signatures) {
    assert.ok(!all.includes(sig), `corpus contains Wilhelm/Baynes signature: "${sig}"`);
  }
});
