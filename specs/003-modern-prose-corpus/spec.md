# Feature Specification: Modern-Prose Corpus (A Modern Distillation of the Yi King)

**Feature Branch**: `003-modern-prose-corpus` (numeric spec id `003`; active workspace branch `main` — no git branch was created, as no `before_specify` hook is registered)

**Created**: 2026-11-14

**Status**: Draft

**Input**: User description: "We have the Yi King (Legge 1882) and corpus sorted. Rewrite the corpus in a more modern prose. Main ideas: reflection over prediction; casting coins and yarrow; reading changing rows (lines); a modern distillation of the 64 hexagrams. The idea is to provide a text that is more up to date and uses more modern speech."

## Context & Constraints (recorded, not requirements)

Per the ratified project constitution (principles I–V), corpus provenance rules, and the conventions of specs 001 and 002, downstream planning must respect the following project-level constraints:

- **Source of truth**: The modern text is a rewrite of the project's cleansed public-domain edition of James Legge's *The Yi King* (SBE Vol. XVI, 1882) at [the_yi_king_clean.md](../../corpus/the_yi_king_clean.md) — which contains King Wan's whole-hexagram text, the Duke of Chou's line texts (`1.`–`6.`, plus `7.` on Hexagrams 1 and 2), Legge's notes, the Image ("Great Symbolism", Appendix II), and the Great Appendix (Appendix III, including the yarrow-stalk procedure). The structured archive [legge-1882.json](../../corpus/legge-1882.json) (number, chinese, name, english, judgement, image, summary) and [PROVENANCE.md](../../corpus/PROVENANCE.md) remain authoritative for the Legge text and are preserved unchanged; the app currently generates its bundled texts from that archive.
- **Licensing**: Legge is public domain. The modern text must be an original rewrite derived only from Legge; Wilhelm/Baynes (1950) and every other in-copyright translation or interpretation contribute no wording, and the existing corpus guard against Wilhelm/Baynes signature strings applies to the new text too.
- **Delivery model (confirmed by user)**: The modern text is a **separate, standalone HTML publication linked from the app**. It does not replace, toggle with, or sit inside the in-app Legge text; the consultation result keeps showing Legge's judgement/image (and the 002 summaries) exactly as today. The only app change is a link out to the publication.
- **Distribution & security constraints**: Constitution Principle II's one-file rule applies per deliverable: the app remains one self-contained file, and the public corpus is a separate, one-file standalone HTML publication. The release may therefore contain these two deliverables; this does not require a constitution amendment. Each deliverable must work offline without external resources. The app retains its existing security invariants, and the corpus HTML receives its own equivalent security verification. Outputs must be deterministic.
- **Manual deployment context**: Deployment remains manual, with instructions that identify both files and how to distribute them together. The reference URL https://i-ching.co.za is context only, not a deployment target or a configuration requirement.
- **Existing app constraints recorded for planning**: The app's current build and verifier are centered on `dist/index.html`; the app retains its 400 KB size budget and existing markup, CSP, storage, and external-link policies. The app-to-publication link must be implemented in a way that preserves those invariants. The separate HTML publication uses semantic structure and in-page navigation and must not depend on network access, remote fonts, images, or scripts.

Everything below is stated in terms of reader value, editorial fidelity, and verifiable outcomes, independent of implementation mechanics.

## Clarifications

### Session 2026-11-14

- Q: How should the modern text relate to the consultation app: shown in the app, toggled with the Legge text, or kept separate? → A: Kept separate. The modern text is a standalone document linked from the app. It does not replace, toggle with, or sit inside the in-app Legge text, and the app's result screen is unchanged.
- Q: How should the standalone corpus be published? → A: As one standalone, self-contained HTML file only. The app links to it; no alternate publication format is required.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Read any hexagram in clear modern English (Priority: P1)

