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
offered with that caveat. The runtime corpus is regenerated from the archive by
running `scripts/gen-corpus.mjs`.**

## Explicit exclusions

- **Wilhelm/Baynes (1950) contributes no wording** (in copyright; spec A-3 forbids
  it). No rendered text from that translation was consulted during assembly, and
  `tests/corpus.test.ts` scans for its distinctive signature strings as a guard.
- No other modern rendering was used as a source.
- Individual line texts are not included in the archive. Whole-hexagram
  commentary and appendices are permitted sources for the editorial summaries.

## Editorial summaries

The archive contains an editorial summary for each of the 64 hexagrams.
They are modern-English syntheses based exclusively on the local cleansed
Legge edition below, not quotations.
The existing `judgement` and `image` transcriptions retain the earlier caveat.
The historical `scripts/assemble-corpus.mjs` recreates the original seed and
would discard summaries; it must not be used to regenerate the extended archive.

## Structure

`corpus/legge-1882.json` — object with `attribution`, `scope`, `assembled`,
`assembly_method`, and `hexagrams[64]` in King Wen order; each entry: `number`,
`chinese` (the Chinese character of the hexagram name), `name` (Legge's
Wade-Giles transliteration), `english` (Legge's English title), `judgement`, and
`image` (both trimmed non-empty), and `summary` (editorial synthesis).

## Audit trail

- Assembled by `scripts/assemble-corpus.mjs` (deterministic; chunks
  `scripts/corpus-chunk-{1,2,3}.mjs`).
- `scripts/gen-corpus.mjs` consumes this file only, embeds its SHA-256 in the
  generated `src/data/texts.ts` header, and is the sole permitted producer of
  that module (R-2/B-12).
- Manual spot-check of hexagrams 1, 2, 8, 63, 64 against the published Legge
  performed at generation time (T007), recorded in the feature checklist.

---

## Cleansed edition — `the_yi_king_clean.md`

**Source**: `the_yi_king.txt`, a scanner's OCR text dump (with page furniture)
of the Dover Publications reprint (first published 1950; this reproduction
1963) of Legge, SBE Vol. XVI. Produced by `clean_yi_king.py` alongside this
file; the raw source is preserved untouched.

**Method** (all repairs derived from the book's own internal evidence —
headers, folios, running heads, glosses and the printed tables of contents —
plus this corpus' canonical `legge-1882.json` for the 64 hexagram names):

- Publisher advertising, book-lists, scanning debris and the Dover
  catalogue that follows p. 443 (Appendix VII) removed; folios, gathering
  signatures, sigla and shelfmarks dropped.
- Running heads (all SBE book/section/chapter/hexagram/appendix variants,
  including OCR-garbled tokens and heads fused mid-line) eliminated without
  dropping short paragraph-ending prose lines.
- Two-band SBE pages separated by printed line measure before page-turn
  rejoining: 12pt translation blocks (upper page) and 9pt commentary / 8pt
  footnote blocks (lower page) rejoin independently across page breaks so
  notes never splice mid-sentence into translation text, and each hexagram's
  Duke of Chou lines (`1.`–`6.`, plus `7.` on Hexagrams I and II) are
  cleanly separated above Legge's commentary for that hexagram.
- Soft-hyphen (`¬`) breaks and line-end word splits repaired from an
  internal concordance built solely from interior tokens of `the_yi_king.txt`;
  unambiguous OCR quote-`1` openings and slash-closed quotes (`‘... ,’`)
  restored where paired.
- Structure rebuilt as markdown: reconstructed Contents tables (Introduction
  Chapters 1–3, all 64 hexagrams, and Appendixes 1–7), Preface, Introduction
  Chapters I–III (with page-bottom footnotes separated as blockquotes), the
  Text (Sections I–II and all 64 hexagrams headed from `legge-1882.json`),
  and Appendixes I–VII at their exact printed treatise and Section I/II
  boundaries.
- Appendix VII (Legge's English rhyme-version of the *Za Kwa*) re-laid
  stanza by stanza with gutter residue stripped and hanging-indented rhyme
  wraps rejoined onto their verse lines.

**Known limitations** (inherent to the 1963 scan, faithful to it, and left
uncorrected rather than guessed): SBE italicised transliterations (`Kh`,
`Ch`, `Ts`, diacritics) and some plates/diagrams carry OCR character damage;
a few inline trigrams and trigram-table cells were read as punctuation/ASCII
runs by the scanner; a handful of outer-margin side-notes in the Introduction
where the scanner interleaved margin and body glyphs on the same line remain
visible inline rather than being guessed at.

**Licence**: the underlying translation is public domain (see above); the
cleansing is a factual, non-creative restoration, adding no new copyright
claim. No external edition or online text was consulted at any point.
