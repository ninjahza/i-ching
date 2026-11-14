import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
// @ts-expect-error The Node HTML renderer is JavaScript by design.
import { renderGuide } from "../scripts/build-modern-guide.mjs";
// @ts-expect-error The Node source validator is JavaScript by design.
import { canonicalData, validateCorpus } from "../scripts/validate-modern-corpus.mjs";
// @ts-expect-error The standalone verifier is JavaScript by design.
import { verifyModernHtml } from "../scripts/verify-modern-html.mjs";

const sourceBytes = readFileSync("corpus/modern-prose.json");
const source = JSON.parse(new TextDecoder().decode(sourceBytes)) as any;
const canonical = canonicalData();
const sourceHash = createHash("sha256").update(sourceBytes).digest("hex");
const html = renderGuide(source, sourceHash, canonical) as string;
const escape = (value: string): string => value.replace(/[&<>"']/g, (c) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[c]!));

test("standalone publication renders all guide content, citations, entries, and line readings in order", () => {
  assert.deepEqual(validateCorpus(source).errors, []);
  assert.deepEqual(verifyModernHtml(html), []);
  assert.match(html, /<title>The Book of Changes: A Modern Guide for Reflection<\/title>/);
  assert.match(html, new RegExp(`Source JSON SHA-256: <code>${sourceHash}<\\/code>`));
  assert.match(html, /Edition 1\.0\.0 · published 2026-11-14/);
  for (const id of ["introduction", "casting", "reading", "glossary", "hexagrams"]) {
    assert.ok(html.includes(`id="${id}"`), `missing section anchor ${id}`);
  }
  const citationNotes = [...html.matchAll(/<p class="citation">/g)];
  assert.equal(citationNotes.length, 536);
  assert.equal((html.match(/class="hexagram"/g) ?? []).length, 64);
  assert.equal((html.match(/class="diagram"/g) ?? []).length, 64);
  assert.equal((html.match(/class="reading"/g) ?? []).length, 64 * 8 + 2);
  assert.equal((html.match(/<span lang="zh">/g) ?? []).length, 128);
  assert.equal((html.match(/<span class="(?:yang|yin)"><\/span>/g) ?? []).length, 64 * 6);
  for (let i = 0; i < 64; i++) {
    const entry = source.hexagrams[i];
    assert.ok(html.includes(`id="hexagram-${i + 1}"`));
    assert.ok(html.includes(escape(entry.modernName)));
    assert.ok(html.includes(`<div class="figure-chinese" aria-hidden="true"><span lang="zh">${escape(entry.chinese)}</span></div>`));
    assert.ok(html.includes(escape(entry.leggeTransliteration)));
    assert.ok(html.includes(escape(entry.leggeTitle)));
    for (const passage of [entry.judgement, entry.image, ...entry.lines, entry.allLinesChanging].filter(Boolean)) {
      for (const ref of passage.sourceReferences) {
        const label = ref.document === "text"
          ? `Legge, ${ref.section}, Hexagram ${ref.hexagramNumber}, ${ref.part === "line" ? `line ${ref.linePosition}` : ref.part}`
          : `Legge, ${ref.section}${ref.hexagramNumber ? `, Hexagram ${ref.hexagramNumber}` : ""}`;
        assert.ok(html.includes(escape(label)), `missing hexagram source citation ${label}`);
      }
    }
    for (const line of entry.lines) assert.ok(html.includes(escape(line.text)));
    assert.ok(html.includes(escape(entry.judgement.text)));
    assert.ok(html.includes(escape(entry.image.text)));
  }
  for (const section of source.sections) {
    for (const block of section.blocks) {
      assert.ok(html.includes(escape(block.text)));
      for (const ref of block.sourceReferences) {
        const label = ref.document === "text"
          ? `Legge, ${ref.section}, Hexagram ${ref.hexagramNumber}, ${ref.part === "line" ? `line ${ref.linePosition}` : ref.part}`
          : ref.document === "appendix"
            ? `Legge, ${ref.section}${ref.hexagramNumber ? `, Hexagram ${ref.hexagramNumber}` : ""}`
            : ref.document === "introduction" ? `Legge, Introduction ${ref.section}` : `Legge, ${ref.section}`;
        assert.ok(html.includes(escape(label)), `missing source citation ${label}`);
      }
    }
  }
});

test("the eight trigrams show their Chinese names and images without duplication", () => {
  const list = html.match(/<ul class="trigrams">([\s\S]*?)<\/ul>/)?.[1];
  assert.ok(list);
  const names = [...list.matchAll(/<li><span class="trigram-chinese" lang="zh">([^<]+)<\/span><span><strong>([^<]+)<\/strong> — ([^<]+)<\/span><\/li>/g)]
    .map((match) => [match[1], match[2], match[3]]);
  assert.deepEqual(names, [
    ["坤", "K'un", "Earth"], ["震", "Chen", "Thunder"], ["坎", "K'an", "Water"], ["兌", "Tui", "Lake"],
    ["艮", "Ken", "Mountain"], ["離", "Li", "Fire"], ["巽", "Hsün", "Wind"], ["乾", "Ch'ien", "Heaven"]
  ].map(([chinese, name, image]) => [chinese, escape(name!), image]));

  const missingPair = {
    ...canonical,
    pairs: canonical.pairs.filter((pair: { upper: number; lower: number }) => pair.upper !== 0 || pair.lower !== 0)
  };
  assert.throws(() => renderGuide(source, sourceHash, missingPair), /Missing Chinese name for trigram id 0/);
});

test("trigram entries retain distinct image and nature descriptions", () => {
  const differentNature = {
    ...canonical,
    trigrams: canonical.trigrams.map((trigram: { id: number; nature: string }) =>
      trigram.id === 0 ? { ...trigram, nature: "Ground & soil" } : trigram)
  };
  const rendered = renderGuide(source, sourceHash, differentNature) as string;
  assert.ok(rendered.includes("<strong>K&#39;un</strong> — Earth; Ground &amp; soil</span>"));
});

test("HTML profile is offline, keyboard-operable, scalable, and WCAG AA contrast passes", () => {
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<meta name="referrer" content="no-referrer">/);
  assert.match(html, /<nav aria-label="Contents"/);
  assert.match(html, /<a class="skip-link" href="#main">Skip to content<\/a>/);
  assert.match(html, /a:focus-visible\s*\{[^}]*outline:/);
  assert.match(html, /font: 100%\/1\.65/);
  assert.match(html, /font-size: clamp\(/);
  assert.equal(/<script\b|<img\b|<svg\b|<iframe\b|<form\b|https?:\/\/|@import\b|url\s*\(/i.test(html), false);
  const hrefs = [...html.matchAll(/\bhref="([^"]+)"/g)].map((match) => match[1]!);
  assert.ok(hrefs.length > 65);
  for (const href of hrefs) assert.match(href, /^#[a-z][a-z0-9-]*$/);

  const luminance = (hex: string): number => {
    const channels = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
  };
  const paper = luminance("f7f5ef");
  for (const foreground of ["1c2520", "4e5e56", "174d73", "8a3d08"]) {
    const ratio = (paper + 0.05) / (luminance(foreground) + 0.05);
    assert.ok(ratio >= 4.5, `${foreground} contrast is ${ratio}`);
  }
});

test("standalone verifier rejects active, remote, malformed, and unreviewed output", () => {
  const attacks = [
    html.replace("</body>", '<script>alert(1)</script></body>'),
    html.replace('href="#main"', 'href="https://example.invalid/guide"'),
    html.replace("</style>", "a { background: url(https://example.invalid/x) }</style>"),
    html.replace("<body>", '<body onload="run()">'),
    html.replace("<main id=\"main\">", "<main id=\"main\"><img src=\"x\">"),
    html.replace('<meta http-equiv="Content-Security-Policy" content="', '<meta http-equiv="Content-Security-Policy" content="default-src *; '),
    html.replace('href="#main"', 'href="#absent-target"'),
    html.replace("</main>", "")
  ];
  for (const attack of attacks) {
    assert.ok(verifyModernHtml(attack).length > 0, "verifier accepted a changed/unsafe publication");
  }
});
