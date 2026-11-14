# Implementation Plan: Modern-Prose Corpus

**Branch**: `003-modern-prose-corpus` (workspace remains on `main`) | **Date**: 2026-11-14 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/003-modern-prose-corpus/spec.md`

## Summary

Create one versioned, structured, original modern corpus beside the preserved Legge source archive. A deterministic build validates that source and generates exactly one standalone, accessible, offline HTML publication. The consultation app remains Legge-first and receives only one accessible link to that publication. The two self-contained deliverables are the app HTML and the public-corpus HTML; no modern corpus text is added to the app bundle. Preserve all three existing Legge source files and the app's existing result content byte-for-byte.

Release and deployment remain manual. Documentation will identify the two files and explain how to distribute them together. `https://i-ching.co.za` is context/reference only, not a deployment target, build input, or configuration requirement.

## Technical Context

**Language/Version**: TypeScript 7.0.2 (strict, existing app); Node.js `>=26` for scripts/tests. The authored modern corpus is versioned UTF-8 JSON.

**Primary Dependencies**: Runtime dependencies remain none. Existing pinned development dependencies are TypeScript 7.0.2 and esbuild 0.28.2. No new document-format compiler, font package, PDF utility, or runtime dependency is needed.

**Storage**: New authoritative `corpus/modern-prose.json`; existing `corpus/legge-1882.json`, `corpus/the_yi_king_clean.md`, and `corpus/the_yi_king.txt` remain unchanged. The two self-contained outputs are `dist/index.html` and `dist/modern-guide.html`. The modern corpus is not emitted into `src/data/texts.ts`.

**Testing**: Existing `node:test` suites, `npm run typecheck`, `npm test`, `npm run build`, and `npm run verify`; add corpus schema/editorial-rule checks, standalone HTML security/accessibility checks, deterministic output verification, app-link/offline checks, and source/result-preservation checks. Manual review covers keyboard and screen-reader access. No PDF generation, parity, or validation.

**Target Platform**: Both deliverables open from `file://` and work offline; when distributed together, the app's relative link opens the corpus HTML. Manual deployment documentation explains packaging the pair without requiring a host or target-specific configuration.

**Project Type**: Existing single-project offline web app plus a separate structured-corpus-to-HTML publication pipeline.

**Performance Goals**: No network/runtime startup or retrieval for either publication. No new app data payload; app remains within the existing 400 KiB limit. No additional quantitative build-time target is stated.

**Constraints**: Only the local public-domain Legge 1882 corpus may inform the editorial text; no in-copyright translation wording. All prose is reviewed, neutral, non-predictive, traceable, within specified word limits, and uses canonical app names. The generated corpus HTML is a single self-contained file with no script, remote resource, image, SVG, or network access. The app's security invariants remain unchanged. Existing Legge texts and in-app results remain unchanged. The output must be stable for unchanged inputs; all release/release-copy steps remain manual.

**Scale/Scope**: Introduction, casting and changing-line guides, glossary, and 64 hexagram entries with 384 line readings plus the two all-lines-changing readings; one generated HTML publication; one app link; build, verification, provenance, and manual release/deployment documentation. No corpus prose is authored during planning.

## Constitution Check

*Gate: evaluated before Phase 0 research and re-evaluated after Phase 1 design.*

| Principle | Pre-design | Post-design | Basis |
|---|---|---|---|
| I. Fidelity to the Idea | PASS | PASS | Source references bind every passage to Legge alone. Canonical King Wen/trigram facts are validated against existing project data; modern text is reflective, not predictive. Existing Legge content is preserved. |
| II. Single-File, Self-Contained Distribution | PASS | PASS | Applied per deliverable: `dist/index.html` remains a self-contained offline app and `dist/modern-guide.html` is a separate, self-contained offline public-corpus artifact. The release pair contains two files. No constitution amendment is needed. |
| III. Security by Construction | PASS | PASS | Keep the current app verifier and CSP. Add only the app's single runtime-created relative corpus link, without weakening existing app rules. Give the standalone HTML a separate, fail-closed verifier that rejects scripts, active content, network/resource dependencies, and unreviewed markup/attributes. |
| IV. Offline-First Privacy | PASS | PASS | No tracking, network access, user data, storage, or consultation data in the corpus publication. Both deliverables work offline; the corpus HTML contains its own styles and navigation. |
| V. Simplicity & Accessibility | PASS with scoped addition | PASS with scoped addition | Retain Node/TypeScript build and test conventions. Add one structured-source validator and HTML renderer/verifier to meet the required standalone accessible publication and app link; no PDF compiler/toolchain or alternate output format. Semantic HTML, keyboard access, scalable text, and WCAG 2.1 AA contrast are required. |

