# Manual release and distribution

The feature ships two separate, self-contained HTML files:

```text
index.html
modern-guide.html
```

Distribute both files together in the same folder. The app's “Read the modern
guide” link is relative, so it opens the guide when both files are side by side.
Either file can also be opened directly from disk and works offline.

## Verify before copying

From the repository root, run:

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run verify
npm run verify:modern
```

The build validates both artifacts before publishing them as a pair under
`dist/`. It preserves the previous `dist/` if any pre-publication check fails.
The app's 400 KiB limit and its existing verifier remain unchanged; the modern
guide has a separate fail-closed verifier.

For a manual release, copy exactly `dist/index.html` and
`dist/modern-guide.html` into the release folder. Keep their names and relative
location unchanged. A release can be checked with:

```sh
shasum -a 256 index.html modern-guide.html
```

Open each file directly with network access disabled. From the app, use the
keyboard to activate the guide link, then use the guide's contents links to
reach an entry and return to the contents. If the guide file is absent, only
that link target is unavailable; the app itself remains usable.

No hosting provider, deployment target, automated deployment process, or
target-specific configuration is required by this feature. The historical
`https://i-ching.co.za` URL is context only and is not a build or release input.
