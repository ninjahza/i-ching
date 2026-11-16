# Feature Specification: User Cast

**Feature Branch**: `004-user-cast`

**Created**: 2026-11-15

**Status**: Draft

**Input**: User description: "i need to add a third casting method - user cast. The user selects the count from the draw (coins or yarrow) and enters the amount 6 times to create the hexagram."

**Clarification**: "instead of entering a number, the user should click on a
number of the count, makes it mobile friendly and reduces security issues".

## Clarifications

### Session 2026-11-15

The clarification form could not reach the user, so these decisions are the
recommended defaults, adopted in autopilot. They may be overridden before implementation.

- Q: Should the tap targets represent final line values or intermediate physical counts? → A: Final line values 6–9 for both coins and yarrow; intermediate counts (e.g. number of heads, yarrow remainders) are not selectable values.
- Q: Which casting-method preference may explicit consent remember? → A: The currently selected method identifier (coins, yarrow, or User cast) only; questions, entered lines, and results are never remembered.
- Q: Where should keyboard focus go after confirming or undoing a line? → A: Focus the first numbered choice for the next line and announce its position; after the sixth confirmation, focus the result heading.

## Context & Constraints

The app currently offers two automatically generated casting methods: Three
coins and Yarrow stalks. User cast adds a third option for people casting with
physical coins or yarrow stalks who want the app to record their results and
display the consultation.

For this feature, the User cast tap targets represent final traditional line
values 6–9; they do not represent intermediate coin or yarrow counts. This
feature supersedes the earlier consultation flow's secure-randomness refusal
only for User cast. Three coins and Yarrow stalks continue to require a secure
random source.

This specification extends the existing question → casting → result flow,
not the visual identity or the interpretation of a hexagram. Existing primary
and related hexagram presentation, classical texts, optional summaries,
question handling, accessibility, and privacy commitments remain in force.

The app must remain a self-contained offline HTML file with no runtime
dependencies, network requests, or active markup injection. Builds remain
deterministic, and new interface copy follows the existing centralized,
reviewed-copy convention.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Record six physical cast results (Priority: P1)

As someone using real coins or yarrow stalks, I choose User cast and tap or
click each line's final value so the app constructs the hexagram from my own
cast rather than generating one. I do not have to type line values.

**Why this priority**: This is the requested capability and the minimum useful
manual consultation.

**Independent Test**: Choose User cast, optionally enter a question, start
casting, and select and confirm six line values. Verify each confirmed entry
fills the next line bottom-up and that the sixth produces the corresponding
primary hexagram and related hexagram, if any.

**Acceptance Scenarios**:

1. **Given** the question step, **When** I inspect the casting choices, **Then**
   Three coins, Yarrow stalks, and User cast are available, with Three coins
   remaining the default when no valid remembered preference exists.
2. **Given** User cast is selected, **When** I start, **Then** the casting step
   asks for line 1 of 6, explicitly identified as the bottom line, and no
   line is generated automatically.
3. **Given** an unfilled line, **When** I tap or click one of the visible
   numbered choices 6, 7, 8, or 9, **Then** the selected value and its meaning
   are visible, but the line is not recorded until I activate "Add line".
4. **Given** a selected valid value, **When** I activate "Add line", **Then**
   exactly one line is recorded at the next position, the figure and progress
   update, and the next line starts with no value selected.
5. **Given** fewer than six confirmed entries, **When** I wait or navigate the
   controls, **Then** no additional lines are generated and no result is shown.
6. **Given** five confirmed entries, **When** I confirm the sixth, **Then** the
   app displays the completed consultation using exactly those six values.
7. **Given** physical coins or yarrow stalks, **When** I consult the entry
   instructions, **Then** they explain that I select the final line value
   6–9, not a raw number of heads, tails, or remaining stalks.
8. **Given** the manual casting step on a touch device, **When** I select a
   numbered choice, **Then** its whole labelled target responds to a tap and
   no numeric text field or on-screen keyboard is required for line values.

