// ---------------------------------------------------------------------------
// scripts/verify-deploy.mjs — hosting-lockdown gate (B-15/B-16/B-17).
//
// Independently re-parses every deploy config and asserts it expresses the
// canonical security-header spec (scripts/security-headers.mjs) exactly, plus
// the HTTPS redirect requirement where the format carries server behaviour.
// Fails closed: unknown format, missing header, drifted value -> exit 1.
//
//   node scripts/verify-deploy.mjs
// ---------------------------------------------------------------------------

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { CANONICAL_HEADERS, HEADER_CSP } from "./security-headers.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (rel) => readFileSync(root + rel, "utf8");
const violations = [];
const say = (v) => violations.push(v);

const norm = (s) => s.replace(/\s+/g, " ").trim();
const expected = CANONICAL_HEADERS.map((h) => ({ name: h.name.toLowerCase(), nameRaw: h.name, value: norm(h.value) }));

// The CSP header must be a SUPERSET of the document meta policy and must add
// the one directive meta cannot carry.
{
  if (!HEADER_CSP.includes("frame-ancestors 'none'")) say("spec: transport CSP must include frame-ancestors 'none' (B-15)");
  for (const directive of ["default-src 'none'", "script-src 'unsafe-inline'", "connect-src 'none'", "base-uri 'none'", "form-action 'none'", "object-src 'none'"]) {
    if (!HEADER_CSP.includes(directive)) say(`spec: transport CSP missing directive "${directive}" — must mirror the document meta policy`);
  }
}

// ---- deploy/_headers (Netlify & Cloudflare Pages) --------------------------
function checkHeadersFile(rel) {
  const blocks = {};
  let current = null;
  for (const line of read(rel).split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    if (!/^\s/.test(line)) {
      current = line.trim();
      blocks[current] = blocks[current] || {};
    } else if (current) {
      const m = line.trim().match(/^([A-Za-z][\w-]*):\s*(.*)$/);
      if (m) blocks[current][m[1].toLowerCase()] = norm(m[2]);
    }
  }
  for (const path of ["/", "/index.html"]) {
    const blk = blocks[path];
    if (!blk) {
      say(`${rel}: no block for path "${path}"`);
      continue;
    }
    for (const h of expected) {
      const got = blk[h.name];
      if (got === undefined) say(`${rel} [${path}]: missing header ${h.nameRaw}`);
      else if (got !== h.value) say(`${rel} [${path}]: ${h.nameRaw} value drifted\n    expected: ${h.value}\n    found:    ${got}`);
    }
  }
}
checkHeadersFile("deploy/_headers");

// ---- deploy/vercel.json ------------------------------------------------------
{
  const conf = JSON.parse(read("deploy/vercel.json"));
  const apply = (conf.headers ?? []).flatMap((r) => r.headers ?? []);
  const byName = {};
  for (const h of apply) byName[h.key.toLowerCase()] = norm(h.value);
  if (!apply.length) say("deploy/vercel.json: no headers configured");
  for (const h of expected) {
    if (byName[h.name] === undefined) say(`deploy/vercel.json: missing header ${h.nameRaw}`);
    else if (byName[h.name] !== h.value) say(`deploy/vercel.json: ${h.nameRaw} value drifted\n    expected: ${h.value}\n    found:    ${byName[h.name]}`);
  }
  const sources = (conf.headers ?? []).map((r) => r.source);
  if (!sources.some((s) => s === "/(.*)" || s === "/" || s === "/index.html"))
    say("deploy/vercel.json: headers must apply to the document path (/, /index.html or /(.*) )");
}

// ---- deploy/.htaccess (Apache) -----------------------------------------------
{
  const txt = read("deploy/.htaccess");
  for (const h of expected) {
    // Header always set Name "value"  (HSTS additionally carries env=HTTPS)
    const re = new RegExp(`^\\s*Header\\s+always\\s+set\\s+${h.nameRaw}\\s+"([^"]*)"`, "m");
    const m = txt.match(re);
    if (!m) say(`deploy/.htaccess: missing "Header always set ${h.nameRaw}"`);
    else if (norm(m[1]) !== h.value) say(`deploy/.htaccess: ${h.nameRaw} value drifted\n    expected: ${h.value}\n    found:    ${norm(m[1])}`);
    if (h.nameRaw === "Strict-Transport-Security" && m && !/env=HTTPS/.test(txt.slice(m.index, m.index + 200)))
      say("deploy/.htaccess: HSTS must be conditioned on HTTPS responses (env=HTTPS) — the vhost also serves the HTTP redirect");
  }
  if (!/RewriteRule\s+\^\s+https:\/\//.test(txt) || !/R=308/.test(txt))
    say("deploy/.htaccess: missing a 308 rewrite of plain HTTP to HTTPS (B-16)");
}

// ---- deploy/nginx.conf.example ------------------------------------------------
{
  const txt = read("deploy/nginx.conf.example");
  for (const h of expected) {
    const re = new RegExp(`add_header\\s+${h.nameRaw}\\s+"([^"]*)"`, "m");
    const m = txt.match(re);
    if (!m) say(`deploy/nginx.conf.example: missing add_header ${h.nameRaw}`);
    else if (norm(m[1]) !== h.value) say(`deploy/nginx.conf.example: ${h.nameRaw} value drifted\n    expected: ${h.value}\n    found:    ${norm(m[1])}`);
  }
  const servers = txt.split(/server\s*\{/).slice(1);
  const httpSrv = servers.find((s) => /listen\s+80\b/.test(s));
  if (!httpSrv || !/return\s+308\s+https:\/\//.test(httpSrv))
    say("deploy/nginx.conf.example: the :80 server must `return 308 https://...` (B-16)");
  const tlsSrv = servers.find((s) => /listen\s+443\s+ssl/.test(s));
  if (!tlsSrv) say("deploy/nginx.conf.example: no TLS server block found");
  else {
    for (const proto of ["TLSv1.2", "TLSv1.3"]) if (!tlsSrv.includes(proto)) say(`deploy/nginx.conf.example: TLS server must offer ${proto}`);
    if (/ssl_protocols[^;]*\b(?:SSLv[0-3]|TLSv1(?:\.[01])?(?![.\d]))/.test(tlsSrv)) say("deploy/nginx.conf.example: ssl_protocols must not offer TLS < 1.2 (NFR-5)");
    if (!/server_tokens\s+off/.test(tlsSrv)) say("deploy/nginx.conf.example: server_tokens must be off");
  }
}

// ---- report -------------------------------------------------------------------
const rel = "deploy/ hosting configs";
if (violations.length === 0) {
  console.log(`${rel}: PASS (${expected.length} canonical headers × 4 configs + HTTPS redirect) — 0 violations`);
  process.exit(0);
} else {
  console.error(`${rel}: FAIL — ${violations.length} violation(s):`);
  for (const v of violations) console.error("  ⚠ " + v);
  process.exit(1);
}
