# Implementation Plan: User Cast

**Feature Branch**: `004-user-cast` | **Date**: 2026-11-15 | **Spec**: [spec.md](spec.md)

## Summary

Add a third, manual casting choice. The user taps or clicks one of four
numbered choices and confirms one final line value at a time, bottom-up,
without typing a line value. They can undo the most recent line until the
sixth is confirmed. Reuse the existing consultation's canonical pattern,
changing-line, and result derivation, but make manual entry independent of
randomness and of the automatic reveal timer. Preserve the existing visual
identity, two automatic distributions, question and result flow, and
consent-gated method-only preference.

This is a plan, not an implementation. The spec assumes the physical cast
produces a final value 6–9, without identifying coins versus yarrow in the app.

## Technical Context

- **Language/Version**: TypeScript 7.0.2, strict mode; Node.js >= 26
- **Primary Dependencies**: No runtime dependencies; existing pinned TypeScript and esbuild development dependencies
- **Storage**: Existing opt-in `iching.method` key only; questions, pending choices, lines, and results remain transient
- **Testing**: `node:test`, `npm run typecheck`, `npm test`, `npm run build`, `npm run verify`, and browser/assistive-technology walkthroughs
- **Target Platform**: Modern browser, including `file://`, offline
- **Project Type**: Single-page, single-file static browser app
- **Performance Goals**: Synchronous manual entry and result rendering; no new network access or timer
- **Constraints**: Exactly six valid entries; canonical bottom-up order and transformations; no manual RNG; deterministic single-file build; CSP and security verification unchanged; WCAG 2.1 AA, keyboard access, screen-reader announcements, 200% zoom, reduced motion
- **Scale/Scope**: One additional method choice and casting state, four value choices, six lines, no new corpus or persistence surface

## Constitution Check

| Principle | Gate | Plan alignment |
|---|---|---|
| I. Fidelity to the Idea | PASS | Existing canonical line, King Wen, and transformation logic handles supplied values unchanged; copy remains reflective. |
| II. Single-File Distribution | PASS | Extend the existing shell and bundle; no network, external assets, or runtime dependency. |
| III. Security by Construction | PASS | Static controls and inert text; retain CSP, DOM and storage restrictions, and existing verifier. |
| IV. Offline-First Privacy | PASS | No cast data persisted; the consented existing preference key may store the manual method. Randomness is required only for automatic draws, never substituted with a weaker source. |
| V. Simplicity & Accessibility | PASS | Reuse the three-step flow and native controls; verify focus, announcements, contrast, zoom and keyboard operation. |

No exception is proposed. Recheck all gates after implementation.

## Phase 0: Decisions

[Research decisions](research.md) document the chosen shared aggregate,
manual input, method-aware availability, storage compatibility, and UI
verification approach. They are grounded in the existing code; no external
service or new package is needed.

## Phase 1: Design

- [Data model](data-model.md): manual and automatic modes, validated lines,
  transient pending selection, and transitions.
- [UI contract](contracts/user-cast-ui.md): controls, accessibility, reset,
  availability, and privacy.
- [Quickstart](quickstart.md): executable post-implementation checks and
  manual walkthroughs, including unavailable randomness and storage.

There is no network API or separately deployed service.

## Implementation Sequence

1. **Shared consultation model** — Extend `src/core/consultation.ts` with a
   typed manual mode alongside the existing automatic mode. Share validated
   append, six-line completion guard, line ordering, and existing derived
   fields. Provide explicit manual add and undo operations, keep the current
   automatic draw behavior, and ensure the manual construction path requires
   no random source. Use `assertLineValue` at the runtime boundary, reject
   wrong-mode/invalid/after-completion calls explicitly, and retain existing
   `castAgain` semantics. See [data-model.md](data-model.md).
