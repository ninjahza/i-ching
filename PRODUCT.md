# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Anyone curious about the I Ching, often alone at a quiet moment, wanting a calm, private ritual to hold a question and read a classical text for reflection — not fortune-telling.

## Product Purpose

A single-purpose consultation of the I Ching (Book of Changes): optionally hold a question, cast six lines bottom-up, and read the resulting hexagram's classical judgement and image — plus the related (transformed) hexagram when lines change. Success is a calm, unhurried ritual that leaves the meaning to the reader.

## Positioning

Honest and private by construction: one offline HTML file, zero network/tracking, real crypto randomness for automatic casts (coins or yarrow probabilities) alongside manual physical-cast entry (User cast), public-domain Legge text, explicitly no predictions.

## Operating Context

- Opened directly from disk (`file://`) or served as a single static file; works fully offline.
- Three steps: question → casting (paced bottom-up automatic line reveals with "Reveal all", or manual bottom-up selection of final values 6–9 with "Add line" and "Undo last line") → result (primary hexagram, related hexagram or stable message, question echo, "Cast again").
- Three casting methods: Three coins (default), Yarrow stalks (distinct classical probability profile), and User cast (tappable final-value choices 6–9 for physical coins or yarrow stalks, requiring no random source).

## Capabilities and Constraints

- Ships as one self-contained `dist/index.html` (~50 KB), built from strict TypeScript with zero runtime dependencies; build must stay byte-deterministic.
- Strict CSP (`default-src 'none'`; no external fonts, images, or connections). Visual work is limited to inline CSS, system fonts, Unicode glyphs, and inline markup.
- `npm run verify` enforces security invariants B-1…B-14 (no `innerHTML`, `eval`, `fetch`, storage probes, external resource attributes, etc.).
- Only persistence: the selected casting-method identifier (`coins`, `yarrow`, or `user`) under `iching.method`, stored only after explicit consent. Questions, entered line values, and results are never stored or sent.
- Automatic casting (`coins`, `yarrow`) uses `crypto.getRandomValues` only and is declined rather than weakened when unavailable; `User cast` uses no randomness and remains available without `crypto.getRandomValues`.
- All authored copy lives in `src/data/app-strings.ts` and is review-gated.

## Brand Commitments

- Name: "I Ching — a consultation for reflection". Tagline: "A consultation for reflection, not prediction."
- Voice: sober, neutral, respectful across beliefs; no predictions, guarantees, or medical/legal/financial advice.
- Hexagram texts are attributed quotations from James Legge, *The Yi King* (1882); one deliberate external link (Legge's Wikipedia article).

## Evidence on Hand

- Full Legge corpus for all 64 hexagrams (`src/data/texts.ts`, provenance in `corpus/PROVENANCE.md`), names, trigrams, and Chinese names.
- No testimonials, users, or usage data exist; none may be invented.

## Product Principles

1. Reflection, never prediction — the text is a mirror, the meaning belongs to the reader.
2. Private by construction — nothing leaves the page; trust is proved, not claimed.
3. Honest mechanics — real randomness and faithful method probabilities, visible and explained.
4. Ritual over speed — pacing and form honour how the lines were always cast, without blocking those who want to skip ahead.

## Accessibility & Inclusion

WCAG AA contrast in both light and dark palettes (enforced by `tests/contrast.test.ts`); native, keyboard-operable controls; line reveals and results announced via an `aria-live` region; text scales with browser font size. Motion must respect `prefers-reduced-motion`.
