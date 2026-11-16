# Tasks: User Cast

**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md),
[data-model.md](data-model.md), [UI contract](contracts/user-cast-ui.md),
[quickstart.md](quickstart.md), and project constitution.

**Tests**: Required by the spec's success criteria and the implementation
plan. Use the existing `node:test` runner and no new runtime dependencies.
Write behavior tests before their corresponding implementation; for new
behavior, confirm they fail for the intended reason.

**Format**: `- [ ] Tnnn [P?] [USn?] action with repository-relative paths`.
`[P]` marks tasks that can run concurrently at the stated checkpoint without
overlapping files or depending on each other's unfinished work. Story labels
are omitted for setup, foundation, and cross-cutting tasks.

## Phase 1: Setup

**Purpose**: Establish a baseline without changing dependencies or generated
files unnecessarily.

- [X] T001 Verify Node.js >= 26 and installed dependencies from `package.json`, then run `npm run typecheck` and `npm test` as the pre-change baseline; record any existing failures before proceeding.

## Phase 2: Foundation

**Purpose**: Define a shared three-choice method identity and reviewed manual
copy before integrating the user journeys.

- [X] T002 [P] Add failing preference tests in `tests/method-pref.test.js` for accepting the manual method identifier alongside existing `coins` and `yarrow`, rejecting corrupt values, using only the existing `iching.method` key, and handling unavailable storage without adding another persistence path.
- [X] T003 Extend the selectable method identity and stored-value validation in `src/ui/method-pref.ts` to include a stable identifier such as `user`, without treating it as an automatic probability profile or changing the existing key or consent boundaries.
- [X] T004 [P] Add reviewed, neutral manual-casting instructions and accessible text builders in `src/data/app-strings.ts`: final values and their meanings, heads = 3/tails = 2, final yarrow value, bottom-up progress, add/undo/error messages, and method-specific no-random messaging.

**Checkpoint**: Preference identifiers and common copy are ready; existing
automatic casting remains unchanged. T004 can run in parallel with T002–T003
because it edits a different file.

## Phase 3: User Story 1 — Record six physical cast results (P1, MVP)

**Goal**: Choose User cast, tap or click and confirm six final values
bottom-up without typing, and obtain the canonical result without generating
lines.

**Independent test**: With secure randomness available, choose User cast, enter
an optional question, confirm six values, and verify one visible line per
confirmation, no automatic lines or early result, and the correct primary and
related or stable result. Repeat with all 6s, all 9s, all 7s, and an
order-sensitive sequence.

### Tests

- [X] T005 [P] [US1] Add initially failing tests in `tests/consultation.test.ts` for manual construction without a random source, valid bottom-up adds, invalid/missing/fractional values, premature derivation, wrong-mode calls, six-line limit, stable/all-changing examples, and all 4,096 sequences against independently calculated primary bits, changing mask, transformed bits, and canonical lookup.
- [X] T006 [P] [US1] Add initially failing controller/interaction tests in `tests/user-cast.test.js` for the four numbered selectable choices and absence of a line-value text/number field, method fixed during a cast, empty initial selection, explicit Add, selection consumption, repeated activation, rejection and feedback for tampered/invalid values, no timer or random calls, guarded/hidden Reveal all, six-line completion, and existing result rendering.

### Implementation

- [X] T007 [P] [US1] Extend `src/core/consultation.ts` with a type-safe manual mode and shared validated append path using `src/core/line-values.ts`; keep automatic draws, question normalization, canonical derivation and completion guards intact, reject invalid/wrong-mode/after-completion operations explicitly, and require no random source for manual construction.
- [X] T008 [P] [US1] Extend `src/shell/index.html` with the User cast method radio, a native four-value radio group styled as distinct clickable/tappable numbered labels at least 44 by 44 CSS pixels each, explicit Add control, progress and instruction/error nodes, and responsive styles in the existing inline style block; add no line-value text/number field and preserve the existing visual identity and automatic controls.
- [X] T009 [US1] Bind and type the new method, manual entry, progress and feedback nodes in `src/ui/shell-bind.ts`, with appropriate semantic labels and focus targets.
- [X] T010 [US1] Implement manual start, pending selection, exact-value UI validation including tampered control values, one-line confirmation, bottom-up figure/progress updates, cleared selection, guarded Reveal all, and immediate sixth-line result in `src/ui/steps.ts`; retain the automatic timer, pacing and existing result presentation.
- [X] T011 [US1] Wire the third method, manual consultation factory, native input changes and Add event in `src/ui/main.ts`; reuse consent-gated preference handling and never obtain or consume random bytes for a manual cast.
- [X] T012 [US1] Add accessible selection, line/progress and result announcements in `src/ui/announce.ts`, `src/ui/steps.ts`, and `src/data/app-strings.ts`; ensure the sixth-line confirmation and result are both conveyed without overwriting each other, and focus moves to the visible result heading.
- [X] T013 [US1] Run the focused manual consultation and interaction tests in `tests/consultation.test.ts` and `tests/user-cast.test.js`, plus existing automatic distribution tests in `tests/casting.test.ts`; resolve regressions before the checkpoint.

