# I Ching — a consultation for reflection

A single-file, fully offline I Ching consultation app. Open `dist/index.html`
in any modern browser — no server, no network, no accounts — hold a question
(or don't), cast six lines, and read the resulting hexagram's classical
judgement and image, translated by James Legge (1882, public domain).

The app is deliberately **not** a fortune teller: it makes no predictions,
gives no advice on medical, legal or financial matters, and stores or sends
nothing. Your question lives on the page and in memory only.

## Try it

Open `dist/index.html` directly from disk. That's the whole app.

Or serve it (still offline-safe):

```sh
npx serve dist
```

## Build from source

Requires Node.js >= 26.

```sh
npm ci
npm run build      # assembles dist/index.html (byte-deterministic, zero runtime deps)
npm test           # 45 unit/structural tests (node --test)
npm run typecheck  # tsc --noEmit, strict
npm run verify     # static security audit of the built artifact (invariants B-1…B-14)
```

All four are wired together in CI-style order; `npm run build` fails if the
output isn't reproducible or a runtime dependency sneaks in.

## What ships

One self-contained HTML file (~50 KB):

- **Zero runtime dependencies** — the bundle is built with esbuild from strict
  TypeScript; nothing is fetched at runtime (CSP `default-src 'none'`).
- **Works from `file://`** — no origin, no APIs, no cookies required.
- **Embeds a restrictive CSP** and `Referrer-Policy: no-referrer`; the build
  verifier fail-closes on banned tokens (`eval`, `innerHTML`, `fetch`, dynamic
  import…), external resource attributes, hosting-context APIs
  (`location`, `postMessage`, storage probes…), and markup-smuggling tricks.
- **Honest cryptography** — casts use `crypto.getRandomValues` only; when no
  secure source exists, casting is declined rather than weakened.
- **One external link, by design** — the footer attribution links to
  [James Legge's Wikipedia article](https://en.wikipedia.org/wiki/James_Legge)
  in a new tab with `rel="noopener noreferrer"` and no referrer.

The only optional persistence is the casting-method preference, stored only
after explicit consent; unchecking deletes it immediately.

## Casting methods

Six lines are drawn one at a time and revealed **bottom-up**, as they were
always cast. Each line is one of four values — **7 young yang** (solid),
**8 young yin** (broken), **9 old yang** and **6 old yin** — the latter two
being *changing* lines, visibly marked in the figure. Changing lines flip to
produce the related (transformed) hexagram shown alongside the primary one; a
cast with no changing lines is simply stable.

Both methods draw from `crypto.getRandomValues` only — one random byte per
line, mapped by a fixed partition (no rejection, no modulo bias) — and differ
only in how the byte is read:

| Line value | Three coins (default) | Yarrow stalks |
|---|---|---|
| 6 — old yin (changing) | 1/8 | 1/16 |
| 7 — young yang | 3/8 | 5/16 |
| 8 — young yin | 3/8 | 7/16 |
| 9 — old yang (changing) | 1/8 | 3/16 |

- **Three coins** is the later, quicker custom: three virtual coins
  (head 3 / tail 2) sum to 6–9, giving every changing line the same 1-in-8
  chance — a total change probability of 1/4 per line. Symmetric and easy to
  do by hand with real coins.
- **Yarrow stalks** reproduces the probability profile of the classical
  stalk-counting ritual: changing yin (6) is rarest at 1/16, changing yang
  (9) three times as likely at 3/16, and young yin (8) the most common line.
  The stalk method historically favours yang change over yin change; a coin
  cast cannot reproduce that asymmetry, which is why the app offers both.

The profile of each method is declared next to its implementation in
[`src/core/casting.ts`](src/core/casting.ts) and asserted by the test suite.

**Remembering your method:** selecting coins or yarrow applies to the session
by default. Only if you tick *Remember my method on this device* is exactly
one word (your method choice) written to this browser's local storage;
unchecking deletes it immediately. Your question and your casts are never
stored under any setting.

## Project layout

```
src/core/       pure engine: line values, coins/yarrow casting, King Wen
                mapping, changing-line transform
src/data/       all authored copy (reviewed, in one place) + Legge corpus:
                64 hexagram judgements/images, names, trigrams
src/ui/         DOM wiring: steps (question → casting → result), live-region
                announcements, attribution & explanation renderers
src/shell/      the HTML/CSS shell inlined by the build
scripts/        build, corpus generation, dist verifier, deploy-config gen
tests/          node:test suites (casting stats, corpus integrity, contrast
                (WCAG AA), storage surface, purity, dist invariants)
specs/          Spec Kit artifacts for feature 001 (spec, plan, tasks, …)
deploy/         ready-made hosting configs + deployment guide
```

## Regenerating the corpus

`src/data/texts.ts` is assembled from public-domain Legge source files
([corpus/PROVENANCE.md](corpus/PROVENANCE.md) documents full provenance,
including an honest caveat on wording fidelity):

```sh
npm run corpus   # regenerate from corpus/ sources (auditable SHA-256 headers)
```

The corpus test guards completeness (64 hexagrams), attribution, and the
absence of any Wilhelm/Baynes wording.

## Deploying publicly

See [deploy/README.md](deploy/README.md): serve only `dist/index.html`, over
HTTPS, with the canonical security headers (configs provided for Netlify,
Cloudflare Pages, Vercel, Apache, nginx — all generated from
`scripts/security-headers.mjs` and drift-checked by `npm run verify:deploy`).

## Accessibility & theming

Light and dark palettes both meet WCAG AA contrast (enforced by
`tests/contrast.test.ts`), all controls are native and keyboard-operable, line
reveals and results are announced through an `aria-live` region, and text
scales with the browser font size.

## License & sources

The app code, scripts, tests, and authored copy are released under the MIT
license — see [LICENSE.md](LICENSE.md).

The hexagram texts are James Legge, *The Yi King*, Sacred Books of the East,
Vol. XVI (1882) — **public domain** and not covered by that license (see
[corpus/PROVENANCE.md](corpus/PROVENANCE.md)); they are rendered for
reflection only.
