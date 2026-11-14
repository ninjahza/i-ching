# Data Model: Hexagram “Read More” Summaries

## 1. Hexagram Corpus Archive

The archive is the existing `corpus/legge-1882.json` document. Its metadata records attribution, scope, assembly date, and assembly method; `hexagrams` contains exactly 64 records in King Wen order. Update provenance metadata and documentation to describe the added editorial field and distinguish it from the transcribed quotations.

## 2. Hexagram Corpus Record

One record identifies a single canonical hexagram and its texts.

| Field | Type | Constraints |
|---|---|---|
| `number` | integer | King Wen number 1–64; position in the archive is number minus one |
| `chinese` | string | Existing canonical character; unchanged |
| `name` | string | Existing Legge transliteration; may contain OCR-related spelling defects and must not be copied blindly into summaries |
| `english` | string | Existing English title |
| `judgement` | string | Existing non-empty quotation; remains unchanged |
| `image` | string | Existing non-empty quotation; remains unchanged |
| `summary` | string | New, non-empty editorial synthesis; 1–2 paragraphs and 60–180 words inclusive |

**Relationships**: A corpus archive has exactly 64 records; a Result card resolves exactly one record by its canonical King Wen number. Existing identity and quote fields retain their current meanings.

## 3. Hexagram Summary

The `summary` value is authored prose stored on its corresponding corpus record. It:

- derives solely from the specified Legge 1882 source material;
- gives a whole-hexagram synthesis covering the emblem/name, trigram relationship, and central situational or moral theme;
- uses clear, modern English and canonical app-facing hexagram/trigram names;
- is not a verbatim quotation, a line-by-line interpretation, a prediction, or personal advice;
- contains one paragraph, or two paragraphs separated in the string by a blank line (`\n\n`).

The generator preserves this string as data. The UI renders it as literal text in paragraph nodes; the string is never treated as markup.

## 4. Summary Disclosure

Each visible result card has one disclosure associated with the summary for that card's hexagram.

| State | Meaning |
|---|---|
| `collapsed` | Initial state when a result is presented; summary region is hidden and the control announces collapsed state |
| `expanded` | The summary for that card's hexagram is visible; the control announces expanded state |

**Relationships and transitions**

- A complete consultation has one primary card and may have one related card.
- A stable consultation (no changing lines) has no related card or related disclosure.
- Primary and related states transition independently: `collapsed ⇄ expanded`.
- A new result always begins with its visible disclosure(s) collapsed.
- “Cast again” discards the result and clears the summary text and disclosure states.
- State exists only in memory for the active consultation and is never persisted.

## Validation Rules

1. Exactly 64 numbered records exist, ordered 1–64, each with a non-empty `summary`.
2. Each summary has 1–2 paragraphs and 60–180 words.
3. Before/after integrity checks prove `judgement` and `image` fields unchanged.
4. Editorial checks verify source fidelity, canonical spelling, neutrality, and exclusion of prediction, advice, copyrighted signatures, and line-by-line interpretation.
5. Disclosure tests verify independent state, default collapse, stable-cast absence, keyboard/screen-reader state, focus retention, and reset/clearing on “Cast again.”
