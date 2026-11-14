import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { canonicalData, validateCorpus } from "./validate-modern-corpus.mjs";
import { verifyModernHtml } from "./verify-modern-html.mjs";
import { MODERN_GUIDE_CSS } from "./modern-guide-style.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = resolve(ROOT, "corpus/modern-prose.json");
const DEFAULT_OUTPUT = resolve(ROOT, "dist/modern-guide.html");
const CSP = "default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src 'none'; font-src 'none'; connect-src 'none'; media-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'";

const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));

export function citationLabel(ref) {
  if (ref.document === "text") {
    const part = ref.part === "line" ? `line ${ref.linePosition}` : ref.part;
    return `Legge, ${ref.section}, Hexagram ${ref.hexagramNumber}, ${part}`;
  }
  if (ref.document === "appendix") return `Legge, ${ref.section}${ref.hexagramNumber ? `, Hexagram ${ref.hexagramNumber}` : ""}`;
  if (ref.document === "introduction") return `Legge, Introduction ${ref.section}`;
  return `Legge, ${ref.section}`;
}

function citations(refs) {
  return `<p class="citation"><strong>Source:</strong> ${refs.map((ref) => `<cite>${esc(citationLabel(ref))}</cite>`).join("; ")}</p>`;
}

function renderBlock(block, canonical) {
  const start = `<div class="guide-block" id="${esc(block.id)}"><p>${esc(block.text)}</p>`;
  let detail = "";
  if (block.kind === "orderedSteps") {
    detail = `<ol>${block.steps.map((step) => `<li>${esc(step)}</li>`).join("")}</ol>`;
  } else if (block.kind === "trigramList") {
    detail = `<ul class="trigrams">${block.items.map((item) => {
      const trigram = canonical.trigrams.find((candidate) => candidate.id === item.id);
      if (!trigram) throw new Error(`Unknown trigram id ${item.id}`);
      const pair = canonical.pairs.find((candidate) => candidate.upper === trigram.id && candidate.lower === trigram.id);
      const chinese = pair ? canonical.archive[pair.number - 1]?.chinese : null;
      if (typeof chinese !== "string" || !chinese.trim()) throw new Error(`Missing Chinese name for trigram id ${item.id}`);
      return `<li><span class="trigram-chinese" lang="zh">${esc(chinese)}</span><span><strong>${esc(item.name)}</strong> — ${esc(item.image)}; ${esc(trigram.nature)}</span></li>`;
    }).join("")}</ul>`;
  } else if (block.kind === "probabilityTable") {
    detail = `<div class="table-wrap"><table><caption>Probability of each line value by method</caption><thead><tr><th scope="col">Method</th><th scope="col">6 — changing yin</th><th scope="col">7 — stable yang</th><th scope="col">8 — stable yin</th><th scope="col">9 — changing yang</th></tr></thead><tbody>${Object.entries(block.distributions).map(([method, values]) => `<tr><th scope="row">${esc(method === "coins" ? "Three coins" : "Yarrow stalks")}</th>${[6, 7, 8, 9].map((n) => `<td>${esc(values[n])}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  } else if (block.kind === "lineKey") {
    detail = `<p class="muted">Line values are recorded from the bottom upward; 6 and 9 change, while 7 and 8 remain stable.</p>`;
  } else if (block.kind === "workedExample") {
    detail = `<p class="example"><strong>Worked values, bottom to top:</strong> ${esc(block.lineValues.join(", "))}. Initial hexagram ${esc(block.initialHexagram)}; changing lines ${esc(block.changingPositions.join(", "))}; relating hexagram ${esc(block.relatingHexagram)}.</p>`;
  } else if (block.kind !== "paragraph") {
    throw new Error(`Unsupported guide block kind: ${block.kind}`);
  }
  return `${start}${detail}${citations(block.sourceReferences)}</div>`;
}

function renderFigure(entry) {
  const lines = entry.lines.map((line) => `<span class="${line.lineType}"></span>`).join("");
  const descriptions = entry.lines.map((line) => `${line.position} ${line.lineType}`).join(", ");
  return `<figure><div class="diagram" aria-hidden="true">${lines}</div><div class="figure-chinese" aria-hidden="true"><span lang="zh">${esc(entry.chinese)}</span></div><figcaption>Hexagram ${entry.number}, ${esc(entry.modernName)} — lines from bottom to top: ${esc(descriptions)}.</figcaption></figure>`;
}

function renderHexagram(entry, canonical) {
  const upper = canonical.trigrams.find((trigram) => trigram.id === entry.upperTrigramId);
  const lower = canonical.trigrams.find((trigram) => trigram.id === entry.lowerTrigramId);
  if (!upper || !lower) throw new Error(`Hexagram ${entry.number} has unknown trigram id`);
  const title = `Hexagram ${entry.number} — ${entry.modernName}`;
  const lineReadings = entry.lines.map((line) =>
    `<section class="reading" aria-labelledby="h${entry.number}-line-${line.position}"><h4 id="h${entry.number}-line-${line.position}"><span class="line-label">Line ${line.position}</span> — ${line.lineType} (${line.lineType === "yang" ? "unbroken" : "divided"})${line.position === 1 ? ", bottom" : line.position === 6 ? ", top" : ""}</h4><p>${esc(line.text)}</p>${citations(line.sourceReferences)}</section>`
  ).join("");
  const special = entry.allLinesChanging
    ? `<section class="reading" aria-labelledby="h${entry.number}-all-change"><h4 id="h${entry.number}-all-change">All six lines changing</h4><p>${esc(entry.allLinesChanging.text)}</p>${citations(entry.allLinesChanging.sourceReferences)}</section>`
    : "";
  return `<article class="hexagram" id="hexagram-${entry.number}"><h3><span lang="zh">${esc(entry.chinese)}</span> ${esc(title)}</h3><p class="metadata">Legge reference: ${esc(entry.leggeTransliteration)} — ${esc(entry.leggeTitle)}</p>${renderFigure(entry)}<p class="trigram-note">Upper trigram: ${esc(upper.name)} (${esc(upper.nature)}); lower trigram: ${esc(lower.name)} (${esc(lower.nature)}).</p><section class="reading" aria-labelledby="h${entry.number}-judgement"><h4 id="h${entry.number}-judgement">Judgement</h4><p>${esc(entry.judgement.text)}</p>${citations(entry.judgement.sourceReferences)}</section><section class="reading" aria-labelledby="h${entry.number}-image"><h4 id="h${entry.number}-image">Image</h4><p>${esc(entry.image.text)}</p>${citations(entry.image.sourceReferences)}</section>${lineReadings}${special}</article>`;
}

export function renderGuide(corpus, sourceSha256, canonical) {
  const navSections = corpus.sections.map((section) => `<li><a href="#${esc(section.id)}">${esc(section.heading)}</a></li>`).join("");
  const navHexagrams = corpus.hexagrams.map((entry) => `<li><a href="#hexagram-${entry.number}">Hexagram ${entry.number} — ${esc(entry.modernName)}</a></li>`).join("");
  const guideSections = corpus.sections.map((section) =>
    `<section id="${esc(section.id)}"><h2>${esc(section.heading)}</h2>${section.blocks.map((block) => renderBlock(block, canonical)).join("")}</section>`
  ).join("");
  const glossary = `<section id="glossary"><h2>Glossary</h2>${corpus.glossary.map((term) =>
    `<article class="glossary-entry" id="glossary-${esc(term.id)}"><h3>${esc(term.fixedRendering)}</h3><p><strong>Legge source form:</strong> ${esc(term.sourceForms.join("; "))}</p><p>${esc(term.explanation)}</p>${citations(term.sourceReferences)}</article>`
  ).join("")}</section>`;
  const hexagrams = `<section id="hexagrams"><h2>The sixty-four hexagrams</h2>${corpus.hexagrams.map((entry) => renderHexagram(entry, canonical)).join("")}</section>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<meta name="referrer" content="no-referrer">
<title>${esc(corpus.title)}</title>
<style>
${MODERN_GUIDE_CSS}</style>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<header id="top">
<h1>${esc(corpus.title)}</h1>
<p class="edition">Edition ${esc(corpus.editionVersion)} · published ${esc(corpus.publicationDate)}</p>
<p>${esc(corpus.provenance.method)} ${esc(corpus.provenance.license)}</p>
<p class="metadata">Source JSON SHA-256: <code>${esc(sourceSha256)}</code></p>
</header>
<nav aria-label="Contents" id="contents">
<h2>Contents</h2>
<ol>${navSections}<li><a href="#glossary">Glossary</a></li><li><a href="#hexagrams">All hexagrams</a></li>${navHexagrams}</ol>
</nav>
<main id="main">
${guideSections}
${glossary}
${hexagrams}
</main>
<footer><p>Modern editorial text based on James Legge's 1882 public-domain translation. The guide is for reflection; it makes no predictions and is not professional advice.</p><p><a href="#contents">Return to contents</a></p></footer>
</body>
</html>
`;
}

export function buildModernGuide(outputPath = DEFAULT_OUTPUT) {
  const sourceBytes = readFileSync(SOURCE);
  const corpus = JSON.parse(sourceBytes.toString("utf8"));
  const validation = validateCorpus(corpus);
  if (validation.errors.length) throw new Error(validation.errors.join("\n"));
  const sourceSha256 = createHash("sha256").update(sourceBytes).digest("hex");
  const html = renderGuide(corpus, sourceSha256, canonicalData());
  const violations = verifyModernHtml(html, outputPath);
  if (violations.length) throw new Error(violations.join("\n"));
  mkdirSync(dirname(outputPath), { recursive: true });
  const temporary = `${outputPath}.tmp`;
  try {
    writeFileSync(temporary, html);
    renameSync(temporary, outputPath);
  } finally {
    rmSync(temporary, { force: true });
  }
  return { outputPath, sourceSha256, htmlSha256: createHash("sha256").update(html).digest("hex"), bytes: Buffer.byteLength(html), report: validation.report };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = buildModernGuide(process.argv[2] ? resolve(process.argv[2]) : DEFAULT_OUTPUT);
    console.log(`modern guide built and verified: ${result.outputPath} (${result.bytes} bytes, sha256 ${result.htmlSha256})`);
  } catch (error) {
    console.error(`modern guide build failed: ${error.message}`);
    process.exitCode = 1;
  }
}
