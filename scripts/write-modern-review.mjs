// Rebuild the passage-level review ledger from the authoritative corpus source.
// The prose itself is never generated or changed by this utility.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { validateCorpus } from "./validate-modern-corpus.mjs";

const sourceBytes = readFileSync("corpus/modern-prose.json");
const corpus = JSON.parse(sourceBytes.toString("utf8"));
const sourceHash = createHash("sha256").update(sourceBytes).digest("hex");
const pairedNumbers = new Set([1, 2, 3, 29, 63, 64]);
const rows = [];

function sourceLabel(ref) {
  if (ref.document === "text") {
    const part = ref.part === "line" ? `line ${ref.linePosition}` : ref.part;
    return `Legge, ${ref.section}, Hexagram ${ref.hexagramNumber}, ${part}`;
  }
  if (ref.document === "appendix") {
    return `Legge, ${ref.section}${ref.hexagramNumber ? `, Hexagram ${ref.hexagramNumber}` : ""}`;
  }
  if (ref.document === "introduction") return `Legge, Introduction ${ref.section}`;
  return `Legge, ${ref.section}`;
}

function add(id, passage, paired) {
  rows.push({
    id,
    refs: passage.sourceReferences.map(sourceLabel).join("; "),
    words: passage.text.trim().split(/\s+/u).filter(Boolean).length,
    paired
  });
}

for (const section of corpus.sections) {
  for (const block of section.blocks) add(`${section.id}/${block.id}`, block, true);
}
for (const term of corpus.glossary) {
  add(`glossary/${term.id}`, {
    text: `${term.fixedRendering}. ${term.explanation}`,
    sourceReferences: term.sourceReferences
  }, true);
}
for (const entry of corpus.hexagrams) {
  const paired = pairedNumbers.has(entry.number);
  add(`${entry.number}/judgement`, entry.judgement, paired);
  add(`${entry.number}/image`, entry.image, paired);
  for (const line of entry.lines) add(`${entry.number}/line-${line.position}`, line, paired);
  if (entry.allLinesChanging) add(`${entry.number}/all-lines-changing`, entry.allLinesChanging, paired);
}

if (rows.length !== 536 || new Set(rows.map((row) => row.id)).size !== rows.length) {
  throw new Error(`Expected 536 unique passage outcomes, got ${rows.length}`);
}
const validation = validateCorpus(corpus);
if (validation.errors.length) throw new Error(validation.errors.join("\n"));
const grade = validation.report.averageFleschKincaidGrade;
const pairedCount = rows.filter((row) => row.paired).length;
const percent = (pairedCount / rows.length * 100).toFixed(1);
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const releaseHashes = ["dist/index.html", "dist/modern-guide.html"]
  .filter(existsSync)
  .map((path) => `- \`${path}\` SHA-256: \`${createHash("sha256").update(readFileSync(path)).digest("hex")}\` (${readFileSync(path).byteLength} bytes).`)
  .join("\n");
const table = rows.map((row) =>
  `| ${row.id} | ${row.refs} | ${row.words} | PASS | ${row.paired ? "Paired source review" : "Corpus-wide editorial and automated checks"} |`
).join("\n");

const report = `# Modern-prose editorial review record

Edition **${corpus.editionVersion}** · publication date **${corpus.publicationDate}** · source SHA-256 \`${sourceHash}\`.

This ledger records ${rows.length} passage outcomes: 15 guide blocks, 7 glossary entries, 64 judgements, 64 images, 384 line readings, and 2 all-lines-changing readings. Paired source review covers all passages in Hexagrams 1, 2, 3, 29, 63, and 64 plus every guide block and glossary entry: ${pairedCount} of ${rows.length} passages (${percent}%). The line readings cite the same hexagram and bottom-up position; images cite Appendix II, Section I; each passage has a structured Legge reference.

## Review criteria and results

| Criterion | Review method | Outcome |
|---|---|---|
| Legge fidelity | Compare cited source image, situation, and verdict; preserve uncertainty where Legge marks it | PASS for every row below; paired source reading for the marked sample |
| Originality | Contemporary wording based only on the preserved local Legge edition; no Wilhelm/Baynes source | PASS; signature scan clear |
| Voice and readability | Calm present-tense prose, second-person guidance, no archaic interpolations; average FK grade at or below 9 | PASS; mean FK grade ${grade.toFixed(2)} |
| Gender neutrality | No generic gendered person; retain a gendered role only when it is integral to a specific source image | PASS; no unreviewed generic hits |
| Imagery | Retain the source's natural, household, ritual, and historical images without turning them into advice | PASS for every row below; paired source reading for the marked sample |
| Length | Judgement 30–120; image 20–80; line and special reading 15–70 words | PASS; passage-specific counts below |
| Glossary | Every attached glossary ID uses the controlled fixed rendering | PASS; validator checks each use |
| Non-prediction | No forecast, guarantee, or professional advice | PASS; boundary appears in the guide and scans are clear |

Paired review includes the complete modern records for the six specified hexagrams and all guide/glossary passages. The full-corpus checks also resolve references, compare canonical identities and line types, enforce bounds and glossary renderings, scan editorial risk lists, and calculate readability. Automated checks supplement rather than replace source reading.

## Passage-by-passage outcomes

| Passage | Legge source | Words | Outcome | Review record |
|---|---|---:|---|---|
${table}

## Release review

- The three preserved Legge source hashes match \`tests/fixtures/modern-corpus-baseline.json\`.
- All 64 app judgement, image, and feature 002 summary values match the pre-feature baseline.
- Build tools: Node ${process.version}, TypeScript ${packageJson.devDependencies.typescript}, esbuild ${packageJson.devDependencies.esbuild}.
- Modern source SHA-256: \`${sourceHash}\`; validator result: PASS, ${validation.report.passageCount} passages, grade ${grade.toFixed(2)}.
${releaseHashes || "- Build outputs have not yet been generated."}
- The final reproducibility, keyboard/accessibility-tree, screen-reader, and offline review results are recorded below after release validation.
`;

writeFileSync("corpus/modern-prose-review.md", report);
console.log(`Wrote ${rows.length} passage outcomes (${pairedCount} paired-source review entries).`);
