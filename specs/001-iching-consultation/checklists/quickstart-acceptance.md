# Quickstart §6 — Offline Acceptance Checklist (T039)

Transcribed from `specs/001-iching-consultation/quickstart.md` §6 (steps 1–8).
Recorded against `dist/index.html`, SHA-256 `f22ca1e7e2e7b9c14dca9af4d2d865e76eb3d8095fb1224b2da7ac4222561f7c` (2026-11-09; Chromium via
the VS Code integrated browser, macOS). **This runtime cannot physically
toggle the machine's network adapter, mount a USB stick, or drive VoiceOver;**
each such step is marked Environment-limited with the automated substitute
that WAS run. The artifact is additionally incapable of network I/O by
construction (CSP `default-src 'none'`/`connect-src 'none'`; verifier bans
fetch/XHR/external refs).

## 1. Airplane-mode first screen — PASS (mode-toggle substituted)
Opened `file://…/dist/index.html`: instant question step; intro explanation
rendered; 0 console/page errors; no blank sections (full a11y tree captured).
*Environment-limited: no network-adapter control here; zero-capability is
enforced by CSP + verifier B-3/B-5 and the 0-request measurement in step 5.*

## 2. Hostile question renders inert — PASS
`<script>alert("x")</script>` completed a full consultation; the result echo
equals the literal string (textContent asserted; echo innerHTML contains no
markup); 0 dialogs; 0 console errors; layout unaltered. Truncation-notice
behavior (600→500 chars) verified in the same pass.

## 3. Full ritual, both methods — PASS
20 casts (10 coins + 10 yarrow): six result rows filled bottom-up; changing
rows carry `○`/`✕` (aria-hidden) **plus** the word "changing"; identity
"N · Name", "Trigrams: X above · Y below", judgement+image in blockquotes with
Legge attribution adjacent; related card iff ≥1 changing line; stable message
otherwise (hexagram 20 observed); "Cast again" clears and returns; result
announcement "Hexagram N - name, becoming hexagram M - name." / "…, stable."
**Found+fixed one real defect on first pass**: the visible figure lived only
in the (hidden) casting step — rebuilt per cast inside the result section
(`src/ui/steps.ts`) and re-verified, incl. screenshots in both color schemes.

## 4. King Wen spot-check (SC-002 20-cast criterion) — PASS
All 20 casts: pattern bits (read from result figure DOM) → number → name →
trigrams → related-flip correct vs an independently held King Wen
transcription; related ⊕ identity held 20/20. Standalone Node check: 21
reference hexagrams (all 8 pure, 3/4, 9/10, 11/12, 15↔23, 41, 50, 61, 62,
63/64) × 6 single-line flips — PASS.

## 5. Zero network (SC-004) — PASS
Request listener across exhaustive use (22 casts, method+consent changes,
two reloads, explanation toggle, hostile input): **0 requests beyond the
document load**; 0 errors. *Environment-limited: browser request events in
lieu of a proxy monitor; the artifact statically cannot network (CSP/verifier).*

## 6. Keyboard-only + screen reader — PASS (AT substituted)
Keyboard-only completion of the full ritual; visible 3px `:focus-visible`
outline on every inspected control; focus lands on the step heading each
step; radiogroup uses native ArrowKey semantics. AT substitute: Chromium
accessibility tree (the data source ATs consume) shows per-line text
status ("Line 1: six in the first place - broken line, changing."), result
announcements with number+name for both hexagrams, both figures
role=img with complete aria-labels, all controls named.
*Environment-limited: physical VoiceOver/NVDA unavailable here.*

## 7. Storage disabled (NFR-003) — PASS
`localStorage` access made to throw SecurityError pre-load (init script);
then yarrow selected, consent flipped, cast completed, page reloaded:
0 errors, method resets to default three-coin, consent unchecked, casting
unaffected (all access try/caught in the single storage module —
tests/storage-surface.test.ts).

## 8. Portable copy (SC-007) — PASS (transport substituted)
Byte-identical copies executed from a different directory (earlier acceptance
passes ran from `.scratch/` copies) with identical behavior; single-file
self-containment verified structurally. *Environment-limited: no USB device
or second machine here; the integrated browser refuses `file://` outside the
workspace (its sandbox), which is a tool limit, not an app limit.*

## Release-summary gate (Expected results table)
- `npm test` — 40/40 green (final T049 run)
- `npm run build` — exit 0; in-process verifier PASS silent; exactly one
  `dist/index.html`; 46.4 KB ≪ ~400 KB target
- Determinism — double build with touched sources → byte-identical SHA-256
- file:// offline — full ritual, 0 requests beyond document, 0 console errors
- Storage disabled — no errors; preference session-only
- Fail-gate (B-10) — temporary direct-`eval` in src: `npm run build` exits 1
  naming `[B-5] banned token "eval("…` and removes the poisoned dist