A reader — often alone, holding a question, and new to the I Ching — has cast (or simply looked up) a hexagram. Legge's 1882 wording ("the superior man", parenthetical interpolations, "there will be occasion for repentance") feels remote. They open the modern distillation for that hexagram and find, in plain present-day English: the hexagram's name and what it pictures, a short judgement, the image (the two trigrams and the lesson drawn from them), and each of the six lines rendered as a brief, readable reflection. The text keeps Legge's imagery (dragons, streams, wells, cauldrons) but speaks to the reader as a contemporary person, inviting reflection rather than issuing a forecast.

**Why this priority**: The 64-hexagram distillation is the heart of the request and the content every other section supports; without it there is no modern corpus.

**Independent Test**: Pick any hexagram number 1–64 and read its modern entry alone; confirm it contains the name, judgement, image, and six lines (seven for 1 and 2), each traceable to the matching Legge passage, in plain gender-neutral English with no predictions.

**Acceptance Scenarios**:

1. **Given** any King Wen number 1–64, **When** the reader opens its modern entry, **Then** they find a modern name (with the Chinese character and Legge's transliteration and title for reference), a judgement, an image, and line readings for lines 1 through 6, in that order.
2. **Given** Hexagram 1 or Hexagram 2, **When** the reader opens the entry, **Then** it additionally contains the "all lines changing" reading (Legge's supernumerary 7th paragraph), clearly labelled as applying when all six lines move.
3. **Given** any modern passage, **When** it is compared side by side with its source Legge passage, **Then** the core image, situation, and traditional verdict (e.g. good fortune, regret, no error) are recognisably preserved, while archaic syntax, bracketed interpolations, and gendered generic nouns are not.
4. **Given** any modern passage, **When** reviewed for tone, **Then** it frames outcomes as qualities of the situation to reflect on, never as predictions, guarantees, or medical, legal, or financial advice.

---

### User Story 2 — Understand why this is a tool for reflection, not prediction (Priority: P1)

Before casting, a reader wants to know what the book is and how to approach it. An introductory section explains, in a few pages of modern prose, where the Book of Changes comes from (King Wan, the Duke of Chou, the appendices — as presented by Legge), what a hexagram is (two trigrams, six lines read bottom-up, yin and yang), and why this edition treats the text as a mirror for reflection: the meaning belongs to the reader, the text offers images and situations to think with, and nothing in it forecasts the future.

**Why this priority**: The reflection-over-prediction stance is the project's non-negotiable first principle and frames how every distillation is read; it is also usable on its own.

**Independent Test**: A reader with no prior knowledge reads only the introduction and can then explain, in their own words, what a hexagram is, how lines are numbered, and why the book is not used here to predict outcomes.

**Acceptance Scenarios**:

1. **Given** the introduction, **When** read on its own, **Then** it explains the origin of the text (per Legge's account), the structure of trigrams and hexagrams, line numbering from the bottom, and the meaning of yin/yang (divided/undivided) lines.
2. **Given** the introduction, **When** read on its own, **Then** it states plainly that the text is offered for reflection, makes no claim of foretelling events, and invites the reader to hold a question openly rather than seek a yes/no answer.
3. **Given** the introduction, **When** checked against Legge's Preface and Introduction, **Then** every historical claim it makes is traceable to Legge (or is clearly marked as this edition's own framing).

---

### User Story 3 — Cast a hexagram by hand with coins or yarrow stalks (Priority: P2)

A reader wants to cast without the app, or to understand what the app does. A how-to section walks them through the three-coin method and the yarrow-stalk method step by step, in modern language, shows how each toss or count yields one of four line values (6, 7, 8, 9), how to draw lines from the bottom up, and how often each kind of line occurs under each method — including why yarrow makes changing yang lines three times as likely as changing yin lines while coins treat them equally.

**Why this priority**: Casting is the ritual the app is built on; a faithful, modern explanation supports honest mechanics (Product Principle 3), but the distillations remain useful without it.

**Independent Test**: A first-time reader, using only this section, three real coins (or 50 sticks), and paper, produces a six-line figure, correctly marks its changing lines, and states the probability of each line value for the method used.

**Acceptance Scenarios**:

1. **Given** the coin instructions, **When** followed, **Then** the reader assigns values per toss (one side = 3, the other = 2; totals 6–9), records 6 as changing yin, 7 as stable yang, 8 as stable yin, 9 as changing yang, and builds the figure from line 1 (bottom) to line 6 (top).
2. **Given** the yarrow instructions, **When** followed, **Then** the reader can complete the classical procedure for one line (set one stalk aside from fifty, divide, count off by fours, three rounds, convert the remainder to 6/7/8/9), consistent with Legge's Great Appendix account.
3. **Given** the method section, **When** the probabilities are read, **Then** they state: coins — 6: 1/8, 7: 3/8, 8: 3/8, 9: 1/8; yarrow — 6: 1/16, 7: 5/16, 8: 7/16, 9: 3/16, matching the values the app's casting engine and README declare.

---

### User Story 4 — Read changing lines and the relating hexagram (Priority: P2)

A reader's cast includes one or more changing lines (6 or 9). A section on reading changes explains what a changing line is, which line readings to read (the changing lines of the first hexagram), how to form the relating (second) hexagram by flipping each changing line, how the two hexagrams relate (where the situation stands and where it is moving), what a cast with no changing lines means, and the special "all lines changing" readings for Hexagrams 1 and 2.

**Why this priority**: Roughly four in five coin casts include at least one changing line, so reading changes is a frequent need; it depends on the line distillations (Story 1) to be fully useful.

**Independent Test**: Given a worked example cast (e.g. lines 7, 9, 8, 8, 6, 7 bottom to top), a reader using only this section identifies the changing lines, names which line readings to consult, and derives the correct relating hexagram.

**Acceptance Scenarios**:

1. **Given** a cast with one or more changing lines, **When** the reader follows the section, **Then** they read the first hexagram's judgement and image, the readings for each changing line only, and then the relating hexagram's judgement and image (not its line readings).
2. **Given** a cast with no changing lines, **When** the reader follows the section, **Then** they understand the reading consists of the single hexagram's judgement and image, and that no relating hexagram exists.
3. **Given** a cast of six changing lines on Hexagram 1 or Hexagram 2, **When** the reader follows the section, **Then** they are directed to that hexagram's "all lines changing" reading in addition to the relating hexagram (2 or 1 respectively).
4. **Given** the section, **When** reviewed, **Then** it includes at least two fully worked examples (one with a single changing line, one with several) whose relating hexagrams are canonically correct.

---

### User Story 5 — Trust the modern text: traceable, original, and clearly labelled (Priority: P3)

A maintainer or careful reader wants to confirm that each modern passage is a faithful, original rewrite of Legge — not invented, not copied from a copyrighted translation — and that Legge's own text remains available unchanged alongside it.

**Why this priority**: Provenance and licensing are constitution-level commitments; this story guards the corpus but delivers no new reading experience on its own.

**Independent Test**: Sample any modern passage, follow its source reference to the exact Legge passage, confirm correspondence, confirm the Legge archive files are byte-identical to before, and run the copyrighted-signature check over the whole modern text.

**Acceptance Scenarios**:

1. **Given** any modern passage (intro section, method section, judgement, image, or line), **When** its source reference is followed, **Then** it leads to the specific Legge passage(s) it rewrites (hexagram number and part, or the Legge chapter/appendix).
2. **Given** the completed feature, **When** the Legge archive files are compared with their pre-feature versions, **Then** they are unchanged.
3. **Given** the full modern text, **When** checked against known signature phrases of in-copyright translations, **Then** there are zero matches, and the provenance record states the text is an original rewrite derived solely from Legge.

---

### User Story 6 — Open the modern guide from the app (Priority: P3)

After a consultation, a reader finds Legge's wording hard going and wants the modern version. A clearly labelled link in the app opens the standalone modern document, which works offline. From its contents they jump straight to the hexagram they cast and read the modern judgement, image, and lines. The app's own result screen does not change; Legge's text stays there.

**Why this priority**: The link makes the modern text discoverable from the app, but the document is fully valuable on its own (Stories 1–4), so the link is the last step.

**Independent Test**: Open the app from disk with the document beside it, activate the link using the keyboard only, and confirm the document opens with no network access. Jump to a hexagram from the contents, and confirm the app's result screen and security verification are unchanged.

**Acceptance Scenarios**:

1. **Given** the app opened offline from a folder that also contains the modern document, **When** the reader activates the "modern guide" link, **Then** the document opens (in a new tab or window) and is fully readable with no network requests.
2. **Given** the open document, **When** the reader selects a hexagram in the table of contents, **Then** they land on that hexagram's entry, and can return to the contents.
3. **Given** a completed cast, **When** the result screen is shown, **Then** it presents Legge's judgement, image, and 002 summary exactly as before, with no modern-text toggle or replacement.
4. **Given** the built app and standalone HTML publication, **When** security verification runs, **Then** every existing app invariant still passes and the publication passes its own equivalent verification.
5. **Given** the manual deployment instructions, **When** a maintainer prepares a release, **Then** the app file and the standalone HTML publication are identified as the two separate deliverables and the instructions explain how to distribute both together without naming a required host.

### Edge Cases

- **Archaic omen formulas**: Legge's recurring verdicts ("good fortune", "evil", "occasion for repentance", "no error", "it will be advantageous to cross the great stream", "to meet the great man") are rendered through a single consistent glossary so the same Legge formula always becomes the same modern phrase, framed reflectively rather than as a forecast — without erasing the verdict itself (fidelity).
- **Gendered roles in the source**: "superior man", "great man", "he/him" for a generic subject become gender-neutral equivalents; gendered figures that are part of a specific image or historical reference (the mare, the young lady and her suitor in Hexagram 3, King Wan, the Duke of Chou, a historical sovereign) are retained where removing them would change the image.
- **Ritual, feudal, and military imagery** (sacrifices, feudal princes, armies, punishments, captives): retained as images and briefly made intelligible, not modernised into different situations and not presented as advice.
- **Legge's uncertainty and alternative readings**: where Legge notes that a line is obscure or that commentators disagree, the modern text gives one clear reading consistent with Legge's preferred view and does not invent certainty Legge lacks.
- **OCR damage in the source**: garbled transliterations or punctuation in the cleansed edition are never copied; names use the project's canonical forms.
- **Hexagrams with the same transliteration** (e.g. the several "Pi", "Ch'ien", "K'un", "I") are disambiguated by number, character, and modern name everywhere.
- **Lines that refer to other lines or positions** ("the strong line below", "the place of authority") are explained in plain terms without requiring the reader to know line-position theory.
- **Legge's Image text sits in Appendix II, not in the main Text**: each hexagram's modern image traces to the matching Appendix II passage.
- **Very short or very long Legge passages**: modern passages stay within the length bounds below even where Legge is terse or expansive.
- **Publication missing beside the app** (e.g. someone copies only the app file): following the link fails gracefully through the browser's normal "file not found" behaviour. The app keeps working fully, and the manual deployment instructions say that both deliverables must be distributed together.
- **App opened from `file://`**: the link resolves relative to the app's own location, so no absolute path or host is assumed.
- **Hexagram figures in the document**: drawn with Unicode hexagram glyphs or CSS-only lines, never images or SVG, and always accompanied by text (number, name, line types) for screen readers.
- **Publication opened without a network connection**: all text, styles, figures, and navigation remain available within the single HTML file without remote resources.
- **Manual deployment omits one deliverable**: the instructions make the two-file distribution explicit; the app remains usable if the publication is absent, while the link cannot open that missing file.
- **Deterministic output**: rebuilding with identical source content produces byte-identical app and publication files.

## Requirements *(mandatory)*

### Functional Requirements

**Corpus & preservation**

- **FR-001**: The project MUST provide a new modern-prose corpus consisting of: an introduction on reflection over prediction, a casting guide (coins and yarrow), a guide to reading changing lines and the relating hexagram, a short glossary of recurring terms, and a modern distillation of all 64 hexagrams in King Wen order.
- **FR-002**: The existing Legge sources (the cleansed edition, the structured archive including its existing judgement, image, and summary texts, and the raw OCR source) MUST remain unchanged and continue to serve as the preserved source of truth alongside the modern corpus.
- **FR-003**: The modern corpus MUST be authored once as a structured, versioned source (one record per hexagram plus the guide sections, with source references) kept in the corpus alongside the Legge archive. The reader-facing publication MUST be generated from that source as exactly one standalone, self-contained HTML file linked from the app. It MUST carry its version/date and source checksum. The app and the public corpus publication are separate deliverables, each produced as one self-contained file.

**Introduction — reflection over prediction**

- **FR-004**: The introduction MUST explain, in modern prose, the origins of the text as Legge presents them, the structure of trigrams and hexagrams, line numbering from bottom to top, the meaning of divided (yin) and undivided (yang) lines, and the eight trigrams with their names and primary images.
- **FR-005**: The introduction MUST state that the text is offered as a mirror for reflection, that it makes no predictions or guarantees, that it is not a source of medical, legal, or financial advice, and that the meaning of a reading belongs to the reader.
- **FR-006**: The introduction MUST offer guidance on approaching a consultation reflectively (e.g. holding an open question rather than a yes/no one, and not re-casting the same question for a different answer — echoing Legge's Hexagram 4 judgement).

**Casting guide**

- **FR-007**: The casting guide MUST give step-by-step instructions for the three-coin method, including the value assignment (one face = 3, the other = 2), the mapping of totals 6/7/8/9 to old yin (changing), young yang, young yin, old yang (changing), and building the figure bottom-up.
- **FR-008**: The casting guide MUST give step-by-step instructions for the yarrow-stalk method consistent with Legge's account in the Great Appendix (fifty stalks, one set aside, division, counting by fours, three changes per line, conversion to 6/7/8/9).
- **FR-009**: The casting guide MUST state the per-line probabilities for both methods — coins 6: 1/8, 7: 3/8, 8: 3/8, 9: 1/8; yarrow 6: 1/16, 7: 5/16, 8: 7/16, 9: 3/16 — and explain in plain language the asymmetry of yarrow (changing yang more likely than changing yin) and the overall chance of a line changing (1/4 under both methods).
- **FR-010**: The casting guide MUST describe line notation (how to draw stable and changing lines) consistently with how the app marks changing lines, so a hand cast and an app cast read the same way.

**Reading changing lines**

- **FR-011**: The reading guide MUST define a changing (moving) line and explain how flipping each changing line produces the relating (second) hexagram.
- **FR-012**: The reading guide MUST adopt one consistent, simple reading procedure as this edition's default: read the first hexagram's judgement and image; read the line text of each changing line (and only those); then read the relating hexagram's judgement and image as the direction the situation is moving. It MUST note briefly that traditional schools weigh particular changing lines differently, without prescribing one as authoritative.
- **FR-013**: The reading guide MUST cover: no changing lines (single hexagram, no relating hexagram); all six lines changing, including the special "all lines changing" readings of Hexagrams 1 and 2; and at least two fully worked examples with canonically correct relating hexagrams.
- **FR-014**: The reading guide MUST present the relationship between the two hexagrams as a prompt for reflection (where things stand; what they may be turning toward), not as a forecast.

**Per-hexagram distillation**

- **FR-015**: Each of the 64 hexagram entries MUST contain: King Wen number; Chinese character; a modern English name; Legge's transliteration and English title (for reference); the upper and lower trigrams by name and image; a modern judgement; a modern image; and modern readings for lines 1–6 labelled by position (bottom to top) and by line type (yin/yang).
- **FR-016**: Hexagrams 1 and 2 MUST additionally contain a modern rendering of Legge's supernumerary paragraph, labelled as the reading for when all six lines change.
- **FR-017**: Modern passages MUST stay within these lengths: judgement 30–120 words; image 20–80 words; each line reading 15–70 words; Hexagram 1/2 "all lines changing" reading 15–70 words.
- **FR-018**: Modern hexagram names MUST be chosen from Legge's own titles and notes on the character's meaning, MUST be distinct from one another across all 64, and MUST NOT reproduce distinctive titles from in-copyright translations where those differ from Legge's.

**Voice, language & safety**

- **FR-019**: All modern text MUST use plain contemporary English in a single consistent voice — sober, calm, contemplative, neutral across beliefs — in present tense, addressing the reader in the second person where guidance is given.
- **FR-020**: All modern text MUST use gender-neutral language for generic persons (e.g. "the wise person", "a person of integrity", "the one in charge", singular "they"), except where a gendered figure is integral to a specific image or historical reference.
- **FR-021**: All modern text MUST remove Legge's bracketed interpolations and archaic constructions while preserving the image, situation, and traditional verdict of each source passage.
- **FR-022**: Recurring traditional formulas MUST be rendered through a glossary of fixed modern equivalents, applied consistently across all 64 hexagrams, each framed as a quality of the situation to consider rather than a prediction.
- **FR-023**: No modern passage MAY predict events, promise outcomes, or give medical, legal, financial, or other professional advice.
- **FR-024**: Hexagram and trigram names MUST use the project's canonical forms and never OCR-damaged spellings from the scanned source.

**Traceability, originality & provenance**

- **FR-025**: Every modern passage MUST carry a source reference identifying the Legge passage(s) it rewrites: hexagram number and part (judgement / image / line n / all-lines-changing) for hexagram content, or the Legge Preface/Introduction chapter/Appendix section for guide content.
- **FR-026**: The modern text MUST be an original rewrite derived solely from the public-domain Legge edition held in the project; no wording from Wilhelm/Baynes (1950) or any other in-copyright translation or interpretation may be used, and the existing signature-phrase guard MUST cover the modern corpus.
- **FR-027**: Corpus provenance documentation MUST be updated to record the modern corpus, its derivation method, its status as an original editorial work (and the licence it is released under), and the clear distinction between Legge's text (preserved quotation/transcription), the 002 editorial summaries, and the modern distillation.
- **FR-028**: Every modern passage MUST pass an editorial review gate (fidelity to source, voice, gender-neutrality, no-prediction rule, length) before the corpus is considered complete, and the review outcome MUST be recorded.

**Standalone HTML publication & link from the app**

- **FR-029**: The modern corpus MUST be published as one standalone HTML file, separate from the consultation app. It MUST contain, in order: title and provenance note, table of contents, introduction, casting guide, reading guide, glossary, and the 64 hexagram entries.
- **FR-030**: The consultation app MUST NOT replace, toggle with, or embed the modern text. The in-app Legge judgement, image, and 002 summaries remain exactly as they are, and the modern text is not added to the app's bundled data.
- **FR-031**: The app MUST offer one clearly labelled link to the modern HTML page (for example "Read the modern guide"), reachable by keyboard, with an accessible name that says it opens a separate document. It must work offline when the app and HTML page are opened from the same folder via `file://`, and when both are served from the same static host.
- **FR-032**: The HTML publication MUST let a reader go straight to any hexagram by number and name from its table of contents using in-page links. It MUST remain readable and navigable without network access, remote fonts, images, or scripts.
- **FR-033**: The HTML publication MUST be fully self-contained and offline-readable, with no network requests or tracking. It MUST meet the project's accessibility bar: semantic headings, readable when text is scaled, and WCAG 2.1 AA contrast. Hexagram figures MUST be announced by number and name, not by glyphs alone.
- **FR-034**: The HTML publication MUST pass security verification equivalent to the app's dist invariants (see Context & Constraints). The app and publication outputs MUST each be byte-deterministic when generated from unchanged inputs.
- **FR-035**: Adding the link MUST NOT weaken any existing app invariant, including the CSP, the static-markup rules, the size budget, no storage, and the single external link policy. Any verifier rule change needed for the link MUST be explicit, minimal, reviewed, and tested.
- **FR-036**: The manual deployment instructions MUST identify the app file and the standalone HTML publication as two separate deliverables and explain how to distribute them together. They MUST NOT require a particular hosting provider, deployment target, automated deployment process, or target-specific configuration.

### Key Entities

- **Modern Corpus**: The complete modern-prose work: introduction, casting guide, reading guide, glossary, and 64 hexagram entries, with provenance metadata (derived-from source, date, method, licence).
- **Modern Hexagram Entry**: One per King Wen number 1–64: number, Chinese character, modern name, Legge transliteration and title, trigram pair, modern judgement, modern image, six modern line readings, and (Hexagrams 1 and 2 only) an all-lines-changing reading.
- **Modern Line Reading**: A short reflection for one line position (1–6, bottom to top) with its line type (yin/yang) and source reference.
- **Guide Section**: An introductory or how-to section (reflection over prediction; coin casting; yarrow casting; reading changing lines), each with source references to Legge.
- **Glossary Term**: A recurring traditional formula or concept (e.g. good fortune, misfortune, regret, no error, the wise person, crossing the great stream) mapped to one fixed modern rendering and its Legge source wording.
- **Source Reference**: A link from a modern passage to the precise Legge passage(s) it rewrites.
- **Legge Source (preserved)**: The existing cleansed edition and structured archive — unchanged, authoritative for the classical text.
- **Modern Guide Publication**: The standalone, self-contained HTML file generated from the Modern Corpus, with a table of contents and per-hexagram anchors; it is linked from the app and distributed as a separate deliverable.
- **Guide Link**: The single labelled entry point in the app that opens the Modern Guide Document; it carries no data from the consultation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 64 of 64 hexagram entries are complete — name, judgement, image, and 6 line readings each (384 line readings), plus the 2 all-lines-changing readings for Hexagrams 1 and 2 — with 0 empty passages and 100% of passages within the length bounds of FR-017.
- **SC-002**: 100% of modern passages carry a source reference, and in a spot-check of at least 10% of passages (including every passage of Hexagrams 1, 2, 3, 29, 63, and 64), 100% are judged faithful to the referenced Legge passage's image, situation, and verdict.
- **SC-003**: The modern text reads at or below a lower-secondary school reading level (approximately grade 9 or below on a standard readability measure) on average, compared with Legge's source, which scores markedly harder.
- **SC-004**: 0 occurrences across the modern corpus of gendered generic terms from a defined review list (e.g. "superior man", "great man", generic "he/him/his" for an unspecified person), excluding documented image-integral exceptions.
- **SC-005**: 0 predictive or advisory statements (checked against a defined list of forecasting and advice phrasings) and 0 matches against in-copyright translation signature phrases.
- **SC-006**: 100% of glossary terms are rendered identically everywhere they occur (0 inconsistent renderings of the same Legge formula).
- **SC-007**: A first-time reader using only the casting and reading guides can complete a hand cast, mark its changing lines, and derive the correct relating hexagram in under 15 minutes; both worked examples in the guide resolve to the canonically correct relating hexagram.
- **SC-008**: Probabilities stated in the casting guide match the app's declared casting profiles exactly (8 of 8 values).
- **SC-009**: The Legge source files are byte-identical before and after the feature (0 changes).
- **SC-010**: From the app, a reader reaches any chosen hexagram's modern entry in at most 2 actions (open the guide, then select it from the contents), fully offline, using a keyboard alone.
- **SC-011**: After the feature, the app passes 100% of its existing security, contrast, and determinism checks. Its in-app result content (Legge judgement, image, summary) is unchanged for all 64 hexagrams, and the app stays within its size budget. The standalone HTML publication passes its own verification with 0 network requests, 0 images or SVG, and 0 external resources. Both deliverables are each one self-contained file, and regenerating either from unchanged inputs yields a byte-identical file.
- **SC-012**: From the HTML publication's table of contents, 100% of sections and all 64 hexagrams are reachable by keyboard using in-page links, without network access.
- **SC-013**: In a deployment walkthrough, 100% of maintainers can follow the documented manual steps to distribute the app file and standalone HTML publication together, without a required host or target-specific configuration.

## Out of Scope

- A new translation from the Chinese, or consulting any translation other than Legge's.
- Rewriting Legge's appendices (Ten Wings) in full beyond what the introduction and guides draw on; Appendix VII's rhyme version is not rendered.
- Modifying the existing Legge `judgement`, `image`, or 002 `summary` texts.
- Prescriptive "advice" readings tailored to topics (love, career, health, money).
- Audio, illustrations, or translations of the modern text into other languages.
- Alternate publication formats, including PDF, EPUB, and print-on-demand.
- Showing the modern text inside the consultation app: no replacement of the Legge text, no modern/Legge toggle, no per-hexagram deep link carrying the cast result, and no inlining of the modern text into the app bundle.
- Any app UI change other than the single link to the modern HTML publication.
- Requiring https://i-ching.co.za, or any particular host, as a deployment target or requiring target-specific deployment configuration.

## Assumptions

- **A-1 (Rewrite, not translation)**: "Modern distillation" means re-expressing Legge's sense in concise contemporary prose; where Legge is ambiguous, this edition follows Legge's preferred reading.
- **A-2 (Audience)**: General adult readers with no prior I Ching knowledge, consistent with PRODUCT.md's users; language targets clarity over scholarly apparatus.
- **A-3 (Romanisation)**: Modern entries lead with the Chinese character and a modern English name, with Legge's Wade-Giles transliteration kept for traceability; Pinyin may be added alongside. The existing archive's `name` and `english` fields are not altered.
- **A-4 (Reading method default)**: The simple "changing lines of the first hexagram, then the relating hexagram's judgement and image" method is the edition's default because it is widely used, easy to follow by hand, and consistent with the app's primary/related display; other traditional rules are mentioned, not mandated.
- **A-5 (Line texts source)**: Line readings are rewritten from the Duke of Chou paragraphs in the cleansed edition (the structured archive has no line texts); the Image is rewritten from Legge's Appendix II.
- **A-6 (Coin convention)**: The coin guide uses the same heads = 3 / tails = 2 convention the app and README already declare.
- **A-7 (Licence of new text)**: The modern corpus is an original authored work of the project, released under the project's existing licence for authored copy, and recorded as such in provenance.
- **A-8 (Relationship to 002 summaries)**: The 002 "Read more" summaries remain as-is; the modern distillation is a separate, fuller text and does not replace them in this feature.
- **A-9 (Authoring & review)**: Drafts may be produced with assistance but every passage passes the human editorial review gate (FR-028) before acceptance, as with all review-gated authored copy.
- **A-10 (Confirmed delivery model)**: The modern text is a separate standalone HTML publication linked from the app and is not shown in place of, or toggled with, the in-app Legge text. It is generated from one structured source; no alternate publication format is required.
- **A-11 (Link target)**: The link opens the document's beginning (contents), not the reader's cast hexagram. Passing the cast to another document would add a hosting-context and privacy surface that the app deliberately avoids.
- **A-12 (Two deliverables and manual deployment)**: Constitution Principle II's one-file requirement applies to each deliverable: the app is one self-contained file and the public corpus is one separate self-contained HTML file. Manual deployment instructions list and explain distribution of both files. The reference URL https://i-ching.co.za is context only; no host or target-specific configuration is assumed.
