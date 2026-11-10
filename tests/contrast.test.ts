// T033/T046 — WCAG contrast for every colour pair the shell actually paints,
// in BOTH prefers-color-scheme modes. Parsed from src/shell/index.html so the
// audited source is the tested source (no hand-copied palette).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const html = readFileSync(join("src", "shell", "index.html"), "utf8");
const style = html.slice(html.indexOf("<style>") + 7, html.indexOf("</style>"));

const lightBlock = style.slice(style.indexOf(":root {"), style.indexOf("@media"));
const darkBlock = style.slice(style.indexOf("prefers-color-scheme: dark"));

function vars(block: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of block.matchAll(/(--[a-z]+):\s*(#[0-9a-fA-F]{6})/g)) {
    const name = m[1] as string;
    const value = m[2] as string;
    out[name] = value; // later declarations of the same var win intentionally
  }
  return out;
}

function chan(hex: string, offset: number): number {
  const u = parseInt(hex.slice(offset, offset + 2), 16) / 255;
  return u <= 0.04045 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  return 0.2126 * chan(hex, 1) + 0.7152 * chan(hex, 3) + 0.0722 * chan(hex, 5);
}

function ratio(fg: string, bg: string): number {
  const ls = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
  const a = ls[0] as number;
  const b = ls[1] as number;
  return (a + 0.05) / (b + 0.05);
}

for (const [mode, block] of [
  ["light (default)", lightBlock],
  ["dark", darkBlock],
] as const) {
  test(`palette in ${mode} mode defines every variable used`, () => {
    const v = vars(block);
    for (const name of ["--bg", "--fg", "--muted", "--line", "--accent", "--card", "--border"]) {
      assert.ok(v[name] !== undefined, `${name} missing in ${mode} palette`);
    }
  });

  test(`text pairs meet AA 4.5:1 in ${mode} mode`, () => {
    const v = vars(block);
    const bg = v["--bg"] as string;
    const card = v["--card"] as string;
    const pairs: Array<[string, string, string]> = [
      ["body (--fg on --bg)", v["--fg"] as string, bg],
      ["muted (--muted on --bg)", v["--muted"] as string, bg],
      ["fg on card", v["--fg"] as string, card],
      ["muted on card (.attribution)", v["--muted"] as string, card],
      ["accent links/labels on --bg", v["--accent"] as string, bg],
      ["accent (.changing-mark) on card", v["--accent"] as string, card],
    ];
    for (const [label, fg, b] of pairs) {
      const r = ratio(fg, b);
      assert.ok(r >= 4.5, `${label}: ${r.toFixed(2)}:1 < 4.5:1`);
    }
  });

  test(`essential graphics meet AA 3:1 in ${mode} mode`, () => {
    const v = vars(block);
    // hexagram bars (.seg uses --line) against both backgrounds they sit on
    assert.ok(ratio(v["--line"] as string, v["--bg"] as string) >= 3);
    assert.ok(ratio(v["--line"] as string, v["--card"] as string) >= 3);
    // button borders are non-essential (focus ring carries affordance), but
    // the focus outline (--accent) must be >=3:1 against both backgrounds:
    assert.ok(ratio(v["--accent"] as string, v["--bg"] as string) >= 3);
    assert.ok(ratio(v["--accent"] as string, v["--card"] as string) >= 3);
  });
}
