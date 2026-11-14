# Tasks: Modern-Prose Corpus

**Input**: Design documents from `specs/003-modern-prose-corpus/`

**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, and `quickstart.md`

**Tests**: Included because the specification and design require source validation, preservation, security, accessibility, link, and reproducibility checks.

**Organization**: Tasks are grouped by the six user stories in `spec.md`, in priority order. The structured corpus is one shared JSON file, so edits to it must be serialized. The public corpus has exactly one generated format: standalone HTML. PDF, Typst, print, and automated deployment work are out of scope.

## Phase 1: Setup

**Purpose**: Capture pre-feature source and app-result baselines before implementation can change generated outputs.

- [X] T001 Capture SHA-256 values for the three preserved Legge files and a complete baseline of all 64 app judgement/image/002-summary results in `tests/fixtures/modern-corpus-baseline.json`.

---

## Phase 2: Foundational Source Validation

**Purpose**: Establish the fail-closed source and preservation checks required by every content story.

- [X] T002 Implement the structured-source validator in `scripts/validate-modern-corpus.mjs`, checking metadata and required section order, 64 canonical King Wen identities, trigram IDs, bottom-up line positions/types, word limits, source-reference shape, glossary IDs, and worked-example calculations.
- [X] T003 Add validator tests and representative valid/invalid source fixtures in `tests/modern-corpus.test.ts` and `tests/fixtures/modern-corpus/`, including assertions against the pre-feature Legge hashes in `tests/fixtures/modern-corpus-baseline.json`.

**Checkpoint**: Validation infrastructure is ready. No corpus content or app source has been changed by this task plan.

---

## Phase 3: User Story 1 — Read any hexagram in clear modern English (Priority: P1) 🎯 MVP

**Goal**: Provide all 64 ordered, concise, traceable hexagram entries, with six line readings each and the two required all-lines-changing readings.

**Independent Test**: Validate the corpus and inspect entries 1, 2, 3, 29, 63, and 64. Confirm canonical identity, trigram details, judgement, image, six bottom-up line readings with types and Legge references, word limits, and all-lines-changing readings only for 1 and 2.

- [X] T004 [US1] Author the 64 King Wen-ordered records, distinct modern names, canonical characters and trigram IDs, Legge reference labels, judgements, images, six bottom-up line readings, and the special readings for 1 and 2 in `corpus/modern-prose.json`.
- [X] T005 [US1] Extend the corpus tests in `tests/modern-corpus.test.ts` to assert completeness, ordering, unique names, canonical identities, passage bounds, correct line types, and special-reading coverage for all 64 entries.

**Checkpoint**: The hexagram records pass machine validation and can be reviewed independently against the cited Legge passages.

---

## Phase 4: User Story 2 — Understand why this is a tool for reflection, not prediction (Priority: P1)

**Goal**: Explain the text's origins as Legge presents them, hexagram structure, trigrams, line numbering, and the reflective, non-predictive approach.

**Independent Test**: Read the introduction alone and confirm it covers origins, all eight trigrams and their primary images, yin/yang, bottom-up line numbering, open-question practice, no re-casting for a different answer, and the no-prediction/no-professional-advice boundary; confirm historical claims have Legge references.

- [X] T006 [US2] Author the sourced introduction blocks, including the eight canonical trigrams and primary images, reflection framing, and open-question guidance, in `corpus/modern-prose.json`.
- [X] T007 [US2] Add introduction coverage and source-reference assertions to `tests/modern-corpus.test.ts`.

---

## Phase 5: User Story 3 — Cast a hexagram by hand with coins or yarrow stalks (Priority: P2)

**Goal**: Give complete, sourced coin and classical yarrow procedures, line notation, and exact probabilities.

**Independent Test**: Follow each method with coins or 50 sticks and paper. Confirm the reader can produce and mark six bottom-up lines and correctly state each outcome probability, including the yarrow asymmetry and the 1/4 change probability for both methods.

- [X] T008 [US3] Author the coin and yarrow procedures, 6/7/8/9 mappings, bottom-up notation, exact probability tables, and Great Appendix references in `corpus/modern-prose.json`.
- [X] T009 [US3] Add assertions for both probability distributions, total change probabilities, line notation, and required Great Appendix references in `tests/modern-corpus.test.ts`.

---

## Phase 6: User Story 4 — Read changing lines and the relating hexagram (Priority: P2)

**Goal**: Teach one clear default reading procedure, no-change and all-change cases, and at least two correct worked examples.

**Independent Test**: Apply the single- and multiple-changing-line examples, independently derive each relating hexagram, and confirm the specified line readings, no-change case, all-change case, and reflective rather than predictive framing.

