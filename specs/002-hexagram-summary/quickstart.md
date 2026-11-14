# Quickstart: Hexagram “Read More” Summaries

This guide is for implementation-time validation. It does not create or include summary prose. The feature remains an offline, single-file TypeScript application.

## Prerequisites

- Node.js `>=26`
- npm dependencies installed from the lockfile (`npm ci`)
- Repository root as the working directory

## Automated validation

After implementation and editorial review:

```sh
npm run typecheck
npm test
npm run build
npm run verify
```

Expected outcomes:

- TypeScript completes without diagnostics.
- All unit/integrity tests pass, including 64-record coverage, 60–180-word and 1–2-paragraph bounds, unchanged `judgement`/`image`, independent disclosure state, reset behavior, and no new storage access.
- Build produces only the existing self-contained `dist/index.html` deliverable, deterministically, within the repository's size budget.
- Distribution verification passes CSP, offline/no-network, banned-pattern, and security checks.

The repository's `npm run build` invokes the distribution verifier itself; `npm run verify` is also listed explicitly for a standalone validation pass.

## Manual offline scenarios

1. Open `dist/index.html` directly from disk (no server/network). Complete a cast and verify the primary card's summary is hidden initially.
2. Toggle the primary summary by mouse and keyboard. Confirm the label and expanded state change, the summary appears as readable text below the classical quotations, and focus remains on the control.
3. For a changing-line cast, verify the related card has a separate initially collapsed control. Expand either or both summaries and confirm that each shows text for its own hexagram and that toggles do not affect the other.
4. For a stable cast, verify that no related card or related summary control is present.
5. Expand one or both summaries, choose “Cast again,” and complete another cast. Verify the prior text is cleared and all new disclosures are collapsed.
6. Repeat keyboard and screen-reader checks at 200% zoom in light and dark color schemes. Confirm visible focus, AA contrast, no horizontal overflow, and reduced-motion behavior.
7. With browser network inspection enabled, verify that opening/closing summaries makes no requests and that no storage entry is created or changed.

## Design references

- Data and editorial constraints: [data-model.md](data-model.md)
- User-facing behavior: [contracts/summary-ui-contract.md](contracts/summary-ui-contract.md)
- Requirements and acceptance scenarios: [spec.md](spec.md)