---

### User Story 2 - Correct an entry before completion (Priority: P2)

As someone recording a physical cast, I can correct a mistaken selection or
undo a confirmed line without having to invent additional results or start
the whole ritual again.

**Why this priority**: An accidental entry changes the resulting hexagram;
simple correction protects fidelity to the physical cast.

**Independent Test**: Record three lines, undo the third, replace it, and
complete the remaining lines. Verify the result uses the replacement and not
the removed value.

**Acceptance Scenarios**:

1. **Given** a value selected but not confirmed, **When** I select another
   value, **Then** only the pending selection changes.
2. **Given** one to five confirmed entries, **When** I activate "Undo last
   line", **Then** the most recent line is removed, any pending selection is
   cleared, and the app asks for that position again.
3. **Given** several confirmed entries, **When** I undo repeatedly, **Then**
   each activation removes exactly the latest remaining line, stopping at
   zero entries without producing a result.
4. **Given** no confirmed entries, **When** I inspect the controls, **Then**
   "Undo last line" cannot remove a line and "Add line" is unavailable until
   a valid value is selected.

---

### User Story 3 - Reuse the method privately and without random generation (Priority: P2)

As someone who casts by hand, I can repeat the consultation and optionally
remember User cast using the same privacy controls as the other methods.
Manual entry also works when the device cannot provide secure randomness.

**Why this priority**: Manual casting must not inherit an irrelevant random
source requirement or expand the application's storage surface.

**Independent Test**: Complete a manual cast without secure randomness, choose
"Cast again", and verify the entries and question clear while the method
remains selected. Separately test consent-gated preference restoration.

**Acceptance Scenarios**:

1. **Given** a completed manual consultation, **When** I choose "Cast again",
   **Then** the app returns to the question step with User cast selected,
   no question, no pending or confirmed entries, and no previous result text.
2. **Given** User cast selected without storage consent, **When** I select
   values or complete a cast, **Then** no method, question, or cast data is
   written to persistent storage.
3. **Given** explicit "Remember my method on this device" consent, **When** I
   choose User cast and reopen the app, **Then** User cast is restored with an
   empty consultation, using only the existing method-preference storage key.
4. **Given** a remembered User cast preference, **When** I withdraw consent,
   **Then** the stored preference is deleted immediately and User cast remains
   selected for the current session.
5. **Given** secure randomness is unavailable, **When** I select User cast,
   **Then** I can complete a manual consultation; Three coins and Yarrow
   stalks still decline automatic casting with a method-specific explanation.

### Edge Cases

- **Repeated values**: All six entries may be identical. Each still requires
  a deliberate selection and confirmation; a value never carries forward.
- **Missing or invalid selection**: There is no free-text line-value input.
  Missing, out-of-range, fractional, malformed, or tampered values cannot be
  committed even through unexpected events or programmatic calls. A rejected
  submission explains what is required without changing progress or entries.
- **Repeated activation**: Double-clicking "Add line" or a held confirmation
  key cannot reuse the previous selection to fill another position.
- **Six-line limit**: After completion, further submissions cannot append a
  seventh line or replace a completed cast.
- **No changing lines**: A sequence containing only 7 and 8 displays the
  existing stable message and no related hexagram.
- **All changing lines**: Six 9s produce primary hexagram 1 and related
  hexagram 2; six 6s produce primary hexagram 2 and related hexagram 1.
- **Order-sensitive sequences**: A non-symmetric sequence must retain its
  entry order, with the first value at the bottom and the sixth at the top.
- **Method changes**: The chosen method is fixed during a cast. Returning to
  the question step to start another consultation never carries partial
  manual entries into another method. After "Cast again", the current method
  remains selected; selecting a different method on the question step changes
  the in-session choice.
- **Reload**: Pending and confirmed values, results, and questions disappear.
  Only a consented method preference may survive.
- **Disabled storage**: User cast remains usable in-session under the existing
  preference-storage behavior; no new persistence mechanism is introduced.