- [X] T010 [US4] Author the changing-line procedure, traditional-method caveat, no-change and all-change instructions, and single- and multiple-changing-line examples with Legge references in `corpus/modern-prose.json`.
- [X] T011 [US4] Extend `scripts/validate-modern-corpus.mjs` and `tests/modern-corpus.test.ts` to independently calculate each example's initial and relating hexagrams and check the required procedure and special cases.

---

## Phase 7: User Story 5 — Trust the modern text: traceable, original, and clearly labelled (Priority: P3)

**Goal**: Make source fidelity, editorial review, originality, provenance, licensing, and the distinction from Legge and feature 002 auditable.

**Independent Test**: Trace modern passages to exact Legge locations; review at least 10% of passages, including every passage in hexagrams 1, 2, 3, 29, 63, and 64; confirm all review outcomes are recorded, no unreviewed editorial/signature hits remain, provenance distinguishes the three bodies of work, and the Legge files match T001 byte-for-byte.

- [X] T012 [US5] Add the controlled glossary, source forms, fixed renderings, explanations, and precise references to `corpus/modern-prose.json`, and ensure all glossary IDs resolve to the one controlled rendering.
- [X] T013 [P] [US5] Record passage-by-passage review outcomes for Legge fidelity, originality, voice, gender neutrality, imagery, length, glossary consistency, readability, and non-predictive framing in `corpus/modern-prose-review.md`; document the modern work's method, edition/date, MIT scope, and distinction from Legge and feature 002 in `corpus/PROVENANCE.md` and `LICENSE.md`.
- [X] T014 [P] [US5] Extend `scripts/validate-modern-corpus.mjs` with source-reference resolution/coverage, copyrighted-signature scans, gendered-generic and predictive/advice review-list scans, glossary consistency, and readability reporting.
- [X] T015 [US5] Add tests in `tests/modern-corpus.test.ts` for Legge-reference resolution and passage coverage, signature/editorial scans, glossary consistency, readable reporting, and immutable Legge hashes.

---

## Phase 8: User Story 6 — Open the modern guide from the app (Priority: P3)

**Goal**: Generate the single standalone HTML publication and add one accessible app link without changing consultation results or weakening app security.

**Independent Test**: Open the two built files from disk with no network. Use keyboard navigation from the app link to the guide and from its contents to a hexagram. Check the guide's security/accessibility profile and compare all app result texts against T001.

- [X] T016 [US6] Implement `scripts/build-modern-guide.mjs` to validate and render `corpus/modern-prose.json` as exactly one `dist/modern-guide.html` with semantic sections, complete in-page contents links, citations, accessible text-labelled figures, inline styles, and visible edition version/date/source checksum.
- [X] T017 [P] [US6] Implement the separate fail-closed verifier in `scripts/verify-modern-html.mjs` for allowed markup/attributes, restrictive policy, semantic structure, fragments-only navigation, and rejection of scripts, active content, external/network resources, CSS `url()`/`@import`, images, SVG, and unreviewed constructs.
- [X] T018 [US6] Add publication tests in `tests/modern-publication.test.ts` for complete ordered content/citations, all section and hexagram anchors, language annotations, text alternatives, visible focus, scalable text, WCAG 2.1 AA contrast, no network/resource dependencies, and verifier rejection cases.
- [X] T019 [P] [US6] Add the reviewed accessible link label stating that the guide opens separately in `src/data/app-strings.ts`.
- [X] T020 [US6] Attach exactly one runtime-created relative link to `modern-guide.html` using safe DOM construction in `src/ui/attribution.ts`; do not add a static app-shell resource, pass consultation data, or alter result rendering.
- [X] T021 [US6] Add app-link tests in `tests/modern-link.test.ts` for keyboard-accessible naming, offline relative resolution, no consultation-data transfer, missing-guide fallback, and unchanged judgement/image/002-summary output against `tests/fixtures/modern-corpus-baseline.json`.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Integrate both files into the existing build/verification workflow, document manual distribution, and complete release-readiness checks.

- [X] T022 Update `scripts/build.mjs` and `package.json` to validate and build both `dist/index.html` and `dist/modern-guide.html`, run the existing app verifier and the new corpus verifier without weakening app rules, enforce the app size budget, compare clean repeated-build hashes, and publish no partial output after a failed check.
- [X] T023 [P] Update `deploy/README.md` with manual instructions to copy/distribute `index.html` and `modern-guide.html` together, open either file offline, and verify both before release; require no provider, deployment target, automated deployment, target-specific configuration, or `https://i-ching.co.za` host setup.
- [ ] T024 Run the commands and scenarios in `specs/003-modern-prose-corpus/quickstart.md`, complete manual keyboard/screen-reader and offline review, verify two clean builds are byte-identical, and record results in `corpus/modern-prose-review.md`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 must capture source hashes and app result baselines before implementation changes.
- **Foundational (Phase 2)**: T002–T003 depend on the baseline and block all story work.
- **User Stories (Phases 3–8)**: Follow priority order. The shared `corpus/modern-prose.json` is edited in sequence through T004, T006, T008, T010, and T012; do not parallelize those edits. Story 5 review and provenance require the full corpus. Story 6 publication generation and app-link work require the completed source and editorial checks.
- **Polish (Phase 9)**: T022–T024 require the story work to be complete; release checks depend on both generated files and both verification paths.

