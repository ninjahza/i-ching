# Quickstart: User Cast Validation

These are checks to run **after implementation**, not evidence that the
planned feature is already present.

## Prerequisites

- Node.js >= 26 and dependencies from the existing lockfile.
- Work from the repository root. Install dependencies only if they are missing.
- A modern browser able to open `dist/index.html` directly from disk, plus a
  screen reader for the accessibility walkthrough.

## Automated validation

Run the relevant focused tests while implementing, then:

```sh
npm run typecheck
npm test
npm run build
npm run verify
```

Expected: all checks pass; 4,096 six-value sequences agree with an independent
bottom-up bit/mask oracle and the canonical lookup; invalid/duplicate adds,
undo, reset, secure-source availability and existing preference behavior are
covered. The artifact remains deterministic, self-contained and offline.
The existing casting tests continue to validate the two probability profiles.

## Offline walkthrough

1. Open `dist/index.html` directly. Select User cast, enter an optional
   question, and start. Confirm line 1 is the bottom line, no value is
   selected, Add and Undo are disabled, and Reveal all is absent. Verify
   four distinct numbered choices and no line-value text or numeric field.
2. Tap or click the numbered 6 choice and confirm; verify one broken changing
   bottom line and progress.
   Select 7 and confirm; undo it, verify the second line disappears, then
   select 8 and confirm. Confirm that selection clears after every operation.
   Complete with distinct values and verify the final result uses exactly the
   values selected, including changing positions and question echo.
3. Cast again and select six 7s: expect stable hexagram 1, no related card.
   Repeat with six 9s: expect hexagram 1 becoming hexagram 2. Repeat with
   six 6s: expect hexagram 2 becoming hexagram 1. Check that the old result,
   question, figure, selections and open summaries do not survive Cast again.
4. Start another cast and select `7, 8, 8` bottom to top. Undo back to zero
   and verify no further removal or result is possible. Then select
   `7, 8, 8, 8, 8, 8` bottom to top and complete the cast; verify the primary
   pattern has its only solid line at the bottom, not the top.
5. Repeat with keyboard only and a screen reader: identify each value and
   its meaning, hear progress, confirmations, undo and the final result,
   including line 6, and verify focus stays visible and reaches the result.
   At a narrow mobile width and 200% zoom, verify no horizontal overflow and
   measure each numbered target's clickable bounds as at least 44 by 44 CSS
   pixels. On a touch device or touch-enabled browser, tap each choice and
   confirm no numeric keyboard opens. Check both color schemes and reduced motion.
6. In a controlled test, manipulate a choice value or call the submission path
   with an invalid value; verify an accessible error and no change to the cast.
   This is a validation check, not a claim that the controls prevent tampering.

## Randomness and privacy walkthrough

1. In a controlled browser test environment, expose no secure random source
   before the app boots. Verify both automatic methods are declined with an
   explanation, switch to User cast and complete it, then switch back after
   Cast again and verify the automatic method is still declined. A test spy
   must verify zero random calls on the manual path.
2. Without consent, perform a manual cast and verify no preference, question
   or values are persisted. With consent, select User cast, reopen, and verify
   only the method is restored. Uncheck consent and verify the key is removed;
   the session selection remains. Repeat restoration with existing `coins`
   and `yarrow` values and with storage unavailable.
3. Inspect network activity while using the offline artifact: no runtime
   requests occur. Confirm no new storage key or cast history exists.

See [data-model.md](data-model.md), [UI contract](contracts/user-cast-ui.md),
and [spec.md](spec.md) for precise invariants and acceptance scenarios.
