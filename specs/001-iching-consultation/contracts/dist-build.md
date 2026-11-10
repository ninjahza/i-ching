# Contract: dist/index.html Build & Security Invariants

**Feature**: 001-iching-consultation | Covers: FR-019…FR-021, NFR-001/002, constitution II/III | **Date**: 2026-11-09

This is the production contract for the build pipeline: any artifact failing **any** invariant below must fail `npm run build` / `scripts/verify-dist.mjs` non-zero. These clauses mirror constitution principles II and III verbatim in checkable form.

## The artifact

- **B-1 Single file**: the entire distribution is exactly one file, `dist/index.html` — all markup, one inline `<style>` block, one inline `<script>` block, and the full hexagram data (compiled in). No sibling assets may exist or be produced.
- **B-2 Opens from anywhere**: the document runs with full functionality when opened directly as `file://` from any location (USB stick, mail attachment), with the network permanently off (statically implied by B-3/B-4; behaviorally validated per quickstart §6).
- **B-3 No external references**: the verifier fails on any `src=`/`href=` (or `srcset`, `action`, `formaction`, `data`, `poster`) pointing outside same-document `#` fragments; on any occurrence of `http://` or `https://`; on protocol-relative `//host` references; on any `<link>`, `<img>`, `<iframe>`, `<object>`, `<embed>`, `<audio>`, `<video>`, `<form>` element. The document declares `<meta charset="utf-8">` first in `<head>`.
- **B-4 CSP present and strict**: a `Content-Security-Policy` meta tag exists, exactly once, inside `<head>`, with:
  `default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'none'; font-src 'none'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; navigate-to 'none'`
  The verifier asserts each directive and fails if `default-src` is anything other than `'none'`, if any directive names a remote origin, `*`, a scheme wildcard, or omits any listed directive. (`script-src`/`style-src` `'unsafe-inline'` is the documented single-file exception permitted by constitution III.)

## Dynamic code & active markup (banned tokens)

- **B-5** The verifier scans the whole document and fails on the appearance of any of: `eval(`, `new Function`, `innerHTML`, `outerHTML`, `document.write`, `document.writeln`, `fetch(`, `XMLHttpRequest`, `importScripts`, `WebAssembly`, `Function(` as a constructor call pattern, and leftover module syntax (`^import`, `export ` statements). The app never calls `Math.random` (source-review gate; casting is `crypto.getRandomValues`-only — constitution IV).
- **B-6 DOM construction discipline**: all dynamic DOM text flows through `textContent`/`setAttribute` on `createElement` nodes or pre-existing static shell nodes; no API that parses markup-from-string is used or shipped. (Structurally enforced by B-5, since the banned token list includes the markup-parsing entry points.)

## Randomness & privacy of the artifact

- **B-7 Secure source only**: casting randomness comes exclusively from `crypto.getRandomValues`; absence of the API must produce the honest decline path (flow contract C-3), never an alternate generator.
- **B-8 Privacy surface**: the only persistence permitted anywhere in the script is the `iching.method` localStorage key behind explicit consent (FR-022). The artifact contains no cookie logic, no analytics or telemetry identifiers, no secrets/tokens/environment-specific values (FR-021).

## Build determinism & verification wiring

- **B-9 Deterministic**: for identical inputs (source tree, pinned dev-dependency versions), repeated builds produce a **byte-identical** `dist/index.html` — no timestamps, paths, hashes of build environment, or map comments in output. CI check: build twice, compare SHA-256.
- **B-10 Verifier in the pipeline**: `npm run build` executes the verifier as its final stage; a violation of any clause here exits non-zero and the dist is considered **not built**. Reviewers can run the verifier standalone against any received copy: `node scripts/verify-dist.mjs path/to/index.html`. (Note: the verifier reads the file and tests fixed patterns; it must itself never execute the document's code — static checks only.)
- **B-11 Zero runtime dependencies**: `npm audit --omit=dev` reports no runtime packages; `package.json` contains an empty `dependencies` map. Dev dependencies (`typescript`, `esbuild`) are exact-version-pinned and recorded in the lockfile (constitution III: pinned and audited).
- **B-12 Reproducible data**: `src/data/texts.ts` is machine-generated with its source SHA-256 and attribution in the header; builds never fetch corpus text (research R-2).

## Release checklist gate

Before shipping any dist: B-1…B-12 green via automated run · quickstart §6 offline acceptance pass recorded · content review (§7) recorded · accessibility pass (§6 step 6) recorded.

## Hosting lockdown (public URL)

Additional clauses binding when the artifact is served from a public origin.
The canonical header specification lives in `scripts/security-headers.mjs`;
every config in `deploy/` is GENERATED from it and MUST match it.

| ID | Clause | Verification |
|---|---|---|
| B-13 | **Hosting-context inertness.** Because the artifact is published on a public origin, the whole document MUST NOT contain: URL-observation or navigation APIs (`location*`, `history*`, URLSearchParams, `window.open/name/top/parent/frames/opener`, `document.referrer`), frame/window message channels (`postMessage`, `message` listeners), cross-tab channels (`storage`/`hashchange`/`popstate` listeners, `localStorage.key/length` probes), storage enumeration (`navigator`, `document.domain`), push/pull channels (service workers, WebSocket, EventSource, sendBeacon, caches), or dynamic module loading. A zero-dependency bundle has legitimate reason to contain NONE of these; any occurrence is tamper evidence. | `verify-dist.mjs` B-13 scan fails closed. |
| B-14 | **Hosted document form.** Exactly one BARE inline `<script>` and one BARE inline `<style>` (no attributes — no src, no nonce, no integrity-override surfaces); resource attributes remain `#fragment`-only (B-3); `<meta name="referrer" content="no-referrer">` MUST be present. | `verify-dist.mjs` B-14 checks. |
| B-15 | **Header parity.** The server MUST attach the canonical header set (CSP superset incl. `frame-ancestors 'none'`, XFO DENY, nosniff, no-referrer, full-deny Permissions-Policy, COOP/COEP/CORP, HSTS, cache policy) — verified by `npm run verify:deploy`, which independently re-parses every deploy config. CSP header MUST mirror the document meta policy directive-for-directive. | `npm run verify:deploy` (exit 0). |
| B-16 | **HTTPS only.** Configs that bind plaintext HTTP MUST 308-redirect every request to HTTPS; HSTS on HTTPS responses only. | `verify-deploy.mjs` (rewrite/rules + TLS-version checks). |
| B-17 | **TOFU integrity.** The operator publishes `sha256 dist/index.html`; served bytes are `curl -s https://host/ \| shasum -a 256` and MUST match. Determinism (B-9) makes this check meaningful. | Documented in `deploy/README.md`; enforced by operator practice. |

The build pipeline additionally REMOVES `dist/` whenever the verifier fails, so
a non-compliant artifact cannot survive a failing build (fail-closed end to end).
