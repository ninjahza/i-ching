# I shipped a 105 KB offline app with three AI tools. Here's what each one did.

The build: a single-file I Ching consultation app. One HTML file, ~105 KB, zero runtime
dependencies, works offline from `file://`. No server, no accounts, no
tracking, no predictions. Casting uses `crypto.getRandomValues` or nothing — with no
secure random source, the app declines to cast rather than fake it.

About a week, ~7,000 lines of code, tests and scripts. Three tools did most of the work
alongside me. Honest breakdown:

**1. GitHub Spec Kit (0.13.4) + Copilot — scaffolding that changed how I prompt**

My input was one sentence: *"create an iching app, in TypeScript, compiled to a
single-page HTML distribution, the dist must be secure."*

The payoff: `/speckit.specify` forced "secure" to become fourteen named, testable
invariants (no `innerHTML`, no `eval`, no `fetch`, no storage probes) instead of a vibe.
Every later feature used the same pipeline.

The honest part: the artifacts are verbose; some checklists were ceremony I skimmed.
Spec Kit pays off on features you'll revisit; for a 20-minute tweak it's overhead.

**2. Impeccable — the reviewer that wouldn't let a slide slide**

Edit-time review hooks plus review agents. Its cache logs every session: one UI
file edited 22 times, findings cleared before it called a file clean. It caught real
things — copy drifting toward fortune-telling, storage widening without consent. On half
its runs it caught nothing. A linter with opinions — it did not replace reading the diff.

**3. The boring stack — where trust actually lives**

Strict TypeScript, esbuild, Node's built-in test runner. No framework, no runtime
deps, deliberately. What I trust most isn't AI:

- a dist verifier that fails the build on banned tokens and external attributes
- byte-deterministic builds, so the file you audited is the file you ship
- a WCAG AA contrast test that fails on color drift
- corpus provenance with SHA-256 headers and honest caveats on wording

I wrote the invariants; the agents wrote code against them; the verifier doesn't care
what anyone believes. That separation is the trick.

**What went sideways**

- The test suite is a mix of `.ts` and `.js`. History, not design.
- No CI. The README says "CI-style order" — four npm scripts I run in order, like a
  monk's ritual.
- The first spec was written before this was a git repo. The spec file says so.
- Zero users. The product doc forbids inventing testimonials.
- I still read every diff — ~2,200 lines. I can't remember the last project where I did
  that.

**The takeaway**

The AI tools didn't make the decisions — the spec and the verifier did. My job was
deciding what "secure" and "honest" meant in testable terms. Invariants first, generate
second, verify mechanically.

MIT-licensed, one HTML file, runs on a phone from your Downloads folder. Ask for
the repo — the verifier is the interesting part.

#SpecDrivenDevelopment #AIEngineering #TypeScript #WebSecurity #BuildInPublic
