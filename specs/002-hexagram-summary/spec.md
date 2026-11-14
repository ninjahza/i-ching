# Feature Specification: Hexagram "Read More" Summaries

**Feature Branch**: `002-hexagram-summary` (numeric spec id `002`; active workspace branch `dazzle`)

**Created**: 2026-11-14

**Status**: Draft

**Input**: User description: "we now have a pretty clean version of the original james legge text. Create spec to add a summarized version of the text for each hexagram from the original text this is additional text displayed when a user want to read more about a specific hexagram. it can be added tot he json as a new field"

## Context & Constraints (recorded, not requirements)

Per the ratified project constitution (principles I–V) and explicit user direction, downstream planning must respect the following project-level constraints:
- **Source & archive files**: Summaries are authored from the project's cleansed public-domain edition of James Legge's *The Yi King* (1882) at [the_yi_king_clean.md](../../corpus/the_yi_king_clean.md) and stored as a new `summary` field on each hexagram entry in [legge-1882.json](../../corpus/legge-1882.json), leaving existing `judgement` and `image` fields unchanged.
- **Distribution & security**: The application ships as a single self-contained offline HTML file compiled from strict TypeScript with zero runtime dependencies, strict Content Security Policy, inert text rendering only (no active markup injection), no external assets or network requests, and deterministic build output.

Everything in the specification below is stated in terms of user-visible capability, editorial fidelity, and verifiable outcomes, independent of implementation mechanics.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Read deeper context for a cast hexagram on demand (Priority: P1)

A seeker completes a consultation and arrives at the Result screen, where the primary hexagram is shown with its figure, Chinese character, name, trigrams, and the classical 19th-century Judgement and Image quotations. Wanting clearer context on what the hexagram means as a whole — without losing the calm, uncluttered initial view — the seeker selects a "Read more" control on the hexagram card. An accessible, modern-English summary opens in place beneath the classical quotations, explaining the hexagram's central image, trigram relationship, and core human or situational theme as set out in Legge's *Yi King* commentary. When finished, the seeker can collapse the summary back to its quiet state, or start a new cast with no trace of the previous summary remaining.

**Why this priority**: Legge's archaic phrasing can feel opaque to modern or first-time readers. An optional, on-demand summary delivers the core value of this feature — deeper understanding of a specific hexagram while preserving the sparse, contemplative ritual by default.

**Independent Test**: Open the offline consultation, complete any cast, verify the summary is hidden on initial arrival, expand "Read more" on the primary hexagram, confirm a non-empty, modern-English summary matching that hexagram's Legge commentary appears, collapse it, expand it again, and then choose "Cast again" to confirm both text and open state reset completely.

**Acceptance Scenarios**:

1. **Given** a completed cast on the Result screen, **When** the result first appears, **Then** the primary hexagram's Judgement and Image are visible as before and the extended summary is collapsed by default behind a clear "Read more" control.
2. **Given** a collapsed summary on the primary hexagram card, **When** the seeker activates the "Read more" control, **Then** the summary for that exact King Wen hexagram (1–64) is revealed in place without leaving the Result screen or altering any other part of the consultation.
3. **Given** an expanded summary on the primary hexagram card, **When** the seeker activates the control again, **Then** the summary collapses cleanly and focus remains on the control.
4. **Given** a consultation where the primary hexagram's summary was left expanded, **When** the seeker chooses "Cast again" and completes a subsequent cast, **Then** the previous summary text is cleared and the new result starts with its summary collapsed.

---

### User Story 2 — Explore the related hexagram's summary independently (Priority: P2)

When a cast includes one or more changing lines, the Result screen presents both the primary hexagram and the related (transformed) hexagram. Because the seeker may want to understand either hexagram — or compare how the primary theme shifts toward the related one — each displayed hexagram card provides its own independent "Read more" control, collapsed by default. Expanding or collapsing one hexagram's summary never opens or closes the other's. When a cast has no changing lines (a stable hexagram), only the primary hexagram card and its "Read more" control appear.