### User Story Dependencies

- **US1 (P1)**: Starts after the foundational validator and baseline; defines the 64 hexagram content.
- **US2 (P1)**: Uses the same source file as US1; author after US1 to avoid conflicting edits.
- **US3 (P2)**: Uses the same source file; author after US2.
- **US4 (P2)**: Uses the same source file and US1 line data; author after US3.
- **US5 (P3)**: Depends on the complete US1–US4 source; then completes glossary and editorial/provenance gates.
- **US6 (P3)**: Depends on the completed and reviewed corpus; the app link does not change result content. The renderer and dedicated HTML verifier remain separate from the existing app verifier.

### Dependency Graph

```text
Setup → Foundational validation → US1 → US2 → US3 → US4 → US5 → US6 → Polish/release checks
```

### Parallel Opportunities

- After the full source is in place, T013 (review/provenance documents) and T014 (automated editorial/source checks) can proceed in parallel because they edit different files.
- In US6, T017 (the standalone HTML verifier) and T019 (the app link label) can proceed alongside T016 (the generator) after agreeing to the publication contract; T018 and T021 wait for their respective implementations.
- In Polish, T023 (manual release documentation) can proceed in parallel with T022 (build integration), since no host-specific deployment automation is being added.
- Do not parallelize edits to `corpus/modern-prose.json` or simultaneous changes to a shared test/validator file.

### Parallel Example: Independent Verification and Release Work

```text
After T004–T012 complete:
Task T013: editorial review and provenance documentation in corpus/modern-prose-review.md, corpus/PROVENANCE.md, and LICENSE.md
Task T014: source/editorial checks in scripts/validate-modern-corpus.mjs

After the publication contract is fixed:
Task T016: HTML generation in scripts/build-modern-guide.mjs
Task T017: independent HTML verification in scripts/verify-modern-html.mjs
Task T019: app link label in src/data/app-strings.ts
```

---

## Specification Coverage Check

The story mapping was checked against `spec.md`:

| User story / shared work | Requirements covered | Success criteria covered |
|---|---|---|
| Shared setup and validator | FR-002–003, FR-025–026, FR-034 | SC-009, SC-011 |
| US1 — Hexagram entries | FR-001, FR-015–018, FR-021–024 | SC-001, SC-003–006 |
| US2 — Introduction | FR-004–006, FR-019–023 | SC-003–005 |
| US3 — Casting | FR-007–010 | SC-007–008 |
| US4 — Changing lines | FR-011–014 | SC-007 |
| US5 — Trust and traceability | FR-002, FR-019–028 | SC-002–006, SC-009 |
| US6 — HTML and app link | FR-003, FR-029–036 | SC-010–013 |
| Polish — build and manual release | FR-034–036 | SC-011, SC-013 |

Corpus validation, manual editorial review, the HTML security/accessibility/offline checks, unchanged app-result checks, reproducibility checks, and manual two-file distribution are all assigned. No PDF, Typst, print, or automated deployment task is included.

## Implementation Strategy

### MVP First (User Story 1)

1. Complete T001–T003 to establish immutable baselines and source validation.
2. Complete T004–T005 for the 64-hexagram content slice.
3. **Stop and validate US1 independently** using the story's acceptance criteria. This is a content MVP, not a release-ready distribution; the full reader experience requires US2–US6.

### Incremental Delivery

1. Complete the baseline and validator foundation.
2. Add US1, then US2–US4 in order, validating each increment.
3. Complete US5's glossary, source traceability, editorial review, and provenance/licensing gate.
4. Complete US6's standalone HTML, security/accessibility/offline/reproducibility checks, and app link while preserving app results.
5. Integrate the build, update manual release instructions, and run the complete quickstart.

## Notes

- Every task uses the required `- [ ] Tnnn [P?] [USn?] ...` checklist syntax. Story labels appear only in story phases; every task description names its target file path.
- Tests are included because the spec, plan, contracts, and quickstart explicitly require them.
- Constitution II is applied per deliverable; no constitution amendment is a prerequisite.
- `https://i-ching.co.za` remains context/reference only. Release and deployment are manual.
