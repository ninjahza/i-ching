# Tasks: Hexagram “Read More” Summaries

**Input**: Design documents from `/specs/002-hexagram-summary/`

**Prerequisites**: `plan.md` (required), `spec.md` (required for user stories), `research.md` (R1–R4), `data-model.md`, `contracts/summary-ui-contract.md`, `quickstart.md`, `.specify/memory/constitution.md` (principles I–V)

**Tests**: Included as required by `spec.md` (`SC-001`, `SC-002`, `SC-004`), `plan.md`, `data-model.md` (Validation Rules 1–5), `research.md` (R4), and `quickstart.md` using Node's built-in `node:test` runner (`npm test`) with zero new runtime or dev dependencies.

**Organization**: Tasks are grouped by phase and user story (`US1` P1 MVP, `US2` P2, `US3` P2) so each increment can be implemented and verified cleanly.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (`[US1]`, `[US2]`, `[US3]`; omitted on Setup, Foundational, and Polish phases)
- Every task includes exact repository file paths

## Path Conventions

- **Single project**: `corpus/`, `scripts/`, `src/`, `tests/`, `dist/` at repository root
- **Generated file boundary**: `src/data/texts.ts` is emitted exclusively by `node scripts/gen-corpus.mjs` from `corpus/legge-1882.json` — never hand-edit `src/data/texts.ts`
- **Shell & verifier boundary**: All UI styling lives in the single inline `<style>` block of `src/shell/index.html`; never add HTML `<!-- -->` comments, banned elements (`<svg>`, `<img>`, `<form>`, etc.), `innerHTML`, CSS `url()`, or tokens flagged by `scripts/verify-dist.mjs` (including words like `beacon`, `navigator`, or `bearer ` in prose)

---

## Phase 1: Setup (Baseline & Quotation Immutability Guard)

**Purpose**: Confirm the existing offline build and test suite are green and lock in an automated byte-for-byte guard over the existing 64 `judgement` and `image` quotations before touching `corpus/legge-1882.json`.

- [X] T001 Verify clean pre-feature baseline (`npm run typecheck`, `npm test`, `npm run build`, `npm run verify`) against `package.json` and `dist/index.html`
- [X] T002 Add pre-feature quotation immutability test asserting all 64 `judgement` and `image` strings in `corpus/legge-1882.json` and `src/data/texts.ts` match the original `scripts/corpus-chunk-1.mjs`, `scripts/corpus-chunk-2.mjs`, and `scripts/corpus-chunk-3.mjs` records byte-for-byte (`FR-002`, `SC-001`) in `tests/corpus.test.ts`

---

## Phase 2: Foundational (Corpus Archive, Generator & Core Hexagram Model)

**Purpose**: Populate all 64 whole-hexagram summaries in the canonical archive, update the deterministic generator, regenerate runtime data, and expose `summary` on the core `Hexagram` type.

**⚠️ CRITICAL**: No user story UI or editorial audit work can complete until this foundational data pipeline is in place.

