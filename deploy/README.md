# Deploying `dist/index.html` to a public URL

The artifact is **one self-contained HTML file** (no JS/CSS/font/image requests,
no APIs, no cookies). Locking it down for a public origin means: serve **only
that file**, serve it with the **canonical security headers**, and serve it
**only over HTTPS**.

## Choose your platform config

| Platform | File to use | Notes |
|---|---|---|
| Netlify | `_headers` | place at the deploy root next to `index.html` |
| Cloudflare Pages | `_headers` | same format; headers honoured natively |
| Vercel | `vercel.json` | place at project root |
| Apache 2.4+ | `.htaccess` | needs `mod_headers` + `mod_rewrite`, `AllowOverride All` |
| nginx >= 1.19 | `nginx.conf.example` | copy, set `server_name` + cert paths |

All four express the identical header set, generated from the single source of
truth `scripts/security-headers.mjs`. Never hand-edit them — change the spec and
run `node scripts/gen-deploy.mjs`. Drift is caught in CI by `npm run verify:deploy`.

What the headers do:

- **Content-Security-Policy** — mirrors the document's own meta policy and adds
  `frame-ancestors 'none'`, which meta CSP cannot express. Nobody can iframe your page.
- **X-Frame-Options: DENY** — same protection for legacy clients.
- **X-Content-Type-Options: nosniff** — browsers must trust the declared content type.
- **Referrer-Policy: no-referrer** — leaving the app via the one external link leaks nothing (the document ships its own `referrer` meta too).
- **Permissions-Policy** — every sensitive browser feature (camera, mic, geolocation, ...) is denied for this origin, even for injected code.
- **Cross-Origin-Opener / Embedder / Resource-Policy** — full site isolation; the page shares no browsing-context group and loads nothing cross-origin (it loads nothing at all).
- **Strict-Transport-Security** — one year, includeSubDomains; served only over HTTPS by configs that also handle plaintext HTTP.
- **Cache-Control** — CDN-friendly (max-age 1 day + stale-while-revalidate 7 days) while keeping the fixed URL updatable.
- HTTP to HTTPS is a **308** redirect; plaintext content is never served.

## Serving checklist

1. Serve **only** `dist/index.html` (as `/` and `/index.html`). No directory
   listings, no other files, no server-side execution surface.
2. Apply the platform config above, then verify the live response:

           curl -sI https://your.host/ | sort

   Every canonical header must appear exactly once with the expected value —
   compare against `scripts/security-headers.mjs` or any file in this folder.
3. Confirm the plaintext redirect:

           curl -sI http://your.host/ | head -3    # expect: 308 + Location: https://...

4. **TOFU integrity** — publish the artifact fingerprint and check what is
   actually served:

           shasum -a 256 dist/index.html           # record this (release notes, homepage)
           curl -s https://your.host/ | shasum -a 256   # must match

   The build is deterministic (`npm run build` twice produces identical bytes),
   so a mismatch means the host — or something in front of it — modified the
   artifact.

## Honest limits

- `navigate-to 'none'` in the meta policy is CSP Level 3: browsers without it log
  a harmless "Unrecognized directive" console warning and ignore it. Kept as
  forward protection for the day injection could exist — today the verifier
  guarantees injection cannot exist in a compliant artifact.
- The hosted artifact passes the fail-closed static verifier (`npm run verify`),
  which additionally bans URL-observation, navigation, frame/messaging,
  storage-probing, push channels, and neighbour APIs (clause B-13) — the page is
  inert on any origin it lands on.
- CDN/WAF edge rules must not rewrite the document (HTML minification features
  on some hosts mutate bytes!). Step 4's SHA-256 check is what makes "trust me"
  unnecessary; disable any edge HTML/script optimization for this path.