- **Keyboard, screen readers, and narrow screens**: Controls, selected values,
  progress, errors, and changing-line meanings remain understandable without
  relying on glyphs, color, pointer input, or animation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The casting-method selector MUST add a third option labelled
  "User cast", preserving both existing automatic options and the default.
- **FR-002**: User cast MUST accept the final line values 6, 7, 8, and 9 from
  either physical coin or yarrow casting, with these meanings:

  | Value | Meaning | Primary line | Related line |
  |---|---|---|---|
  | 6 | Old yin, changing | Broken | Solid |
  | 7 | Young yang, stable | Solid | Solid |
  | 8 | Young yin, stable | Broken | Broken |
  | 9 | Old yang, changing | Solid | Broken |

- **FR-003**: Instructions MUST explain that coin values are summed using
  heads = 3 and tails = 2, while yarrow users select the final traditional
  line value after completing the stalk procedure, not an intermediate count.
  The app cannot verify how a selected value was obtained.
- **FR-004**: The casting step MUST show four distinct, clearly numbered and
  labelled choices, 6, 7, 8 and 9, that can be tapped, clicked or operated by
  keyboard. The entire label for each choice MUST be an interactive target of
  at least 44 by 44 CSS pixels. No line-value text or numeric input field or
  on-screen keyboard is required. An explicit "Add line" action confirms the
  choice; initially no value is selected.
- **FR-005**: Confirmed entries MUST fill positions 1–6 sequentially from
  bottom to top, visibly showing the growing figure and current progress.
- **FR-006**: A successful confirmation MUST consume and clear the pending
  selection so that another confirmation cannot accidentally reuse it.
- **FR-007**: The app MUST validate against exactly 6, 7, 8 and 9 at the UI
  and core boundaries, including unexpected programmatic calls or tampered
  control values. It MUST reject invalid or missing submissions without
  altering the cast, with an accessible explanation for rejected attempts.
  The normal confirmation control MUST be disabled without a valid selection.
- **FR-008**: Before completion, users MUST be able to undo the latest
  confirmed line repeatedly, with figure, progress, and announcements updated
  to match the remaining entries.
- **FR-009**: The app MUST derive and display a result only after exactly six
  valid confirmed entries; it MUST NOT accept a seventh entry.
- **FR-010**: Primary hexagram identity, trigram composition, changing-line
  positions, related hexagram, and stable behavior MUST use the same canonical
  rules as the automatic methods, without resampling or altering user values.
- **FR-011**: Manual casting MUST NOT use randomness, automatic reveal timers,
  or "Reveal all" to invent missing values. The automatic-only reveal action
  MUST be absent from the manual casting step.
- **FR-012**: User cast MUST remain available without secure randomness.
  Automatic methods MUST retain their secure-source requirement with no
  weaker fallback. Availability messaging MUST distinguish the two cases.
- **FR-013**: Completed manual consultations MUST preserve the existing result
  experience, including question echo, attribution, primary and related texts,
  optional summaries, stable messaging, and "Cast again".
- **FR-014**: "Cast again" MUST clear pending entries, confirmed entries,
  question, result content, and summary disclosure state, while retaining the
  current in-session casting method.
- **FR-015**: Only the selected method identifier MAY be remembered, under
  explicit existing consent and the existing preference key. The valid
  identifiers are coins, yarrow, or User cast. Questions, pending selections,
  line values, and results MUST remain transient. Existing valid coins/yarrow
  preferences MUST continue to restore correctly.
- **FR-016**: New controls MUST be keyboard-operable with visible focus.
  Accessible labels MUST include value and meaning; progress, confirmations,
  undo actions, errors, and results MUST be announced. Focus MUST move
  to the first numbered choice after Add or Undo clears the current selection,
  and to the result heading after the sixth confirmation; it MUST NOT remain
  on a disabled control or in a hidden step.
- **FR-017**: Manual entry MUST work at narrow mobile widths and 200% zoom
  without horizontal overflow, meet WCAG 2.1 AA contrast in both themes, and
  respect reduced-motion preferences.
