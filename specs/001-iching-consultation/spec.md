# Feature Specification: I Ching Consultation App

**Feature Branch**: `001-iching-consultation` (numeric spec id `001`; no git branch — this workspace is not a git repository)

**Created**: 2026-11-09

**Status**: Draft

**Input**: User description: "create an iching app, written in typescript, compiled to a single page html js distribution. focus on the idea of iching, the dist must be secure"

## Context & Constraints (recorded, not requirements)

The implementation language (TypeScript, strict mode) and the build target (one self-contained HTML file with all script, style, and data inlined) are project constraints ratified in the constitution (principles I–V) and recorded here so downstream planning respects them. Everything below is stated in terms of capability and outcome, independent of that implementation choice. Per the constitution, the distributable must be a single file that works fully offline from a local location, contain zero runtime third-party dependencies, embed a restrictive Content Security Policy, and never let user data leave the device.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Cast and contemplate a hexagram (Priority: P1)

A seeker opens the single HTML file (downloaded to a laptop or phone, opened directly with no server and no network), settles on a question that is weighing on them, optionally enters it as a private prompt for their own reflection, and performs a cast. Six lines appear one at a time, built from the bottom up, with any changing lines visibly marked. The app shows the resulting hexagram: its figure, its number in the King Wen sequence, its name, its trigram composition, and the traditional judgement and image texts, presented as a calm contemplative prompt. If any lines are changing, the related (transformed) hexagram is also shown with its own judgement and image. The seeker reflects, then closes the file — nothing about the question or the cast is stored or transmitted anywhere.

**Why this priority**: This is the entire product in one story. Without question → cast → contemplate there is no app; everything else is enhancement.

**Independent Test**: Open the distributable with networking disabled, complete one full consultation, and verify the displayed hexagram's identity, changing lines, and transformed hexagram against an independent reference table of the King Wen sequence and hexagram transformations. Delivers full standalone value on its own.

**Acceptance Scenarios**:

1. **Given** the app opened offline from a local file, **When** the seeker requests a cast, **Then** six lines are generated from a cryptographically secure random source and displayed bottom-up, with changing lines (old yang, old yin) visibly distinguished from stable lines.
2. **Given** a completed cast, **When** the result is shown, **Then** the hexagram is displayed with its correct King Wen number (1–64), its name, its upper and lower trigram, its judgement text, and its image text.
3. **Given** a cast containing one or more changing lines, **When** the result is shown, **Then** the app also displays the related hexagram obtained by flipping exactly the changing lines, with that hexagram's number, name, judgement, and image.
4. **Given** a cast with no changing lines, **When** the result is shown, **Then** no related hexagram is presented and the app indicates the hexagram is stable (no change).
5. **Given** a seeker who prefers not to type, **When** they cast without entering a question, **Then** the app casts normally — the question field is optional.
6. **Given** a completed consultation, **When** the seeker chooses "cast again", **Then** they return to the question step with a fresh state and no trace of the previous question or cast in the interface.

---

### User Story 2 — Choose the casting method (Priority: P2)

A seeker familiar with the tradition can choose how the hexagram is generated: the quick three-coin method, or the yarrow-stalk method with its classical probability profile. The method changes only the statistical character of the cast (the chance of each line value), never the correctness of the result.

**Why this priority**: Authenticity for knowledgeable users (principle I — fidelity), but P1 already ships a complete consultation with a sensible default method.

**Independent Test**: With each method selected in turn, run a large number of casts in a test harness and verify the four line-value frequencies match that method's declared model — three-coin: old yang 1/8, young yang 3/8, young yin 3/8, old yin 1/8; classical yarrow-stalk: old yang 3/16, young yang 5/16, young yin 7/16, old yin 1/16 (its documented asymmetry favoring old yang over old yin) — within statistical tolerance.

**Acceptance Scenarios**:

1. **Given** the method choice is reachable, **When** the seeker selects three-coin and casts, **Then** the cast follows the three-coin probability model.
2. **Given** the seeker selects yarrow-stalk, **When** many casts are observed in aggregate testing, **Then** the line-value distribution matches the classical yarrow-stalk profile, including old yang being more likely than old yin.
3. **Given** the seeker has selected a method, **When** they cast again in the same session, **Then** the selection remains active; by default the app starts each new opening with the default method (three-coin).

---

### User Story 3 — Contemplative presentation of the idea (Priority: P2)

