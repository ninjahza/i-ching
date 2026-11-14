import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { CORPUS } from "../src/data/texts.ts";
// @ts-expect-error The Node validation module is plain JavaScript by design.
import { canonicalData, refResolves, validateCorpus } from "../scripts/validate-modern-corpus.mjs";

const source = JSON.parse(readFileSync("corpus/modern-prose.json", "utf8")) as any;
const baseline = JSON.parse(readFileSync("tests/fixtures/modern-corpus-baseline.json", "utf8")) as any;
const cases = JSON.parse(readFileSync("tests/fixtures/modern-corpus/validator-cases.json", "utf8")) as any;
const review = readFileSync("corpus/modern-prose-review.md", "utf8");
const canon = canonicalData();
const words = (value: string): number => value.trim().split(/\s+/u).filter(Boolean).length;
const hash = (path: string): string => createHash("sha256").update(readFileSync(path)).digest("hex");

test("full structured corpus passes the fail-closed validator", () => {
  const result = validateCorpus(source);
  assert.deepEqual(result.errors, []);
  assert.equal(result.report.passageCount, 536);
  assert.ok(result.report.averageFleschKincaidGrade <= 9);
  assert.equal(result.report.sourceReferencesResolved, true);
});

test("the corpus contains 64 ordered canonical King Wen identities", () => {
  assert.equal(source.hexagrams.length, 64);
  const names = new Set<string>();
  for (let i = 0; i < 64; i++) {
    const entry = source.hexagrams[i];
    assert.equal(entry.number, i + 1);
    assert.equal(entry.chinese, canon.archive[i].chinese);
    assert.equal(entry.leggeTransliteration, canon.archive[i].name);
    assert.equal(entry.leggeTitle, canon.archive[i].english);
    assert.equal(entry.upperTrigramId, canon.pairs[i].upper);
    assert.equal(entry.lowerTrigramId, canon.pairs[i].lower);
    assert.ok(!names.has(entry.modernName.toLocaleLowerCase()));
    names.add(entry.modernName.toLocaleLowerCase());
    assert.ok(words(entry.judgement.text) >= 30 && words(entry.judgement.text) <= 120);
    assert.ok(words(entry.image.text) >= 20 && words(entry.image.text) <= 80);
    assert.equal(entry.lines.length, 6);
    for (let j = 0; j < 6; j++) {
      assert.equal(entry.lines[j].position, j + 1);
      assert.equal(entry.lines[j].lineType, (canon.pairs[i].upper * 8 + canon.pairs[i].lower) & (1 << j) ? "yang" : "yin");
      assert.ok(words(entry.lines[j].text) >= 15 && words(entry.lines[j].text) <= 70);
      assert.deepEqual(entry.lines[j].sourceReferences[0], {
        document: "text", section: "The Text", hexagramNumber: i + 1, part: "line", linePosition: j + 1
      });
    }
    if (i < 2) assert.ok(words(entry.allLinesChanging.text) >= 15 && words(entry.allLinesChanging.text) <= 70);
    else assert.equal(entry.allLinesChanging, null);
  }
});

test("guide coverage includes origins, trigrams, reflection, probabilities, notation, and changes", () => {
  const text = source.sections.flatMap((section: any) => section.blocks.map((block: any) => block.text)).join("\n");
  for (const phrase of [
    "King Wan", "Duke of Chou", "bottom upward", "unbroken", "divided",
    "no prediction or guarantee", "medical, legal, financial",
    "yes or no", "repeating the same question", "fifty stalks",
    "three rounds", "one quarter", "relating hexagram", "no relating figure"
  ]) assert.ok(text.toLowerCase().includes(phrase.toLowerCase()), `guide omitted ${phrase}`);
  assert.equal(source.sections.map((s: any) => s.id).join(","), "introduction,casting,reading");
  assert.equal(source.sections[0].blocks.find((b: any) => b.id === "trigrams").items.length, 8);
});

test("coin and yarrow distributions are exact and sum to one quarter changing", () => {
  const casting = source.sections.find((s: any) => s.id === "casting");
  const coin = casting.blocks.find((b: any) => b.id === "coins").probabilities;
  const yarrow = casting.blocks.find((b: any) => b.id === "yarrow").probabilities;
  assert.deepEqual(coin, { 6: "1/8", 7: "3/8", 8: "3/8", 9: "1/8" });
  assert.deepEqual(yarrow, { 6: "1/16", 7: "5/16", 8: "7/16", 9: "3/16" });
  const value = (ratio: string): number => {
    const [a, b] = ratio.split("/").map(Number);
    return a! / b!;
  };
  assert.equal(value(coin[6]) + value(coin[9]), 1 / 4);
  assert.equal(value(yarrow[6]) + value(yarrow[9]), 1 / 4);
  assert.equal(value(yarrow[9]), 3 * value(yarrow[6]));
});

