import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { MODERN_GUIDE_CSS } from "./modern-guide-style.mjs";

const ALLOWED_TAGS = new Set([
  "html", "head", "meta", "title", "style", "body", "a", "header", "nav", "ol", "ul",
  "li", "main", "section", "article", "h1", "h2", "h3", "h4", "p", "strong", "cite",
  "div", "span", "figure", "figcaption", "table", "caption", "thead", "tbody", "tr",
  "th", "td", "footer", "code"
]);
const VOID_TAGS = new Set(["meta"]);
const ATTRS_BY_TAG = {
  html: new Set(["lang"]),
  meta: new Set(["charset", "name", "content", "http-equiv"]),
  a: new Set(["class", "href"]),
  h4: new Set(["id"]),
  nav: new Set(["id", "aria-label"]),
  header: new Set(["id"]),
  main: new Set(["id"]),
  section: new Set(["id", "class", "aria-labelledby"]),
  article: new Set(["id", "class"]),
  div: new Set(["id", "class", "aria-hidden"]),
  span: new Set(["class", "lang"]),
  ul: new Set(["class"]),
  figure: new Set([]),
  th: new Set(["scope"]),
  p: new Set(["class"]),
  li: new Set(["class"]),
  ol: new Set(["class"])
};
const CSP = "default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src 'none'; font-src 'none'; connect-src 'none'; media-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'";

const TAG_TOKEN = /<\/?[A-Za-z][^>]*>|<!doctype\s+html\s*>/gi;

function parseTag(raw) {
  if (/^<!doctype\s+html\s*>$/i.test(raw)) return { doctype: true };
  const close = /^<\//.test(raw);
  const nameMatch = /^<\/?\s*([A-Za-z][A-Za-z0-9-]*)/.exec(raw);
  if (!nameMatch) return null;
  const name = nameMatch[1].toLowerCase();
  if (!raw.endsWith(">") || /\/\s*>$/.test(raw)) return { invalid: `malformed or self-closing tag ${raw.slice(0, 60)}` };
  if (close) {
    if (!/^<\/\s*[A-Za-z][A-Za-z0-9-]*\s*>$/.test(raw)) return { invalid: `malformed closing tag ${raw.slice(0, 60)}` };
    return { close: true, name, attrs: {} };
  }
  const attrs = {};
  let rest = raw.slice(nameMatch[0].length, -1);
  while (rest.length) {
    if (/^\s+$/.test(rest)) { rest = ""; break; }
    const match = /^\s+([A-Za-z][A-Za-z0-9:-]*)(?:\s*=\s*("([^"]*)"|'([^']*)'))?/.exec(rest);
    if (!match) return { invalid: `unparsed attribute syntax in ${raw.slice(0, 80)}` };
    const key = match[1].toLowerCase();
    if (Object.hasOwn(attrs, key)) return { invalid: `duplicate ${key} attribute` };
    if (match[2] == null) return { invalid: `boolean/unquoted attribute ${key} is not permitted` };
    attrs[key] = match[3] ?? match[4] ?? "";
    rest = rest.slice(match[0].length);
  }
  return { close: false, name, attrs };
}

