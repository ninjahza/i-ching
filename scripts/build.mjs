// T036 — the whole build: esbuild bundle → single-file dist → verify or fail.
// Plain Node + the two pinned dev deps, nothing more (NFR-006, R-1, R-10).
// Byte-deterministic (B-9): fixed inputs, no timestamps/paths/env in output.

import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyDocument } from './verify-dist.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(resolve(root, 'build.mjs'));
const esbuild = require('esbuild');
const MARKER = '__SPEC_APP_BUNDLE__';

function assemble() {
  const js = esbuild.buildSync({
    absWorkingDir: root,
    entryPoints: ['src/main.ts'],
    bundle: true,
    format: 'iife',
    target: ['es2020'],
    minify: true,
    charset: 'utf8',
    legalComments: 'none',
    sourcemap: false,
    write: false,
  }).outputFiles[0].text;

  if (/<\/script/i.test(js)) {
    console.error('build: bundle would break out of the inline <script> element');
    process.exit(1);
  }

  const shell = readFileSync(resolve(root, 'src/shell/index.html'), 'utf8');
  if (shell.split(MARKER).length - 1 !== 1) {
    console.error('build: shell must contain exactly one bundle placeholder');
    process.exit(1);
  }
  return shell.replace(MARKER, () => js);
}

// B-9: determinism — a second full assembly must be byte-identical.
const html = assemble();
const sha = createHash('sha256').update(html, 'utf8').digest('hex');
if (sha !== createHash('sha256').update(assemble(), 'utf8').digest('hex')) {
  console.error('build FAILED — non-deterministic output (B-9)');
  process.exit(1);
}

// B-11 (real check, not the vacuous `npm audit --omit=dev`): no runtime deps.
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const runtimeDeps = Object.keys(pkg.dependencies ?? {});
if (runtimeDeps.length > 0) {
  console.error(`build FAILED — runtime dependencies present (B-11): ${runtimeDeps.join(", ")}`);
  process.exit(1);
}

// F-12 (security review): size cap — guards against corpus/data poisoning
// shipping a bloated-but-"valid" dist (research R-10 budget: < ~400 KB).
const MAX_BYTES = 400 * 1024;
if (Buffer.byteLength(html, 'utf8') > MAX_BYTES) {
  console.error(`build FAILED — dist exceeds ${MAX_BYTES / 1024} KB budget (data poisoning guard)`);
  process.exit(1);
}

const distDir = resolve(root, 'dist');
rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });
const outFile = resolve(distDir, 'index.html');
writeFileSync(outFile, html);

// B-10: verification is the final stage of the build; a violation means the
// dist is considered NOT built.
const { violations, bytes } = verifyDocument(readFileSync(outFile, 'utf8'), outFile);
if (violations.length > 0) {
  // B-10: a violating dist is CONSIDERED NOT BUILT — remove it from disk.
  rmSync(distDir, { recursive: true, force: true });
  console.error(`build FAILED — dist did not pass verification (${violations.length} violation(s)); dist removed:`);
  for (const v of violations) console.error('  ' + v);
  process.exit(1);
}
console.log(`build OK — dist/index.html (${(bytes / 1024).toFixed(1)} KB, sha256 ${sha.slice(0, 16)}…), verifier PASS (B-1…B-8, B-9, B-11/B-12)`);