**Checkpoint**: The six-entry manual flow works in the normal environment;
the later stories add correction and no-random/private repeat behavior.

## Phase 4: User Story 2 — Correct an entry before completion (P2)

**Goal**: Change a pending selection or undo the most recent confirmed line
repeatedly before the sixth line is committed.

**Independent test**: Confirm three lines, undo the third, replace it, and
complete the cast; verify the replacement determines the result. Undo
repeatedly to zero in a separate cast and verify no line can be removed past
the beginning or after completion.

### Tests

- [X] T014 [P] [US2] Add initially failing manual undo tests in `tests/consultation.test.ts` for last-in-first-out removal, repeated undo to empty, positions after replacement, rejection after completion, and no effect on automatic casts.
- [X] T015 [P] [US2] Extend `tests/user-cast.test.js` with initially failing interaction tests for changing a pending value, disabling Undo at zero, clearing a pending choice on undo, updating the visible slot/progress, repeated undo, and announcements/focus.

### Implementation

- [X] T016 [P] [US2] Add a guarded manual-only undo operation to `src/core/consultation.ts`, preserving the six-line completion boundary and recalculating the next bottom-up position after removal.
- [X] T017 [P] [US2] Add a safe figure-slot clearing operation in `src/ui/line-view.ts` that removes the latest rendered line and hides its slot without rebuilding or reordering the remaining figure.
- [X] T018 [US2] Add and bind the Undo control in `src/shell/index.html` and `src/ui/shell-bind.ts`, including disabled state when no confirmed line exists.
- [X] T019 [US2] Wire Undo in `src/ui/steps.ts` and `src/ui/main.ts`: remove only the latest line, clear pending selection, restore the figure and progress, announce the action, and move focus to the first numbered choice for the next line.
- [X] T020 [US2] Run the correction-focused tests in `tests/consultation.test.ts` and `tests/user-cast.test.js`; verify the replacement value and existing US1 behavior remain correct.

**Checkpoint**: Correction works independently once the US1 entry flow exists.

## Phase 5: User Story 3 — Private repeat casting without random generation (P2)

**Goal**: Complete manual casting when secure randomness is unavailable, retain
the selected method across Cast again, and remember only the consented method.

**Independent test**: Boot without a secure random source, select User cast
and complete it with zero random calls; Cast again and verify all consultation
data clears while the method remains selected. Verify automatic methods are
still refused and the existing preference key restores/deletes only after
consent.

### Tests

- [X] T021 [P] [US3] Add preference integration tests in `tests/user-cast-preference.test.js` for consent/write/delete, legacy value restoration, remembered User cast with empty consultation after reload, and blocked storage; exercise the existing `src/ui/method-pref.ts` path without introducing another key.
- [X] T022 [P] [US3] Extend `tests/user-cast.test.js` with initially failing boot/restore and method-switch cases with and without secure randomness, zero manual random calls, automatic refusal, and Cast again clearing of question, entries, figure, results and summaries.

### Implementation

- [X] T023 [US3] Make start availability in `src/ui/main.ts` depend on the selected method and injected secure-random capability; recalculate on boot/restore and selection changes, accurately show or hide method-specific messaging, and preserve explicit consent for all preference writes/deletes.
- [X] T024 [US3] Update `src/ui/steps.ts` to use the injected method-aware availability rather than the unconditional global crypto check, guard automatic calls without a secure source, recompute availability on return to the question step, and permit manual casting without crypto.
- [X] T025 [US3] Extend Cast again reset in `src/ui/steps.ts` and any necessary focus handling in `src/ui/shell-bind.ts` to clear pending values, figure slots, consultation, question, results and summaries while retaining the current session method and focusing the visible question heading.
- [X] T026 [US3] Run preference, no-random, repeat-cast and privacy tests in `tests/method-pref.test.js`, `tests/user-cast-preference.test.js`, `tests/user-cast.test.js`, and `tests/storage-surface.test.ts`; ensure the only persisted item is the existing consented method key.

