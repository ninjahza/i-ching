// T035 — Static security verifier for dist/index.html (contracts/dist-build.md
// B-1…B-8), security-review hardened (F-1,2,3,4,5,6,7,8,10,11).
// Reads the document and tests fixed patterns. It NEVER executes the document's
// code (B-10). The pattern list lives ONLY here — never in src/ (R-1).
// Standalone: node scripts/verify-dist.mjs path/to/index.html [more files...]
//
// Architecture: the document is split into REGIONS — the raw <script> body and
// everything else (markup). Markup-level checks (tags, attributes, comments,
// PIs, element bans) run on a script-free copy, raw AND entity-decoded (F-1:
// `&#101;val&#40;` decodes to `eval(` in attribute/text context for the browser,
// so it must decode for us too). Token-level checks (B-5 dynamic code, B-7, B-8)
// run over the whole document, raw AND decoded, including the script body.
// Tags are PARSED (quote forms "..." '...' unquoted, nested `<` inside a tag,
// F-2/F-4), not matched with loose attribute regexes over the raw text.
//
// Honest scope note: a static scanner is a tripwire, not an oracle. Minified JS
// can always hide a token by string-splitting; the artifact's defense rests on
// zero runtime deps + tiny auditable source, and this verifier fails CLOSED on
// structural anomalies (comments, extra closers, trailing content, weakened CSP).
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const CSP_REQUIRED = [
  ["default-src", "'none'"],
  ["script-src", "'unsafe-inline'"],
  ["style-src", "'unsafe-inline'"],
  ["img-src", "'none'"],
  ["font-src", "'none'"],
  ["connect-src", "'none'"],
  ["object-src", "'none'"],
  ["base-uri", "'none'"],
  ["form-action", "'none'"],
  ["navigate-to", "'none'"],
];