**Why this priority**: Changing-line casts occur frequently (roughly 82% of three-coin casts have at least one changing line), and readers naturally ask what the emerging hexagram signifies alongside the primary one.

**Independent Test**: Complete a cast with at least one changing line; verify both the primary and related hexagram cards start with summaries collapsed; open the related summary while keeping the primary collapsed (and vice versa), then open both simultaneously and verify each displays its own distinct hexagram summary; complete a stable cast and verify no related card or second summary control is present.

**Acceptance Scenarios**:

1. **Given** a cast with one or more changing lines, **When** the Result screen is shown, **Then** both the primary hexagram card and the related hexagram card display their own collapsed "Read more" controls.
2. **Given** both primary and related hexagram cards are visible, **When** the seeker expands "Read more" on the related hexagram only, **Then** the related hexagram's summary opens while the primary hexagram's summary remains collapsed.
3. **Given** both summaries are expanded simultaneously, **When** the seeker reads them, **Then** the primary card shows the primary hexagram's summary and the related card shows the related hexagram's summary, and collapsing either leaves the other open.
4. **Given** a stable cast with zero changing lines, **When** the Result screen is shown, **Then** only the primary hexagram's "Read more" control is present and no related hexagram summary or control is rendered.

---

### User Story 3 — Contemplative, clearly attributed synthesis faithful to Legge (Priority: P2)

A reader who expands "Read more" can immediately distinguish between Legge's verbatim classical quotations (Judgement and Image) and the modern-English summary of Legge's commentary. The summary illuminates the hexagram's name/emblem, trigram dynamic, and overarching theme in clear, sober, contemplative language — never predicting outcomes, prescribing personal decisions, offering medical/legal/financial advice, or importing concepts or phrasing from copyrighted translations.

**Why this priority**: Constitution Principle I (Fidelity to the Idea) and public-domain provenance are non-negotiable. A summary that blurs verbatim quotation with modern paraphrase, slips into fortune-telling, or echoes copyrighted works would violate the product's core trust commitments.

**Independent Test**: Audit all 64 hexagram summaries and their in-app framing against the cleansed 1882 Legge text and the project's content review rules: verify visual/textual distinction from verbatim quotes, factual grounding in Legge's text and notes, absence of line-by-line breakdowns, zero predictive or advisory claims, and zero copyrighted-translation signature phrases.

**Acceptance Scenarios**:

1. **Given** any expanded summary on the Result screen, **When** a seeker views the hexagram card, **Then** the summary is visually and textually framed as an editorial overview based on Legge's 1882 commentary rather than a verbatim quotation.
2. **Given** any of the 64 hexagram summaries, **When** compared against the cleansed 1882 Legge source, **Then** its imagery, trigram explanation, and thematic synthesis come exclusively from Legge's public-domain translation and notes for that hexagram, while existing Judgement and Image quotations remain unchanged.
3. **Given** any of the 64 hexagram summaries, **When** reviewed for tone and compliance, **Then** it uses accessible modern prose focused on reflection, contains no predictions or personal advice, and omits individual line-by-line (lines 1–6) readings.

### Edge Cases