- **FR-018**: Three coins and Yarrow stalks MUST retain their existing
  probabilities, bottom-up automatic pacing, and "Reveal all" behavior.
- **FR-019**: `README.md`, `PRODUCT.md`, and
  `specs/001-iching-consultation/contracts/consultation-flow.md` MUST be
  updated when this feature ships to describe all three methods, distinguish
  automatic secure random casting from manual user-supplied line values, and
  accurately describe consented method-identifier-only persistence. The
  existing secure-randomness refusal MUST remain documented for automatic
  methods and MUST explicitly exclude User cast.

### Key Entities

- **Casting choice**: Three coins, Yarrow stalks, or User cast. The third is a
  user-input mode, not a third probability distribution.
- **Pending line selection**: One unconfirmed value from 6–9, or no selection;
  it contributes nothing to the hexagram until confirmed.
- **Confirmed cast line**: A final value, a bottom-up position from 1–6, and
  the changing/stable status determined by that value.
- **Manual consultation**: An optional question and an ordered sequence of
  zero to six confirmed lines, with derived results available only at six.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can complete a manual consultation with exactly six
  explicit confirmations; after each confirmation, the figure contains
  exactly the corresponding number of lines, and no result exists before six.
- **SC-002**: For all 4,096 possible six-value sequences, manual result
  derivation matches the canonical primary pattern, changing positions, and
  transformed pattern, retaining bottom-up order.
- **SC-003**: Focused acceptance checks for correction, missing/invalid input,
  duplicate confirmation, six-line limits, stable casts, and fully changing
  casts all pass without unintended line additions or stale results.
- **SC-004**: Manual casting completes with secure randomness unavailable and
  makes zero random-source calls; both automatic methods continue to refuse
  casting in that condition and retain their existing behavior when available.
- **SC-005**: Keyboard-only and screen-reader walkthroughs can select, confirm,
  undo, and complete a cast while identifying line position, value, meaning,
  and errors; mobile, zoom, contrast, and reduced-motion checks pass. On a
  narrow mobile viewport, each of the four numbered targets measures at least
  44 by 44 CSS pixels and can be tapped without opening a numeric keyboard.
- **SC-006**: Offline checks confirm zero network requests and no persistent
  question or cast data. Consent checks confirm only the existing method key
  is used and withdrawing consent deletes it.

## Out of Scope

- Simulating another probability distribution or replacing automatic casting.
- A coin-by-coin entry tool or a guided yarrow counting calculator.
- Recording whether physical coins or yarrow were used as separate metadata.
- Editing a completed result; users start a fresh consultation instead.
- Cast history, import/export, new storage keys, or server-side persistence.
- Changing classical texts, summaries, interpretation rules, or visual identity.

## Assumptions

- **A-001 (Input interpretation)**: "Count" means the final traditional line
  value 6–9, not an intermediate count. Both physical methods therefore use
  the same entry controls without an additional physical-method selector.
- **A-002 (Confirmation)**: Selection and confirmation are separate actions
  to reduce mistakes and allow the same value to be entered on consecutive
  lines deliberately.
- **A-003 (Completion)**: Confirming the sixth line immediately opens the
  existing Result step; no additional review screen is introduced.
- **A-004 (Correction boundary)**: Undo is available only while entering the
  cast. A mistaken sixth selection can be changed before confirming it;
  after completion, correction requires a new consultation.
- **A-005 (Preference)**: Any selected method identifier (coins, yarrow, or
  User cast) participates in the existing method-only consent mechanism; the
  physical tool and the entered values are not saved.
- **A-006 (Selection control)**: The four numbers are direct selectable
  controls, not a text-entry or numeric-entry field. Selection reduces ordinary
  invalid inputs but is not a security boundary; runtime validation remains
  necessary.
- **A-007 (Focus)**: After a successful Add or Undo, focus returns to the
  first numbered choice for the next line; confirming line six moves focus to
  the result heading.