// ---- B-5 banned tokens (word-boundary guarded: "important" ≠ import) ----
const BANNED = [
  [/\beval\s*\(/, "eval("],
  [/\beval`/, "eval` template call"],
  [/\.eval\s*\(/, ".eval( indirect eval"],
  [/\bnew\s+Function\b/, "new Function"],
  [/\binnerHTML\b/, "innerHTML"],
  [/\bouterHTML\b/, "outerHTML"],
  [/\binsertAdjacentHTML\b/, "insertAdjacentHTML"],
  [/\bdocument\s*\.\s*write(?:ln)?\s*\(/, "document.write / document.writeln"],
  [/\bfetch\s*\(/, "fetch("],
  [/\bXMLHttpRequest\b/, "XMLHttpRequest"],
  [/\bimportScripts\b/, "importScripts"],
  [/\bWebAssembly\b/, "WebAssembly"],
  [/(?<![\w$.])Function\s*\(/, "Function( constructor call"],
  [/(?:^|[^\w$.])import\s*\(/, "dynamic import("],
  [/(?:^|[;\s{}])import\s*[{*\w]/m, "leftover module import"],
  [/(?:^|[;\s{}])export\s*[{*\w]/m, "leftover module export"],
  // F-5: computed-member obfuscation gadgets — legitimate compiled code never emits these.
  [/\b(?:document|window|self|top|parent|frames|globalThis|localStorage|sessionStorage|navigator|indexedDB|location)\s*\[/, "computed member access on a web/API global"],
  [/\bMath\s*\[/, "computed Math access"],
  [/\batob\s*\(/, "atob("],
  [/javascript\s*:/i, "javascript: URI"],
  [/\bdata\s*:\s*text/i, "data:text URI"],
];

// F-10/B-3: elements that load external content or activate script.
const BANNED_ELEMENTS = new Set(["link", "img", "iframe", "object", "embed", "audio", "video", "form", "base", "svg", "math", "animate", "marquee"]);
// B-3 resource attributes: values must be same-document #fragments, ever (F-11).
const RESOURCE_ATTRS = new Set(["src", "href", "srcset", "action", "formaction", "poster", "data", "background", "xlink:href"]);

// B-13: hosting-context APIs. On a PUBLIC origin the artifact must be inert:
// no URL observation/navigation, no frame/window messaging, no neighbour
// probing, no cross-tab channels, no channels to anywhere. The zero-dependency
// bundle built from this src tree contains NONE of these — so any occurrence
// is a tamper/backdoor signal, and the scan fails closed.
const HOSTILE_HOST_CONTEXT = new RegExp(
  [
    String.raw`\b(?:document|window|self|globalThis|top|parent|frames)\s*\.\s*(?:location|history|referrer|opener|external|frameElement|dialogArguments|status|name|open)\b`,
    String.raw`\blocation\s*\.\s*(?:href|search|hash|host|hostname|origin|pathname|protocol|assign|replace|reload)\b`,
    String.raw`\bhistory\s*\.\s*(?:pushState|replaceState|go|back|forward|length)\b`,
    String.raw`\bURLSearchParams\b`,
    String.raw`\bpostMessage\b`,
    String.raw`\baddEventListener\s*\(\s*["'](?:message|storage|hashchange|popstate)["']`,
    String.raw`\bnavigator\b`,
    String.raw`\bserviceworker\w*\b`,
    String.raw`\bcaches\s*[.[]`,
    String.raw`\bindexedDB\b`,
    String.raw`\bWebSocket\b`,
    String.raw`\bEventSource\b`,
    String.raw`\bsendBeacon\b`,
    String.raw`\bdocument\s*\.\s*domain\b`,
    String.raw`\blocalStorage\s*\.\s*(?:key|length)\b`,
  ].join("|"),
  "i",
);

const TAG = /<[^>]*>?/g;
const TAG_NAME = /^<\s*\/?\s*([a-zA-Z][^\s/>]*)/;
// One attribute inside a tag; "double" | 'single' | unquoted (F-4).
const ATTR = /([A-Za-z][A-Za-z0-9_:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`=<>]+))?/g;

// Single-pass HTML entity decoding (matches browser attribute/text decoding).
const NAMED = { lt: "<", gt: ">", amp: "&", quot: '"', apos: "'", tab: " ", newline: "\n", colon: ":", lpar: "(", rpar: ")", excl: "!", num: "#", comma: ",", period: "." };
function decodeEntities(s) {
  return s.replace(/&(#[xX][0-9a-fA-F]{1,6}|#\d{1,7}|lt|gt|amp|quot|apos|tab|newline|colon|lpar|rpar|excl|num|comma|period);/gi, (m, ref) => {
    if (ref[0] === "#") {
      const cp = ref[1] === "x" || ref[1] === "X" ? parseInt(ref.slice(2), 16) : parseInt(ref.slice(1), 10);
      return Number.isFinite(cp) && cp >= 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : m;
    }
    return NAMED[ref.toLowerCase()] ?? m;
  });
}

const SCRIPT_BLOCK = /(<script\b[^>]*>)[\s\S]*?(<\/script\s*>)/gi;
const STYLE_BLOCK = /(<style\b[^>]*>)[\s\S]*?(<\/style\s*>)/gi;
const stripBodies = (s) => s.replace(SCRIPT_BLOCK, "$1$2").replace(STYLE_BLOCK, "$1$2");

/** @returns {string[]} human-readable violations (empty ⇒ pass) */
export function verifyDist(html, label = "document") {
  const v = [];
  const say = (msg) => v.push(`${label}: ${msg}`);

  // ================= B-1 single-file structure =================
  const scriptTags = html.match(/<script\b[^>]*>/gi) ?? [];
  if (scriptTags.length !== 1) say(`B-1 expected exactly one <script> tag, found ${scriptTags.length}`);
  if (scriptTags.some((t) => /\bsrc\s*=/i.test(t))) say(`B-1/B-3 inline <script> must not carry a src attribute`);
  const styleTags = html.match(/<style\b/gi) ?? [];
  if (styleTags.length !== 1) say(`B-1 expected exactly one <style> block, found ${styleTags.length}`);
  if (html.includes("__SPEC_APP_BUNDLE__")) say(`B-1 build placeholder still present — bundle not injected`);
  if ((html.match(/<\/script/gi) ?? []).length !== 1) say(`B-1 expected exactly one closing </script — possible truncation or smuggled markup (F-3)`);
  if ((html.match(/<\/style/gi) ?? []).length !== 1) say(`B-1 expected exactly one closing </style (or style body contains "</style", truncation risk)`);

  // F-3: script body must carry no markup sequences, and nothing may follow the
  // closer except the document tail. (esbuild-legal JS cannot need these.)
  const script = /<script\b[^>]*>([\s\S]*?)<\/script\s*>/i.exec(html);
  if (script) {
    const body = script[1];
    if (/<\s*script/i.test(body)) say(`B-1/F-3 script body contains a nested <script sequence (script-data-escaped state attack surface)`);
    if (/<!--|-->/.test(body)) say(`B-1/F-3 script body contains an HTML-comment sequence (script-data escape attack surface)`);
    const tail = html.slice((script.index ?? 0) + script[0].length);
    if (!/^\s*<\/body>\s*<\/html>\s*$/i.test(tail)) say(`B-1/F-3 content after </script> other than </body></html> — truncation or smuggled markup`);
  }

  // ================= head (B-3) fail-closed =================
  const head = /<head\b[^>]*>([\s\S]*?)<\/head>/i.exec(html);
  if (!head) say(`B-3 <head> element not found — check fails closed (F-4)`);
  else {
    if (!head[1].trimStart().startsWith('<meta charset="utf-8"')) say(`B-3 <meta charset="utf-8"> must be the first tag in <head>`);
    if (!/<meta\b[^>]*http-equiv\s*=\s*["']Content-Security-Policy["']/i.test(head[1])) say(`B-4 CSP meta must live inside <head>`);
  }

  // ================= markup scans: raw + entity-decoded (F-1) =================
  const markupRaw = stripBodies(html);
  const markupDecoded = stripBodies(decodeEntities(html));
  const markupDocs = markupDecoded === markupRaw ? [markupRaw] : [markupRaw, markupDecoded];
  for (const doc of markupDocs) {
    const tag = doc === markupRaw ? "" : " [entity-decoded]";
    for (const m of doc.matchAll(TAG)) {
      const t = m[0];
      const name = TAG_NAME.exec(t)?.[1]?.toLowerCase();

      // HTML comments / CDATA in markup ⇒ fail closed (F-2): masking vectors
      // like <sc<!---->ript> and comment-state attacks die here. DOCTYPE exempt.
      if (t.startsWith("<!") && !/^<!doctype\b/i.test(t)) say(`B-1/B-3${tag} markup-inclusion sequence (comment/CDATA) present: ${snip(t)}`);
      if (t.startsWith("<?")) say(`B-3${tag} processing-instruction sequence present: ${snip(t)}`);

      if (name && BANNED_ELEMENTS.has(name)) say(`B-3${tag} banned element <${name}> present: ${snip(t)}`);

      // <base href> / meta refresh handled via element ban + attribute rules below.
      for (const a of t.matchAll(ATTR)) {
        const attrName = a[1].toLowerCase();
        const value = (a[2] ?? a[3] ?? a[4]) ?? "";
        // F-10: inline event handlers (also entity-decoded forms of them).
        if (/^on[a-z][a-z0-9]*$/.test(attrName)) say(`B-3/F-10${tag} event-handler attribute "${a[1]}=" present: ${snip(t)}`);
        // B-3 resource attributes, F-4 all quote forms, F-11 empty banned.
        if (RESOURCE_ATTRS.has(attrName)) {
          if (value === "") say(`B-3/F-11${tag} ${attrName}= has an empty or absent value (resolves to document scope)`);
          else if (!value.startsWith("#")) say(`B-3${tag} ${attrName}= references "${snip(value, 60)}" — only same-document #fragments are allowed`);
          else if (value.startsWith("#/") || value.startsWith("#\\") || /\/\/|javascript:|data:/i.test(value)) say(`B-3/F-7${tag} ${attrName}= fragment "${snip(value, 60)}" embeds a scheme/host`);
        }
      }
      if (/http-equiv\s*=\s*["']?\s*refresh/i.test(t)) say(`B-3${tag} <meta http-equiv=refresh> present: ${snip(t)}`);
    }
  }
  if (/https?:\/\//i.test(markupRaw) || /https?:\/\//i.test(markupDecoded)) say(`B-3 document contains an http(s):// reference${markupDecoded !== markupRaw ? " (possibly entity-decoded)" : ""}`);
  if (/@import\b/i.test(html.match(STYLE_BLOCK)?.[0] ?? "")) say(`B-3 CSS @import present`);
  if (/url\s*\(/i.test(html.match(STYLE_BLOCK)?.[0] ?? "")) say(`B-3 CSS url() reference present`);

  // ================= CSP (B-4, exact-match, fail-closed) =================
  const cspMetas = html.match(/<meta[^>]*http-equiv\s*=\s*["']Content-Security-Policy["'][^>]*>/gi) ?? [];
  if (cspMetas.length !== 1) say(`B-4/F-8 expected exactly one CSP meta tag, found ${cspMetas.length}`);
  else {
    const csp = cspMetas[0].match(/content\s*=\s*"([^"]*)"/i) ?? cspMetas[0].match(/content\s*=\s*'([^']*)'/i);
    if (!csp) say(`B-4 CSP meta content attribute not parseable — fails closed`);
    else {
      const directives = new Map();
      for (const part of csp[1].split(";")) {
        const toks = part.trim().split(/\s+/).filter(Boolean);
        if (toks.length) directives.set(toks[0].toLowerCase(), toks.slice(1));
      }
      for (const [dName, expected] of CSP_REQUIRED) {
        const got = directives.get(dName);
        // F-8: presence IS asserted; exact single-source value required.
        if (!got) say(`B-4/F-8 CSP directive ${dName} missing — required and must be exact`);
        else if (got.length !== 1 || got[0] !== expected) say(`B-4 CSP ${dName} must be exactly "${expected}", got "${got.join(" ")}"`);
      }
      for (const [dName, srcs] of directives) {
        if (!CSP_REQUIRED.some(([n]) => n === dName)) say(`B-4 unexpected CSP directive ${dName}`);
        if (srcs.some((s) => s === "*" || /:\/\//.test(s) || (!s.startsWith("'") && !/^[a-z][a-z-]*$/.test(s)))) say(`B-4 CSP ${dName} names a remote/wildcard source`);
      }
    }
  }

  // ================= banned tokens over WHOLE doc, raw + decoded (B-5) =================
  const tokenDocs = html === decodeEntities(html) ? [html] : dedupe([html, decodeEntities(html)]);
  for (const hay of tokenDocs) {
    for (const [re, name] of BANNED) {
      const m = hay.match(re);
      if (m) say(`B-5 banned token "${name}" found near: ${snip(hay.slice(Math.max(0, (m.index ?? 0) - 24), (m.index ?? 0) + 48), 96)}${hay !== html ? " [entity-decoded]" : ""}`);
    }
  }

  // ================= URL / frame / neighbour inertness on a shared origin (B-13) =================
  // The app must not observe or navigate the hosting context: a public host may
  // be an origin neighbour of anything, and URL-borne input (query/hash) is the
  // classic remote input channel on a hosted page. The zero-dependency bundle
  // has a legitimate reason to touch NONE of these — so any appearance is a
  // supply-chain/backdoor signal, not a false positive.
  if (HOSTILE_HOST_CONTEXT.test(html)) {
    const m = html.match(HOSTILE_HOST_CONTEXT);
    say(`B-13 hosted-context API observed in artifact: "${m[0]}" near: ${snip(html.slice(Math.max(0, (m.index ?? 0) - 24), (m.index ?? 0) + 48), 96)} — the app must stay inert on a public origin`);
  }

  // ================= bare inline blocks (B-14) =================
  for (const st of html.match(/<script\b[^>]*>/gi) ?? []) {
    if (st.toLowerCase() !== "<script>") say(`B-14 script tag carries attributes (${snip(st, 60)}) — a hosted artifact ships exactly one bare inline <script>`);
  }
  for (const st of html.match(/<style\b[^>]*>/gi) ?? []) {
    if (st.toLowerCase() !== "<style>") say(`B-14 style tag carries attributes (${snip(st, 60)}) — a hosted artifact ships exactly one bare inline <style>`);
  }
  if (!/<meta\b[^>]*name\s*=\s*["']referrer["'][^>]*content\s*=\s*["']no-referrer["']/i.test(html) &&
      !/<meta\b[^>]*content\s*=\s*["']no-referrer["'][^>]*name\s*=\s*["']referrer["']/i.test(html)) {
    say(`B-14 referrer lockdown meta (<meta name="referrer" content="no-referrer">) missing — required for public hosting`);
  }

  // ================= randomness (B-7) =================
  if (/\bMath\s*\.\s*random\b/.test(html)) say(`B-7 Math.random present — casting must use crypto.getRandomValues only`);
  if (!/crypto\s*\.\s*getRandomValues/.test(html)) say(`B-7 crypto.getRandomValues not found — secure casting source missing`);

  // ================= privacy surface (B-8) =================
  if (/document\s*\.\s*cookie|\.cookie\s*=/i.test(html)) say(`B-8 cookie logic present`);
  if (/\b(gtag|google-analytics|googleAnalytics|matomo|piwik|posthog|telemetry|beacon|sendBeacon)\b/i.test(html)) say(`B-8 analytics/telemetry identifier present`);
  if (!html.includes("iching.method") && /localStorage/i.test(html)) say(`B-8 localStorage used without the sanctioned "iching.method" key literal`);
  for (const m of html.matchAll(/(?:setItem|getItem|removeItem)\s*\(\s*["']([^"']+)["']/g)) {
    if (m[1] !== "iching.method") say(`B-8 localStorage key "${m[1]}" not permitted (only iching.method)`);
  }
  if (/api[_-]?key|secret[_-]?token|bearer\s+|AKIA[0-9A-Z]{16}/i.test(html)) say(`B-8 possible secret/token pattern present`);

  return v;
}

function dedupe(arr) {
  return [...new Set(arr)];
}
function snip(s, cap = 80) {
  return `"${s.replace(/\s+/g, " ").slice(0, cap)}"`;
}

// API used by scripts/build.mjs (in-process final stage, B-10).
export function verifyDocument(html, label = "document") {
  return { violations: verifyDist(html, label), bytes: Buffer.byteLength(html, "utf8") };
}

// ---- CLI: standalone review of any received copy (B-10) ----
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.error("usage: node scripts/verify-dist.mjs path/to/index.html [...]");
    process.exit(2);
  }
  let violations = 0;
  for (const f of files) {
    const found = verifyDist(readFileSync(f, "utf8"), f);
    violations += found.length;
    for (const x of found) console.error(`FAIL ${x}`);
    if (found.length === 0) console.log(`OK ${f} — all dist invariants hold (B-1…B-8, reviewed-hardened)`);
  }
  process.exit(violations === 0 ? 0 : 1);
}