export function verifyModernHtml(html, label = "modern guide") {
  const failures = [];
  const fail = (message) => failures.push(`${label}: ${message}`);
  if (typeof html !== "string" || !html.length) return [`${label}: empty/non-text document`];
  if (!html.startsWith("<!doctype html>")) fail("must begin with lowercase <!doctype html>");
  if ((html.match(/<!doctype/gi) ?? []).length !== 1) fail("exactly one doctype is required");
  if (/<!--|-->|<!\[CDATA\[|<\?/.test(html)) fail("comments, CDATA and processing instructions are prohibited");
  if (/<\s*(?:script|img|svg|iframe|object|embed|form|audio|video|source|link|base|math)\b/i.test(html)) fail("active content or external-resource element is prohibited");
  if (/@import\b|url\s*\(|expression\s*\(|javascript\s*:|data\s*:/i.test(html)) fail("CSS or markup contains a network/active-content construct");
  if (/https?:\/\/|\\\\|file\s*:/i.test(html)) fail("external, file, or network URL is prohibited");

  const tokens = [...html.matchAll(TAG_TOKEN)];
  const outside = html.replace(TAG_TOKEN, "");
  if (outside.includes("<") || outside.includes(">")) fail("malformed markup delimiter outside a parsed tag");
  const stack = [];
  const ids = new Set();
  const fragments = [];
  let doctypeCount = 0;
  const tagCounts = new Map();
  const metaCounts = { charset: 0, viewport: 0, csp: 0, referrer: 0 };
  let headDepth = 0;
  let styleContent = null;
  let priorEnd = 0;
  for (const token of tokens) {
    const raw = token[0];
    if (token.index > priorEnd) {
      const gap = html.slice(priorEnd, token.index);
      if (gap.includes("<") || gap.includes(">")) fail("malformed raw markup in text");
    }
    priorEnd = token.index + raw.length;
    const tag = parseTag(raw);
    if (!tag) { fail(`unrecognized tag syntax ${raw.slice(0, 50)}`); continue; }
    if (tag.doctype) { doctypeCount++; continue; }
    if (tag.invalid) { fail(tag.invalid); continue; }
    if (!ALLOWED_TAGS.has(tag.name)) fail(`unreviewed or prohibited element <${tag.name}>`);
    if (tag.close) {
      if (tag.name === "head") headDepth = 0;
      const expected = stack.pop();
      if (expected !== tag.name) fail(`misnested closing </${tag.name}>; expected </${expected ?? "nothing"}>`);
      continue;
    }
    tagCounts.set(tag.name, (tagCounts.get(tag.name) ?? 0) + 1);
    if (tag.name === "head") headDepth++;
    const allowed = ATTRS_BY_TAG[tag.name] ?? new Set();
    for (const [name, value] of Object.entries(tag.attrs)) {
      if (!allowed.has(name)) fail(`unreviewed attribute ${name} on <${tag.name}>`);
      if (/^on/i.test(name) || name === "style" || name === "src" || name === "srcset" || name === "action") fail(`active/resource attribute ${name} prohibited`);
      if (name === "id") {
        if (!/^[a-z][a-z0-9-]*$/.test(value)) fail(`invalid id ${value}`);
        if (ids.has(value)) fail(`duplicate id ${value}`);
        ids.add(value);
      }
      if (name === "href") {
        if (!value.startsWith("#") || value.length < 2 || value.includes("?") || value.includes("\\")) fail(`href must be an in-page fragment, got ${value}`);
        else fragments.push(value.slice(1));
      }
      if (name === "lang" && !["en", "zh"].includes(value)) fail(`unreviewed language annotation ${value}`);
      if (name === "aria-hidden" && value !== "true") fail("aria-hidden must be the fixed decorative value true");
      if (name === "scope" && !["col", "row"].includes(value)) fail(`invalid table scope ${value}`);
    }
    if (tag.name === "meta") {
      if (!Object.keys(tag.attrs).length) fail("meta element must have attributes");
      const keys = Object.keys(tag.attrs).sort().join(",");
      if (keys === "charset") {
        metaCounts.charset++;
        if (tag.attrs.charset.toLowerCase() !== "utf-8") fail("document charset must be UTF-8");
      } else if (keys === "content,http-equiv" && tag.attrs["http-equiv"] === "Content-Security-Policy") {
        metaCounts.csp++;
        if (tag.attrs.content !== CSP) fail("restrictive CSP is absent or not the exact reviewed policy");
      } else if (keys === "content,name" && tag.attrs.name === "referrer") {
        metaCounts.referrer++;
        if (tag.attrs.content !== "no-referrer") fail("referrer policy must be no-referrer");
      } else if (keys === "content,name" && tag.attrs.name === "viewport") {
        metaCounts.viewport++;
        if (tag.attrs.content !== "width=device-width, initial-scale=1") fail("viewport must preserve user text scaling");
      } else fail("unreviewed or incomplete meta element");
    }
    if (tag.name === "style") {
      if (headDepth !== 1 || styleContent !== null) fail("exactly one style block must be inside head");
      const after = token.index + raw.length;
      const closeAt = html.indexOf("</style>", after);
      if (closeAt < 0) fail("style element is not closed");
      else styleContent = html.slice(after, closeAt).trim();
    }
    if (!VOID_TAGS.has(tag.name)) stack.push(tag.name);
  }
  if (stack.length) fail(`unclosed elements: ${stack.join(", ")}`);
  if (doctypeCount !== 1) fail("doctype missing or duplicated");
  for (const [name, count] of Object.entries(metaCounts)) if (count !== 1) fail(`expected exactly one ${name} meta declaration`);
  for (const id of fragments) if (!ids.has(id)) fail(`fragment link #${id} has no target`);
  if (styleContent !== MODERN_GUIDE_CSS.trim()) fail("stylesheet differs from the fixed reviewed standalone stylesheet");
  for (const required of ["html", "head", "body", "title", "style", "header", "nav", "main", "footer"]) {
    if (tagCounts.get(required) !== 1) fail(`expected exactly one <${required}>`);
  }
  if (!/<html lang="en">/.test(html)) fail('root document must declare lang="en"');
  if (!/<meta charset="utf-8">/.test(html)) fail("UTF-8 charset declaration is required");
  if (!/<meta http-equiv="Content-Security-Policy" content="[^"]+">/.test(html)) fail("a restrictive policy meta element is required");
  if (!/<meta name="referrer" content="no-referrer">/.test(html)) fail("no-referrer policy is required");
  if (!/<main id="main">/.test(html) || !/<nav aria-label="Contents"/.test(html)) fail("semantic main and labelled contents navigation are required");
  if (!/Source JSON SHA-256: <code>[a-f0-9]{64}<\/code>/.test(html)) fail("visible source checksum is missing or malformed");
  if (!/Edition [^<]+ · published \d{4}-\d{2}-\d{2}/.test(html)) fail("visible fixed edition version/date are required");
  if (!/<span lang="zh">[^<]+<\/span>/.test(html)) fail("Chinese characters require a language annotation");
  if (!/<figure><div class="diagram" aria-hidden="true">/.test(html) || !/<figcaption>Hexagram 1,/.test(html)) fail("text-labelled CSS hexagram figures are required");
  if (!/<a class="skip-link" href="#main">/.test(html) || !/a:focus-visible/.test(styleContent ?? "")) fail("skip navigation and visible keyboard focus are required");
  return failures;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const files = process.argv.slice(2);
  if (files.length !== 1) {
    console.error("usage: node scripts/verify-modern-html.mjs path/to/modern-guide.html");
    process.exit(2);
  }
  const violations = verifyModernHtml(readFileSync(files[0], "utf8"), files[0]);
  if (violations.length) {
    for (const violation of violations) console.error(`FAIL ${violation}`);
    process.exitCode = 1;
  } else console.log(`OK ${files[0]} — standalone corpus HTML profile PASS`);
}
