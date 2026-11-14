// Fail-closed validation for the separately published feature 003 source.
// The modern guide is not imported by the app; this script reads its JSON and
// the preserved Legge/canonical identity sources only.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_PATH = resolve(ROOT, "corpus/modern-prose.json");
const SECTIONS = ["introduction", "casting", "reading"];
const LIMITS = { judgement: [30, 120], image: [20, 80], line: [15, 70], allLinesChanging: [15, 70] };
const SIGNATURES = [
  "wilhelm", "baynes", "abysmal", "keeping still", "the arousing",
  "the joyous (lake)", "the abyss (", "the alchemist", "wu hsin"
];
const GENDERED_GENERIC = [
  /\bsuperior man\b/i, /\bgreat man\b/i, /\bwise man\b/i, /\bmankind\b/i,
  /\bevery man\b/i, /\bthe man who\b/i, /\bhe\b/i, /\bhim\b/i, /\bhis\b/i,
  /\bshe\b/i, /\bher\b/i
];
const PREDICTIVE_OR_ADVICE = [
  /\byou\s+(?:will|shall|should|must|need to|ought to)\b/i,
  /\byour\s+(?:future|destiny)\b/i,
  /\b(?:this reading|the hexagram|the text)\s+(?:guarantees?|foretells?|predicts?)\b/i,
  /\b(?:medical|legal|financial)\s+advice\b/i, /\bthis means that .{0,30}\bwill\b/i,
  /\bthe outcome is certain\b/i
];

const read = (file) => readFileSync(resolve(ROOT, file), "utf8");
const wordCount = (value) => value.trim().split(/\s+/u).filter(Boolean).length;
const syllables = (word) => {
  const clean = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!clean) return 0;
  const groups = clean.match(/[aeiouy]+/g)?.length ?? 1;
  return Math.max(1, groups - (clean.endsWith("e") && groups > 1 ? 1 : 0));
};

