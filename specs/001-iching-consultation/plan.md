# Implementation Plan: I Ching Consultation App

**Spec id**: `001-iching-consultation` (numeric spec id `001`; no git branch — workspace is not a repository, per spec A-7) | **Date**: 2026-11-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-iching-consultation/spec.md`

## Summary

A single-screen I Ching consultation app: pose an optional question → cast six lines (three-coin default or classical yarrow-stalk, both via `crypto.getRandomValues`) → contemplate the King Wen hexagram with Legge's judgement and image, plus the related hexagram when lines change. Ships as **exactly one self-contained `dist/index.html`** (all JS/CSS/data inlined, CSP meta, zero runtime dependencies, zero network), built by an esbuild-based inline-and-verify pipeline with a static security verifier wired into the build. Pure casting/mapping logic is separated from the DOM and unit-tested with `node:test` on Node's native TypeScript type-stripping.

## Technical Context

**Language/Version**: TypeScript 5.x — `strict`, `erasableSyntaxOnly`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, target ES2020 (research R-10). Tooling runtime: Node.js ≥ 26 (v26.13.0 locally verified — native TS type-stripping runs tests directly, no transform step).

**Primary Dependencies**: **Runtime: none (zero, no exceptions — constitution III).** Dev dependencies, exact-pinned: `typescript` (type gate via `tsc --noEmit`) and `esbuild` (bundler only). Empty `dependencies` map is itself a verified invariant (contract B-11).

**Storage**: None by default. Single consent-gated `localStorage` key `iching.method` (method preference) only — opt-in, disclosed, deleted on opt-out, try/caught for disabled-storage (research R-8; FR-022/FR-023). The question is never persisted.

**Testing**: `node --test tests/` (built into Node, no framework) against `src/core/**` and `src/data/**` imports directly (type-stripping works because `erasableSyntaxOnly` is enforced). Suites: data integrity, King Wen mapping, transformation (exhaustive), probability models (exact byte-partition + ≥100k statistical), consultation state machine, core purity (research R-9; SC-002/SC-003).

**Target Platform**: Modern desktop/mobile browsers (last ~5 years, spec A-1), opened directly as `file://`, fully offline. No server, no installation.

**Project Type**: Single-page web app (static single-file distribution).

**Performance Goals**: Open-to-interactive effectively instant (NFR-002); dist comfortably under ~400 KB (corpus-dominated); SC-001: first consultation under 2 minutes of user time.

**Constraints**: Single-file offline distribution; embedded CSP `default-src 'none'` (inline script/style only); banned-pattern static verifier gating every build; deterministic byte-identical rebuilds; WCAG 2.1 AA, full keyboard + screen-reader operability; casting randomness strictly `crypto.getRandomValues` with honest decline when unavailable. (All from constitution II/III/IV/V and FR-016–FR-021.)

**Scale/Scope**: 64 hexagram records + ~128 corpus texts; ~8 small core modules, ~5 data modules, ~6 UI modules; ~2.5–3 k LOC source incl. tests; 3 screens (question / casting / result). No backend, no routing, no i18n (English only, A-6).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

Gate evaluated against `.specify/memory/constitution.md` v1.0.0 (principles I–V + Technical Constraints). **Pre-research: PASS. Post-design: PASS.** No violations ⇒ Complexity Tracking empty.

| # | Principle | Pre | Post | Basis in this plan |
|---|---|---|---|---|
| I | Fidelity to the Idea | ✅ | ✅ | Tested King Wen bijection + XOR transformation (data-model §3/§5, `transform.test.ts`); Legge-only corpus with attribution and content checklist gate (research R-2; flow contract C-7; quickstart §7) |
| II | Single-File Self-Contained | ✅ | ✅ | esbuild IIFE + shell injection → one `dist/index.html`; verifier clauses B-1–B-3 forbid any external reference; file:// acceptance in quickstart §6 (research R-1, R-10) |
| III | Security by Construction | ✅ | ✅ | CSP meta `default-src 'none'` + inline-only script/style (B-4); banned-token scan inside the build (B-5, research R-1); DOM via static shell + `createElement`/`textContent` only (B-6); zero runtime deps (B-11); no secrets — nothing environment-specific exists in the pipeline |
| IV | Offline-First Privacy | ✅ | ✅ | `crypto.getRandomValues` only, honest decline with cast disabled when absent — never a weak fallback (research R-4, flow C-3); sole persistence item is the consent-gated, deletable method preference; nothing transmitted (flow C-2/C-13) |
| V | Simplicity & Accessibility | ✅ | ✅ | Build is "tsc + a bundling step" exactly as the constitution phrases it (esbuild, dev-only); no framework, 3 static screens (research R-12); line/hexagram announcements as name+number text, shape markers not color-alone, keyboard-everywhere (flow C-4/C-12, R-5/R-6) |
| — | Technical Constraints (TS strict/erasableSyntaxOnly, deterministic build, tested pure logic, PD-only attributed corpus) | ✅ | ✅ | R-10 (flags), R-1/B-9 (double-build SHA-256 check), R-9 (browserless unit tests), R-2 (generator with source checksum + review gate) |

**Evaluated judgment calls (no gate failures):**
1. *esbuild as a dev dependency* — the constitution prohibits runtime third-party dependencies (none are introduced) and explicitly allows "`tsc` plus a bundling step". esbuild performs exactly that bundling step, pinned and audited per III. A hand-rolled tsc-emit concatenation was rejected in research R-1 precisely because a hand-written module linker would *exceed* the permitted build complexity and add dynamic-code-flavored machinery to dist. Decision logged below.
2. *`'unsafe-inline'` in CSP* — permitted by constitution III's wording (inline script/style allowed); remote origins, objects, base, forms all denied (R-7).

## Project Structure

### Documentation (this feature)

```text
specs/001-iching-consultation/
├── plan.md                          # this file
├── research.md                      # Phase 0 — decisions R-1…R-12 with rationale
├── data-model.md                    # Phase 1 — entities, validation rules, test map
├── quickstart.md                    # Phase 1 — build/test/preview/verify guide
├── contracts/
│   ├── consultation-flow.md         # Phase 1 — behavioral state-machine contract (C-1…C-13)
│   └── dist-build.md                # Phase 1 — dist security & single-file invariants (B-1…B-12)
├── checklists/                      # (existing) requirements checklist
├── spec.md
└── tasks.md                         # Phase 2 output (/speckit.tasks — NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── core/                     # PURE logic — no window/document/node imports (purity-tested)
│   ├── line-values.ts        #   LineValue 6|7|8|9, isYang/isChanging, markers
│   ├── pattern.ts            #   6-bit bottom-up pattern, mask ops, XOR transform
│   ├── casting.ts            #   CastingMethod models; byte-partition draws; RandomSource injection
│   ├── hexagram.ts           #   hexagram lookup, trigram derivation, relatedHexagram()
│   └── consultation.ts       #   Consultation aggregate + flow state machine (transient, in-memory)
├── data/                     # static, tested records
│   ├── king-wen.ts           #   PATTERN_TO_KW[64] / KW_TO_PATTERN[64]
│   ├── trigrams.ts           #   8 trigrams (name, nature, bits)
│   ├── hexagram-names.ts     #   Legge names by KW number
│   ├── texts.ts              #   GENERATED: corpus 1..64 judgement+image + attribution header (DO-NOT-EDIT)
│   └── app-strings.ts        #   app-authored copy (labels, help) — content-review subject
├── ui/                       # DOM layer (the ONLY layer touching document/window)
│   ├── main.ts               #   entry: probe randomness, restore opted-in preference, mount
│   ├── shell-bind.ts         #   query static shell nodes; visibility step switching
│   ├── announce.ts           #   aria-live announcements (research R-5)
│   ├── line-view.ts          #   CSS line figures with ○/✕+word markers (research R-6)
│   ├── steps.ts              #   question/casting/result step controllers, focus management
│   └── method-pref.ts        #   consent-gated localStorage read/write/delete (try/caught)
├── shell/
│   └── index.html            # HTML skeleton + inline <style> + CSP meta + script placeholder
└── main.ts                   # thin entry importing core/ui (esbuild input)

corpus/                       # archived public-domain Legge source text (input to generator)
scripts/
├── build.mjs                 # esbuild bundle → shell injection → dist/index.html → verify
├── verify-dist.mjs           # B-1…B-8 static checks; exits non-zero on violation
└── gen-corpus.mjs            # corpus/ → src/data/texts.ts (deterministic, header w/ SHA-256)
tests/                        # node:test, *.test.ts, run via type-stripping (no browser)
├── hexagram-map.test.ts      # bijection, inverses, trigrams (SC-002)
├── transform.test.ts         # exhaustive XOR, 1↔2 / 63↔64, stable case
├── casting.test.ts           # exact partitions + ≥100k statistical (SC-003)
├── consultation.test.ts      # state machine, cast-again clears state
├── corpus.test.ts            # completeness + attribution (FR-015)
└── purity.test.ts            # core/data free of DOM globals & banned constructs
dist/
└── index.html                # THE deliverable (built; never hand-edited)
package.json                  # dependencies: {} — devDeps: typescript, esbuild (pinned)
tsconfig.json                 # strict, erasableSyntaxOnly, noEmit (esbuild emits)
```

**Structure Decision**: One project (no backend exists — a static single-page app). The `src/core` ↔ `src/ui` split is *load-bearing*, not stylistic: the constitution mandates browser-free unit tests, so purity of `core/`+`data/` is itself an enforced test (`purity.test.ts`). `src/shell/index.html` holds static markup so dynamic JS only ever mutates `textContent` of pre-existing nodes or appends `createElement` nodes (principle III). `scripts/` owns the verify-gated build; corpus regeneration is an auditable generator, not an edit.

## Phase 0 → Phase 1 outcome

All Technical Context unknowns resolved — see [`research.md`](./research.md): build pipeline **R-1**, corpus intake **R-2**, encoding/King-Wen/transformation **R-3**, randomness & fallback **R-4**, reveal pacing **R-5**, glyphs **R-6**, CSP/fonts **R-7**, persistence **R-8**, testing **R-9**, bundle target **R-10**, question limits **R-11**, no-framework shell **R-12**. No NEEDS CLARIFICATION remains. Design artifacts: [`data-model.md`](./data-model.md), [`contracts/consultation-flow.md`](./contracts/consultation-flow.md), [`contracts/dist-build.md`](./contracts/dist-build.md), [`quickstart.md`](./quickstart.md). Constitution **re-checked after design: PASS** (table above).

## Complexity Tracking

> No constitution violations — nothing to justify.

**Zero runtime dependencies; dev dependencies limited to `typescript` + `esbuild` (pinned).** No new principles, no added features beyond spec (NFR-006 YAGNI observed: no line texts, no history, no themes UI, single language).

## Decision Log (new entries worth user attention)

1. **Build = esbuild (pinned dev-dep) + `build.mjs` shell-injection + in-build security verifier; `tsc --noEmit` remains the type gate** (R-1). Chosen over tsc-emit + hand-rolled concatenation (would require a hand-written module linker — more, not less, build complexity) and over Vite/webpack/rollup (surface area without gain). Determinism enforced by CI double-build SHA-256 equality.
2. **Legge corpus via checked-in public-domain source + deterministic generator** (`corpus/` → `scripts/gen-corpus.mjs` → `src/data/texts.ts` with attribution + source SHA-256 header, diff-reviewed regeneration; hand-curation only as per-entry fallback). Wilhelm/Baynes is excluded as still in copyright. (R-2)
3. **Yarrow/coin draws are rejection-free byte partitions** of `crypto.getRandomValues` bytes — exact declared probabilities by construction, no modulo bias; missing secure-random API disables casting with an honest message rather than any fallback generator. (R-4)
4. **Hexagram figures drawn as CSS bars with ○/✕ + word markers; no dependence on Unicode hexagram fonts**; screen-reader output carries numbers, names, and line status as text throughout. (R-5/R-6)
5. **Persistence is one consent-gated key (`iching.method`) and nothing else**; app defaults to three-coin on every opening unless opt-in memory is active; storage-disabled costs the seeker nothing. (R-8)

## Next Step

Run `/speckit.tasks` to generate `tasks.md` from this plan (dependency-ordered, honoring the contract clauses C-1…C-13 and B-1…B-12 as acceptance criteria).
