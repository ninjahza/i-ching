# Content Review — Feature 001 (T034, quickstart §7, SC-006)

Date: 2026-11-09 · Scope: every app-authored string + all 64 corpus pairings as displayed.

## Walkthrough

### App-authored copy — `src/data/app-strings.ts`
Every export reviewed (APP_TITLE · EXPLANATION · DECLINE_NO_RANDOM ·
TRUNCATION_NOTICE · STABLE_MESSAGE · FOOTER_NOTE · CONSENT_ON · CONSENT_OFF ·
announce/label builders):

- No predictions, guarantees, or fate-claims. EXPLANATION and the intro paragraph
  state plainly: no predictions, no medical/legal/financial advice.
- STABLE_MESSAGE is neutral ("stillness is its own text") — implies no lesser cast (C-6).
- DECLINE_NO_RANDOM is honest about capability, promises nothing (C-3).
- CONSENT_* disclose exactly what is stored and that deletion is immediate (FR-022).
- Tone is sober throughout; no marketing or mystical hyperbole; neutral across
  religious/secular worldviews (describes the I Ching as a classic text, not truth-claim).

### Static shell copy — `src/shell/index.html`
Title/tagline/intro/question label/help/casting caption/method labels/consent
disclosure/footer reviewed: same findings; the strong sentence "This app makes no
predictions…" appears on the intro (FR-014); the footer repeats it beside the
attribution line. No string urges, warns of omens, or advises.

### Corpus quotations — 64 judgement+image pairs
- Displayed only inside `<blockquote>` with `CORPUS_ATTRIBUTION` adjacent (C-5/C-7)
  — structurally impossible to present a quotation as an app claim.
- Wording is a hand-curated transcription of Legge 1882 (honest provenance recorded
  in `corpus/PROVENANCE.md`; may deviate from the printed original).
- `tests/corpus.test.ts` enforces: all 64 non-empty, King Wen order, and a
  Wilhelm/Baynes-phrase exclusion scan ("the abysmal", "keeping still", "the
  arousing", "the joyous (lake)", "wu hsin", …) — 0 findings.
- Legge's judgement texts contain conditional/advisory classical phrasing
  ("It will be advantageous…"); these are bracketed as quoted translations, and the
  app frame (intro + explanation + attribution) marks them as old-text quotations,
  satisfying FR-008/FR-011 as scoped by C-7.

### Findings
0 string findings. SC-006's engineering half is met; its human half (≥4/5 first-time
readers describing the app as "for reflection, not prediction") is a post-ship
reader study, noted in tasks.md T034 and out of scope here.

**Gate: PASS.**
