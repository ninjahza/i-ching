# Contract: Modern Corpus Source

This contract defines the editable corpus boundary and validation rules. It does not author corpus content.

## Authority and provenance

- Sole editable modern text source: `corpus/modern-prose.json`.
- Legge sources remain authoritative and read-only: `corpus/legge-1882.json`, `corpus/the_yi_king_clean.md`, and `corpus/the_yi_king.txt`.
- Modern prose is an original editorial work derived only from the public-domain Legge source held in this repository. No wording from Wilhelm/Baynes or another in-copyright translation or interpretation may be used.
- License the new feature 003 editorial work under the project's MIT license and update `LICENSE.md`'s scope note and `corpus/PROVENANCE.md` accordingly. This does not apply MIT to the public-domain Legge material or change the provenance/licensing of the existing feature 002 summaries.
- Keep provenance for Legge quotation/transcription, feature 002 editorial summaries, and the feature 003 original distillation clearly distinct. Record the modern work's fixed edition version/date, derivation method, licence, and completed review outcome.
- Source checksum is SHA-256 over the exact UTF-8 bytes of `modern-prose.json`; it is calculated by the build and is not stored recursively in that JSON.

## Required record shape

The versioned JSON contains:

1. Edition metadata: schema version, reader-facing edition version, publication date, language/title, provenance, and licence.
2. Ordered introduction blocks with source references to Legge's Preface/Introduction and relevant appendix material.
3. Ordered coin and yarrow guide blocks, including the exact per-line distributions, one-in-four line-change probability for each method, bottom-up notation, and source references.
4. Ordered changing-line guide blocks, default reading procedure, no-change and all-change explanations, and two or more worked examples with independently checkable source/relating hexagram numbers. State that traditional schools weigh changing lines differently without presenting one school as authoritative.
5. A fixed glossary of source formulas/concepts, source references, and one controlled modern rendering per term.
6. Exactly 64 modern hexagram entries in King Wen order, each with canonical character, unique modern name, Legge reference labels, canonical upper/lower trigram ids, judgement, image, six line readings in positions 1–6, source references, and controlled glossary term ids where applicable.
7. An all-lines-changing reading for hexagrams 1 and 2 only.

Every authored paragraph/passage has at least one structured source reference. Hexagram references identify King Wen number and judgement/image/line/all-lines-changing part. Guide references identify Legge Preface, Introduction chapter, or appendix/section. The generated standalone HTML publication exposes the references in a readable citation note.

## Validation and editorial gate

Fail closed if any of the following is false:

- Ordered section list is introduction → casting → changing-line reading → glossary → hexagrams 1–64; each required section is present.
- Hexagram numbers are unique, complete, and ordered; modern names are all distinct.
- Chinese character, trigram ids, and line types match canonical project data. Lines are numbered bottom-up.
- Judgement = 30–120 words; image = 20–80; each line = 15–70; each special all-lines-changing reading = 15–70. The fixed whitespace-separated word-count convention excludes headings and source citation labels.
- Source references are present, structurally valid, and resolve to the intended Legge division and part.
- Guide facts and worked examples validate, including exact coin/yarrow probabilities and canonical relating hexagrams.
- Every glossary-term id resolves to the same fixed rendering; no silent variants for the same source formula.
- The existing in-copyright signature guard also scans every field in this corpus.
- Prose uses a consistent, calm, present-tense voice; guidance addresses the reader in second person. It removes archaic syntax/bracketed interpolations, retains source imagery and verdicts, and uses gender-neutral language for generic people.
- Defined gendered-generic and predictive/advice phrase checks have no unreviewed hits. No passage predicts events, promises outcomes, or offers professional advice. Ambiguous hits are documented and adjudicated; scans do not replace editorial review.
- The reflective introduction explains holding an open question and not repeatedly recasting the same question to seek a different answer.
- Readability is measured and reported; editorial review confirms the approximate grade-9 target without treating a readability score as a fidelity test.
- Every passage passes editorial review for Legge-only source fidelity, present-day language, neutral voice, gender-neutral generic persons, retained integral imagery, no forecast/advice, and length. Record review outcome in `corpus/modern-prose-review.md`.

## Immutability contract

The modern generator may read the Legge files and existing canonical King Wen/trigram facts. It must not write or regenerate any Legge source file, `src/data/texts.ts`, or app corpus data. Tests record and assert the pre-feature SHA-256 of all three Legge source files. A feature diff that changes any of them fails review.
