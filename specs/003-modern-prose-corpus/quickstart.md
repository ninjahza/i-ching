# Quickstart: Modern-Prose Publication Validation

This is the implementation-time validation guide. Commands marked **planned** need to be added with the feature; no modern corpus prose or implementation is created by this planning workflow.

## Prerequisites

- Node.js `>=26`; install existing pinned npm dependencies with `npm ci`.
- Build and read the generated artifacts without network access. No external document toolchain, font files, or network service is required.
- Release and deployment are manual; follow the repository's deployment documentation for the two-file distribution. No provider or deployment target is assumed.

## Build and static checks

```sh
npm run typecheck
npm test
npm run build
npm run verify
npm run verify:modern        # planned: corpus source and standalone HTML security/accessibility/stability
```

Expected outcomes:

- The source schema/editorial validators pass: 64 ordered entries, all required guide sections and references, all length limits, fixed glossary terms, canonical trigrams and line types, and correct worked examples.
- `npm test` includes modern corpus, existing Legge immutability, accessibility-relevant app-link behavior, and no-change checks for the app's Legge result texts.
- `npm run build` produces the app and exactly one public-corpus publication: `dist/index.html` and `dist/modern-guide.html`. Both outputs are byte-identical across two clean builds with unchanged inputs. A failure does not publish an invalid/partial release set.
- Existing app verification remains green and app output remains under 400 KiB. Modern prose is not included in the app bundle.
- `npm run verify:modern` reports valid HTML profile, no network/active content or disallowed resources, exact content order and source traceability, visible version/date/checksum, accessibility checks, and no output hash drift.
- Manually confirm both self-contained HTML deliverables are present and that the written release instructions do not require a hosting provider or target-specific configuration. Do not treat provider-specific deployment configuration as a release prerequisite.

## Scenario A — Intro, casting, and reading guides

1. Open `dist/modern-guide.html` directly from disk with network access disabled.
2. Navigate with keyboard from the contents to the introduction, casting guide, changing-line guide, and glossary.
3. Use only the guide plus three coins (or 50 physical sticks) and paper to produce six bottom-up lines. Check values/probabilities against the stated coin or yarrow distribution and total change probability.
4. Follow a single-changing-line and a multiple-changing-line worked example. Confirm both yield the canonical relating hexagram and that no-changing/all-changing cases are explained.

Expected: semantic heading structure, visible focus, readable scaling, text-labelled line figures, valid internal navigation, and no failed network requests. Guide text and examples are independently reviewed against the cited Legge passages.

## Scenario B — Any hexagram and changing lines

1. From the guide contents, select a hexagram at the beginning, middle, and end of the sequence, including 1, 2, 3, 29, 63, and 64.
2. Check each sample has number, character, distinct modern name, Legge reference labels, upper/lower trigram names and images, judgement, image, and six readings labelled bottom-to-top with yin/yang type.
3. Confirm 1 and 2 have an additional all-six-lines-changing passage and that other entries do not.
4. Follow the displayed source references to the right Legge hexagram and section/line. Compare an editorial-review sample of at least 10%, including every required special-case hexagram.

Expected: all limits/required fields pass automatically; each citation resolves; the editorial review log records fidelity, voice, gender-neutrality, originality, and non-prediction outcomes.

## Scenario C — App link and unchanged consultation

1. Open `dist/index.html` from disk with `modern-guide.html` beside it. Use keyboard only to activate the “Read the modern guide” link.
2. Confirm the guide opens as a separate document with no query/hash/cast/question transfer. Confirm the app remains usable if the guide is removed.
3. Complete an app consultation with changing and stable results. Compare the Legge judgement, image, and feature 002 summary for all 64 entries with the pre-feature baseline.
4. Run the existing app verifier and size check. Confirm the app verifier still accepts no static resource attribute other than its existing allowed fragments.

Expected: one accessible app→HTML entry point, no modern text in result UI or bundle, and all existing app security, contrast, privacy, and deterministic checks pass.

## Source preservation and reproducibility record

Before feature implementation, capture the committed SHA-256 values for `corpus/legge-1882.json`, `corpus/the_yi_king_clean.md`, and `corpus/the_yi_king.txt`; assert they remain equal after generation. Record the modern source checksum, build tool versions, output checksums, validator results, and review record for each manual release.