- [X] T003 [P] Add failing structural `summary` assertions requiring all 64 entries in `src/data/texts.ts` (`CORPUS[1..64]`) and `corpus/legge-1882.json` to carry a non-empty trimmed `summary` of 1–2 `\n\n`-separated paragraphs and 60–180 words inclusive (`FR-001`, `FR-005`, `SC-001`) in `tests/corpus.test.ts`
- [X] T004 [P] Update `scripts/gen-corpus.mjs` to validate non-empty `summary` (1–2 paragraphs separated by `\n\n`, 60–180 words) on all 64 entries in `corpus/legge-1882.json` and emit `readonly summary: string` on `HexagramTexts` and each `CORPUS` record in `src/data/texts.ts`
- [X] T005 Author whole-hexagram Legge summaries (1–2 paragraphs, 60–180 words targeting 80–140 words) for Hexagrams 1–15 (Book I, part 1) exclusively from `corpus/the_yi_king_clean.md` (*Thwan*, *Great Symbolism*, Legge's notes, and whole-hexagram appendices), using canonical names from `src/data/hexagram-names.ts` and `src/data/trigrams.ts` while leaving `judgement` and `image` untouched (`FR-001`–`FR-007`), in `corpus/legge-1882.json`
- [X] T006 Author whole-hexagram Legge summaries (1–2 paragraphs, 60–180 words targeting 80–140 words) for Hexagrams 16–30 (Book I, part 2) exclusively from `corpus/the_yi_king_clean.md` under the same source, canonical-naming, length, neutrality, and untouched-quotation rules (`FR-001`–`FR-007`), in `corpus/legge-1882.json`
- [X] T007 Author whole-hexagram Legge summaries (1–2 paragraphs, 60–180 words targeting 80–140 words) for Hexagrams 31–47 (Book II, part 1) exclusively from `corpus/the_yi_king_clean.md` under the same source, canonical-naming, length, neutrality, and untouched-quotation rules (`FR-001`–`FR-007`), in `corpus/legge-1882.json`
- [X] T008 Author whole-hexagram Legge summaries (1–2 paragraphs, 60–180 words targeting 80–140 words) for Hexagrams 48–64 (Book II, part 2) exclusively from `corpus/the_yi_king_clean.md` under the same source, canonical-naming, length, neutrality, and untouched-quotation rules (`FR-001`–`FR-007`), in `corpus/legge-1882.json`
- [X] T009 Run `node scripts/gen-corpus.mjs` to regenerate `src/data/texts.ts` from `corpus/legge-1882.json` and confirm repeated runs produce byte-identical output (`R1`, `SC-005`)
- [X] T010 Extend `Hexagram` interface and `byPattern` lookup in `src/core/hexagram.ts` to expose `readonly summary: string` from `CORPUS[kw]`, add summary propagation assertions for `hexagramByPattern` and `relatedHexagram` in `tests/hexagram-map.test.ts`, and verify `npm test` and `npm run typecheck` pass

**Checkpoint**: Foundation ready — all 64 King Wen records expose validated `summary` prose through `CORPUS` and `Hexagram`, with `judgement` and `image` proven unchanged.

---

## Phase 3: User Story 1 — Read deeper context for a cast hexagram on demand (Priority: P1) 🎯 MVP

**Goal**: Add a collapsed-by-default "Read more" control to the primary hexagram card on the Result screen that expands/collapses that hexagram's modern-English Legge summary in place as inert literal text, preserves keyboard focus and ARIA state, writes nothing to persistent storage, and resets completely on "Cast again".

**Independent Test**: Open the offline consultation, complete any cast, verify the summary is hidden on initial arrival, expand "Read more" on the primary hexagram by mouse and keyboard, confirm a non-empty 1–2 paragraph summary for that exact King Wen hexagram appears with framing label and updated `aria-expanded`, collapse and re-expand with focus retained on the button, and choose "Cast again" to confirm both summary text and expanded state clear completely.

### Tests for User Story 1

> **NOTE: Write these tests FIRST and confirm they FAIL before implementing `src/ui/summary-disclosure.ts`**

- [ ] T011 [P] [US1] Write failing unit tests covering 1- and 2-paragraph `\n\n` splitting, collapsed-by-default presentation, toggle label and `aria-expanded` transitions, literal `textContent` handling of HTML/script characters, rapid repeated toggling without paragraph duplication or focus loss, and complete clearing on reset (`FR-009`, `FR-011`, `FR-014`, `FR-015`) in `tests/summary-disclosure.test.ts`

### Implementation for User Story 1

- [X] T012 [P] [US1] Add neutral summary toggle copy in `src/data/app-strings.ts` and an attributed overview heading in `src/shell/index.html` (`FR-006`, `FR-011`–`FR-013`)
- [X] T013 [P] [US1] Add static primary summary disclosure controls and paragraph nodes with responsive, reduced-motion-safe styles inside the inline `<style>` block in `src/shell/index.html`
- [X] T014 [US1] Create `src/ui/summary-disclosure.ts` with transient presentation, toggle and clearing helpers using literal text and `hidden`, updating the button label and accessibility state without moving focus or accessing storage
- [X] T015 [US1] Query and expose the static primary summary elements as `primarySummary` on `Shell` in `src/ui/shell-bind.ts`
- [X] T016 [US1] Wire primary summary presentation in `presentResult()` (collapsed on arrival), add `togglePrimarySummary()` on `Steps`, clear/collapse primary summary nodes in `castAgain()` in `src/ui/steps.ts`, and attach the `#primary-summary-toggle` click listener in `src/ui/main.ts`, confirming focused disclosure tests pass (depends on `T014`, `T015`)

**Checkpoint**: User Story 1 (MVP) is complete and independently testable for any primary hexagram cast.

---

## Phase 4: User Story 2 — Explore the related hexagram's summary independently (Priority: P2)

**Goal**: Provide a separate, collapsed-by-default "Read more" disclosure on the related hexagram card whenever changing lines exist (`mask !== 0`), operating completely independently of the primary card, unambiguously labeled for screen readers, absent on stable casts (`mask === 0`), and cleared on "Cast again".

**Independent Test**: Complete a changing-line cast; verify both primary and related cards start collapsed; expand only the related summary (primary stays collapsed), expand both simultaneously (each displays its own hexagram's summary), collapse either without affecting the other; then complete a stable cast and verify `#related-card` and any second summary control remain hidden and cleared.

### Tests for User Story 2

- [ ] T017 [P] [US2] Extend `tests/summary-disclosure.test.ts` with failing tests for independent primary/related state transitions, all-six-lines-changing casts (e.g., Hexagram 1 ↔ Hexagram 2), unambiguous hexagram-specific `aria-label` values when both controls are present (`FR-013`), stable-cast (`mask === 0`) clearing after a prior expanded changing-line cast, and dual reset on "Cast again" (`FR-010`, `FR-015`)

### Implementation for User Story 2

- [X] T018 [P] [US2] Add static related summary disclosure controls and paragraphs inside `#related-card` in `src/shell/index.html`
- [X] T019 [US2] Query and expose the static related summary elements as `relatedSummary` on `Shell` in `src/ui/shell-bind.ts`
- [X] T020 [US2] Wire independent related summary presentation when `related !== null && mask !== 0`, explicit related summary clearing/collapse in both the `mask === 0` stable-cast branch and `castAgain()`, add `toggleRelatedSummary()` in `src/ui/steps.ts`, and bind `#related-summary-toggle` in `src/ui/main.ts`, confirming focused disclosure tests pass (depends on `T017`, `T019`)

**Checkpoint**: User Stories 1 and 2 both work independently across stable, partial-changing, and all-lines-changing casts.

---

## Phase 5: User Story 3 — Contemplative, clearly attributed synthesis faithful to Legge (Priority: P2)

**Goal**: Visually and textually frame expanded summaries as editorial overviews of Legge's 1882 commentary distinct from verbatim `blockquote` quotations, honestly document `summary` provenance, and verify 100% editorial compliance across all 64 summaries and UI strings.

**Independent Test**: Run automated editorial/provenance/contrast suites and audit the 64 summaries and Result card presentation against `corpus/the_yi_king_clean.md`: confirm non-blockquote overview framing, updated provenance documentation, 0 copyrighted-translation signature matches, 0 OCR transliteration garbles, 0 line-by-line (lines 1–6) breakdowns, and 0 predictive or medical/legal/financial advice claims.

### Tests for User Story 3

- [ ] T021 [P] [US3] Add automated editorial compliance tests in `tests/corpus.test.ts` scanning all 64 `summary` strings and summary UI copy in `src/data/app-strings.ts` for: Wilhelm/Baynes signature phrases, individual line-by-line breakdowns (`line 1`–`line 6`, `nine in the`, `six in the`, `topmost`), predictive or medical/legal/financial advice language, raw OCR transliteration garbles against canonical names in `src/data/hexagram-names.ts` and `src/data/trigrams.ts`, and `scripts/verify-dist.mjs` banned tokens (`SC-001`, `SC-002`)

### Implementation for User Story 3

- [X] T022 [P] [US3] Update top-level metadata (`attribution`, `scope`, `assembled`, `assembly_method`) in `corpus/legge-1882.json` and update `corpus/PROVENANCE.md` to record the `summary` field, its exclusive derivation from `corpus/the_yi_king_clean.md`, the distinction between transcribed quotations (`judgement`, `image`) and editorial synthesis (`summary`), and the historical seed role of `scripts/assemble-corpus.mjs` (`FR-008`), then run `node scripts/gen-corpus.mjs` to refresh `src/data/texts.ts`
- [ ] T023 [P] [US3] Refine `.hexagram-summary`, `.summary-heading`, and disclosure button styling in `src/shell/index.html` so editorial overviews are visually distinct from `blockquote` quotations in both light and dark palettes, and add WCAG 2.1 AA contrast assertions (`>= 4.5:1` text, `>= 3:1` focus/affordance) for summary elements in `tests/contrast.test.ts` (`FR-012`, `FR-017`, `SC-004`)
- [X] T024 [US3] Conduct a full 64-hexagram editorial audit comparing `corpus/legge-1882.json` against `corpus/the_yi_king_clean.md`, refining summary prose and regenerating `src/data/texts.ts` via `node scripts/gen-corpus.mjs` until all `tests/corpus.test.ts` and `tests/contrast.test.ts` checks pass (`FR-003`–`FR-007`, `SC-001`, `SC-002`)

**Checkpoint**: All three user stories are complete, editorially audited, attributed, and compliant with WCAG 2.1 AA.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final privacy-surface audit, deterministic single-file artifact verification, and end-to-end offline manual validation.

- [X] T025 [P] Add `src/ui/summary-disclosure.ts` and `src/ui/steps.ts` to the explicit non-persistence audit list in `tests/storage-surface.test.ts` to guarantee summary disclosures never import `src/ui/method-pref.ts` or access browser storage (`FR-016`, `SC-005`)
- [X] T026 Run full automated gate (`npm run typecheck`, `npm test`, `npm run build`, `npm run verify`, `npm run verify:deploy`) to confirm `dist/index.html` builds deterministically within the 400 KB budget in `scripts/build.mjs` with zero CSP, offline, or security violations (`SC-005`)
- [ ] T027 Execute all seven manual offline validation scenarios on `dist/index.html` opened via `file://` (mouse/keyboard/screen-reader walkthrough, independent changing-line disclosures, stable-cast absence, "Cast again" reset, 200% zoom and mobile wrapping, light/dark schemes, `prefers-reduced-motion`, and zero network/storage activity) per `specs/002-hexagram-summary/quickstart.md` (`SC-003`–`SC-005`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — starts immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 (`T001`–`T002`) — **BLOCKS** all user stories until all 64 records in `corpus/legge-1882.json` and `src/data/texts.ts` carry validated `summary` fields and `Hexagram` exposes `summary`.
- **User Story 1 (Phase 3 — P1 MVP)**: Depends on Foundational (Phase 2) completion.
- **User Story 2 (Phase 4 — P2)**: Depends on User Story 1 (`T012`–`T016`), reusing `src/ui/summary-disclosure.ts` and `src/data/app-strings.ts` to wire independent related-card state on `#related-card`.
- **User Story 3 (Phase 5 — P2)**: Editorial test and provenance tasks (`T021`, `T022`) can start as soon as Phase 2 + `T012` complete; visual framing refinement (`T023`) follows the Result-card markup updates in `T013`/`T018`; final reconciliation (`T024`) completes after `T021`–`T023`.
- **Polish (Phase 6)**: Depends on Phases 3–5 being complete.

### User Story Dependency Graph

```text
Phase 1 (Setup: T001–T002)
  └──► Phase 2 (Foundational Corpus & Hexagram Model: T003–T010)
         ├──► Phase 3: US1 Primary Summary Disclosure [P1 🎯 MVP] (T011–T016)
         │      └──► Phase 4: US2 Independent Related Summary Disclosure [P2] (T017–T020)
         │             └──► Phase 5: US3 Editorial Framing, Provenance & 64-Record Audit [P2] (T021–T024)
         │                    └──► Phase 6: Polish & Offline Dist Verification (T025–T027)
         └──► (T021, T022 in US3 can run in parallel with US2 once T012 is done)
```

### Within Each Phase / User Story

- Failing tests (`T003`, `T011`, `T017`, `T021`) are written before or alongside disjoint setup files and verified to fail before the corresponding implementation closes them.
- `corpus/legge-1882.json` batch authoring (`T005` → `T006` → `T007` → `T008`) runs sequentially because all four batches edit the same JSON archive; `node scripts/gen-corpus.mjs` (`T009`) always regenerates `src/data/texts.ts`.
- Static HTML markup (`src/shell/index.html`) precedes `src/ui/shell-bind.ts`, which precedes `src/ui/steps.ts` + `src/ui/main.ts`.

---

## Parallel Opportunities

- **Phase 2**: `T003` (`tests/corpus.test.ts`) and `T004` (`scripts/gen-corpus.mjs`) can run in parallel before corpus authoring batches `T005`–`T008`.
- **Phase 3 (US1)**: `T011` (`tests/summary-disclosure.test.ts`), `T012` (`src/data/app-strings.ts`), and `T013` (`src/shell/index.html`) touch completely separate files and can run in parallel; `T014` (`src/ui/summary-disclosure.ts`) and `T015` (`src/ui/shell-bind.ts`) can also run in parallel once `T011`–`T013` finish.
- **Phase 4 (US2)**: `T017` (`tests/summary-disclosure.test.ts`) and `T018` (`src/shell/index.html`) can run in parallel before `T019`–`T020`.
- **Phase 5 (US3)**: `T021` (`tests/corpus.test.ts`), `T022` (`corpus/legge-1882.json` + `corpus/PROVENANCE.md` + `src/data/texts.ts`), and `T023` (`src/shell/index.html` + `tests/contrast.test.ts`) operate on disjoint files and can run in parallel prior to `T024`.

### Parallel Example: User Story 1

```bash
# Launch disjoint test, copy, and static shell tasks for User Story 1 together:
Task T011: "Write failing unit tests for primary summary disclosure in tests/summary-disclosure.test.ts"
Task T012: "Add centralized summary UI copy in src/data/app-strings.ts"
Task T013: "Add static primary summary disclosure markup and styles in src/shell/index.html"

# Then launch controller and shell-binding tasks in parallel:
Task T014: "Create transient disclosure controller in src/ui/summary-disclosure.ts"
Task T015: "Bind static primary summary elements in src/ui/shell-bind.ts"
```

### Parallel Example: User Story 2

```bash
# Launch related-card tests and static shell markup together:
Task T017: "Extend tests/summary-disclosure.test.ts with independent related-card and stable-cast tests"
Task T018: "Add static related summary disclosure controls inside #related-card in src/shell/index.html"
```

### Parallel Example: User Story 3

```bash
# Launch editorial compliance suite, provenance documentation, and visual contrast updates together:
Task T021: "Add automated editorial compliance tests in tests/corpus.test.ts"
Task T022: "Update provenance metadata in corpus/legge-1882.json and corpus/PROVENANCE.md"
Task T023: "Refine summary framing styles in src/shell/index.html and contrast checks in tests/contrast.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete **Phase 1: Setup** (`T001`–`T002`) to lock in quotation immutability.
2. Complete **Phase 2: Foundational** (`T003`–`T010`) so all 64 hexagrams have validated Legge summaries in `corpus/legge-1882.json`, `src/data/texts.ts`, and `src/core/hexagram.ts`.
3. Complete **Phase 3: User Story 1** (`T011`–`T016`) to expose the primary hexagram "Read more" disclosure on the Result screen.
4. **STOP and VALIDATE**: Run `npm run typecheck && npm test && npm run build` and test User Story 1 offline in `dist/index.html`.

### Incremental Delivery

1. **Setup + Foundational** → Complete 64-hexagram summary archive and generated runtime data with unchanged classical quotations.
2. **Add User Story 1 (P1)** → On-demand primary hexagram summary disclosure with full keyboard/ARIA support and "Cast again" reset (MVP).
3. **Add User Story 2 (P2)** → Independent related hexagram summary disclosure on changing-line casts and clean suppression on stable casts.
4. **Add User Story 3 (P2)** → Audited overview framing, honest provenance documentation, and 64-summary compliance verification.
5. **Polish** → Storage-surface verification, deterministic single-file security check, and full offline manual walkthrough.

---

## Notes

- `[P]` tasks modify separate files and have no incomplete prerequisites.
- Never hand-edit `src/data/texts.ts`; always modify `corpus/legge-1882.json` and run `node scripts/gen-corpus.mjs`.
- Keep all DOM rendering strictly on `textContent` and static nodes (`hidden` attribute toggling) — never `innerHTML` or dynamic markup parsing.
- Avoid HTML `<!-- -->` comments in `src/shell/index.html` and words matched by `scripts/verify-dist.mjs` (`beacon`, `navigator`, `bearer `, etc.) so single-file verification stays green.
