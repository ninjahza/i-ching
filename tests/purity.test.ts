// T010 — purity: src/core/** and src/data/** are browser-free and side-effect-free
// (constitution: pure logic separated from the DOM; supports R-9 / B-6)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const BANNED = [
  "document", "window", "navigator", "fetch", "XMLHttpRequest",
  "localStorage", "eval(", "new Function", "innerHTML", "Math.random"
];

function sourceFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".ts"))
    .map((f) => join(dir, f));
}

function scanFile(path: string): string[] {
  const src = readFileSync(path, "utf8");
  const problems: string[] = [];
  // Strip comments so doc-comments naming a banned word don't false-positive.
  const code = src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  for (const token of BANNED) {
    if (code.includes(token)) problems.push(`${path}: contains banned token "${token}"`);
  }
  return problems;
}

test("src/core and src/data contain no DOM/browser globals or banned constructs", () => {
  const dirs = ["src/core", "src/data"];
  const files = dirs.flatMap((d) => sourceFiles(d));
  assert.ok(files.length >= 6, `expected core+data sources under test, found ${files.length}: ${files.join(", ")}`);
  const violations = files.flatMap(scanFile);
  assert.deepEqual(violations, []);
});
