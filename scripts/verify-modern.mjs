import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalData, validateCorpus } from "./validate-modern-corpus.mjs";
import { renderGuide } from "./build-modern-guide.mjs";
import { verifyModernHtml } from "./verify-modern-html.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceBytes = readFileSync(resolve(root, "corpus/modern-prose.json"));
const corpus = JSON.parse(sourceBytes.toString("utf8"));
const validation = validateCorpus(corpus);
if (validation.errors.length) {
  for (const error of validation.errors) console.error(`FAIL source: ${error}`);
  process.exitCode = 1;
} else {
  const sourceHash = createHash("sha256").update(sourceBytes).digest("hex");
  const expected = renderGuide(corpus, sourceHash, canonicalData());
  const published = readFileSync(resolve(root, "dist/modern-guide.html"), "utf8");
  const violations = verifyModernHtml(published, "dist/modern-guide.html");
  for (const violation of violations) console.error(`FAIL ${violation}`);
  if (published !== expected) {
    console.error("FAIL dist/modern-guide.html differs from deterministic rendering of the validated source");
    process.exitCode = 1;
  } else if (violations.length === 0) {
    const hash = createHash("sha256").update(published).digest("hex");
    console.log(`modern publication PASS — ${validation.report.passageCount} passages, ${Buffer.byteLength(published)} bytes, source sha256 ${sourceHash}, output sha256 ${hash}`);
  }
}
