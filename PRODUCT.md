# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Anyone curious about the I Ching, often alone at a quiet moment, wanting a calm, private ritual to hold a question and read a classical text for reflection — not fortune-telling.

## Product Purpose

A single-purpose consultation of the I Ching (Book of Changes): optionally hold a question, cast six lines bottom-up, and read the resulting hexagram's classical judgement and image — plus the related (transformed) hexagram when lines change. Success is a calm, unhurried ritual that leaves the meaning to the reader.

## Positioning

Honest and private by construction: one offline HTML file, zero network/tracking, real crypto randomness (coins or yarrow probabilities), public-domain Legge text, explicitly no predictions.

## Operating Context

- Opened directly from disk (`file://`) or served as a single static file; works fully offline.
- Three steps: question → casting (paced, bottom-up line reveals, with "Reveal all") → result (primary hexagram, related hexagram or stable message, question echo, "Cast again").
- Two casting methods: three coins (default) and yarrow stalks, with distinct probability profiles.

## Capabilities and Constraints

- Ships as one self-contained `dist/index.html` (~50 KB), built from strict TypeScript with zero runtime dependencies; build must stay byte-deterministic.
- Strict CSP (`default-src 'none'`; no external fonts, images, or connections). Visual work is limited to inline CSS, system fonts, Unicode glyphs, and inline markup.
- `npm run verify` enforces security invariants B-1…B-14 (no `innerHTML`, `eval`, `fetch`, storage probes, external resource attributes, etc.).
- Only persistence: the casting-method word, stored only after explicit consent. The question and casts are never stored or sent.
- `crypto.getRandomValues` only; casting is declined rather than weakened when unavailable.
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
