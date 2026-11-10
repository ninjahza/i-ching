# I Ching App Constitution

**Version**: 1.0.0
**Ratified**: 2026-11-09
**Last Amended**: 2026-11-09

## Core Principles

### I. Fidelity to the Idea (NON-NEGOTIABLE)
The app exists to convey the *idea* of the I Ching — the Book of Changes as a mirror for reflection, not a fortune-telling machine. All hexagrams must be canonically correct (King Wen sequence, correct trigram composition), and changing-line logic must produce the correct related hexagram. Judgements and images are presented as contemplative prompts, never as predictions, guarantees, or medical/legal/financial advice. The tone is sober, poetic, and neutral across beliefs.

### II. Single-File, Self-Contained Distribution (NON-NEGOTIABLE)
The distributable is exactly one HTML file: all markup, styles, script, and the full hexagram data set are inlined. It must open and work fully offline from `file://`, with no network requests of any kind at runtime — no CDNs, no fonts, no analytics, no remote images. Source is TypeScript compiled to this one artifact.

### III. Security by Construction (NON-NEGOTIABLE)
The dist file must be safe to open anywhere:
- No `eval`, `new Function`, or any dynamic code execution.
- No `innerHTML`/`outerHTML` assignment or `document.write`; the DOM is built via `textContent` and static template nodes only.
- Zero runtime third-party dependencies; dev dependencies pinned and audited.
- A Content Security Policy meta tag (default-src `none`, inline script/style allowed, no remote origins) embedded in the dist.
- No user data leaves the device; any persistence is opt-in, local-only (`localStorage`), and clearly disclosed.
- No secrets, tokens, or environment-specific values ever bundled.

### IV. Offline-First Privacy
No accounts, no tracking, no cookies, no telemetry. Casting history, if present, is stored locally, exportable, and deletable by the user. Casting randomness uses a cryptographically secure source (`crypto.getRandomValues`) with an honest, documented fallback — casting integrity is part of the idea's integrity.

### V. Simplicity & Accessibility
One screen per step; the casting ritual (question → cast → contemplate) is the whole app. No build complexity beyond `tsc` plus a bundling step producing the single HTML. Full keyboard operability, semantic markup, and screen-reader-friendly output (each line and hexagram announced with its name and number, not just glyphs). WCAG 2.1 AA contrast.

## Technical Constraints

- Language: TypeScript (strict mode, `erasableSyntaxOnly`), compiled; no non-TypeScript logic in `src/`.
- Runtime dependencies: none. Zero exceptions (principle III).
- Build: deterministic — same source always yields a byte-identical dist.
- Testing: unit tests for hexagram data integrity (64 unique hexagrams, correct binary→King-Wen mapping, trigram composition, changing-line derivation) and cast logic; pure logic is separated from the DOM so tests run without a browser.
- All hexagram texts live in a data module attributed to a cited translation; only public-domain translations may be bundled, verified before inclusion.

## Development Workflow & Governance

- Feature work follows Spec Kit: specify → plan → tasks → implement; specs are the source of truth for behavior.
- Every change affecting dist must keep the security checklist (principle III) green; the build greps dist for banned patterns (`eval(`, `new Function`, `innerHTML`, `document.write`, `fetch(`, remote URLs) and fails on violation.
- Constitution amendments require a reasoned change and version bump (semantic: MAJOR principle removals/redefinitions, MINOR new principle, PATCH clarifications).
- YAGNI: any added dependency, feature, or principle must justify itself against principles I–III.
