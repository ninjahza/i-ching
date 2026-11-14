# Phase 0 Research: Modern-Prose Corpus

**Feature**: [spec.md](./spec.md) | **Date**: 2026-11-14

Research grounds the design in the updated spec and current repository. It resolves the publication format, distribution interpretation, build boundary, and deployment assumptions. No corpus content is authored here.

## R1. One structured editorial source; one generated publication

**Decision**: Add `corpus/modern-prose.json` as the sole editable source for guide sections, glossary, and all 64 entries. Validate it, compute SHA-256 from the exact UTF-8 bytes, then render the normalized records into exactly one standalone HTML file. Generate the edition version, publication date, and checksum from this source and show them in the publication.

**Rationale**:
- FR-003 requires a single structured, versioned source and one self-contained HTML publication carrying its version/date/checksum.
- Existing project convention already separates an editable archive from generated artifacts (`corpus/legge-1882.json` → `src/data/texts.ts`); the modern generator must be separate and must not edit that archive or generated runtime module.
- A shared validated source avoids a second content copy. Verification of generated HTML is still required to catch omissions and security/accessibility regressions.

**Alternatives considered**:
- Independently authoring the publication HTML duplicates content and can drift from the traceable structured source.
- Putting the prose in app TypeScript bundles it into the consultation app, contradicting FR-030 and the app's existing size/security boundary.
- Treating `corpus/legge-1882.json` as the modern source changes preserved Legge data and merges distinct works/provenance.
- Generating PDF, EPUB, or another publication format is explicitly out of scope.

## R2. Standalone HTML as the only public-corpus format

**Decision**: Generate a script-free, self-contained HTML file with semantic document structure, inline styles, accessible in-page navigation, and text-labelled CSS-only line figures. Include source references, version/date/checksum, and no remote resources. The app links to this HTML only.

**Rationale**:
- The clarified spec explicitly says the public corpus is one standalone HTML file only; PDF and other alternate formats are out of scope.
- Inline markup and styles preserve offline use and allow the public corpus deliverable to remain a single file.
- A dedicated verifier can enforce the corpus HTML's security profile without relaxing the app's stricter static-markup verifier.
- Semantic headings, keyboard access, scalable text, contrast, and text equivalents support the accessibility requirements without a separate document toolchain.

**Alternatives considered**:
- A PDF pipeline would introduce an unrequested format, compiler, fonts, parity checks, and validation; all PDF work is dropped.
- External stylesheets, scripts, fonts, images, SVG, or a hosted conversion service conflict with the standalone/offline requirement.
- Adding corpus prose to the app bundle violates the specified separation.

## R3. Reproducibility and traceability are output properties

**Decision**: Make generation deterministic from versioned source, templates, and pinned existing build tools. Avoid current timestamps, absolute paths, host-specific values, and environment-derived output. Verify the source checksum appears in the final HTML and require byte-identical corpus HTML and app output for unchanged inputs. Check the required order, references, and records in the generated HTML.

**Rationale**: A source checksum alone proves the input did not change, not that the final HTML includes all required material. Validating generated output and comparing clean repeated builds catches renderer omissions and unstable values without a second output format.

**Alternatives considered**:
- Validating only the source misses output omissions or reordering.
- Screenshot comparison misses textual and semantic structure changes.
- Embedding build time or machine-specific values makes otherwise identical output unstable.

## R4. App and corpus security boundaries

**Decision**: Keep app verification and CSP rules intact. Add a dedicated fail-closed verifier for the standalone HTML, rejecting scripts, active content, remote URLs, network-capable resources, unreviewed elements/attributes, and other features prohibited by the spec. The app's one clearly labelled link is created at runtime using the existing safe DOM construction convention; it carries no consultation data.

**Rationale**: `scripts/verify-dist.mjs` currently restricts app static resource attributes to fragments. Broadening that verifier to permit arbitrary paths would expand the app's resource surface without need. The corpus is a separate artifact and should have a narrowly defined independent profile.

**Alternatives considered**:
- A static app-shell link violates the existing static resource rule.
- Generalizing the app verifier to allow paths would weaken a rule unrelated to this feature.
- Scripted navigation, external stylesheets, remote conversion, or embedded media violate the offline/security profile.

## R5. Source preservation, editorial traceability, and manual release

**Decision**: Keep `corpus/legge-1882.json`, `corpus/the_yi_king_clean.md`, and `corpus/the_yi_king.txt` read-only. Every modern passage records precise Legge references. Record editorial review and the new work's provenance separately from the public-domain transcription and the feature 002 summaries. Manual release documentation names the two HTML deliverables and says to distribute them together, without requiring any host or target-specific configuration.

**Rationale**:
- FR-002 and FR-025–028 distinguish Legge quotation, existing 002 synthesis, and the new original editorial work.
- The clean edition contains Legge's context and line material, while `legge-1882.json` contains whole-hexagram judgement, image, and 002 summary.
- Deployment is explicitly manual. The reference URL `https://i-ching.co.za` is context only and must not drive build or deployment configuration.

**Alternatives considered**:
- Extending the archive violates byte-preservation requirements and conflates provenance.
- Recording only a general “based on Legge” note does not let a reviewer trace a passage.
- Automated deployment, a required provider, or target-specific generated configuration exceeds the clarified release scope.

## Repository evidence consulted

- `.specify/memory/constitution.md`, `PRODUCT.md`, `README.md`
- `corpus/PROVENANCE.md`, `corpus/legge-1882.json`, `corpus/the_yi_king_clean.md`
- `scripts/build.mjs`, `scripts/verify-dist.mjs`, `scripts/gen-corpus.mjs`, `scripts/gen-deploy.mjs`, `scripts/verify-deploy.mjs`, `scripts/security-headers.mjs`
- `src/shell/index.html`, `src/ui/main.ts`, `src/ui/attribution.ts`, `src/data/app-strings.ts`, `src/data/king-wen.ts`, `src/data/trigrams.ts`
