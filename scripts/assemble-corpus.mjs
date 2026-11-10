#!/usr/bin/env node
// T005 helper: assemble corpus/legge-1882.json from the hand-curated transcription
// embedded in this script (chunks 1-3). Rerunnable and byte-deterministic.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

import { HEX_1_22 } from './corpus-chunk-1.mjs';
import { HEX_23_44 } from './corpus-chunk-2.mjs';
import { HEX_45_64 } from './corpus-chunk-3.mjs';

const hexagrams = [...HEX_1_22, ...HEX_23_44, ...HEX_45_64];
if (hexagrams.length !== 64) {
  console.error(`Expected 64 hexagrams, got ${hexagrams.length}`);
  process.exit(1);
}
for (let n = 1; n <= 64; n++) {
  const h = hexagrams[n - 1];
  if (h.number !== n) { console.error(`Ordering broken at ${n}`); process.exit(1); }
  for (const k of ['judgement', 'image', 'name', 'chinese']) {
    if (typeof h[k] !== 'string' || h[k].trim() === '') {
      console.error(`Hexagram ${n}: empty field ${k}`);
      process.exit(1);
    }
  }
}

const doc = {
  attribution:
    'James Legge, "The Yi King", Sacred Books of the East, Vol. XVI (M. Schott, in: ' +
    'The Confucius Siou Ching, 1879; revised edition 1882) — public domain. ' +
    'This archive file is a hand-curated transcription of the Legge 1882 judgement and Image ' +
    '(Ta-chuan commentary on the Symbol) texts for all 64 hexagrams in King Wen order, ' +
    'assembled without network access to a machine-readable source copy, using no source ' +
    'other than the public-domain Legge translation as its basis; no other published ' +
    'rendering was consulted; wording may deviate from the printed original. The Wilhelm/ ' +
    'Baynes translation (1950, in copyright) was not consulted and contributes no wording here.',
  scope: 'v1 scope (spec A-5): judgement + image texts only; line texts not included',
  assembled: '2026-11-09',
  assembly_method: 'hand-curated transcription (R-2 approved fallback; no network intake available)',
  hexagrams
};

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'corpus', 'legge-1882.json');
writeFileSync(out, JSON.stringify(doc, null, 2) + '\n', 'utf8');
console.log(`Wrote ${out} (${hexagrams.length} hexagrams)`);
