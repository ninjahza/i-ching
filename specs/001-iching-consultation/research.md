# Phase 0 Research: I Ching Consultation App

**Spec**: `specs/001-iching-consultation/spec.md` | **Plan**: `specs/001-iching-consultation/plan.md`
**Date**: 2026-11-09

All Technical Context items were resolved during planning; no NEEDS CLARIFICATION remains. Each decision below records rationale and alternatives, per the plan workflow.

---

## R-1. Build pipeline: esbuild bundle → HTML shell injection → security verify

**Decision**: Use **esbuild** as a single pinned **dev dependency** plus a small `scripts/build.mjs` that (1) bundles `src/main.ts` to an IIFE, (2) injects the bundle into `src/shell/index.html` (the HTML/CSS/CSP shell), (3) writes `dist/index.html`, and (4) runs `scripts/verify-dist.mjs`, which fails the build on any banned pattern. `tsc --noEmit` is retained as the strict type gate (`erasableSyntaxOnly` enforced there). Determinism is verified in CI/tests by building twice and comparing SHA-256.

**Rationale**:
- The constitution (V) permits build complexity of "`tsc` plus a bundling step"; an esbuild bundler *is* a bundling step, and pinning it satisfies III ("dev dependencies pinned and audited"). It adds zero runtime dependencies — the artifact contains only this project's compiled code.
- esbuild bundles the ES-module graph of `src/` into one IIFE with no loader glue, tree-shaking, and `target: es2020` output; it is deterministic for fixed input (same source ⇒ byte-identical output; verified explicitly by a double-build checksum test).
- `build.mjs` is ~60 lines of plain Node: read shell template, replace one placeholder, write, verify. The verify step is part of the pipeline so principle III's checklist can never be skipped.

**Alternatives considered**:
- **(b) `tsc` emit + hand-rolled concatenation**: TypeScript emits per-module ES files with `import`/`export` statements; making those work inline in a single `file://` document would require writing a mini module loader/linker by hand — real build complexity, real bug surface, and arguably a dynamic-code-flavored mechanism. Rejected against principles III and V ("no build complexity beyond tsc plus a bundling step" — a hand-rolled linker *is* beyond a bundling step).
- `tsc --outFile` with `module: system/amd`: forces a non-erasable module idiom and a runtime loader shim baked into dist; rejected against III/V.
- Vite / webpack: heavier configuration and plugin surface than this project needs; rejected on YAGNI (governance).
- Single-file rollup: comparable to esbuild but slower and its determinism for this use case is no better; esbuild chosen for its "one binary, one flag set, deterministic" simplicity.

