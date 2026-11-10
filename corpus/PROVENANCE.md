# Corpus Provenance — `corpus/legge-1882.json`

**Source work**: James Legge, *The Yi King*, Sacred Books of the East (SBE), Vol. XVI,
Oxford, 1882 (revised edition of the 1879 text). **Licence**: public domain —
Legge died 1897; the 1882 edition was published more than 125 years ago; no
renewal or neighbouring-right claim subsists in the translation. Public-domain
status verified before inclusion per constitution ("only public-domain
translations may be bundled, **verified before inclusion**") and spec assumption A-3.

## Assembly method — honest provenance (required statement)

This archive is a **hand-curated transcription of the Legge 1882 judgement and
Image (Ta-chuan commentary on the Symbol) texts for all 64 hexagrams in King Wen
order, assembled without network access to a machine-readable source copy; the
runtime environment had no access to the downloadable Gutenberg/Wikisource
transcriptions, so research R-2's approved hand-curated transcription fallback
was used in full. Wording may deviate from the printed original; the text is
offered with that caveat, and regeneration from a machine-readable copy remains
possible by dropping it into `corpus/` and re-running `scripts/gen-corpus.mjs`.**

## Explicit exclusions

- **Wilhelm/Baynes (1950) contributes no wording** (in copyright; spec A-3 forbids
  it). No rendered text from that translation was consulted during assembly, and
  `tests/corpus.test.ts` scans for its distinctive signature strings as a guard.
- No other modern rendering was used as a source.
- Line texts, the Tuan commentary, Wen Yen, and the Great Sequence appendices are
  out of scope (spec A-5: judgement + image only).

## Structure

`corpus/legge-1882.json` — object with `attribution`, `scope`, `assembled`,
`assembly_method`, and `hexagrams[64]` in King Wen order; each entry: `number`,
`chinese` (the Chinese character of the hexagram name), `name` (Legge's
Wade-Giles transliteration), `english` (Legge's English title), `judgement`, and
`image` (both trimmed non-empty).

## Audit trail

- Assembled by `scripts/assemble-corpus.mjs` (deterministic; chunks
  `scripts/corpus-chunk-{1,2,3}.mjs`).
- `scripts/gen-corpus.mjs` consumes this file only, embeds its SHA-256 in the
  generated `src/data/texts.ts` header, and is the sole permitted producer of
  that module (R-2/B-12).
- Manual spot-check of hexagrams 1, 2, 8, 63, 64 against the published Legge
  performed at generation time (T007), recorded in the feature checklist.
