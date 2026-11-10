# Tasks: I Ching Consultation App

**Input**: Design documents from `specs/001-iching-consultation/`

**Prerequisites**: plan.md, spec.md, research.md (R-1…R-12), data-model.md, contracts/consultation-flow.md (clauses C-1…C-13), contracts/dist-build.md (clauses B-1…B-12), quickstart.md, `.specify/memory/constitution.md` (principles I–V)

**Workspace note (A-7)**: feature id `001` from `.specify/feature.json` — not a git repository. No branches; "review the diff" steps mean diffing a saved previous copy. Node.js ≥ 26 required (native TS type-stripping lets `node --test` run `.ts` tests directly — R-9).

**Tests**: INCLUDED (mandated by the constitution's "tested pure logic" constraint, NFR-005, and SC-002/SC-003). Suite names match data-model.md's validation-rules summary. Where a task says "write failing test X first", create the test before the implementation in the same task and confirm it fails before making it pass.

**Format**: `[ID] [P?] [Story] Description`
- **[P]**: parallelizable (different files, no incomplete dependency)
- **[US1]…[US4]**: user-story label per template traceability, mapping to spec.md stories — US1 = Priority **P1**; US2, US3, US4 = Priority **P2** (phases below carry the P1/P2 priority in their headers)
- Contract clauses (C-x flow, B-x dist) and FR/NFR ids appear in each task's acceptance note.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project scaffold, pinned zero-runtime-dependency setup, strict TS gate, test-runtime smoke check (B-11; R-9, R-10)

- [x] T001 Create project directory structure per plan.md §Project Structure: `src/core/`, `src/ui/`, `src/data/`, `src/shell/`, `corpus/`, `scripts/`, `tests/`, `dist/`
- [x] T002 Create `package.json`: private, `"engines": {"node": ">=26"}`, **`"dependencies": {}` — the empty runtime map is itself a verified invariant (B-11, constitution III)**; `devDependencies` with **exact-version-pinned** `typescript` and `esbuild` (no ranges — "pinned and audited", B-11); scripts: `typecheck` = `tsc --noEmit`, `test` = `node --test tests/`, `build` = `node scripts/build.mjs` (the verifier runs inside build, so `verify` on a fresh dist is covered by `build`), `verify` = `node scripts/verify-dist.mjs` (standalone reviewer entry point, B-10), `corpus` = `node scripts/gen-corpus.mjs`. No framework, no extra tooling (NFR-006 YAGNI)
- [x] T003 [P] Create `tsconfig.json` per R-10: `strict`, `erasableSyntaxOnly`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `module: ESNext`, `target: ES2020`, `noEmit` (esbuild emits; `erasableSyntaxOnly` is exactly what keeps Node type-stripping valid for `tests/*.test.ts` importing `src/**` — R-9)
- [x] T004 Install pinned dev deps and commit `package-lock.json` (lockfile integrity hashes complete — B-11); smoke-test the harness: add a throwaway `tests/harness.test.ts` that imports a stub from `src/core/`, run `npm test` and `npm run typecheck` to confirm Node 26 type-stripping + the strict gate work end-to-end, then delete the throwaway file

**Checkpoint**: `npm ci` / `npm run typecheck` / `npm test` all runnable; two pinned dev deps, zero runtime deps.

---

## Phase 2: Foundational (Core Infrastructure)

**Purpose**: Public-domain corpus pipeline, all static data, all pure core logic and their browser-free test suites.
**⚠️ CRITICAL**: Blocks every user story. Import order is strictly data → core (a core module may import every lower layer; core imports data — order T005→T018 accordingly). Tests T008–T010 are written FAIL-FIRST; implementation tasks T011–T018 turn them green. Covers SC-002, SC-003, NFR-005, and the constitution's "tested pure logic separated from the DOM" constraint.

- [x] T005 Archive a verified public-domain transcription of James Legge, *The Yi King* (SBE Vol. XVI, 1882) into `corpus/` (candidate: Project Gutenberg SBE-XVI transcription; alternate: Wikisource), saving source files + a `corpus/PROVENANCE.md` recording the licence verification (constitution: PD translations only, **verified before inclusion**; A-3 — Wilhelm/Baynes is under copyright and must never enter; R-2; scope = judgement + image only per A-5/FR-015)
- [x] T006 Write deterministic `scripts/gen-corpus.mjs` (R-2): reads `corpus/`, extracts the 64 judgement+image pairs, emits `src/data/texts.ts` — header comment carries the attribution line, source filenames, **source SHA-256**, generator command, and a "DO NOT EDIT" marker; output byte-stable across runs; builds never fetch (B-12)
- [x] T007 Run `node scripts/gen-corpus.mjs` to generate `src/data/texts.ts` (`CORPUS: readonly {judgement; image}[65]` + `CORPUS_ATTRIBUTION: string` per data-model §8); diff-review the generated file against a saved prior copy; manually spot-check hexagrams 1, 2, 8, 63, 64 against the published Legge text and hand-correct only malformed entries, re-running the generator's per-entry fallback convention (R-2 review gate; FR-008 attribution string present)
- [x] T008 [P] Write failing `tests/corpus.test.ts` (FR-015, FR-008, SC-002): entries 1..64 all present; judgement **and** image non-empty after trim for every hexagram; `CORPUS_ATTRIBUTION` mentions Legge + SBE + public domain; no Wilhelm/Baynes signature strings (A-3)
- [x] T009 [P] Write failing `tests/hexagram-map.test.ts` (FR-007, NFR-005, SC-002; data-model §5 validation): `PATTERN_TO_KW` values are exactly {1..64} with no duplicates; `PATTERN_TO_KW[KW_TO_PATTERN[n]] === n` for all n∈1..64 and the converse for all 64 patterns (mutual inverses); trigram composition derivable from every pattern (lower = bits 0–2, upper = bits 3–5, bottom-up) and 8 trigrams have unique bits (also asserts C-5's identity formula `PATTERN_TO_KW[bitpattern]`, bit 0 = bottom line)
- [x] T010 [P] Write failing `tests/purity.test.ts` (constitution: browser-free logic; supports R-9/B-6): structural scan asserting every file in `src/core/**` and `src/data/**` contains no `document`, `window`, `navigator`, `fetch`, `XMLHttpRequest`, `localStorage`, `eval(`, `new Function`, `innerHTML`, or `Math.random`
- [x] T011 Create `src/data/trigrams.ts` (data-model §4): `TRIGRAMS: readonly Trigram[8]` — id, Legge name, nature (Heaven/Earth/…), `bits` bottom-line = bit 0
- [x] T012 Create `src/data/king-wen.ts` (R-3, FR-007): `PATTERN_TO_KW[64]` and `KW_TO_PATTERN` tables using the canonical **bottom-up** encoding (bit 0 = position 1 = bottom, yang = 1); tables are facts validated by T009, not trusted
- [x] T013 [P] Create `src/data/hexagram-names.ts` (data-model §5): `HEXAGRAM_NAMES` by King Wen number (index 0 unused), Legge's names
- [x] T014 Create `src/core/line-values.ts` (data-model §1): `type LineValue = 6 | 7 | 8 | 9`, `isYang` (odd check), `isChanging` (6 or 9), traditional position names ("nine in the … place" / "six in the … place"), marker glyphs `○`/`✕` constants (R-3/R-6)
- [x] T015 [P] Create `src/core/pattern.ts` + tests — create failing `tests/transform.test.ts` first (FR-009/FR-010, data-model §3 validation, C-6): `patternFromLines` (sets bit p−1 when position p is yang), `changingMask`, `relatedPattern(pattern, mask) = pattern ^ mask`; tests: exhaustive all 64 patterns × all 64 masks XOR equals independently derived expectation, documented full flips 1↔2 and 63↔64, related pattern never retains changing bits, `mask === 0` ⇒ stable (no related computed). Then create `src/core/pattern.ts` making it pass
- [x] T016 [P] Create `src/core/casting.ts` + tests — create failing `tests/casting.test.ts` first (FR-004, FR-005, SC-003, R-4; data-model §6): `RandomSource` injected interface; `CastingMethod` records for `coins` (9→1/8, 7→3/8, 8→3/8, 6→1/8) and `yarrow` (9→3/16, 7→5/16, 8→7/16, 6→1/16) with probs summing to 1; tests assert **exact byte-partition counts over every byte 0..255** (coins = low-3-bits popcount sum, yarrow = `byte & 15` map — rejection-free, no modulo bias) **and ≥100,000 draws per method within 0.5 pp of the declared profile** via an injected deterministic source, including old-yang > old-yin asymmetry for yarrow. Then create `src/core/casting.ts` making it pass (drawing consumes exactly one getRandomValues byte via the injected source; no `Math.random` anywhere)
- [x] T017 Create `src/core/hexagram.ts` (data-model §5, R-3): `hexagramByPattern(pattern)` via king-wen + names + corpus join (throws on bad input, tested indirectly by T009/T008), `trigramsOf(pattern)`, `relatedHexagram(pattern, mask)` returning `null` when `mask === 0`
- [x] T018 Create `src/core/consultation.ts` + failing `tests/consultation.test.ts` written first (data-model §7, C-1…C-3, C-8, C-11, FR-002, FR-012, FR-023, R-11): `Consultation` aggregate in a single file with its state machine `empty → asking → casting(k revealed, bottom-up) → complete`; derived `pattern/changingMask/hexagram/related` computed only on completion (a half cast can never present as a result — C-11); question optional (FR-002) truncated defensively at 500 chars (R-11); `castAgain()` returns a fresh instance with `question = null`, no lines, no derived data (test asserts the old question is unreachable — FR-012/FR-023)
- [x] T019 Run `npm test` and `npm run typecheck`: all six suites green (corpus, hexagram-map, transform, casting, consultation, purity) with zero browser involvement; record SC-002/SC-003 evidence

**Checkpoint**: Foundation ready — pure logic + data complete and fully tested; user stories can begin (in parallel if staffed).

---

## Phase 3: User Story 1 — Cast and contemplate a hexagram (Priority: P1) 🎯 MVP

**Goal**: Open → optional question → cast six lines bottom-up from `crypto.getRandomValues` with honest decline when it's absent → result showing King Wen number/name/trigrams/judgement/image with visible attribution, changing lines marked by shape+word, the related hexagram when any line changed (stable message when none) → "Cast again" with a spotless state. Question renders inert. (Contract clauses C-1…C-8, C-10, C-11, C-13; FR-001…FR-004, FR-006…FR-013, FR-019 surface in Phase 6.)

**Independent Test**: Open the built page offline, complete one full consultation, and verify hexagram identity, changing lines, and related hexagram against an independent King Wen reference (spec US1 Independent Test; quickstart §6 steps 1–4).

- [x] T020 [P] [US1] Create `src/main.ts` thin entry (R-12): probe `crypto.getRandomValues` availability **once at boot** (typeof check, R-4); on available build the `RandomSource` adapter over it and construct Consultation; on absent construct the UI in honest-decline mode (cast control disabled, plain message set via textContent — C-3, FR-003, A-8; never a weak fallback, B-7)
- [x] T021 [P] [US1] Create `src/ui/announce.ts` (R-5, FR-017, C-4): `aria-live="polite"` region writer — `announceLine(position, value)` ("Line 3: six in the second place — broken line, changing"), `announceHexagram(kw, name)`, `announceStatus(msg)`; textContent-only writes; visual figures stay `aria-hidden` while this region carries the meaningful text
- [x] T022 [P] [US1] Create `src/ui/line-view.ts` (R-6, FR-006, FR-017): render a line as CSS-styled bar divs (solid yang / split yin) filling **pre-created static container nodes** via `createElement`/`textContent`/`setAttribute` only; changing lines get `○`(nine)/`✕`(six) text markers **plus the word "changing"** — never colour alone; whole figure `aria-hidden="true"`; hexagram figure container gets `role="img"` + `aria-label` naming number, name, and changing positions
- [x] T023 [P] [US1] Create `src/ui/question-echo.ts` (FR-013, C-10, R-11): renders the seeker's optional question back on the result screen into a static node via `textContent` only (never markup parsing), container styled `white-space: pre-wrap`; angle brackets/quotes/script-like sequences display as typed and cannot alter structure; nothing written anywhere persistent (FR-023)
- [x] T024 [P] [US1] Create `src/shell/index.html` (R-7, R-12; seeds B-1/B-3/B-4): `<meta charset="utf-8">` first in head, then the **CSP meta** `default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'none'; font-src 'none'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'` (FR-020, constitution III); one inline `<style>` block (system-font stack, WCAG AA palette, `prefers-color-scheme` split, visible `:focus-visible`, `hidden`-toggled step sections); three `<section id="step-question|step-casting|step-result">` static views + the `aria-live` region + script placeholder for build injection; native `<button>`/`<textarea>`/`<input>` controls for question, cast, reveal-all, cast again — all keyboard-focusable (FR-016); **no `<img>`/`<link>`/`<iframe>`/`<object>`/`<form>` elements** and no external references anywhere (B-3); no inline `on*` attributes (B-5 class)
- [x] T025 [US1] Create `src/ui/steps.ts` + `src/ui/shell-bind.ts` (the step-switcher pair, R-12; C-1, C-2, C-4, C-5, C-6, C-8, FR-001, FR-012): `shell-bind` queries the static nodes and toggles `hidden` so exactly one step is visible (C-1); `steps` controls: Question (optional textarea maxlength 500 with a clear truncation notice — C-2/R-11; Cast button disabled-with-message when the boot probe failed — C-3), Casting (bottom-up reveal loop ≈400 ms/line driven by `castLine()` under the active method, each reveal announced via T021 and marked via T022; immediate "Reveal all" control — C-4; keyboard-activatable), Result (identity content per C-5: figure, KW number, name, upper/lower trigram names, judgement, image, visible attribution line; related-hexagram subsection rendered **iff** `mask !== 0` via the same components — C-6/FR-009; neutral stable message "no changing lines — the hexagram is stable" when `mask === 0`, never implying a lesser cast — FR-010; focus moved to the result heading; question echo via T023)
- [x] T026 [US1] Create `src/ui/main.ts` (composition root wired from `src/main.ts`): assemble shell-bind, steps, announcer, casting session; **"Cast again" discards the Consultation object and clears the question/casting/result DOM nodes' textContent — nodes removed/cleared, not hidden — then returns to Question with empty fields (C-8, FR-012; no trace of prior question or cast — C-8/spec US1 scenario 6)**; no cast state persisted anywhere so reload mid-cast restarts at Question (C-11, edge case "back-navigation"); method = default three-coin for now (US2 replaces the selector plumbing; keep the seam in `steps.ts`); flow performs zero network calls and zero storage writes (C-13, NFR-003)

**Checkpoint**: US1 independently functional — full offline consultation per the Independent Test (needs the Phase 6 build to produce dist for manual check, or run the shell via any static preview).

---

## Phase 4: User Story 2 — Choose the casting method (Priority: P2)

**Goal**: Method choice at the Question step — three-coin default and classical yarrow-stalk selectable; selection persists within the opening; across openings only via the consent-gated single key `iching.method`; probability models themselves are already implemented and tested (T016) — this phase adds the UI affordance and consent-gated persistence. (C-3, C-9, C-12; FR-005, FR-016, FR-022; A-4; R-8.)

**Independent Test**: With each method selected, run ≥100k simulated casts in the test harness (already covered by `tests/casting.test.ts`) and verify frequencies match the declared models incl. yarrow's old-yang-favoured asymmetry; UI: select yarrow, cast — distribution over many UI casts drifts toward the yarrow profile; reopen — default restored unless opted in.

- [x] T027 [P] [US2] Create `src/ui/method-pref.ts` (R-8, C-9, FR-022, B-8, data-model §9 — the ONLY persistence module in the app): read/write the single key `iching.method` with values `"coins" | "yarrow"`; written **only after explicit opt-in** toggle; opt-out calls `removeItem` immediately; every localStorage access wrapped in try/catch — storage disabled degrades silently to in-session-only with no errors and no lost functionality (NFR-003); exposes a frozen allow-list constant `STORAGE_KEYS = ["iching.method"]` used by the audit task and never bypassed; question text and cast results never pass through this module under any call path (FR-023, C-2)
- [x] T028 [US2] Extend `src/ui/steps.ts` + `src/main.ts`: method selector on the Question step (radio pair with visible selection + `:focus-visible`, keyboard-operable C-12/FR-016); selection changes the active `CastingMethod` for the next cast and stays active for subsequent casts in the same opening (C-9; spec US2 scenario 3); on each app opening the default is three-coin **unless** the consent toggle is opted-in, in which case `method-pref.load()` applies (C-9); in the consent disclosure row, plain language states what is stored, where, and that opting out deletes it (FR-022); opt-out clears `iching.method` immediately even if the app then closes
- [x] T029 [US2] Write `tests/storage-surface.test.ts` [P-compatible with T027]: static scan of `src/ui/**` asserting `localStorage` identifiers appear only inside `method-pref.ts`, and that `consultation.ts`/`question` code paths contain no storage writes (FR-022, FR-023, SC-004 "0 storage writes the user did not opt into", B-8) in `tests/storage-surface.test.ts` (node:test, static source scan like purity.test.ts)

**Checkpoint**: US1 + US2 independently functional; method choice verified against the statistical model per story's Independent Test.

---

## Phase 5: User Story 3 — Contemplative presentation of the idea (Priority: P2)

**Goal**: Overlay pass over content and presentation (the US1 pipeline already renders texts + attribution): app-authored copy finalised, explanation complete, corpus shown as attributed quotations, every string on the content checklist. (C-7; FR-008 framing, FR-011, FR-014; constitution I; SC-006.)

**Independent Test**: Review every string in the app (labels, help, messages, all 64 judgement/image pairings) against the quickstart §7 checklist — 0 predictive/advicive/belief-biased instances; a first-time reader can restate the purpose after the explanation.

- [x] T030 [P] [US3] Create `src/data/app-strings.ts` (C-7, FR-011) with all app-authored copy centralised — labels, button text, help, the in-app explanation "what an I Ching consultation is and is not" (FR-014: sufficient for a first-time reader and stating plainly that the app makes no predictions), the stable-cast message (neutral, not implying a lesser cast — C-6), the decline message (C-3), truncation notice (C-2), consent disclosure (C-9) — every string sober/neutral, **no predictive, guaranteeing, or medical/legal/financial-advice wording anywhere** (FR-011, SC-006)
- [x] T031 [US3] Wire `src/ui/steps.ts` (and `src/main.ts`) to consume `src/data/app-strings.ts` everywhere, removing scattered literals; render the FR-014 explanation on the intro view and reachable again via a result-step toggle (R-12) — textContent only
- [x] T032 [US3] Render corpus quotations per C-5/C-7/FR-008 in `src/ui/steps.ts`: judgement/image for primary and related hexagram presented as quoted contemplative prompts with the Legge attribution line adjacent (from `CORPUS_ATTRIBUTION`); no app-authored sentence interprets or predicts (constitution I); no Wilhelm/Baynes phrasing appears anywhere (A-3 spot-check with `tests/corpus.test.ts` already green)
- [x] T033 [US3] Accessibility + contrast conformance: (a) announcements — verify/extend T021/T022 integration so each line reveal is announced with position + traditional line name + changing status as text, primary and related hexagram announced with **number + name** on result, `role="img"` labels complete for both figures, all controls labelled, full ritual completable screen-reader + keyboard alone (FR-017, C-4, C-12); (b) contrast — finalise/verify the inline `<style>` block in `src/shell/index.html` for all US1+US3 content: body text ≥ 4.5:1 and essential graphics ≥ 3:1 in **both** `prefers-color-scheme` modes, visible focus outlines, usable layout at 200% zoom and small screens; record results for quickstart §6 step 6 (the formal pass is T046) (FR-016, FR-018, NFR-004, R-7)
- [x] T034 [US3] Content review gate (quickstart §7, SC-006): walk **every** string — all of `app-strings.ts`, shell static text, and all 64 judgement+image pairings as displayed — against the checklist (no predictions/guarantees/advice; neutral across beliefs; attributed quotations) using spec.md US3 acceptance scenarios; record the pass in `specs/001-iching-consultation/checklists/` (0 string findings satisfies SC-006's verifiable half; its human-survey half — ≥4/5 first-time readers describing the app as "for reflection, not prediction" — is a post-ship reader study noted here, not an engineering task)

**Checkpoint**: US1+US2+US3 all independently functional; content review recorded.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: The verify-gated single-file build pipeline (contracts/dist-build.md end-to-end; constitution II/III NON-NEGOTIABLE), determinism, audit gate, and recorded validations. **Import order honored: data → core → ui → build.** ⚠️ T035+T036 are prerequisites for Phase 7 acceptance and for quickstart §6 steps that need dist.

- [x] T035 [P] Write `scripts/verify-dist.mjs` implementing **B-1…B-8 (+B-11 map check where applicable)** as static checks only — it must never execute the document's code (B-10): single inline `<script>`/`<style>` and no sibling assets (B-1, B-3); banned external refs — any `src=`/`href=`/`srcset`/`action`/`formaction`/`data`/`poster` outside same-doc `#` fragments, any `http://`/`https://`, protocol-relative `//host`, and any `<link|img|iframe|object|embed|audio|video|form>` element; `<meta charset>` first in head (B-3); CSP meta present with **each** required directive asserted and `default-src 'none'` exact (B-4); banned-token scan of the whole document: `eval(`, `new Function`, `innerHTML`, `outerHTML`, `document.write`, `document.writeln`, `fetch(`, `XMLHttpRequest`, `importScripts`, `WebAssembly`, `Function(` constructor pattern, leftover `import `/`export ` module syntax (B-5); privacy surface: no cookie logic, no analytics/telemetry identifiers, no secrets/tokens/environment-specific values, no localStorage reference other than `iching.method` (B-8); B-6 (DOM construction discipline) is structurally enforced by the banned-token list, which contains every markup-parsing entry point; **exit non-zero printing every violation**; pattern list lives only in this script, never in `src/` (R-1; standalone use `node scripts/verify-dist.mjs path/to/index.html` per B-10)
- [x] T036 Write `scripts/build.mjs` (R-1, quickstart §4; depends T035): (1) esbuild bundle `src/main.ts` → IIFE, target es2020, minify, `charset: utf8`, no sourcemaps (R-10); (2) read `src/shell/index.html`, replace the single script placeholder with the bundle; (3) write **exactly one** file `dist/index.html` (B-1); (4) run `verify-dist.mjs` **in-process as the final stage — any violation exits non-zero and the dist is considered NOT built** (B-10); (5) determinism: no timestamps/paths/env values enter the output (B-9); keep it ~60 lines of plain Node — the constitution's "tsc + a bundling step" and nothing more (NFR-006). Then run `npm run build` → green
- [x] T037 Determinism verification (B-9, constitution: deterministic builds): execute the quickstart §4 double-build — build, SHA-256, touch a source file, rebuild, SHA-256 — assert byte-identical; wire the check into the build script as a final step and prove B-10's fail-on-violation by temporarily adding an `eval(` string to a test fixture, confirming `npm run build` exits non-zero and names the violation, then reverting
- [x] T038 [P] Audit gate (constitution III, B-11): `npm audit --omit=dev` reports zero runtime packages and `package.json` `dependencies` is `{}`; `npm audit` on dev deps clean; verify `typescript`+`esbuild` are exact-pinned in `package-lock.json` (no ranges)
- [ ] T039 [P] Manual acceptance checklist: create `specs/001-iching-consultation/checklists/quickstart-acceptance.md` as a step-by-step transcription of quickstart.md §6 steps 1–8 with result-recording fields, to be filled against the real dist in Phase 7 (SC-001, SC-004, SC-005, SC-007)
- [x] T040 [P] Performance/size sanity (NFR-002, quickstart expectation): confirm `dist/index.html` comfortably under ~400 KB and document the uncompressed size; confirm open-to-interactive effectively instant on the preview machine
- [x] T041 [P] YAGNI/scope audit (NFR-006): verify no screens beyond question/casting/result + method choice + explanation exist in `src/shell/index.html` / `src/ui/`; no line texts, history, themes, or i18n crept in; confirm no date/time-dependent behavior exists anywhere (A-9 — keeps the app correct on clock-less/offline devices per the spec edge case) (spec NFR-006, A-5, A-6, A-9)

---

## Phase 7: User Story 4 — Private, safe, portable distribution (Priority: P2)

**Goal**: The artifact itself, inspected and exercised: one self-contained file, zero network, zero non-consented storage, works from anywhere offline. This is the US4 release pass recorded against a fresh build of the fully implemented app (US1+US2+US3 complete). **Requires Phase 6's pipeline (T035–T036) to produce `dist/index.html` first** — the build phase follows ui per the import order, and this story is verified by artifact inspection + behavior rather than by feature development (spec US4).

**Independent Test**: Open `dist/index.html` with a network monitor — 0 requests; full function with local storage disabled; single document, no external references, CSP embedded (spec US4 Independent Test; quickstart §6).

- [ ] T042 [P] [US4] Offline functional acceptance (quickstart §6 steps 1+3): airplane mode, open `dist/index.html`, complete full consultations with **both** methods — bottom-up reveal, `○/✕`+word markers, King Wen number/name/trigrams/judgement/image/attribution shown, related hexagram iff changing / stable message otherwise ("Cast again" clean) — record in the T039 checklist (SC-001, C-4…C-8 paths)
- [ ] T043 [P] [US4] Inert-input acceptance (quickstart §6 step 2): question `<script>alert("x")</script>` renders inert on the result screen, layout unaltered, no console errors (FR-013, C-10)
- [ ] T044 [P] [US4] Zero-network verification (quickstart §6 step 5): DevTools Network + proxy monitor during exhaustive use — **0 requests recorded** (FR-019, FR-021, NFR-002, C-13, SC-004); record
- [ ] T045 [P] [US4] Independent reference spot-check (quickstart §6 step 4; SC-002): 20-cast spot-check of pattern→number→name→related-hexagram against an independent published King Wen reference (spec SC-002's 20-cast criterion; quickstart's 5-result step 4 is the minimum, the 20-cast criterion takes precedence)
- [ ] T046 [US4] Assistive-tech pass (quickstart §6 step 6; SC-005): complete the full ritual keyboard-only with visible focus on every control, then VoiceOver/NVDA-only receiving number+name+line status as text for every line and both hexagrams (FR-016, FR-017, C-12, NFR-004); record
- [ ] T047 [US4] Storage-disabled tolerance (quickstart §6 step 7; NFR-003): browser site-data storage disabled — set method, cast, reload: no errors, method returns to default, nothing lost (C-9, R-8); record
- [ ] T048 [P] [US4] Portability acceptance (quickstart §6 step 8; spec scenario 4, SC-007): copy `dist/index.html` onto a USB stick and open as an email attachment on a fresh/airgapped machine — identical full behavior; record (B-2)
- [ ] T049 [US4] Verifier on a received copy + release gate (B-10, release checklist): run `node scripts/verify-dist.mjs dist/index.html` standalone against the USB/emailed copy just opened — green; confirm `dist/` contains exactly `index.html` and `src/data/texts.ts` header SHA still matches `corpus/` files (B-12); run the quickstart "Expected results summary" table end-to-end (`npm test` green, `npm run build` exit 0 — verifier included, `npm run typecheck` green, byte-identical re-build, 0 requests recorded, storage-disabled OK) and mark the feature release-gate complete (quickstart.md "Expected results summary", contracts/dist-build.md "Release checklist gate"; quickstart Expected-results table; FR-019–FR-023, NFR-001–NFR-003, SC-004–SC-007)

**Checkpoint**: All four user stories independently functional; dist verified, portable, private, and safe.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies — start immediately
- **Foundational (Phase 2)**: depends on Setup; **BLOCKS all user stories**; internal order strictly data → core: T005→T006→T007 (corpus chain, `texts.ts`), T011/T012/T013 (static tables) before T017/T018 (`hexagram.ts`/`consultation.ts` import king-wen + corpus); T008/T009/T010 (failing tests) before their targets; T014 before T015/T016/T018 (type imports)
- **User Stories (Phases 3–7)**: depend on Foundational checkpoint T019
  - US1 → US2 → US3 → [Phase 6 pipeline] → US4 recommended order (single implementer); stories US2/US3 could parallel US1 after T019 if different files are guaranteed (conflicts called out in "Sequential by file" below)
  - US1 internal order: T020/T021/T022/T023/T024 in parallel → T025 (step controllers — `steps.ts` + `shell-bind.ts`) → T026 (`src/ui/main.ts` composition root, wires everything last). **`src/shell/index.html` (T024, T033) and `src/ui/steps.ts` (T025, T028, T031, T032) are shared files → those tasks are sequential, never [P] with each other**
  - US2 depends on US1's Question step existing (T025); US3 depends on US1 rendering being in place it overlays (T025/T031 consume `app-strings.ts` from T030)
- **Phase 6 Polish (T035–T041)**: depends on Phases 3–5 (all `src/` authoring, T020–T034) because it bundles them; **T035 → T036 → T037** strictly ordered (verifier before pipeline before determinism); no story before Phase 7 needs the pipeline except the MVP-validation convenience noted in Phase 3
- **Phase 7 US4 (T042–T049)**: depends on **T034** (US3 content review recorded), **T036** (dist built, verifier green) and **T037** (determinism + fail-gate proven) — this is the "build last" import-order consequence (data → core → ui → build); T039's checklist file (Phase 6) is filled by the Phase 7 runs

### User Story Dependencies

- **US1 (P1)**: after Foundational only — the whole product in one story
- **US2 (P2)**: after Foundational + US1's Question step (T025); models/tests already in T016; independently testable (statistical harness independent of UI; UI check independent of US2 internals)
- **US3 (P2)**: after US1 (overlays presentation of an existing flow); independently testable via the §7 content walk without touching casting machinery
- **US4 (P2)**: after US1–US3 + build pipeline (artifact-inspection story; spec US4 rationale); independently testable by opening the file

### Within Each User Story

- Fail-first tests before implementation (Phase 2 pattern; constitution mandates the tests)
- Data before core before ui; composition (`main.ts`) wires last and stays thin (R-12)
- Story complete and checkpoint-validated before next priority (template rule)

### Parallel Opportunities

- Setup: T002∥T003
- Foundational: T008∥T009∥T010 (three test files); T011∥T012∥T013 (three data files); T015∥T016 (different core files, both only need T014)
- US1: T020∥T021∥T022∥T023∥T024 (five distinct new files) after Foundational
- US2: T027∥T029 (new files; T028 edits `steps.ts`+`main.ts` — sequential with story file owners)
- US3: T030 first (new file `app-strings.ts`), then T031→T032→T033 strictly sequential (T031/T032 share `steps.ts`; T033 additionally owns the `index.html` contrast edits); T034 last (content gate)
- Phase 6: T035∥T038∥T039∥T040∥T041 once relevant inputs exist (T036 needs T035; T037 needs T036)
- Phase 7: T042∥T043 T044∥T045∥T048 (different quickstart steps — independent manual paths); T046∥T047 (assistive/storage paths independent)
- Team strategy: after T019, three implementers can run US1→(US2/US3 split), build pipeline, and US4-test-prep; shared-file conflicts per the list above serialize onto one owner. T046/T047 after T042 (stable dist open). T049 is last (release gate).

---

## Parallel Example: User Story 1 (after Foundational checkpoint T019)

```bash
# Launch together (distinct files, no interdependency):
Task: "T020 [US1] Create src/main.ts thin entry + randomness probe"
Task: "T021 [US1] Create src/ui/announce.ts aria-live announcer"
Task: "T022 [US1] Create src/ui/line-view.ts CSS line figures"
Task: "T023 [US1] Create src/ui/question-echo.ts inert echo"
Task: "T024 [US1] Create src/shell/index.html static shell + CSP meta"
# Then sequentially (shared/integrating files):
Task: "T025 [US1] Create src/ui/steps.ts step controllers + src/ui/shell-bind.ts"
Task: "T026 [US1] Compose src/ui/main.ts + cast-again clearance"
```

---

## Implementation Strategy

### MVP First (Setup + Foundational + User Story 1)

1. Complete Phase 1 Setup (T001–T004)
2. Complete Phase 2 Foundational (T005–T019) — **CRITICAL gate: all six test suites green**
3. Complete Phase 3 US1 (T020–T026) + the minimum build subset T035+T036 to produce a testable `dist/index.html`
4. **STOP and VALIDATE**: offline one-file consultation vs the independent King Wen reference (US1 Independent Test)
5. Demo — a complete, secure, standalone product already exists at this point (constitution II/III already enforced by the pipeline)

### Incremental Delivery

1. Setup + Foundational → tested data/logic foundation
2. + US1 → MVP: full consultation in one secure file (validate independently)
3. + US2 → method choice + consent-gated preference (validate: statistical harness + UI reopen behavior)
4. + US3 → contemplative overlay + content review recorded (validate: §7 checklist walk)
5. Phase 6 pipeline hardening (determinism, audit gate) + US4 acceptance phases → release gate B-1…B-12 green (T049: release-ready)
6. Each increment keeps `npm test` / `npm run build` green; the verifier gates every build throughout — no story can ship an unsafe dist (B-10)

### Parallel Team Strategy

With multiple developers: run Setup + Foundational together; then Developer A: US1→US2→US3 (UI story line); Developer B: build pipeline T035–T037 + audit T038 (independent until dist needed); Developer C: US4 acceptance-plan prep (T039) then executes T042–T049 once dist exists.

---

## Notes

- [P] = different files, no incomplete dependency; shared-file tasks (`steps.ts`, `index.html`, `main.ts`) are deliberately sequential
- Story labels [US1]–[US4] map to spec.md stories US1(P1), US2(P2), US3(P2), US4(P2)
- No commits (workspace is not a git repository — A-7); "record" tasks write results into `specs/001-iching-consultation/checklists/`
- The verifier (`verify-dist.mjs`) runs inside every `npm run build`; a red verifier means the dist does not exist (B-10)
- Stop at any checkpoint to validate a story independently