- **All six lines changing** (e.g., Hexagram 1 transforming to Hexagram 2): both primary and related cards render and toggle their respective summaries independently without conflict.
- **No changing lines (stable cast)**: related summary state and content remain empty and unrendered, even if the related summary was expanded during an earlier consultation in the same session.
- **Keyboard-only navigation and assistive technology**: when both primary and related "Read more" controls are present on screen, screen-reader users can tell which hexagram each control belongs to (e.g., via accessible naming or programmatic association) and hear the current expanded/collapsed state.
- **Repeated rapid toggling**: activating "Read more" / "Show less" repeatedly never duplicates paragraphs, corrupts state, or loses keyboard focus.
- **OCR artifacts in the source text**: scanner corruption present in italicized transliterations or punctuation of the cleansed 1882 OCR text (such as garbled Wade-Giles spellings) is never copied into summaries; summaries use clean modern English and the project's established canonical hexagram names where named.
- **Small viewports, 200% zoom, and reduced motion**: expanded summaries wrap comfortably within cards on narrow mobile screens and at 200% zoom without horizontal scrolling, meet WCAG 2.1 AA contrast in both light and dark palettes, and respect reduced-motion preferences.
- **Reload or device storage**: summary open/closed state is strictly session-transient; nothing is written to browser storage when opening or closing a summary.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The corpus MUST provide a complete, non-empty `summary` text for every one of the 64 canonical hexagrams in King Wen order (1–64).
- **FR-002**: Existing `judgement` and `image` texts for all 64 hexagrams MUST remain unchanged when adding summaries.
- **FR-003**: Every hexagram summary MUST be authored exclusively from the project's cleansed public-domain edition of James Legge's *The Yi King* (1882) — drawing on the hexagram's *Thwan* (Judgement), *Great Symbolism* (Image), and Legge's explanatory notes and whole-hexagram appendix commentary — with zero consultation of or wording from Wilhelm/Baynes (1950) or any other copyrighted work.
- **FR-004**: Each summary MUST be written as an accessible modern-English synthesis of the hexagram as a whole — covering its central emblem/name, component trigram relationship, and core situational or moral theme — and MUST NOT enumerate or interpret lines 1 through 6 individually.
- **FR-005**: Each summary MUST consist of 1 to 2 concise paragraphs totaling between 60 and 180 words (targeting approximately 80–140 words), giving comparable contemplative depth across all 64 hexagrams without overwhelming the result card.
- **FR-006**: Every summary and all associated UI labels MUST maintain a sober, neutral, contemplative tone across beliefs and MUST NOT make predictions, promise outcomes, or offer medical, legal, or financial advice.
- **FR-007**: Summaries MUST use clean English prose and, whenever referencing a hexagram or trigram by name, MUST use the project's canonical transliterations and English titles rather than raw OCR-damaged spellings from the scanned source.
- **FR-008**: Corpus provenance metadata and documentation MUST be updated honestly to record the addition of the `summary` field, its derivation from the cleansed 1882 Legge text, and the distinction between verbatim/transcribed quotations (`judgement`, `image`) and editorial synthesis (`summary`).
- **FR-009**: On the Result screen, the primary hexagram card MUST include an interactive disclosure control (e.g., "Read more") that is collapsed by default when a cast completes.
- **FR-010**: When a cast has one or more changing lines, the related hexagram card MUST also include its own disclosure control, collapsed by default, operating independently of the primary hexagram's disclosure control; when no lines change, no related disclosure control may be shown.
- **FR-011**: Activating a hexagram card's disclosure control MUST toggle the visibility of that hexagram's summary in place and update both its visual label/state and its programmatic expanded/collapsed state for assistive technologies.
- **FR-012**: Each displayed summary MUST be visually and structurally distinguished from the verbatim Judgement and Image blockquotes, with a brief heading or framing label indicating it is an overview/summary of Legge's commentary rather than a direct quotation.
- **FR-013**: When both primary and related hexagram cards are visible, their disclosure controls MUST carry unambiguous accessible labels or context so screen-reader users can distinguish which hexagram each control expands.
- **FR-014**: Summary paragraphs MUST be rendered strictly as inert literal text with zero active markup interpretation, zero external resources, and zero network activity, bundled in full within the single offline distributable file.
- **FR-015**: Choosing "Cast again" MUST reset all summary disclosure controls to their collapsed state and clear any rendered summary text from the Result view alongside the rest of the finished consultation.
- **FR-016**: Expanding or collapsing a summary MUST NOT read from or write to persistent device storage; summary visibility exists in transient memory only for the active consultation.
- **FR-017**: All summary controls and revealed text MUST be fully operable by keyboard alone with visible focus indicators, meet WCAG 2.1 AA contrast requirements in both light and dark color schemes, remain readable without horizontal overflow at 200% zoom, and respect user reduced-motion preferences.

