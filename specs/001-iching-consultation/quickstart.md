# Quickstart: Build, Test, Preview, Verify

**Feature**: 001-iching-consultation | **Date**: 2026-11-09

Everything runs from the repository root with Node.js **≥ 26** (tests rely on Node's native TypeScript type-stripping) and npm. No server, browser automation, or network access at runtime is ever needed.

## 1. Install (dev environment only)

```bash
npm ci
```

Dev dependencies are exactly two, pinned in `package-lock.json`: `typescript` and `esbuild`. After install, audit them:

```bash
npm audit --omit=dev   # must report zero runtime deps
```

## 2. Typecheck

```bash
npm run typecheck      # tsc --noEmit — strict + erasableSyntaxOnly gate
```

## 3. Unit tests (pure logic, no browser)

```bash
npm test               # node --test tests/
```

Expect all green, covering (see `data-model.md` §Validation summary and `contracts/`):

- **Data integrity** — 64 unique patterns; King Wen bijection + mutual table inverses; trigram composition; corpus completeness + attribution present (SC-002).
- **Transformation** — exhaustive XOR-transform property checks; known flips 1↔2 and 63↔64; stable case.
- **Probability models** — exact byte-partition check for both methods; ≥ 100 000 simulated lines per method within 0.5 pp of declared profiles (SC-003).
- **Consultation state machine** — transitions, "cast again" clears question + cast (FR-012/FR-023).
- **Purity** — `src/core/**` and `src/data/**` contain no DOM globals.

## 4. Build dist (bundle → inline → verify)

```bash
npm run build
```

Pipeline (`scripts/build.mjs`): esbuild IIFE bundle of `src/main.ts` → injected into the `src/shell/index.html` shell (CSP meta + inline `<style>` + semantic skeleton) → writes `dist/index.html` → automatically runs the **security verifier** (`scripts/verify-dist.mjs`). Any banned pattern, missing CSP directive, or external reference **fails the build** (NFR-001).

### Determinism check

```bash
npm run build && shasum -a 256 dist/index.html > /tmp/a.sha
touch src/main.ts && npm run build && shasum -a 256 dist/index.html | diff /tmp/a.sha -
# expected: no diff — byte-identical dist (constitution: deterministic build)
```

## 5. Security verifier (standalone)

```bash
npm run verify         # node scripts/verify-dist.mjs dist/index.html
```

Checks enforced (contract: `contracts/dist-build.md`): no `eval(`, `new Function`, `innerHTML`, `outerHTML`, `document.write`, `fetch(`, `XMLHttpRequest`, `importScripts`, `http://`, `https://`, protocol-relative or absolute external `src=`/`href=`; CSP meta present with `default-src 'none'` and no remote origins; exactly one inline `<script>` and no `<link>`/`<img>`/`<iframe>`. Exit code 0 = pass; non-zero prints each violation.

## 6. Preview the distribution — file:// as the user experiences it

```bash
open dist/index.html        # macOS; or drag the file into any modern browser
```

**Offline acceptance pass** (mirrors User Story 4 & quickstart-level spec testing):

1. Disable the machine's network (or use Airplane mode) and open `dist/index.html`. Expected: instant first screen (question step), intro explanation readable, no errors in the browser console, no blank sections.
2. Enter a question containing `<script>alert("x")</script>` and cast. Expected: the question renders back as inert literal text on the result screen; a full consultation completes.
3. Cast several times with both methods. Expected: six lines appear bottom-up, changing lines marked `○`/`✕` **and** textually; result shows King Wen number, name, trigrams, judgement, image, and attribution; related hexagram appears only when at least one line is changing; "no changing lines → stable" message when none are.
4. Spot-check 5 results against an independent King Wen reference (FR-007/SC-002): pattern → number → name match.
5. **Zero network**: with DevTools Network panel open (or a proxy monitor), perform exhaustive use. Expected: **0 requests** (SC-004).
6. Keyboard-only pass: Tab/Enter through question → method change → cast → reveal-all → result → "Cast again" with a visible focus indicator on every control (FR-016). Screen-reader pass (VoiceOver/NVDA): each line and both hexagrams announced with **number + name + line status** (FR-017).
7. With site data / storage disabled in browser settings, set the method and reload. Expected: no errors; method returns to default (three-coin) — no functionality lost (NFR-003).
8. Copy `dist/index.html` to a USB stick / attach it to an email, open from the new location offline. Expected: identical behavior (SC-007).

## 7. Content review (principle I / FR-011 / SC-006)

Manual gate before release: read every app string and all 64 judgement/image pairings against the checklist: no predictive claims, no guarantees, no medical/legal/financial advice framing, tone sober and neutral across beliefs, corpus texts visibly attributed to Legge. Record the pass in the feature checklist.

## 8. Corpus regeneration (rare; auditable)

```bash
node scripts/gen-corpus.mjs     # reads ./corpus/ archives, rewrites src/data/texts.ts
git-less review: diff the previous copy of src/data/texts.ts before and after
```

Review the full diff (audit trail), confirm the header's source SHA-256 matches the files under `corpus/`, then re-run `npm test` (corpus completeness test guards FR-015). Spot-check hexagrams 1, 2, 8, 63, 64 texts against the published Legge translation.

## Expected results summary

| Step | Expected |
|---|---|
| `npm test` | all suites green |
| `npm run build` | exit 0; verifier silent-pass; single `dist/index.html` (target size comfortably < ~400 KB) |
| Determinism re-run | byte-identical SHA-256 |
| file:// offline run | full ritual, 0 network requests, 0 console errors |
| Storage disabled | no errors; preference is session-only |