**Checkpoint**: All three stories are independently verifiable through their
documented scenarios, with US2 and US3 building on the US1 casting flow.

## Phase 6: Cross-Cutting Validation and Documentation

- [X] T027 [P] Update `README.md`, `PRODUCT.md`, and `specs/001-iching-consultation/contracts/consultation-flow.md` to describe the shipped User cast (three methods), tappable final-value choices 6–9, secure randomness required only for automatic methods, and consented method-only persistence; replace the README draft-only notice.
- [X] T028 [P] Review new copy in `src/data/app-strings.ts` and `src/shell/index.html` for a neutral reflective tone, accurate coin/yarrow guidance, clear value meanings and no predictive or advisory claims.
- [X] T029 Run `npm run typecheck`, `npm test`, `npm run build`, and `npm run verify` using `package.json`; confirm existing automatic distributions, static security and storage checks pass and repeat the build to verify byte-identical `dist/index.html`.
- [X] T030 Perform the actual offline browser walkthrough in `specs/004-user-cast/quickstart.md` against `dist/index.html`, including stable/changing/order-sensitive casts, correction, disabled crypto, both method transitions, consent/reload/opt-out and zero runtime network requests.
- [X] T031 Perform touch, keyboard and screen-reader walkthroughs of `dist/index.html`, including numbered selection without a numeric keyboard, sixth-line and result announcements, all focus transitions and errors; measure each numbered target at least 44 by 44 CSS pixels and verify narrow/mobile layouts, 200% zoom, light/dark AA contrast and reduced motion using `tests/contrast.test.ts` and `specs/004-user-cast/quickstart.md`. Record any environment-limited checks honestly.

**Checkpoint**: All stories, automatic regressions, offline/privacy guarantees,
documentation and accessibility checks are complete; no feature is claimed
shipped until the implementation and verification actually pass.

## Dependencies and Execution Order

```text
T001 → T002 → T003 ─┐
         T004 ───────┴→ US1 (T005–T013)
                         ├→ US2 (T014–T020) ─┐
                         └→ US3 (T021–T026) ─┴→ Cross-cutting (T027–T031)
```

- T004 can begin after T001 independently of the preference work. T002 must
  precede T003; both must be complete before US1 integration.
- T005 and T006 can be written in parallel; after both demonstrate missing
  behavior, T007 and T008 can proceed in parallel. T009 requires T008; T010
  requires T007 and T009; T011 requires T010; T012 follows integration.
- US2 and US3 both depend on US1. They touch `src/ui/steps.ts`,
  `src/ui/main.ts`, and `tests/user-cast.test.js`, so do **not** implement
  them concurrently in the same worktree without coordinating file ownership.
  Complete US2 before US3 for the default serial path.
- T014/T015 and T021/T022 are parallel test pairs after their prerequisites;
  T016/T017 are independent implementation tasks after the US2 tests.
- T027/T028 touch different files and can run in parallel after the stories.
  T029 must follow implementation; T030/T031 require the built artifact.

## Parallel Examples

- **US1**: After foundation, write T005 core tests and T006 UI tests together;
  after their failures are confirmed, implement T007 core and T008 shell in
  parallel, then integrate them sequentially.
- **US2**: After US1, write T014 core and T015 UI tests together; then T016
  aggregate undo and T017 figure clearing can proceed independently.
- **US3**: After US1, preference tests T021 and UI tests T022 can be written
  concurrently; serialize implementation with US2 because their UI files overlap.

## Implementation Strategy

1. Complete setup and foundation, then implement and validate US1 as the
   smallest demonstrable manual-cast increment.
2. Add US2 correction, then US3 method-aware availability and private repeat
   behavior, validating each independently without regressing US1.
3. Finish cross-cutting checks and update documentation. The full feature,
   including no-crypto support and undo, is not complete at the MVP checkpoint.