export function canonicalData() {
  const mapSource = read("src/data/king-wen.ts");
  const trigramSource = read("src/data/trigrams.ts");
  const archive = JSON.parse(read("corpus/legge-1882.json"));
  const pairs = [...mapSource.matchAll(/\[(\d+),\s*(\d+),\s*(\d+)\]/g)].map((m) => ({
    number: Number(m[1]), upper: Number(m[2]), lower: Number(m[3])
  })).filter((x) => x.number >= 1 && x.number <= 64);
  const trigrams = [...trigramSource.matchAll(/\{ id: (\d+), name: "([^"]+)", nature: "([^"]+)", bits:/g)]
    .map((m) => ({ id: Number(m[1]), name: m[2], nature: m[3] }));
  if (pairs.length !== 64 || trigrams.length !== 8 || archive.hexagrams?.length !== 64) {
    throw new Error("Cannot establish canonical King Wen, trigram, and Legge source data");
  }
  const texts = read("corpus/the_yi_king_clean.md");
  const textStart = texts.indexOf("## The Text\n");
  const appendixStart = texts.indexOf("### Appendix I", textStart);
  if (textStart < 0 || appendixStart < 0) throw new Error("Legge text section boundaries not found");
  const mainText = texts.slice(textStart, appendixStart);
  const headingMatches = [...mainText.matchAll(/^### ([IVXLCDM]+)\. .+$/gm)];
  const hexagramSources = headingMatches.slice(0, 64).map((m, i) => {
    const start = m.index;
    const end = headingMatches[i + 1]?.index ?? mainText.length;
    return mainText.slice(start, end);
  });
  if (hexagramSources.length !== 64) throw new Error("Could not resolve all 64 Legge text headings");
  const imageStart = texts.indexOf("#### Appendix II · Section I");
  const imageEnd = texts.indexOf("#### Appendix II · Section II", imageStart);
  if (imageStart < 0 || imageEnd < 0) throw new Error("Legge Appendix II image section boundaries not found");
  return { pairs, trigrams, archive: archive.hexagrams, texts, hexagramSources };
}

function allPassages(corpus) {
  const out = [];
  for (const section of corpus.sections ?? []) {
    for (const block of section.blocks ?? []) {
      if (typeof block.text === "string") out.push({ label: `${section.id}/${block.id}`, text: block.text, refs: block.sourceReferences, terms: block.glossaryTerms ?? [] });
    }
  }
  for (const term of corpus.glossary ?? []) {
    out.push({ label: `glossary/${term.id}`, text: `${term.fixedRendering} ${term.explanation}`, refs: term.sourceReferences, terms: [] });
  }
  for (const entry of corpus.hexagrams ?? []) {
    for (const [part, passage] of [["judgement", entry.judgement], ["image", entry.image], ["all-lines-changing", entry.allLinesChanging]]) {
      if (passage && typeof passage.text === "string") out.push({ label: `${entry.number}/${part}`, text: passage.text, refs: passage.sourceReferences, terms: passage.glossaryTerms ?? [] });
    }
    for (const line of entry.lines ?? []) out.push({ label: `${entry.number}/line-${line.position}`, text: line.text, refs: line.sourceReferences, terms: line.glossaryTerms ?? [] });
  }
  return out;
}

export function refResolves(ref, canonical) {
  if (!ref || !["preface", "introduction", "text", "appendix"].includes(ref.document) ||
      typeof ref.section !== "string" || !ref.section.trim()) return false;
  if (ref.document === "text") {
    if (ref.section !== "The Text") return false;
    if (!Number.isInteger(ref.hexagramNumber) || ref.hexagramNumber < 1 || ref.hexagramNumber > 64) return false;
    const section = canonical.hexagramSources[ref.hexagramNumber - 1];
    if (ref.part === "judgement") {
      const firstLine = section.search(/^[1-7]\. /m);
      return firstLine >= 0 && section.slice(0, firstLine).trim().length > 0;
    }
    if (ref.part === "line") return Number.isInteger(ref.linePosition) && ref.linePosition >= 1 && ref.linePosition <= 6 &&
      new RegExp(`^${ref.linePosition}\\. `, "m").test(section);
    if (ref.part === "all-lines-changing") return /^7\. /m.test(section);
    return false;
  }
  if (ref.document === "appendix") {
    if (!/^Appendix [IVX]+(?: · Section [IVX]+)?$/.test(ref.section)) return false;
    if (!canonical.texts.includes(`#### ${ref.section}`) && !canonical.texts.includes(`### ${ref.section}`)) return false;
    if (ref.hexagramNumber != null && (!Number.isInteger(ref.hexagramNumber) || ref.hexagramNumber < 1 || ref.hexagramNumber > 64)) return false;
    if (ref.part === "image") return ref.section === "Appendix II · Section I" &&
      Number.isInteger(ref.hexagramNumber) && !!canonical.archive[ref.hexagramNumber - 1]?.image;
    return ref.part === "guide" || ref.part === "trigrams" || ref.part === "yarrow";
  }
  if (ref.document === "preface") return ref.section === "Preface" && canonical.texts.includes("## Preface");
  if (ref.document === "introduction") {
    const chapter = ref.section.match(/^Chapter ([IVX]+)$/)?.[1];
    return !!chapter && canonical.texts.includes(`### Chapter ${chapter}.`);
  }
  return false;
}

export function validateCorpus(corpus, canonical = canonicalData()) {
  const errors = [];
  const fail = (message) => errors.push(message);
  if (!corpus || typeof corpus !== "object" || Array.isArray(corpus)) return { errors: ["source must be an object"], report: null };
  for (const field of ["schemaVersion", "editionVersion", "publicationDate", "language", "title"]) {
    if (typeof corpus[field] !== "string" || !corpus[field].trim()) fail(`metadata.${field} must be a non-empty string`);
  }
  if (corpus.language !== "en") fail("metadata language must be en");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(corpus.publicationDate ?? "") || Number.isNaN(Date.parse(`${corpus.publicationDate}T00:00:00Z`))) fail("publicationDate must be an ISO date");
  if (!corpus.provenance || typeof corpus.provenance !== "object") fail("provenance metadata is required");

  if (!Array.isArray(corpus.sections) || corpus.sections.map((s) => s.id).join(",") !== SECTIONS.join(",")) {
    fail(`sections must be ordered ${SECTIONS.join(" → ")}`);
  }
  for (const section of corpus.sections ?? []) {
    if (!section.heading || !Array.isArray(section.blocks) || section.blocks.length === 0) fail(`section ${section.id ?? "?"} needs a heading and blocks`);
    for (const block of section.blocks ?? []) {
      if (!block.id || !["paragraph", "orderedSteps", "workedExample", "probabilityTable", "trigramList", "lineKey"].includes(block.kind)) fail(`section ${section.id}: invalid block id/kind`);
      if (typeof block.text !== "string" || !block.text.trim()) fail(`${section.id}/${block.id}: text is required`);
      if (!Array.isArray(block.sourceReferences) || block.sourceReferences.length === 0 || block.sourceReferences.some((r) => !refResolves(r, canonical))) fail(`${section.id}/${block.id}: source reference missing or unresolved`);
    }
  }
  if (!Array.isArray(corpus.glossary) || corpus.glossary.length < 1) fail("glossary must contain controlled terms");
  const terms = new Map((corpus.glossary ?? []).map((t) => [t.id, t]));
  if (terms.size !== (corpus.glossary ?? []).length) fail("glossary ids must be unique");
  for (const term of corpus.glossary ?? []) {
    if (!term.id || !term.fixedRendering || !term.explanation || !Array.isArray(term.sourceForms) || !term.sourceForms.length) fail(`glossary/${term.id ?? "?"}: incomplete term`);
    if (!Array.isArray(term.sourceReferences) || !term.sourceReferences.length || term.sourceReferences.some((r) => !refResolves(r, canonical))) fail(`glossary/${term.id}: unresolved source reference`);
  }
  const entries = corpus.hexagrams;
  if (!Array.isArray(entries) || entries.length !== 64) fail("hexagrams must contain exactly 64 entries");
  const names = new Set();
  for (let i = 0; i < (entries?.length ?? 0); i++) {
    const e = entries[i];
    const n = i + 1;
    const identity = canonical.pairs[n - 1];
    const source = canonical.archive[n - 1];
    if (e.number !== n) fail(`hexagram ${n}: King Wen order/number mismatch`);
    if (e.chinese !== source.chinese || e.leggeTransliteration !== source.name || e.leggeTitle !== source.english) fail(`hexagram ${n}: canonical Legge identity mismatch`);
    if (e.upperTrigramId !== identity.upper || e.lowerTrigramId !== identity.lower) fail(`hexagram ${n}: trigram ids do not match King Wen mapping`);
    if (!e.modernName || names.has(e.modernName.toLocaleLowerCase())) fail(`hexagram ${n}: modern name missing or duplicated`);
    names.add(e.modernName?.toLocaleLowerCase());
    const checkPassage = (part, passage, range) => {
      if (!passage || typeof passage.text !== "string" || !passage.text.trim()) { fail(`hexagram ${n}/${part}: missing passage`); return; }
      const count = wordCount(passage.text);
      if (count < range[0] || count > range[1]) fail(`hexagram ${n}/${part}: ${count} words; expected ${range[0]}–${range[1]}`);
      if (!Array.isArray(passage.sourceReferences) || !passage.sourceReferences.length || passage.sourceReferences.some((r) => !refResolves(r, canonical))) fail(`hexagram ${n}/${part}: invalid source reference`);
      for (const id of passage.glossaryTerms ?? []) {
        if (!terms.has(id)) fail(`hexagram ${n}/${part}: unknown glossary term ${id}`);
        else if (!passage.text.includes(terms.get(id).fixedRendering)) fail(`hexagram ${n}/${part}: glossary ${id} is not using its controlled rendering`);
      }
    };
    checkPassage("judgement", e.judgement, LIMITS.judgement);
    checkPassage("image", e.image, LIMITS.image);
    if (!Array.isArray(e.lines) || e.lines.length !== 6) fail(`hexagram ${n}: exactly six lines required`);
    const pattern = (identity.upper << 3) | identity.lower;
    for (let j = 0; j < (e.lines?.length ?? 0); j++) {
      const line = e.lines[j];
      const pos = j + 1;
      const expected = (pattern & (1 << (pos - 1))) ? "yang" : "yin";
      if (line.position !== pos || line.lineType !== expected) fail(`hexagram ${n}/line-${pos}: position/order/type mismatch; expected ${expected}`);
      checkPassage(`line-${pos}`, line, LIMITS.line);
      if (line.sourceReferences?.some((r) => r.document !== "text" || r.hexagramNumber !== n || r.part !== "line" || r.linePosition !== pos)) fail(`hexagram ${n}/line-${pos}: reference must resolve to its own Legge line`);
    }
    if (n <= 2) checkPassage("all-lines-changing", e.allLinesChanging, LIMITS.allLinesChanging);
    else if (e.allLinesChanging != null) fail(`hexagram ${n}: all-lines-changing reading is permitted only for 1 and 2`);
  }

  const referencedGlossaryIds = new Set();
  for (const p of allPassages(corpus)) {
    if (!Array.isArray(p.refs) || p.refs.length === 0 || p.refs.some((r) => !refResolves(r, canonical))) fail(`${p.label}: passage source trace is unresolved`);
    for (const id of p.terms) {
      if (!terms.has(id)) fail(`${p.label}: unknown glossary id ${id}`);
      else {
        referencedGlossaryIds.add(id);
        if (!p.text.includes(terms.get(id).fixedRendering)) fail(`${p.label}: glossary ${id} is not using its controlled rendering`);
      }
    }
  }
  for (const term of corpus.glossary ?? []) if (!referencedGlossaryIds.has(term.id)) fail(`glossary/${term.id}: term is never used`);

  const examples = (corpus.sections?.find((s) => s.id === "reading")?.blocks ?? []).filter((b) => b.kind === "workedExample");
  if (examples.length < 2) fail("reading guide needs at least two worked examples");
  for (const example of examples) {
    const values = example.lineValues;
    if (!Array.isArray(values) || values.length !== 6 || values.some((v) => ![6, 7, 8, 9].includes(v))) {
      fail(`reading/${example.id}: lineValues must be six values from 6–9`);
      continue;
    }
    const initialPattern = values.reduce((p, v, i) => p | ((v === 7 || v === 9 ? 1 : 0) << i), 0);
    const relatingPattern = values.reduce((p, v, i) => p | ((v === 6 || v === 7 ? 1 : 0) << i), 0);
    const initial = canonical.pairs.findIndex((p) => ((p.upper << 3) | p.lower) === initialPattern) + 1;
    const relating = canonical.pairs.findIndex((p) => ((p.upper << 3) | p.lower) === relatingPattern) + 1;
    const positions = values.flatMap((v, i) => v === 6 || v === 9 ? [i + 1] : []);
    if (initial !== example.initialHexagram || relating !== example.relatingHexagram ||
        JSON.stringify(positions) !== JSON.stringify(example.changingPositions)) fail(`reading/${example.id}: worked example calculation mismatch`);
  }

  const prose = allPassages(corpus).map((p) => p.text).join("\n");
  const allSourceStrings = JSON.stringify(corpus).toLowerCase();
  for (const sig of SIGNATURES) if (allSourceStrings.includes(sig)) fail(`copyright-signature scan matched "${sig}"`);
  for (const pattern of GENDERED_GENERIC) if (pattern.test(prose)) fail(`gendered-generic scan matched ${pattern}`);
  for (const pattern of PREDICTIVE_OR_ADVICE) if (pattern.test(prose)) fail(`predictive/advice scan matched ${pattern}`);
  const words = prose.match(/\b[\p{L}'’-]+\b/gu) ?? [];
  const sentences = prose.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
  const syllableCount = words.reduce((n, w) => n + syllables(w), 0);
  const fkGrade = words.length && sentences
    ? 0.39 * (words.length / sentences) + 11.8 * (syllableCount / words.length) - 15.59
    : 0;
  const report = {
    passageCount: allPassages(corpus).length,
    wordCount: words.length,
    averageFleschKincaidGrade: Number(fkGrade.toFixed(2)),
    sourceReferencesResolved: true,
    sourceSha256: createHash("sha256").update(readFileSync(SOURCE_PATH)).digest("hex")
  };
  if (fkGrade > 9) fail(`average Flesch–Kincaid grade ${fkGrade.toFixed(2)} exceeds target 9`);
  return { errors, report };
}

export function validateFile(path = SOURCE_PATH) {
  const raw = readFileSync(path, "utf8");
  let corpus;
  try { corpus = JSON.parse(raw); }
  catch (error) { return { errors: [`invalid JSON: ${error.message}`], report: null }; }
  return validateCorpus(corpus);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = validateFile(process.argv[2] ? resolve(process.argv[2]) : SOURCE_PATH);
  if (result.errors.length) {
    for (const error of result.errors) console.error(`FAIL ${error}`);
    process.exitCode = 1;
  } else console.log(`modern corpus source PASS ${JSON.stringify(result.report)}`);
}