A first-time reader with zero prior knowledge encounters the app. The interface makes clear this is the Book of Changes used as a mirror for reflection — never a fortune-telling machine. Judgement and image texts read as sober, poetic, contemplative prompts. No wording anywhere predicts the future, guarantees outcomes, or gives medical, legal, or financial advice.

**Why this priority**: Principle I is non-negotiable at the content level, but it is an overlay on the P1 flow that can be verified and refined independently of the casting machinery.

**Independent Test**: Review every string in the app (labels, help text, all 64 judgements and images, all messages) against a content checklist: no predictive claims, no advice framing, neutral tone across beliefs; texts framed as prompts for reflection.

**Acceptance Scenarios**:

1. **Given** any cast result, **When** the texts are displayed, **Then** they are attributed to the cited translation and presented as contemplative prompts, with no app-authored statement about the seeker's future.
2. **Given** the app's short in-app explanation, **When** a newcomer reads it, **Then** they can explain what an I Ching consultation is and that the app makes no predictions.

---

### User Story 4 — Private, safe, portable distribution (Priority: P2)

A privacy-conscious user opens the file and can confirm the app is safe and private: it loads instantly with no network activity, asks for no permissions, stores nothing they did not opt into, and can be copied onto a USB stick or emailed to a friend who opens it the same way.

**Why this priority**: The constitution makes this NON-NEGOTIABLE for shipping, but it is verified by inspecting the artifact and its behavior rather than by feature development, and the P1 experience works regardless.

**Independent Test**: Open the file with a network monitor attached and confirm zero requests; confirm full function with local storage disabled; confirm the file is a single document with no external references and an embedded Content Security Policy that blocks all remote origins.

**Acceptance Scenarios**:

1. **Given** a device with no network connection, **When** the seeker opens the file, **Then** the full consultation flow works with no errors, blank states, or missing content.
2. **Given** the file opened while monitoring network traffic, **When** any consultation is performed, **Then** no request to any network address is made at any time.
3. **Given** the distributed file, **When** a reviewer opens it in a text editor, **Then** all styles, script, and hexagram data are inside the one file, with a restrictive Content Security Policy declaration present.
4. **Given** the app after any number of sessions, **When** local storage is inspected, **Then** nothing is stored unless the seeker explicitly opted in (see Assumption A-4).

### Edge Cases