test("worked examples are independently derived from bottom-up line values", () => {
  const examples = source.sections.find((s: any) => s.id === "reading").blocks.filter((b: any) => b.kind === "workedExample");
  assert.equal(examples.length, 2);
  assert.deepEqual(examples.map((e: any) => [e.initialHexagram, e.changingPositions, e.relatingHexagram]), [
    [1, [5], 14], [41, [2, 5], 42]
  ]);
  assert.deepEqual(validateCorpus(source).errors, []);
});

test("all modern passages are traced and glossary renderings stay controlled", () => {
  for (const entry of source.hexagrams) {
    assert.equal(entry.judgement.sourceReferences[0].part, "judgement");
    assert.equal(entry.image.sourceReferences[0].section, "Appendix II · Section I");
    for (const line of entry.lines) assert.ok(refResolves(line.sourceReferences[0], canon));
  }
  const allPassages = [
    ...source.sections.flatMap((s: any) => s.blocks),
    ...source.hexagrams.flatMap((e: any) => [e.judgement, e.image, ...e.lines, e.allLinesChanging].filter(Boolean))
  ];
  for (const passage of allPassages) {
    for (const id of passage.glossaryTerms ?? []) {
      const term = source.glossary.find((x: any) => x.id === id);
      assert.ok(term);
      assert.ok(passage.text.includes(term.fixedRendering));
    }
  }
});

test("validator rejects representative malformed source records", () => {
  assert.equal(refResolves(cases.validReference, canon), true);
  assert.equal(refResolves(cases.invalidReference, canon), false);
  for (const mutate of [
    (copy: any) => { copy.hexagrams[0].lines[0].position = cases.invalidPosition.position; },
    (copy: any) => { copy.hexagrams[0].lines[0].lineType = "yin"; },
    (copy: any) => { copy.hexagrams[0].judgement.text = "too short"; },
    (copy: any) => { copy.hexagrams[0].lines[0].sourceReferences[0] = cases.invalidReference; },
    (copy: any) => { copy.sections[2].blocks.find((b: any) => b.id === "single-example").relatingHexagram = cases.invalidExample.relatingHexagram; },
    (copy: any) => { copy.provenance.method = "The Abysmal"; },
    (copy: any) => { copy.hexagrams[0].lines[0].glossaryTerms = ["missing-term"]; },
    (copy: any) => { copy.sections[0].blocks[0].text += " A superior man leads."; },
    (copy: any) => { copy.sections[0].blocks[0].text += " You should follow this."; },
    (copy: any) => { copy.hexagrams[0].judgement.text = copy.hexagrams[0].judgement.text.replace("favorable conditions", "good luck"); }
  ]) {
    const copy = structuredClone(source);
    mutate(copy);
    assert.ok(validateCorpus(copy).errors.length > 0);
  }
});

test("review ledger covers every passage and reports readability and editorial gates", () => {
  const rows = [...review.matchAll(/^\| (?:introduction|casting|reading|glossary\/|\d+\/)[^|]*\|/gm)];
  assert.equal(rows.length, 536);
  assert.match(review, /mean FK grade 7\.\d+/);
  assert.match(review, /72 of 536 passages \(13\.4%\)/);
  for (const n of [1, 2, 3, 29, 63, 64]) {
    assert.match(review, new RegExp(`\\| ${n}/judgement \\|.*\\| PASS \\| Paired source review \\|`));
    assert.match(review, new RegExp(`\\| ${n}/line-6 \\|.*\\| PASS \\| Paired source review \\|`));
  }
  assert.match(review, /\| Originality \|.*PASS/);
  assert.match(review, /\| Non-prediction \|.*PASS/);
});

test("the immutable Legge hashes and all pre-feature app result texts match baseline", () => {
  for (const [path, expected] of Object.entries(baseline.sourceSha256)) assert.equal(hash(path), expected, path);
  const archive = JSON.parse(readFileSync("corpus/legge-1882.json", "utf8"));
  assert.equal(baseline.appResults.length, 64);
  assert.equal(CORPUS.length, 65);
  for (let i = 0; i < 64; i++) {
    const expected = baseline.appResults[i];
    const actual = CORPUS[i + 1];
    assert.ok(actual);
    assert.equal(expected.number, i + 1);
    assert.deepEqual(
      { judgement: actual.judgement, image: actual.image, summary: actual.summary },
      { judgement: expected.judgement, image: expected.image, summary: expected.summary }
    );
    assert.deepEqual(
      { judgement: archive.hexagrams[i].judgement, image: archive.hexagrams[i].image, summary: archive.hexagrams[i].summary },
      { judgement: expected.judgement, image: expected.image, summary: expected.summary }
    );
  }
});
