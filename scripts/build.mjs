// Build and verify the two self-contained deliverables before publishing the
// complete output directory. Failed checks leave the last valid dist intact.
import { createRequire } from "node:module";
import {
  existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync,
  rmSync, writeFileSync
} from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { verifyDocument } from "./verify-dist.mjs";
import { canonicalData, validateCorpus } from "./validate-modern-corpus.mjs";
import { renderGuide } from "./build-modern-guide.mjs";
import { verifyModernHtml } from "./verify-modern-html.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(resolve(root, "build.mjs"));
const esbuild = require("esbuild");
const MARKER = "__SPEC_APP_BUNDLE__";
const MAX_APP_BYTES = 400 * 1024;
const distDir = resolve(root, "dist");

function assembleApp() {
  const js = esbuild.buildSync({
    absWorkingDir: root,
    entryPoints: ["src/main.ts"],
    bundle: true,
    format: "iife",
    target: ["es2020"],
    minify: true,
    charset: "utf8",
    legalComments: "none",
    sourcemap: false,
    write: false
  }).outputFiles[0].text;
  if (/<\/script/i.test(js)) throw new Error("bundle would break out of the inline <script> element");
  const shell = readFileSync(resolve(root, "src/shell/index.html"), "utf8");
  if (shell.split(MARKER).length - 1 !== 1) throw new Error("shell must contain exactly one bundle placeholder");
  return shell.replace(MARKER, () => js);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function replaceDistAtomically(stageDir) {
  let backupDir = null;
  if (existsSync(distDir)) {
    backupDir = mkdtempSync(join(root, ".dist-backup-"));
    rmSync(backupDir, { recursive: true, force: true });
    renameSync(distDir, backupDir);
  }
  try {
    renameSync(stageDir, distDir);
  } catch (error) {
    if (backupDir && !existsSync(distDir)) renameSync(backupDir, distDir);
    throw error;
  }
  if (backupDir) rmSync(backupDir, { recursive: true, force: true });
}

let stageDir;
try {
  const appHtml = assembleApp();
  const appHash = sha256(appHtml);
  if (appHash !== sha256(assembleApp())) throw new Error("non-deterministic app output");

  const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
  const runtimeDeps = Object.keys(pkg.dependencies ?? {});
  if (runtimeDeps.length > 0) throw new Error(`runtime dependencies present: ${runtimeDeps.join(", ")}`);
  const appBytes = Buffer.byteLength(appHtml, "utf8");
  if (appBytes > MAX_APP_BYTES) throw new Error(`app exceeds ${MAX_APP_BYTES / 1024} KiB size budget`);
  const appCheck = verifyDocument(appHtml, "dist/index.html");
  if (appCheck.violations.length) throw new Error(`app verifier failed:\n${appCheck.violations.join("\n")}`);

  // Read the authoritative corpus exactly once, then render the same validated
  // in-memory model twice to assert output determinism.
  const sourceBytes = readFileSync(resolve(root, "corpus/modern-prose.json"));
  const corpus = JSON.parse(sourceBytes.toString("utf8"));
  const sourceValidation = validateCorpus(corpus);
  if (sourceValidation.errors.length) throw new Error(`modern corpus validation failed:\n${sourceValidation.errors.join("\n")}`);
  const sourceHash = sha256(sourceBytes);
  const canonical = canonicalData();
  const guideHtml = renderGuide(corpus, sourceHash, canonical);
  const guideHash = sha256(guideHtml);
  const repeatedGuide = renderGuide(corpus, sourceHash, canonical);
  if (guideHash !== sha256(repeatedGuide)) throw new Error("non-deterministic modern guide output");
  const guideViolations = verifyModernHtml(guideHtml, "dist/modern-guide.html");
  if (guideViolations.length) throw new Error(`modern HTML verifier failed:\n${guideViolations.join("\n")}`);

  stageDir = mkdtempSync(join(root, ".dist-stage-"));
  writeFileSync(resolve(stageDir, "index.html"), appHtml);
  writeFileSync(resolve(stageDir, "modern-guide.html"), guideHtml);
  const stagedApp = readFileSync(resolve(stageDir, "index.html"), "utf8");
  const stagedGuide = readFileSync(resolve(stageDir, "modern-guide.html"), "utf8");
  if (verifyDocument(stagedApp, "dist/index.html").violations.length) throw new Error("staged app verification failed");
  if (verifyModernHtml(stagedGuide, "dist/modern-guide.html").length) throw new Error("staged guide verification failed");
  const outputFiles = readdirSync(stageDir).sort();
  if (outputFiles.join(",") !== "index.html,modern-guide.html") {
    throw new Error(`stage must contain exactly the two HTML deliverables; found ${outputFiles.join(", ")}`);
  }

  replaceDistAtomically(stageDir);
  stageDir = null;
  console.log(`build OK — dist/index.html (${(appBytes / 1024).toFixed(1)} KiB, sha256 ${appHash}), verifier PASS`);
  console.log(`build OK — dist/modern-guide.html (${Buffer.byteLength(guideHtml)} bytes, sha256 ${guideHash}), verifier PASS`);
  console.log(`source PASS — ${sourceValidation.report.passageCount} passages, grade ${sourceValidation.report.averageFleschKincaidGrade}, source sha256 ${sourceHash}`);
} catch (error) {
  console.error(`build FAILED — ${error.message}`);
  process.exitCode = 1;
} finally {
  if (stageDir) rmSync(stageDir, { recursive: true, force: true });
}