### Key Entities

- **Hexagram Summary**: A concise, modern-English contemplative synthesis (1–2 paragraphs, 60–180 words) of a single hexagram's whole-figure symbolism, trigram dynamic, and theme, derived solely from James Legge's 1882 *The Yi King* text and commentary.
- **Hexagram Corpus Record**: The canonical per-hexagram entry (King Wen 1–64) combining identity metadata, unchanged classical `judgement` and `image` quotations, and the new `summary` synthesis under documented public-domain provenance.
- **Summary Disclosure**: An independent, transient expand/collapse affordance attached to a displayed hexagram result card (primary, and related when changing lines exist), collapsed on initial result presentation and cleared on "Cast again".

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of the 64 hexagrams include a non-empty summary between 60 and 180 words, with 0 changes to existing `judgement` and `image` strings, verified by automated corpus integrity checks.
- **SC-002**: 100% of all 64 summaries and new interface labels pass automated and editorial content checks: 0 copyrighted-translation signature matches, 0 raw OCR transliteration garbles, 0 individual line-by-line (lines 1–6) breakdowns, and 0 predictive or medical/legal/financial advice statements.
- **SC-003**: A seeker on the Result screen can expand and collapse deeper context for the primary hexagram — and independently for the related hexagram on changing-line casts — in a single interaction (1 click or keypress) with zero page navigation or layout breakage on desktop, mobile, and 200% zoom.
- **SC-004**: 100% of keyboard-only and screen-reader walkthroughs successfully identify, expand, read, and collapse both primary and related hexagram summaries, and automated contrast checks confirm WCAG 2.1 AA compliance across light and dark palettes.
- **SC-005**: The complete offline distributable remains a single self-contained file with 0 network requests, 0 security verification violations, 0 new persistent storage writes, and byte-deterministic output across repeated builds.

## Out of Scope

- Individual line-by-line (lines 1–6, or supernumerary line 7) translations or summaries in the consultation result.
- Revising or replacing the existing `judgement` and `image` quotation strings in the corpus.
- Browsing or searching a standalone index of all 64 hexagrams outside a consultation result.
- Persisting whether a seeker prefers summaries expanded by default across casts or sessions.

## Assumptions

- **A-1 (Confirmed editorial voice)**: Summaries are newly written, accessible modern-English syntheses grounded strictly in Legge's 1882 text and commentary rather than verbatim 19th-century excerpts, making classical imagery approachable while keeping verbatim quotations intact above them.
- **A-2 (Confirmed coverage boundary)**: Each summary addresses the hexagram as a whole (name/character imagery, component trigrams, and overall situation/theme from Legge's *Thwan*, *Great Symbolism*, notes, and whole-hexagram appendices) and intentionally leaves out Duke of Chou line-by-line specifics, matching the v1 consultation model (which casts whole primary and related hexagrams without prescribing line-reading rules).
- **A-3 (Confirmed placement)**: Both the primary hexagram card and the related hexagram card (when changing lines are present) feature independent "Read more" disclosures, collapsed by default so the initial result presentation stays calm and unhurried.
- **A-4 (Confirmed corpus boundary)**: Existing `judgement` and `image` fields remain untouched in this feature so existing quotation behavior and tests stay stable; reconciling verbatim quotes against the cleansed OCR edition, if ever desired, would be a separate effort.
- **A-5 (Paragraph representation)**: Multi-paragraph summaries (1–2 paragraphs) may be represented cleanly within the single new `summary` string field (for example separated by blank lines `\n\n`) and rendered as separate text paragraphs without active markup.
