# Contract: Standalone HTML Publication Build

## Output and source

One validated `corpus/modern-prose.json` generates exactly one public-corpus artifact:

- `dist/modern-guide.html` — the standalone, self-contained publication.

The corpus source is read once per build. The generated HTML uses the validated passage ordering and carries the edition version, fixed publication date, and SHA-256 of the exact source JSON bytes. Required order is title/provenance, table of contents, introduction, casting guide, changing-line guide, glossary, and hexagrams 1–64. The app remains a separate self-contained deliverable at `dist/index.html`.

The corpus HTML is generated from the structured source and is never edited by hand. No PDF, EPUB, print edition, or other public-corpus format is generated.

## HTML profile

- One UTF-8 HTML file with `lang="en"` and appropriate language annotations on Chinese characters.
- Semantic heading structure, native in-page links from contents to every section and hexagram, keyboard-visible focus, scalable text, and tested WCAG 2.1 AA contrast.
- Self-contained markup and styling. CSS-only six-line figures have adjacent accessible text naming the number, name, and line types.
- No JavaScript, remote fonts, images, SVG, audio/video, forms, embedded content, event handlers, network requests, or tracking. Styles, text, figures, and navigation are within the HTML deliverable.
- A dedicated guide verifier enforces this profile and fails closed on malformed markup, scripts, remote URLs, CSS `url()`/`@import`, active content, weakened or absent restrictive policy where required by the app's equivalent security profile, and unreviewed elements/attributes.
- In-page fragment links are permitted for navigation. No external link or non-fragment resource reference is needed by the publication.

## Security and accessibility gates

1. Verify the generated HTML's markup and attributes against the dedicated fail-closed corpus profile; do not broaden the app's `verify-dist.mjs` rules.
2. Verify there are no scripts, event handlers, remote/network resources, external destinations, images/SVG, forms, media, embedded content, or tracking.
3. Check semantic headings, in-page navigation, keyboard operation and visible focus, language annotations, text alternatives for line figures, text scaling, and WCAG 2.1 AA contrast.
4. Open the publication from `file://` with network access disabled; all content and navigation remain available.
5. Validate visible source version/date/checksum and complete ordered content/citations against the structured source.
6. Require byte-identical output hashes from two clean builds with unchanged inputs. Do not write current time, absolute paths, host-specific values, or environment-only values into outputs.
7. Verify app HTML independently using the existing app security, size, and deterministic-output checks.

Security, content, accessibility, or determinism failures block release. No alternate format parity checks or print checks are part of this contract.

## Build and release boundary

Build and verify the app and public corpus as two distinct self-contained HTML deliverables. Do not inline the modern corpus into the app. Preserve the existing app-only 400 KiB limit, CSP/static-resource rules, privacy/security checks, and result content.

Release and deployment are manual. Documentation identifies `index.html` and `modern-guide.html` as the two deliverables and instructs maintainers to distribute them together. No hosting provider, target URL, automated deployment process, or target-specific configuration is required. `https://i-ching.co.za` is context/reference only.
