# Contract: App Link and Manual Release

## App link

- Add exactly one clearly labelled link to `modern-guide.html`; it says it opens a separate document and remains keyboard-operable with a visible focus indicator.
- Attach the link at runtime using the existing DOM-construction convention (`createElement`, `textContent`, safe relative `href` property), with `target="_blank"` only if required by the accepted user experience and `rel="noopener noreferrer"`. Do not add a static `href` to the app shell; its verifier only permits same-document fragments in static resource attributes.
- The app link passes no cast, question, hexagram, or other consultation data to the guide.
- If the app and guide are in the same folder, the link works from `file://`; when served from the same origin, the relative path resolves alongside the app. If the guide is missing, normal browser file-not-found behavior is acceptable and the app remains usable.
- The app result continues to show Legge judgement/image and feature 002 summary exactly as before. No modern text is added to the result or app bundle.

## Release contents and manual deployment

The two self-contained HTML deliverables are:

```text
index.html
modern-guide.html
```

Distribute both together in the same release folder so the app's relative link resolves offline. The guide remains a standalone document and can also be opened directly. If one file is missing, the other remains usable apart from the unavailable link target.

Update manual release/deployment documentation to identify both filenames and explain copying them together. Do not require a hosting provider, deployment target, automated deployment process, target-specific configuration, or domain. `https://i-ching.co.za` is context/reference only, not a destination to configure.

## Build and verification integration

- Build the app and standalone corpus HTML with existing project tooling; verify both before manual release.
- Preserve existing app-only size, CSP/static-resource, security, and deterministic checks. Keep corpus HTML verification in its own fail-closed profile rather than relaxing app rules.
- Manual release checks confirm the two deliverables are present and that the guide path and app link label match.
- Do not add PDF files, routes, configuration, or validation.

## Acceptance checks

1. Launch `dist/index.html` from disk with `modern-guide.html` beside it; activate the guide link with keyboard only and verify the standalone guide opens offline and has an accessible name communicating that it is separate.
2. From the guide contents, reach any selected hexagram in one activation and return via contents navigation.
3. Serve both files from the same static origin if desired; exercise both paths without relying on target-specific configuration.
4. Run existing app test, contrast, size, security, and deterministic-build checks unchanged in intent; confirm app result text stays byte-identical for all 64 records.
5. Confirm the corpus HTML passes its own security/accessibility/stability checks, and manual release instructions require only distributing the two HTML files together.
