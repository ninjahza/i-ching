// T029 — storage surface audit (FR-022, FR-023, SC-004, B-8).
// Static scan of ALL production sources: localStorage may be touched ONLY
// inside src/ui/method-pref.ts, no other storage or network API exists
// anywhere, and no module that sees the question or cast results performs
// storage I/O or even imports the persistence module.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const SRC = join("src");

function tsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...tsFiles(p));
    else if (name.endsWith(".ts")) out.push(p);
  }
  return out;
}

const files = tsFiles(SRC);
assert.ok(files.length >= 12, `expected the full source tree, found ${files.length} files`);

const ALLOW_STORAGE_FILE = join(SRC, "ui", "method-pref.ts");

test("localStorage appears only in method-pref.ts", () => {
  const offenders: string[] = [];
  for (const f of files) {
    if (f === ALLOW_STORAGE_FILE) continue;
    const text = readFileSync(f, "utf8");
    if (text.includes("localStorage")) offenders.push(f.slice(SRC.length + 1));
  }
  assert.deepEqual(offenders, []);
});

test("no other storage, tracking, or network API exists anywhere in src", () => {
  const banned = [
    "sessionStorage",
    "indexedDB",
    "document.cookie",
    "navigator.storage",
    "serviceWorker",
    "XMLHttpRequest",
    "fetch(",
    "sendBeacon",
    "dataLayer",
  ];
  const offenders: string[] = [];
  for (const f of files) {
    const text = readFileSync(f, "utf8");
    for (const token of banned) {
      if (text.includes(token)) {
        offenders.push(`${f.slice(SRC.length + 1)} contains ${token}`);
      }
    }
  }
  assert.deepEqual(offenders, []);
});

test("question/cast code paths never import the persistence module", () => {
  // Question text and cast results never pass through method-pref (FR-023, C-2).
  const seesQuestion = [
    join(SRC, "core", "consultation.ts"),
    join(SRC, "core", "casting.ts"),
    join(SRC, "ui", "question-echo.ts"),
    join(SRC, "ui", "shell-bind.ts"),
    join(SRC, "ui", "line-view.ts"),
    join(SRC, "ui", "announce.ts"),
    join(SRC, "ui", "steps.ts"),
    join(SRC, "ui", "summary-disclosure.ts"),
  ];
  for (const f of seesQuestion) {
    const text = readFileSync(f, "utf8");
    assert.ok(
      !text.includes("method-pref"),
      `${f.slice(SRC.length + 1)} must not import the persistence module`,
    );
  }
});

test("method-pref touches exactly the allow-listed key", () => {
  const text = readFileSync(ALLOW_STORAGE_FILE, "utf8");
  const keys = [...text.matchAll(/"(iching\.[a-zA-Z]+)"/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(keys)], ["iching.method"]);
  assert.match(text, /STORAGE_KEYS[^=]*=\s*Object\.freeze\(\["iching\.method"\]\)/);
});