**Constitution II interpretation**: The one-file self-contained requirement applies per deliverable, as explicitly recorded in the updated feature spec. The app and public corpus are two distinct, individually self-contained HTML files. This is an explicit PASS and requires no constitution amendment.

**Post-design gate: PASS.** No principle is violated or amended. Manual deployment documentation does not designate a hosting provider or target. The URL `https://i-ching.co.za` remains reference context only.

## Phase 0: Outline & Research

Repository inspection confirmed that `scripts/build.mjs` currently deletes/recreates `dist/`, verifies the app, and checks its byte stability and 400 KiB ceiling; `verify-dist.mjs` restricts app static resource attributes to fragments; deploy documentation/configuration exists; app attribution is attached at runtime in `src/ui/attribution.ts`; and `src/data/texts.ts` is generated from the Legge archive. Implementation must extend these boundaries without changing the existing Legge generator or result content.

The feature's updated spec resolves the key design decisions: one structured modern source; exactly one generated public-corpus format (standalone HTML); no PDF or print requirement; one app link; per-deliverable application of Constitution II; and manual release/deployment with no required host. See [research.md](./research.md) for the decisions and their rationale.

## Phase 1: Design & Contracts

- [Data model](./data-model.md): versioned source, passage/source-reference records, canonical hexagram/trigram identity, validation, and HTML rendering projection.
- [Corpus contract](./contracts/corpus-source.md): content shape, source references, glossary, editorial/review, immutability, and provenance gates.
- [Publication contract](./contracts/publication-build.md): one generated HTML output, security/accessibility profile, deterministic output verification, and release boundary.
- [App/release contract](./contracts/app-link-and-deploy.md): separate app link, unchanged results, two-file manual distribution, and no deployment target/config requirement.
- [Quickstart](./quickstart.md): implementation-time runnable validation and manual accessibility/release checks.

There is no network API. User-facing contracts are the app link and the generated HTML publication, so they are specified as document/build contracts rather than API endpoints.

## Project Structure

### Planning artifacts

```text
specs/003-modern-prose-corpus/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    ├── corpus-source.md
    ├── publication-build.md
    └── app-link-and-deploy.md
```

### Relevant implementation areas (planned, not created in this planning task)

```text
corpus/
├── modern-prose.json             # sole editable modern corpus; versioned/schema-checked
├── modern-prose-review.md        # required editorial review outcome/provenance
└── PROVENANCE.md                 # add distinct modern-work provenance/licence
scripts/
├── build.mjs                     # orchestrate app and corpus HTML build/verification
├── build-modern-guide.mjs        # validate source and render standalone HTML
└── verify-modern-html.mjs        # guide-specific, fail-closed HTML profile
src/
├── ui/attribution.ts             # runtime-created accessible app→HTML link
├── data/app-strings.ts           # reviewed link label only
└── shell/index.html              # unchanged static resource attributes
dist/
├── index.html                    # unchanged app behavior, tiny link-only bundle delta
└── modern-guide.html             # generated standalone public-corpus publication
tests/
├── modern-corpus.test.ts         # schema, mapping, word-count, source, glossary guards
├── modern-publication.test.ts    # security and deterministic-output checks
└── modern-link.test.ts           # offline path, keyboard name, unchanged result contract
deploy/
└── README.md                     # manual two-file release/distribution instructions
```

**Structure Decision**: Retain the current single app project and add a separate corpus publication pipeline under `corpus/` and `scripts/`. Keep modern source independent of `corpus/legge-1882.json` and the runtime app corpus. The generator reads the modern source once, validates it, and produces only the standalone HTML publication. Generated HTML is never hand-edited. Deployment configuration for a particular host is not a feature requirement.

## Complexity Tracking

| Scoped addition | Why required | Simpler alternative rejected because |
|---|---|---|
| Structured-source validation and a standalone HTML renderer/verifier | FR-003 and FR-029–034 require one source to generate one secure, self-contained, accessible HTML publication with stable output. | Hand-authoring the public HTML separately from the structured corpus creates duplicate content and loses reliable source traceability, validation, and repeatable output. |
| Two-file manual release instructions and one runtime app link | FR-031 and FR-036 require the guide to be discoverable while remaining separate from the app and require both deliverables to be distributed together. | Embedding the modern prose in the app violates the separation and self-contained per-deliverable model; a PDF or host-specific deployment workflow is explicitly out of scope. |

**Workflow boundary**: This plan ends after design artifacts. It does not author modern prose, modify corpus/provenance files, change build scripts, run a build, or create `tasks.md`.
