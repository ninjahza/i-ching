# Research: Hexagram “Read More” Summaries

**Feature**: [spec.md](spec.md)  
**Date**: 2026-11-14

## Decisions

### R1. Extend the archived corpus and regenerate runtime data

- **Decision**: Add a `summary` string to each existing King Wen-ordered record in `corpus/legge-1882.json`; update the deterministic validation/emission path in `scripts/gen-corpus.mjs`; regenerate `src/data/texts.ts` rather than editing that generated module by hand. Preserve every existing `judgement` and `image` value byte-for-byte.
- **Rationale**: The repository identifies the JSON archive as the corpus source and the generator as the sole producer of the TypeScript runtime corpus. This preserves its auditable source hash and deterministic-build convention.
- **Alternatives considered**: A separate summary file or UI-local string table would split corpus ownership and complicate hexagram-number mapping. Hand-editing the generated TypeScript would be overwritten on regeneration and break the generator contract.

### R2. Keep editorial evidence within the specified Legge source

- **Decision**: Base the summaries only on `corpus/the_yi_king_clean.md` and the relevant whole-hexagram material specified in the feature: the Thwan/Judgement, Great Symbolism/Image, Legge's explanatory notes, and whole-hexagram appendix commentary. Do not consult or quote Wilhelm/Baynes or any other copyrighted translation. Do not copy OCR-corrupted transliterations.
- **Rationale**: This follows FR-003/004/007 and the corpus provenance's documented limits and exclusions. `src/data/hexagram-names.ts` and the trigram data provide the project's canonical names for app-facing references; they are labels, not alternative summary sources.
- **Alternatives considered**: Using external translations or web sources could import protected wording and violate the source boundary. Summarizing only the two currently archived quote fields would omit Legge commentary explicitly allowed by the specification.
- **Content boundary**: Planning records this method only; it does not draft, synthesize, or generate any summary text.

### R3. Model each disclosure as independent, ephemeral UI state

- **Decision**: Each displayed card owns its own collapsed/expanded state, initially collapsed at result presentation. The related card and its disclosure exist only when changing lines produce a related hexagram. Use native buttons with programmatic expanded state and a relationship to the controlled summary region. Reset state and clear summary DOM text on “Cast again.”
- **Rationale**: This directly meets FR-009–013, FR-015–016 and reuses the app's static shell, native controls, and transient consultation lifecycle. Rendering text nodes with `textContent` and static paragraph elements is consistent with the security constitution.
- **Alternatives considered**: A single global toggle cannot express independent primary/related state. Persisting disclosure preferences contradicts FR-016. Interpreting summary text as HTML is forbidden by the security construction principle.

### R4. Extend existing validation rather than adding a new test stack

- **Decision**: Extend existing Node built-in tests for corpus coverage and field integrity; add focused behavior/accessibility tests using the repository's existing test conventions. Validate static contrast and security with current project checks. Keep implementation dependency-free.
- **Rationale**: `package.json` already defines `npm test`, `npm run typecheck`, `npm run build`, and `npm run verify`; the corpus, contrast, purity, and storage surfaces already have dedicated tests.
- **Alternatives considered**: Adding a browser automation framework or new runtime library increases build surface and is not justified for the requested inline disclosure. Manual-only checks would not verify all 64 records or preservation of existing quotes.

## Resolved Technical Context

The source archive, generated-data boundary, UI composition, static shell, build pipeline, test runner, and distribution constraints are present in the repository. There are no unresolved technical-context questions that require additional research. Editorial review of the eventual 64 summaries is a later content/implementation activity, not a planning-time clarification.

## Repository Evidence Consulted

- `.specify/memory/constitution.md`
- `corpus/PROVENANCE.md`
- `corpus/legge-1882.json`
- `corpus/the_yi_king_clean.md`
- `scripts/gen-corpus.mjs`
- `src/data/texts.ts`, `src/data/hexagram-names.ts`, `src/data/trigrams.ts`
- `src/shell/index.html`, `src/ui/shell-bind.ts`, `src/ui/steps.ts`
- `tests/corpus.test.ts`, `tests/contrast.test.ts`, `package.json`