- **All six lines changing**: the related hexagram is the pattern with every line flipped (e.g., hexagram 1 ↔ hexagram 2); display must remain correct and complete.
- **No lines changing**: stable hexagram — no related hexagram, with wording that does not imply a lesser cast.
- **Secure randomness unavailable**: the app states plainly that casting is unavailable on this device and declines to cast; it never silently substitutes a weak source (principle IV's honest fallback).
- **Very long question**: limited or truncated gracefully with a clear message; **empty question**: allowed (FR-002).
- **Question containing markup** (angle brackets, quotes, script-like text): rendered as inert literal text, never interpreted.
- **Reload or back-navigation mid-cast**: the session may restart from the question step; no corrupted or half-cast state may persist or display as a result.
- **Small screens, large text, 200% zoom**: consultation remains fully usable; changing lines are never marked by color alone.
- **Screen reader**: each revealed line and each hexagram is announced with its name and number, not glyphs alone.
- **Keyboard-only seeker**: every step (question, cast, reveal, method change, cast again) is operable without a pointer.
- **File opened from any location** (email attachment, USB stick, download folder): behavior is identical; file location must not enable any additional capability.
- **Clock offline / unsynchronized**: the app has no date-dependent behavior, so an absent or wrong clock changes nothing.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST guide the seeker through the consultation ritual as one step per screen: pose a question → cast → contemplate.
- **FR-002**: System MUST let the seeker enter an optional free-text question for personal reflection, and MUST cast successfully when it is left empty.
- **FR-003**: System MUST generate the cast using a cryptographically secure random source available in the runtime environment, and when none is available MUST display an honest failure message and decline to cast — never a silent weak fallback.
- **FR-004**: System MUST produce six lines, assembled and displayed in traditional bottom-up order (position 1 first), each independently drawn as one of four line values: old yang (changing), young yang (stable), young yin (stable), old yin (changing).
- **FR-005**: System MUST default to the three-coin probability model (per line: old yang 1/8, young yang 3/8, young yin 3/8, old yin 1/8) and MUST offer the classical yarrow-stalk model (per line: old yang 3/16, young yang 5/16, young yin 7/16, old yin 1/16) as an explicit, selectable alternative. *(Documented decision — Assumption A-2; suggested resolution if only one method is wanted: three-coin only.)*
- **FR-006**: System MUST distinguish changing lines from stable lines with shape/text markers in addition to any color (never color alone).
- **FR-007**: System MUST identify the cast hexagram by its correct King Wen number (1–64), traditional name, figure, and upper/lower trigram composition, with the line-pattern → hexagram mapping covered by automated data-integrity checks.
- **FR-008**: System MUST display the judgement text and the image text of the cast hexagram from the cited public-domain translation, presented as a contemplative prompt with visible attribution.
- **FR-009**: When one or more lines are changing, system MUST derive and display the related hexagram by flipping exactly the changing lines (old yang → young yang, old yin → young yin; stable lines unchanged), with its number, name, judgement, and image.
- **FR-010**: When no lines are changing, system MUST indicate that the hexagram is stable and MUST NOT display a related hexagram.
- **FR-011**: System MUST present all text in a sober, neutral, contemplative tone and MUST NOT make predictions, guarantees, or medical/legal/financial advice anywhere in its wording (principle I).
- **FR-012**: System MUST offer a clear "cast again" path returning to the question step with a fresh consultation state.
- **FR-013**: System MUST render all seeker-entered text, including the question, as inert literal text wherever displayed, never as active markup.
- **FR-014**: System MUST include a short in-app explanation of what an I Ching consultation is and is not, sufficient for a first-time reader.
- **FR-015**: System MUST bundle the complete text data set for all 64 hexagrams (judgement and image, non-empty for every hexagram) from a cited, verified public-domain translation.
- **FR-016**: System MUST be fully operable by keyboard alone, with a visible focus state on every interactive element.
- **FR-017**: System MUST expose content so screen-reader users receive hexagram names, numbers, and line changes as meaningful text (never glyphs alone) — each line and hexagram announced with its name and number.
- **FR-018**: System MUST meet WCAG 2.1 AA contrast for all text and essential graphics and remain usable at 200% browser zoom.
- **FR-019**: System MUST deliver as exactly one self-contained document (all markup, styles, script, and data inlined) that runs by being opened directly, offline, from a local location, making zero network requests and containing zero references to external resources.
- **FR-020**: The distribution MUST embed a restrictive Content Security Policy (default-deny for all remote origins; only the document's own inline script and style permitted) and MUST contain no capability to execute code from data, no unsafe active-markup DOM construction, and no remote references of any kind.
- **FR-021**: The distribution MUST contain no tracking, analytics, telemetry, cookies, or accounts, and MUST bundle no secrets, tokens, or environment-specific values.
- **FR-022**: Any persistence MUST be opt-in, device-local, clearly disclosed in plain language, and deletable within the app. For v1 the only contemplated persisted item is the casting-method preference (Assumption A-4).
- **FR-023**: System MUST treat the question as private: never written to persistent storage, never sent anywhere, never included in any generated artifact (no export exists in v1).

### Key Entities

- **Line**: One of six positions in a hexagram; attributes: position (1 = bottom … 6 = top), value (old yang / young yang / young yin / old yin), changing flag. Changing lines drive transformation.
- **Hexagram**: One of the 64 canonical figures; attributes: King Wen number (1–64), name, six-line pattern, upper and lower Trigram, judgement text, image text. Each six-line pattern maps to exactly one hexagram and vice versa.
- **Trigram**: One of the eight three-line figures; attributes: name, element/nature, line pattern; composes the halves of a Hexagram and is derivable from its lines.
- **Casting Method**: The random model — three-coin or classical yarrow-stalk — with its four per-line value probabilities; one method is active per cast.
- **Consultation (Session)**: One seeker's single pass: optional question, six cast lines, resulting Hexagram, its changing lines, and the Related Hexagram (present only when lines change). Transient by default.
- **Translation Text Set**: The cited, public-domain judgement/image corpus covering all 64 hexagrams, bundled in full with attribution.

## Non-Functional Requirements

- **NFR-001 (Security)**: The distribution is statically and automatically verifiable as safe: no dynamic-code-execution constructs, no active-markup injection constructs, no network-fetch constructs, no remote URLs or references, and an embedded CSP denying all remote origins. Verification tooling fails the build on any violation (constitution governance checklist).
- **NFR-002 (Offline-first)**: Full functionality with the network permanently unavailable; time from opening the file to a first interactive screen is effectively instant on ordinary hardware (a single small self-contained file).
- **NFR-003 (Privacy)**: Nothing leaves the device, ever; nothing is stored by default; a seeker with local storage fully disabled loses no v1 functionality.
- **NFR-004 (Accessibility)**: WCAG 2.1 AA as specified in FR-016–FR-018; the full ritual is achievable with assistive technology alone.
- **NFR-005 (Correctness)**: The data set — 64 unique patterns, binary → King Wen mapping, trigram composition, changing-line transformation, and text completeness (non-empty judgement and image for every hexagram) — is verified by automated tests over the casting and mapping logic independent of any browser.
- **NFR-006 (Simplicity)**: The app contains no screens beyond the ritual (question, cast, contemplate) plus the method choice and the short explanation; no features beyond this specification (YAGNI).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time seeker completes a full consultation (question → cast → hexagram with texts) in under 2 minutes from opening the file, with zero setup steps.
- **SC-002**: 100% of the 64 hexagrams pass automated integrity checks (unique patterns, correct King Wen mapping, correct trigram composition, correct transformation derivation, non-empty judgement and image), and 100% of a 20-cast random spot-check matches an independent reference table for hexagram identity and related hexagram.
- **SC-003**: Validation over at least 100,000 simulated casts per method shows observed line-value frequencies within 0.5 percentage points of the declared three-coin and yarrow-stalk profiles respectively.
- **SC-004**: Network monitoring during exhaustive use records 0 requests; a static audit of the distribution finds 0 external references, 0 dynamic-code-execution constructs, and 0 storage writes the user did not opt into.
- **SC-005**: A keyboard-only user and a screen-reader user each complete a full consultation end-to-end; automated accessibility checks report no violations.
- **SC-006**: A content review of every app string and all 64 judgement/image texts finds 0 instances of predictive, advicive, or belief-biased wording; at least 4 of 5 first-time readers describe the app as "for reflection, not prediction" after one use.
- **SC-007**: The distribution opened from arbitrary new locations (USB stick, email attachment, a different machine with no network) is fully functional 100% of the time tested.

## Assumptions

- **A-1 (Audience & platform)**: Seekers use a modern browser (desktop or mobile, circa last five years) that provides a cryptographically secure random source and permits inline script/style in local documents; no installation, server, or account is needed.
- **A-2 (Casting methods — decision)**: v1 offers both methods, three-coin as default and yarrow-stalk as a selectable alternative, because supporting both is inexpensive, honors fidelity to the tradition (principle I), and preserves a genuinely valid alternative. Single acceptable reduction if the product owner prefers one method: three-coin only.
- **A-3 (Translation — decision)**: Texts come from James Legge's *The Yi King* (Sacred Books of the East, Vol. XVI, 1882), public domain worldwide. The widely known Wilhelm/Baynes (1950) translation is still under copyright and MUST NOT be bundled; the chosen edition is license-verified before inclusion (constitution constraint). Legge's 19th-century idiom is accepted as consistent with a sober, classical tone.
- **A-4 (Persistence — decision)**: v1 persists at most the casting-method preference, stored locally and only with the seeker's consent; casting history and question history are out of scope for v1 (privacy-minimal per principle IV; YAGNI). History could return as a later feature with the export/delete guarantees the constitution requires.
- **A-5 (Reading rules)**: v1 shows the primary hexagram's judgement and image, plus the related hexagram's judgement and image when lines change. The classical multi-changing-line reading conventions are not encoded by the app; it neither prescribes nor forbids traditional reading habits in its wording. (Per FR-015's data set, individual line texts are optional extras for v1.)
- **A-6 (Language & users)**: English only, from the cited translation; single local user; no accounts or multi-user features.
- **A-7 (Git-less workspace)**: No git branch exists (the workspace is not a repository); the numeric spec id `001` stands in for the branch identifier, consistent with the sequential numbering configured in `.specify/init-options.json`.
- **A-8 (Old devices)**: Browsers lacking a secure random source are handled explicitly by FR-003 (decline to cast, honest message), not by a weak fallback.
- **A-9 (No date/time features)**: The app performs no date-dependent behavior (no "hexagram of the day", no timestamps shown), which keeps it correct on clock-less or offline devices.
