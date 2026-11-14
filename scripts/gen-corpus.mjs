// T006 — Deterministic corpus generator (research R-2, contract B-12).
// Reads corpus/legge-1882.json ONLY (builds never fetch); emits src/data/texts.ts
// with an auditable header: attribution, source filename, source SHA-256,
// generator command, DO-NOT-EDIT marker. Output is byte-stable across runs.
// Standalone invocation: node scripts/gen-corpus.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const corpusDir = join(root, 'corpus');
const outFile = join(root, 'src', 'data', 'texts.ts');

// Deterministic input selection: every file in corpus/ participates in the
// provenance hash (sorted); the archive itself is the single named source.
const archived = readdirSync(corpusDir).filter((f) => !f.startsWith('.')).sort();
const ARCHIVE = 'legge-1882.json';
if (!archived.includes(ARCHIVE)) {
  console.error(`corpus/${ARCHIVE} not found`);
  process.exit(1);
}
const raw = readFileSync(join(corpusDir, ARCHIVE), 'utf8');
const sha256 = createHash('sha256').update(raw, 'utf8').digest('hex');

const doc = JSON.parse(raw);
const hexs = doc.hexagrams;
if (!Array.isArray(hexs) || hexs.length !== 64) {
  console.error('corpus archive must contain exactly 64 hexagrams');
  process.exit(1);
}

// Per-entry fallback convention (R-2 review gate): entries are accepted only if
// number == index+1, the quotations are non-empty, and the editorial summary
// has one or two paragraphs and 60–180 words; never emit a placeholder.
for (let i = 0; i < 64; i++) {
  const h = hexs[i];
  const summary = h && typeof h.summary === 'string' ? h.summary : '';
  const paragraphs = summary.split('\n\n');
  const wordCount = summary.trim() ? summary.trim().split(/\s+/).length : 0;
  const ok = h && h.number === i + 1 &&
    typeof h.judgement === 'string' && h.judgement.trim() !== '' &&
    typeof h.image === 'string' && h.image.trim() !== '' &&
    summary === summary.trim() &&
    paragraphs.length >= 1 && paragraphs.length <= 2 &&
    paragraphs.every((p) => p.length > 0 && p === p.trim() && !p.includes('\n')) &&
    wordCount >= 60 && wordCount <= 180;
  if (!ok) {
    console.error(`Entry at index ${i} fails the fallback convention; hand-correct corpus/legge-1882.json and re-run.`);
    process.exit(1);
  }
}

const j = (s) => JSON.stringify(s.trim());
const lines = [];
lines.push('// DO NOT EDIT — GENERATED FILE (research R-2, contract B-12).');
lines.push('// Regenerate with:  node scripts/gen-corpus.mjs   (then review the diff — the audit gate)');
lines.push('//');
lines.push(`// Source: corpus/${ARCHIVE} (archived under corpus/, SHA-256 below)`);
lines.push(`// Source SHA-256: ${sha256}`);
lines.push(`// Corpus dir files at generation: ${archived.join(', ')}`);
lines.push('// Attribution: James Legge, "The Yi King", Sacred Books of the East, Vol. XVI,');
lines.push('//   M. Schott (1879; revised 1882) — public domain.');
lines.push('// Provenance note (honest, per corpus/PROVENANCE.md): hand-curated transcription of');
lines.push('//   quotations assembled without a machine-readable source; wording may deviate from');
lines.push('//   the original. Summaries are editorial syntheses of the cleansed Legge edition.');
lines.push('');
lines.push('/** Classical quotations and editorial summary per King Wen number. */');
lines.push('export interface HexagramTexts {');
lines.push('  readonly judgement: string;');
lines.push('  readonly image: string;');
lines.push('  readonly summary: string;');
lines.push('}');
lines.push('');
lines.push('/** Index 0 sentinel (unused); indices 1..64 = King Wen order (FR-015). */');
lines.push('export const CORPUS: readonly (HexagramTexts | null)[] = [');
lines.push('  null,');
for (const h of hexs) {
  lines.push(`  { judgement: ${j(h.judgement)}, image: ${j(h.image)}, summary: ${j(h.summary)} },`);
}
lines.push('] as const;');
lines.push('');
lines.push('/** Visible attribution (FR-008); also scanned by tests/corpus.test.ts. */');
lines.push(`export const CORPUS_ATTRIBUTION = ${j(
  'Texts: James Legge, "The Yi King", Sacred Books of the East, Vol. XVI (1882) — public domain.'
)};`);
lines.push('');

writeFileSync(outFile, lines.join('\n'), 'utf8');
console.log(`Wrote ${outFile}`);
console.log(`Source SHA-256: ${sha256}`);
