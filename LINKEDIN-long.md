# I shipped a 105 KB offline app with three AI tools. Here's what each one actually did.

*Full-length version — for LinkedIn Articles or a blog post. The ~3,000-char cut is in LINKEDIN.md.*

The build: a single-file I Ching consultation app. One HTML file, about 105 KB, zero
runtime dependencies, works from `file://` with the network off. No server, no accounts,
no tracking, no predictions. Automatic casting uses `crypto.getRandomValues` or nothing
at all — if a secure random source is missing, the app declines to cast rather than fall
back to something weaker. There's also a manual mode for people casting with real coins
or yarrow stalks at their kitchen table, which needs no randomness because you supply it.

It took about a week and roughly 7,000 lines of source, tests, and build scripts. Three
tools did most of the work alongside me, and each one changed a different part of how I
actually work. Honest breakdown, including the parts that were ceremony.

## 1. GitHub Spec Kit (0.13.4) + Copilot — the scaffolding that changed how I prompt

My original input was one sentence:

> "create an iching app, written in typescript, compiled to a single page html js
> distribution. focus on the idea of iching, the dist must be secure"

That's it. I ran it through the Spec Kit pipeline — `/speckit.constitution`,
`/speckit.specify`, `/speckit.plan`, `/speckit.tasks` — with Copilot as the agent
integration.

The payoff was one word: **"secure" became fourteen.** Fourteen named, testable
invariants (B-1 through B-14): no `innerHTML`, no `eval`, no `fetch`, no dynamic imports,
no storage probes, no external resource attributes, no markup-smuggling tricks. Before
Spec Kit, "the dist must be secure" was a vibe I'd argue about in a code review. After
the spec phase, it was a verifier script with an opinion and a non-zero exit code.

Every feature after that — the modern prose corpus, the hexagram summary, the manual
user-cast mode — went through the same specify → clarify → plan → tasks pipeline, each
with its own folder of artifacts. The clarify round in particular interrogated my vague
requirements in ways I hadn't thought to interrogate them myself. "What should happen if
no secure random source exists?" sounds like an edge case until you realize it's the
entire ethics of the app.

**The honest part:** the artifacts are verbose. Several checklists and research docs
were ceremony I skimmed on the way to the code. Spec Kit earns its keep on features
you'll revisit or hand off; for a 20-minute tweak it's pure overhead, and I stopped
using it for small changes. And the very first spec was written before this workspace was
even a git repository — the spec file literally notes "no git branch." Spec-driven
development, starting before version control existed. The archaeology is embarrassing
and I left it in.

## 2. Impeccable — the reviewer that wouldn't let a slide slide

Impeccable is an edit-time review hook plus finish-review agents. Every file the agents
touched got scanned; findings had to be cleared before anything was called done. Its
cache still logs the sessions: the main UI steps file edited 22 times before it passed,
the HTML shell 13, one file requiring seven separate copy edits.

And it caught real things. Marketing copy drifting toward fortune-telling ("gain
insight", "discover your future") when the entire product premise is *reflection, never
prediction*. Storage surface area quietly widening without a consent gate. Attribution
wording that overstated fidelity to the source corpus.

It also caught nothing on maybe half its runs, and "clear the findings" sometimes meant
"write a sentence the checker likes," which is not the same as writing an honest
sentence. Noisy in a useful way — a linter with opinions. It did not replace me reading
the diff, and I'd be suspicious of anyone claiming a review agent replaced them.

## 3. The boring stack — where the trust actually lives

Strict TypeScript, esbuild, Node 26's built-in test runner (`node --test`). No
framework, no runtime dependencies, deliberately. The parts of this project I trust most
aren't AI at all:

- **A dist verifier** (`verify-dist.mjs`) that statically audits the built file for the
  banned tokens and API surface the spec enumerates, and fails the build on any hit.
- **Byte-deterministic builds** — the build fails if the output isn't reproducible, so
  the file you audited is provably the file you ship.
- **A contrast test** that computes WCAG AA compliance for both palettes and fails on
  color drift.
- **Corpus provenance** — the hexagram texts are James Legge's 1882 public-domain
  translation, assembled from source files by script, with SHA-256 headers, a provenance
  document, a test asserting no Wilhelm/Baynes wording leaked in, and an explicit caveat
  about wording fidelity. For an app whose entire content is quotations, that mattered.
- **Deployment configs generated from a single source** and drift-checked by another
  verifier, because hand-maintained security headers rot.

The division of labor that emerged: I wrote the invariants, the agents wrote code
against the invariants, and the verifiers check the artifacts without caring what any
of us believe. That separation — generation decoupled from judgment — is the whole
trick. The AI can't weasel an `innerHTML` past a grep that runs in the build.

## What went sideways, kept honest

- The test suite is a `node --test` mix of `.ts` and `.js` files. That's history, not
  design, and it bothers me every time I open the folder.
- There is no CI pipeline. The README says the checks run in "CI-style order," which is
  exactly right: four npm scripts I run in order by hand, like a monk's ritual, praying.
- Zero users. No testimonials, no usage data — the product document contains an explicit
  rule that none may be invented. It's a well-verified thing nobody has needed yet.
- I never A/B tested anything, including the pacing decisions that are the whole UX.
- I still read every diff. At this size that's ~2,200 lines of source. I genuinely
  cannot remember the last project where I did that — which is the actual finding here.
  The tools didn't make me faster so much as they made the project a size I could still
  hold in my head.

## The takeaway

The AI tools didn't make the decisions. The spec and the verifier did. My job — the
irreplaceable part, this week — was deciding what "secure" and "honest" meant in
testable terms, and then refusing to soften the definitions when convenience pushed
back. Once those invariants existed, the tools were excellent at refusing to hand-wave
around them.

Define invariants first. Generate second. Verify mechanically. Ship the thing you can
prove.

The whole project is MIT-licensed: one HTML file that runs on a phone from your
Downloads folder, offline, forever. Ask me for the repo — the verifier is the
interesting part.

#SpecDrivenDevelopment #AIEngineering #TypeScript #WebSecurity #BuildInPublic #Privacy
