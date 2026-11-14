# Implementation Plan: Hexagram “Read More” Summaries

**Branch**: `002-hexagram-summary` | **Date**: 2026-11-14 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-hexagram-summary/spec.md`

## Summary

Add a complete, editorially authored `summary` field to each of the 64 King Wen records, then expose each displayed hexagram's summary through a separately controlled, collapsed-by-default disclosure on the Result screen. Preserve the existing `judgement` and `image` strings exactly. The summaries will be sourced only from the project's cleansed Legge 1882 text and rendered as inert text in the existing offline, self-contained application. This plan defines data, UI, and validation work; it does not author any of the 64 summaries.

## Technical Context

**Language/Version**: TypeScript 7.0.2, strict mode; Node.js `>=26` for development/build tooling  
**Primary Dependencies**: No runtime dependencies; pinned development dependencies are TypeScript 7.0.2 and esbuild 0.28.2  
**Storage**: `corpus/legge-1882.json` is the canonical archive; generated runtime data lives in `src/data/texts.ts`. Disclosure state is in-memory only; no new browser storage.  
**Testing**: `node:test` via `npm test`; `npm run typecheck`; `npm run build` and `npm run verify` for the offline artifact and security checks  
**Target Platform**: Modern browser opening the single distributable HTML file via `file://`, offline  
**Project Type**: Single-project, static TypeScript browser application  
**Performance Goals**: Disclosures respond synchronously in place; no additional network or asynchronous data access. No quantified latency requirement is stated.  
**Constraints**: Public-domain Legge source only; 64 complete summaries (1–2 paragraphs, 60–180 words each); preserve quote fields; literal text rendering; no runtime dependency, network request, or persistence; deterministic single-file build; keyboard and screen-reader access; WCAG 2.1 AA, light/dark palette, 200% zoom, and reduced-motion support  
**Scale/Scope**: One added summary per canonical hexagram, two independently expandable result cards at most, one offline HTML artifact

## Constitution Check

*Gate: evaluated before Phase 0 research; re-evaluated after Phase 1 design.*

| Principle | Gate | Plan alignment |
|---|---|---|
| I. Fidelity to the Idea | PASS | Summaries are whole-hexagram reflective syntheses from Legge; avoid prediction, advice, line-by-line readings, and copyrighted translation wording. |
| II. Single-File, Self-Contained Distribution | PASS | The existing build embeds corpus data and UI in the single HTML output; no remote assets or requests are introduced. |
| III. Security by Construction | PASS | Summary content is literal text in static DOM nodes; no active markup, dynamic code, or runtime dependency. |
| IV. Offline-First Privacy | PASS | Disclosure state is transient and never stored; existing method-preference storage remains unchanged. |
| V. Simplicity & Accessibility | PASS | Reuse the current Result screen and native buttons, expose `aria-expanded`/control relationships, retain visible focus, and verify both color schemes, zoom, keyboard, and reduced motion. |

No constitution violations or exceptions are proposed.

## Phase 0: Outline & Research

Repository conventions and feature requirements resolve the technical choices; no unresolved technical clarification remains. Research decisions and alternatives are recorded in [research.md](research.md).

## Phase 1: Design & Contracts

- [Data model](data-model.md): archive record, editorial summary, and transient disclosure state.
- [UI contract](contracts/summary-ui-contract.md): user-facing disclosure behavior, accessibility, reset, and privacy guarantees.
- [Quickstart](quickstart.md): implementation-time validation scenarios and project commands.

The UI is the application's user-facing interface, so a behavioral contract is included. There is no network API or separately deployed service.

## Project Structure

### Planning artifacts

```text
specs/002-hexagram-summary/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    └── summary-ui-contract.md
```

### Relevant implementation areas

```text
corpus/
├── legge-1882.json          # canonical 64-record archive
├── PROVENANCE.md            # source and field provenance
└── the_yi_king_clean.md     # permitted editorial source
scripts/
└── gen-corpus.mjs           # deterministic archive-to-TypeScript generator
src/
├── data/
│   ├── texts.ts             # generated runtime corpus (do not hand-edit)
│   ├── hexagram-names.ts    # canonical app names
│   └── trigrams.ts          # canonical trigram data
├── shell/index.html         # static UI, CSS, CSP, and result-card nodes
└── ui/
    ├── shell-bind.ts         # static shell bindings
    └── steps.ts              # Result presentation and Cast again reset
tests/
├── corpus.test.ts
├── contrast.test.ts
└── ...                       # existing pure logic, UI-adjacent, and security tests
```

**Structure Decision**: Keep the existing single-project layout. Extend the canonical archive and its generator, add disclosure elements to the static shell and bind them through the current UI composition, and extend corpus/behavior/security validation. The generated `src/data/texts.ts` remains generator-owned.

## Design Re-check

All five constitutional principles still pass after Phase 1. The schema and UI contract add no new runtime architecture, data store, network integration, dependency, or exception. Content authorship and implementation are downstream work; no summary prose is created by this planning workflow.
