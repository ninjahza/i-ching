// T008 — corpus completeness + attribution + no-Wilhelm guard (FR-015, FR-008, SC-002, A-3)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
// The historical JavaScript chunks are the baseline for the archived quotations.
// @ts-expect-error The historical seed scripts do not provide TypeScript declarations.
import { HEX_1_22 } from "../scripts/corpus-chunk-1.mjs";
// @ts-expect-error The historical seed scripts do not provide TypeScript declarations.
import { HEX_23_44 } from "../scripts/corpus-chunk-2.mjs";
// @ts-expect-error The historical seed scripts do not provide TypeScript declarations.
import { HEX_45_64 } from "../scripts/corpus-chunk-3.mjs";
import { CORPUS, CORPUS_ATTRIBUTION } from "../src/data/texts.ts";

test("archive and generated quotations remain byte-for-byte identical to the original chunks", () => {
  const archive = JSON.parse(readFileSync("corpus/legge-1882.json", "utf8"));
  const baseline = [...HEX_1_22, ...HEX_23_44, ...HEX_45_64];
  assert.equal(archive.hexagrams.length, 64);
  assert.equal(baseline.length, 64);
  for (let i = 0; i < 64; i++) {
    const original = baseline[i];
    const generated = CORPUS[i + 1];
    assert.ok(original);
    assert.ok(generated);
    assert.equal(archive.hexagrams[i].number, i + 1);
    for (const field of ["judgement", "image"] as const) {
      assert.equal(archive.hexagrams[i][field], original[field], `archive ${i + 1} ${field}`);
      assert.equal(generated[field], original[field], `generated ${i + 1} ${field}`);
    }
  }
});

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

test("archive and generated summaries are complete, matching, and within editorial bounds", () => {
  const archive = JSON.parse(readFileSync("corpus/legge-1882.json", "utf8"));
  assert.equal(archive.hexagrams.length, 64);
  for (let n = 1; n <= 64; n++) {
    const text: unknown = archive.hexagrams[n - 1].summary;
    assert.equal(typeof text, "string", `hexagram ${n}: missing summary`);
    const summary = text as string;
    assert.equal(summary, summary.trim(), `hexagram ${n}: surrounding whitespace`);
    const paragraphs = summary.split("\n\n");
    assert.ok(paragraphs.length >= 1 && paragraphs.length <= 2, `hexagram ${n}: paragraph count`);
    assert.ok(paragraphs.every((p) => p.trim() === p && p.length > 0 && !p.includes("\n")), `hexagram ${n}: invalid paragraphs`);
    const words = summary.split(/\s+/).length;
    assert.ok(words >= 60 && words <= 180, `hexagram ${n}: ${words} words`);
  }
  for (let n = 1; n <= 64; n++) {
    const generated = CORPUS[n] as { readonly summary?: string } | null;
    assert.equal(generated?.summary, archive.hexagrams[n - 1].summary, `hexagram ${n}: generated summary differs`);
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
  const archive = JSON.parse(readFileSync("corpus/legge-1882.json", "utf8"));
  for (const entry of archive.hexagrams) {
    if (typeof entry.summary === "string") allParts.push(entry.summary);
  }
  const all = allParts.join("\n").toLowerCase();
  for (const sig of signatures) {
    assert.ok(!all.includes(sig), `corpus contains Wilhelm/Baynes signature: "${sig}"`);
  }
});

test("authored summaries avoid line-by-line readings and predictive or advisory language", () => {
  const archive = JSON.parse(readFileSync("corpus/legge-1882.json", "utf8"));
  const prohibited = [
    /\bline\s*(?:[1-6]|one|two|three|four|five|six)\b/i,
    /\b(?:first|second|third|fourth|fifth|sixth|topmost|bottommost)\s+line\b/i,
    /\b(?:nine|six)\s+in\s+the\b/i,
    /\b(?:you|your)\s+(?:will|shall|should|must|need to|ought to)\b/i,
    /\b(?:you(?:'ll| will)|your future)\b/i,
    /\b(?:guarantees?|predicts?|foretells?|diagnos(?:e|es)|prescrib(?:e|es))\b/i,
    /\b(?:medical|legal|financial)\s+advice\b/i
  ];
  let present = 0;
  for (const entry of archive.hexagrams) {
    if (typeof entry.summary !== "string") continue;
    present++;
    for (const pattern of prohibited) {
      assert.ok(!pattern.test(entry.summary), `hexagram ${entry.number}: ${pattern}`);
    }
  }
  assert.ok(present > 0, "no summaries available to scan");
});