**Banned-pattern verification** (run inside the build, constitution governance checklist, NFR-001): the verifier scans `dist/index.html` and fails on any of: `eval(`, `new Function`, `innerHTML`, `outerHTML`, `document.write`, `fetch(`, `XMLHttpRequest`, `importScripts`, `http://`, `https://`, protocol-relative `"//"` references in `src=`/`href=` attributes, leftover `import `/`export ` statements, and asserts the CSP meta tag is present with the required directives. (String literals of the app's *own* copy never contain these tokens; the verifier pattern list is kept in `scripts/verify-dist.mjs`, not in `src/`, so scanning has no false positives from the checker itself.)

---

## R-2. Legge corpus intake: checked-in public-domain source + deterministic generator

**Decision**: Archive a verified public-domain transcription of James Legge's *The Yi King* (Sacred Books of the East, Vol. XVI, 1882) under `corpus/` in-repo (candidate source: Project Gutenberg's transcription of the SBE-XVI text; Wikisource's page-scanned transcription as alternate). A checked-in, deterministic `scripts/gen-corpus.mjs` parses those files and emits `src/data/texts.ts` — a pure data module whose header carries the attribution block and a source SHA-256. Regeneration requires re-running the script and **reviewing the file diff** (audit trail); a hand-curated transcription is the explicitly approved fallback for any hexagram whose machine-extracted text is malformed, with the same diff-reviewed audit.

**Rationale**:
- Constitution: "only public-domain translations may be bundled, **verified before inclusion**" — an in-repo archived source + generator + checksum makes the provenance auditable rather than folklore; the diff on regeneration is the review gate.
- The Wilhelm/Baynes (1950) translation remains in copyright and must never appear (spec A-3).
- Deterministic generator output (stable ordering, fixed formatting) keeps builds reproducible (constitution: deterministic dist).
- Automated integrity tests (NFR-005/SC-002) then assert all 64 entries have non-empty judgement and image, and a documented manual spot-check (hexagrams 1, 2, 8, 63, 64 against the printed/published text) gates first inclusion.

**Alternatives considered**:
- Pure hand-curation of all ~128 texts: slower, typo-prone, no provenance artifact. Retained only as per-entry fallback.
- Fetching text at build time from the web: breaks hermetic/offline builds and the "verified before inclusion" step. Rejected.

**Scope note**: v1 needs only the **judgement (Tuan/decision)** and **Image (Ta-chuan commentary)** per hexagram (spec A-5, A-5-optional line texts excluded as YAGNI), which sharply narrows the extraction surface.

---

## R-3. Binary encoding, King Wen mapping, transformation

**Decision**:
- **Line values** use the traditional numbers: `6` old yin (yin, changing) · `7` young yang (yang, stable) · `8` young yin (yin, stable) · `9` old yang (yang, changing). Yang bit = `value % 2 === 1`.
- **Pattern encoding**: a hexagram pattern is a 6-bit integer, **bottom-up**: position 1 (first/bottom line) = bit 0 (LSB) … position 6 (top) = bit 5. Yang bit `1`, yin bit `0`. Lower trigram = bits 0–2, upper trigram = bits 3–5, each read bottom-up within the trigram.
- **King Wen mapping**: two checked-in tables — `PATTERN_TO_KW: number[64]` (pattern int 0–63 → King Wen number 1–64, no sentinel needed: a correct bijection leaves no `0` entries) and `KW_TO_PATTERN: number[64]` (index 0 unused or offset handled by convention; tests assert the two tables are strict mutual inverses). The tables are *facts* (sequence orderings are not copyrightable expression) and are validated by tests, not trusted.
- **Transformation**: with a changing-position bitmask `mask`, the related pattern is `pattern ^ mask`. Old yang→young yang, old yin→young yin (the yang/yin bit stays; only the changing quality is cleared) — XOR on positions flips the line's polarity, matching the traditional rule exactly. Changing lines never occur in the transformed pattern (mask cleared by construction).
- **Zero changing lines**: `mask === 0` ⇒ no related hexagram is computed or shown; the result step displays an explicit "stable — no change" statement (FR-010), worded so it does not imply a lesser cast.

**Rationale**: bottom-up LSB matches both the tradition (lines grow upward, FR-004) and trivial bit math; trigram derivation, XOR transformation, and table inverse tests are then one-liners. Self-inverse table testing converts the data tables from "trust me" into tested code (NFR-005).

**Alternatives considered**: top-first encoding (inverted bit order) — rejected as error-prone against the tradition; string-of-`"101010"` patterns — slower to derive and less testable than ints; per-KW-number full records as the primary key — kept *out* of the core because the pattern→KW join is the part that must be machine-verified.

---

## R-4. Randomness: secure source, unbiased selection, honest failure

**Decision**:
- All randomness comes from `crypto.getRandomValues` (Web Crypto, available synchronously). A tiny `RandomSource` interface in `src/core/casting.ts` injects the byte source so tests use a seeded/deterministic source.
- **Three-coin line**: read 1 random byte; use its low 3 bits as three virtual coins (head = 3, tail = 2); sum = `6 + popcount(bits)` ∈ {6,7,8,9} with probabilities exactly **1/8, 3/8, 3/8, 1/8**.
- **Yarrow-stalk line**: read 1 random byte; take `r = byte & 15` (uniform 0–15); map `r ≤ 2 → 9` (old yang, 3/16), `3–7 → 7` (young yang, 5/16), `8–14 → 8` (young yin, 7/16), `r = 15 → 6` (old yin, 1/16). Exactly **3/16, 5/16, 7/16, 1/16** — classical profile including the old-yang-favored asymmetry (SC-003).
- Both methods are **rejection-free and modulo-free**: every draw consumes exactly one byte with a partitioned outcome space, so the distributions are exact, not approximate.
- **Availability check**: at app start, `typeof crypto?.getRandomValues === 'function'` is probed **once**. If absent, the cast control is disabled and an honest, plainly worded message states the device offers no secure random source and the app will not cast (FR-003, A-8). `Math.random` is **never** called anywhere in `src/` (the dist verifier does not even need to grep it; the source-review checklist covers it).

**Rationale**: Principle IV — "casting integrity is part of the idea's integrity". The spec (FR-003/A-8) defines the fallback as *honest decline*, not a weaker generator; documented here as the "honest documented fallback" the constitution asks for. Partitioned-byte mapping avoids modulo bias entirely and is trivially testable with an injected fake source; probability conformance over ≥100 k casts is checked in a unit test with a deterministic PRNG that itself draws entropy from `getRandomValues`.

**Alternatives considered**: `Math.random` fallback — rejected (FR-003). Seedable-hash "CSPRNG" fallback — rejected as the "silent weak source" the spec forbids. `crypto.getRandomValues` *async* (`crypto.subtle`) — unnecessary; the synchronous `getRandomValues` exists in every target browser (A-1).

---

## R-5. Casting UI animation vs. accessibility (reveal pacing)

**Decision**: Lines reveal sequentially **bottom-up**; each reveal is announced in an `aria-live="polite"` status region as text (e.g. "Line 3: six in the second place — broken line, changing"), while the visual line is `aria-hidden`. Reveals are driven by a timer (≈ 400 ms apart) with an immediately-effective **"reveal all"** control; keyboard activation of "Cast" starts the sequence without pointer use. The result step moves focus to its heading so screen readers read the hexagram identity first.

**Rationale**: FR-004 (one at a time) and FR-017 (announced with name and number) coexist only if the visual animation is decorative and the live region carries the text. A "reveal all" escape keeps the animation from becoming an accessibility delay (WCAG 2.2.2 spirit), and keeps the SC-001 <2-minute budget.

**Alternatives considered**: instant reveal (fails FR-004's ritual feel); audio cues (over-scope, YAGNI).

---

## R-6. Hexagram glyph rendering

**Decision**: Hexagram figures are drawn as **divs styled with CSS** (solid bar for yang; two segments with a gap for yin), plus text markers for changing lines: `○` on old yang, `✕` on old yin (the traditional markers, rendered as text, not color), plus a visible text label ("changing"). The container is `role="img"` with an `aria-label` spelling the full hexagram ("Hexagram 63 — After Completion, changing line in position 4").

**Rationale**: The Unicode hexagram block (U+4DC0–U+4DFF) cannot be relied on from `file://` offline (font availability varies by device — same failure class as remote fonts), would be announced by screen readers as glyphs alone or not at all, and cannot mark changing lines (the block has no changing variants). CSS bars are CSP-clean (inline `<style>`), deterministic, and controllable, and shape markers satisfy FR-006 (never color alone).

**Alternatives considered**: Unicode glyphs (rejected above); SVG via inline `innerHTML` (banned by III); `<canvas>` (worse for AT — rejected).

---

## R-7. CSP, styling, and fonts

**Decision**: The dist `<head>` embeds:
`Content-Security-Policy: default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'none'; font-src 'none'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`.
All CSS is one inline `<style>` block using CSS custom properties; layout is a single centered column; **system font stack only** (no webfonts). Palette targets WCAG 2.1 AA (≥ 4.5:1 body text, ≥ 3:1 essential graphics) with a `prefers-color-scheme` split and visible `:focus-visible` outlines. No `<img>`, `<link>`, `<iframe>`, or `<form>` elements exist in dist at all (verified statically).

**Rationale**: `'unsafe-inline'` for script/style is the documented, constitution-allowed exception that makes single-file inline distribution possible while `default-src 'none'` denies every remote origin and every active-content vector (III, FR-019/FR-020). System fonts keep `font-src 'none'` honest and dist byte-small (NFR-002).

**Alternatives considered**: nonce/hash-based CSP for the inline script (a static meta tag cannot carry a per-build hash without changing on every build in ways that add nothing against a local single-file threat model; `'unsafe-inline'` + `default-src 'none'` is the accepted construction here); external stylesheet compiled from SCSS (extra build surface, YAGNI).

---

## R-8. Persistence: consent-gated method preference

**Decision**: At most one persisted item, per A-4/FR-022: the casting-method preference, stored only after explicit opt-in ("Remember my method choice on this device"). Opt-in flips a boolean that writes `localStorage.setItem("iching.method", …)` on each method change; opting out immediately `removeItem`s the key — a single disclosure line states what is stored, where, and that opting out deletes it. Every `localStorage` call is wrapped in `try/catch`; with storage disabled the feature silently degrades to in-session-only (NFR-003: no lost v1 functionality). The question text is *never* written anywhere (FR-023); the state machine holds it in memory only and nulls it on "cast again".

**Alternatives considered**: persist nothing at all (acceptable but drops A-4, which the spec pre-commits as the only allowed item); store on every method change without consent (violates III/IV/F R-022 — rejected).

---

## R-9. Testing approach: `node:test` against TypeScript sources via Node type stripping

**Decision**: Tests live in `tests/*.test.ts`, run with `node --test tests/` on Node 26's native TypeScript type-stripping (no transform step), importing `src/core/*` and `src/data/*` directly. `erasableSyntaxOnly` in `tsconfig` is precisely what guarantees Node can strip the types. Test suites:
1. **Data integrity** (SC-002, NFR-005): 64 unique patterns; `PATTERN_TO_KW`/`KW_TO_PATTERN` mutual inverses; trigram composition of every hexagram; corpus completeness (non-empty judgement+image × 64; attribution header present).
2. **Transformation**: exhaustive all-64-patterns × all-64-masks XOR spot-check table against independent expectations for known pairs (1↔2, 3↔…; 63↔64) plus mask-clears-changing-lines property; zero-mask ⇒ stable case.
3. **Probability models**: ≥ 100 000 simulated lines per method via injected deterministic source; χ² or absolute-frequency check within 0.5 pp (SC-003); plus exactness tests asserting the byte-partition mapping (every byte 0–255 maps per declared counts).
4. **Domain/state machine**: consultation transitions, "cast again clears state", question truncation.
The DOM layer (`src/ui/`) is excluded from unit tests by construction — `src/core/` is pure (no `window`/`document` references), which the constitution requires anyway; a structural test asserts `src/core/**` and `src/data/**` contain no DOM-global identifiers.

**Rationale**: Zero test-framework dependency; runs without a browser exactly as the constitution mandates; type stripping avoids a second compile path. Exhaustive 64×64 transformation checks are cheap and prove FR-009 for all inputs rather than spot samples.

**Alternatives considered**: Vitest/Jest (extra dev deps and config for node:test-expressible work — YAGNI); browser smoke tests (valuable for quickstart manual passes, but the constitution's tested surface is pure logic; automated DOM testing infrastructure would violate V's simplicity budget).

---

## R-10. Language target & module system of the bundle

**Decision**: `tsconfig`: `strict`, `noUncheckedIndexedAccess`, `erasableSyntaxOnly`, `target: ES2020`, `module: ESNext`, `verbatimModuleSyntax`. esbuild output: format `iife`, target `es2020`, `minify`, `charset: utf8`, no sourcemaps, `legalComments: none`. Bundle is inserted into `<script>` in the shell at a single placeholder line; the shell file contains the `<style>` block, semantic skeleton (native `<button>`s, `<input>`, headings), and CSP meta.

**Rationale**: ES2020 covers everything used (`?.`, `??`) with a wide browser floor (A-1's last-five-years browsers all support it). Minification shrinks the corpus-heavy dist (~tens of KB script + Legge texts) toward the NFR-002 "instant" goal. `charset: utf8` keeps CJK-free Chinese names as literals — check that any diacritics survive; output is one UTF-8 document with `<meta charset="utf-8">` first in head (byte-size note: Legge corpus dominates file size regardless of minify; acceptable if dist stays comfortably < ~400 KB).

**Alternatives considered**: ES2023 target (smaller output but shrinks the honest browser floor for negligible gain here); shipping un-minified bundle into dist (larger, no benefit once tests typecheck the source).

---

## R-11. Question length handling

**Decision**: The question textarea enforces `maxLength = 500` characters; the core `Consultation` constructor additionally truncates defensively at 500 with a one-time UI notice ("Question shortened to 500 characters"). The question is displayed back on the result screen (if non-empty) via `textContent` only, preserving newlines with CSS `white-space: pre-wrap` (R-7) — never interpreted (FR-013 edge case: markup/angle brackets render inert).

**Rationale**: Graceful limit with clear feedback per the spec's edge case ("limited or truncated gracefully with a clear message"); the display-back is deliberate (the seeker's own prompt visible while contemplating) and is safe precisely because all output paths are `textContent`.

**Alternatives considered**: unbounded input (no requirement demands it; a sane bound removes any DoS-ish UI pathology); not showing the question back (loses useful contemplative framing at zero cost).

---

## R-12. App shell vs. router vs. framework

**Decision**: No framework. `src/ui/` is a hand-wired step switcher: three `<section>`s (`question`, `casting`, `result`) in the shell, `hidden` toggled per state, one `aria-live` region, focus moved to step heading on transition. Method selection lives on the question step. A short static "What this is / what it is not" explanation is on the intro view and reachable again via a toggle on the result step.

**Rationale**: Three screens with linear transitions (NFR-006 limits the app to the ritual); a router or framework is a runtime dependency (banned, III) and complexity beyond budget (V). Static markup in the shell + `textContent` updates is the smallest construction that satisfies III's DOM rule ("static template nodes").

**Alternatives considered**: hyperscript-style createElement tree in TS (works with III but duplicates static structure the shell already expresses — both are compliant; shell-first keeps less logic in JS).

---

## Constitution gate pre-check summary (before design)

| Principle | Status | Basis |
|---|---|---|
| I. Fidelity | ✅ Pass by design | R-3 tested King Wen/transformation correctness; R-2 Legge-only corpus; content policy FR-011/SC-006 review in quickstart |
| II. Single-file | ✅ Pass | R-1/R-7/R-10: one inline HTML, zero remote refs |
| III. Security | ✅ Pass | R-1 verifier-in-build, R-7 CSP, createElement/textContent shells, zero runtime deps (esbuild is dev-only) |
| IV. Offline privacy | ✅ Pass | R-4 honesty, R-8 opt-in deletable preference |
| V. Simplicity | ✅ Pass | R-9/R-12: no framework, node:test, minimal build |

**Re-check after Phase 1 design: PASS** — recorded in `plan.md` §Constitution Check post-design table; no violations ⇒ Complexity Tracking empty.
