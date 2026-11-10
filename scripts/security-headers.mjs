// ---------------------------------------------------------------------------
// scripts/security-headers.mjs — THE canonical security-header specification
// for public hosting of dist/index.html.
//
// Every deploy config in deploy/ must express EXACTLY these values, and
// scripts/verify-deploy.mjs fails (exit 1) if any config drifts. If the CSP
// in the HTML shell changes, change it here and in src/shell/index.html
// together — they are one policy, split across transport (headers) and
// document (meta) because meta CSP cannot carry frame-ancestors.
// ---------------------------------------------------------------------------

/** The document CSP (must match the <meta http-equiv> in src/shell/index.html exactly). */
export const DOC_CSP =
  "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'none'; font-src 'none'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; navigate-to 'none'";

/** Transport CSP = document policy + frame-ancestors (meta CSP cannot express frame-ancestors, B-15). */
export const HEADER_CSP = DOC_CSP + "; frame-ancestors 'none'";

const PERMISSIONS_DENIED = [
  "accelerometer", "ambient-light-sensor", "attribution-reporting", "autoplay",
  "bluetooth", "camera", "clipboard-read", "clipboard-write", "display-capture",
  "encrypted-media", "fullscreen", "gamepad", "geolocation", "gyroscope", "hid",
  "idle-detection", "interest-cohort", "magnetometer", "microphone", "midi",
  "paste", "payment", "picture-in-picture", "serial", "speaker-selection",
  "storage-access", "sync-xhr", "usb", "vr", "wake-lock", "web-share", "xr-spatial-tracking",
];

/**
 * The headers that MUST be served with the app document on a public URL.
 * HSTS is in this list; configs that also serve plain HTTP must attach it
 * only on HTTPS responses (verify-deploy.mjs enforces the conditioning).
 */
export const CANONICAL_HEADERS = [
  { name: "Content-Security-Policy", value: HEADER_CSP },
  { name: "X-Frame-Options", value: "DENY" },
  { name: "X-Content-Type-Options", value: "nosniff" },
  { name: "Referrer-Policy", value: "no-referrer" },
  { name: "Permissions-Policy", value: PERMISSIONS_DENIED.map((f) => `${f}=()`).join(", ") },
  { name: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { name: "Cross-Origin-Embedder-Policy", value: "require-corp" },
  { name: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { name: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // Fixed public URL with updatable content: short freshness, long stale-while-revalidate
  // (FR-SEC-10 intent: CDN-friendly without pinning the artifact for a year).
  { name: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800, must-revalidate" },
];