2. **Method selection and availability** — Represent the selectable method
   separately from `CastingMethod`'s automatic probability profiles. Extend
   `src/ui/method-pref.ts` to recognize a short manual identifier under the
   same key. In `src/ui/main.ts`, handle all three radio choices and restore,
   write, and forget them through existing consent paths. Compute start
   availability from the selected method and injected boot capability;
   remove the unconditional global-crypto check in `steps.ts`. Recalculate
   on initial restore, selection changes, and return to question.
3. **Manual casting interaction** — Add static, semantic radio controls styled
   as four distinct numbered tap targets, each at least 44 by 44 CSS pixels,
   and Add/Undo actions to `src/shell/index.html`. Do not add a text or number
   field for line values. Bind the controls in
   `src/ui/shell-bind.ts`, and route events through `src/ui/main.ts` and
   `src/ui/steps.ts`. The controller owns pending selection; the aggregate owns
   confirmed lines. Start manual mode with empty figure slots and no timer;
   validate values at both UI and core boundaries even if the DOM is
   manipulated, and clear selection after each successful add or undo. Hide
   and guard Reveal all in manual mode. On undo, clear the corresponding
   figure slot and refresh progress. On the sixth confirmation, use the
   existing result renderer immediately.
4. **Accessibility, copy, and reset** — Use the existing visual language and
   central reviewed strings in `src/data/app-strings.ts`; document the
   physical-method instructions and each value's meaning. Ensure progress,
   selection, successful add, undo, invalid submissions and result are
   available to assistive technology; prevent the sixth-line announcement
   from being overwritten by the result announcement. After Add or Undo, move
   focus to the first numbered choice for the next line; move it to the result
   heading on completion.
   Clear the manual controls, figure, question, results and summary state on
   Cast again; retain the session method.
5. **Verification and documentation** — Add focused core and controller/
   preference tests, including the exhaustive 4,096-sequence check and
   no-random behavior. Exercise the built UI offline with keyboard, screen
   reader, mobile/zoom, themes and reduced motion. Update README casting and
   persistence descriptions only once the feature actually ships. Run the
   existing typecheck, tests, build and verifier; preserve automatic casting.

## Verification Strategy

- Exhaustively generate all `4^6` inputs and independently compute primary
  bits, changing mask, and transformed bits from the value table; compare to
  the completed manual consultation and canonical lookup. Include explicit
  all-6, all-9, stable, and asymmetric order-sensitive examples.
- Add focused tests for invalid input, no partial derivation, repeated
  selection/confirmation, undo to empty, sixth/seventh boundaries, reset,
  method freezing, and wrong-mode operations. Verify user mode consumes zero
  random calls and automatic modes retain exact byte partition tests.
- Test boot/restore with and without secure randomness, method switching in
  both directions, consent/write/delete, existing stored values, unavailable
  storage, hidden/guarded Reveal all, timers, focus and live announcements.
  Use the existing lightweight test style and browser checks; do not add a
  runtime dependency merely to test the UI.
- Build and verify the actual artifact, then inspect it in a browser using
  [quickstart.md](quickstart.md). Static checks are not a substitute for
  keyboard and screen-reader walkthroughs, measured 44-by-44 CSS-pixel tap
  targets, touch interaction without a numeric keyboard, or overflow checks.

## Project Structure

```text
specs/004-user-cast/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/user-cast-ui.md
src/
├── core/{casting,consultation,line-values,pattern,hexagram}.ts
├── data/app-strings.ts
├── shell/index.html
└── ui/{main,method-pref,steps,shell-bind,line-view,announce}.ts
tests/
├── consultation.test.ts
├── casting.test.ts
├── storage-surface.test.ts
└── contrast.test.ts
```

**Structure Decision**: Keep the current single-project architecture; extend
existing files and add a focused UI test only if needed. No new service,
runtime package, or storage key is introduced. Spec Kit targets
`specs/004-user-cast` on the `004-user-cast` feature branch; implementation
work is tracked in [tasks.md](tasks.md).

## Post-Design Constitution Check

All five gates remain satisfied. Manual input does not weaken the automatic
randomness requirement, expand persistence, or change result interpretation.
