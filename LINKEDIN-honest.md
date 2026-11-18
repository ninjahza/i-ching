# I built an I Ching app that refuses to tell your fortune. Then I made it prove it.

*Version 3 — leads with the product's honesty, tooling as the second act. ~1,250 words.*

---

The I Ching is close to three thousand years old. It is not a fortune teller. It's a
book — the *Yi Jing*, the Book of Changes — and the oldest honest thing about it is how
people use it: you hold a question you already have, six lines are built from the bottom
up, and a text assembled over many centuries holds your question back up to you in
different light.
The meaning was always yours. The book is a mirror, not a window.

Which made it an oddly perfect thing to build in 2026, because almost everything built
around this idea does the opposite. It sells you a window. It tells you what's coming,
it wants your email first, it wants your card details second, and it "shares your
reading" to a third party by default.

So I set three rules before writing a line of code:

1. **Reflection, never prediction.** No predictions, no guidance, no medical, legal or
   financial advice. The hexagram texts are attributed quotations from James Legge's
   1882 public-domain translation. The app offers a mirror and leaves the meaning with
   you.
2. **Private by construction.** One HTML file, ~105 KB, zero runtime dependencies. It
   works from your Downloads folder with the network off. No server, no accounts, no
   analytics. Your question lives on the page and in memory, and when you close the tab
   it has never existed anywhere else.
3. **Honest mechanics.** When the app generates lines, it uses `crypto.getRandomValues`
   or nothing at all. If a secure random source isn't available, it *declines to cast*
   rather than quietly falling back to a weaker source. And because plenty of people
   cast with real coins or yarrow stalks, there's a manual mode that uses no randomness
   whatsoever — you supply the lines. The probability profiles of each classical method
   (three coins, yarrow stalks — which historically favor yang change over yin change,
   an asymmetry coins can't reproduce) are declared in the code and asserted by tests,
   right next to a plain-language explanation for the reader.

The one deliberate external link is a footer attribution to Legge's Wikipedia article.
The only optional persistence is your casting-method preference, stored only after you
tick a box, deleted the instant you untick it. The product document — written before the
code — contains the line: *"No testimonials, users, or usage data exist; none may be
invented."* There are no users yet. I intend to keep that honest until there are.

## Then I made it prove it

Here's where honesty stops being a vibe. Trust you can't check is just branding, so
every one of those three rules was compiled into machinery that fails loudly:

- A **dist verifier** that statically audits the built file and fails the build on any
  banned token — `innerHTML`, `eval`, `fetch`, dynamic imports, storage probes, markup
  smuggling — and on any external resource attribute. The CSP ships `default-src 'none'`
  — and in the interest of the honesty this piece is about: the single-file format forces
  `'unsafe-inline'` for its one inline script and style, which is exactly why the token
  verifier, not the CSP, is the real gate. `connect-src 'none'` is the part that keeps
  the promise: nothing can leave the page.
- **Byte-deterministic builds**: the build fails if the output isn't reproducible, so
  the file you audited is provably the file you ship.
- A **corpus audit**: all 64 hexagrams generated from documented public-domain sources
  with SHA-256 headers, a provenance file with an explicit caveat on wording fidelity,
  and a test asserting no Wilhelm/Baynes wording leaked in. For an app whose entire
  content is quotations, provenance is the product.
- **WCAG AA contrast, enforced in CI-fashion by a test** that fails on color drift,
  because a contemplative ritual that's unreadable to a third of users is not
  contemplative.

## How it was actually built (the honest part)

Now the second act, because this is where most build-in-public posts get slippery. The
app is roughly 7,000 lines of source, tests, and scripts, written in about a week with
three tools — and the same honesty rule applied to describing them as applied to the
product.

**GitHub Spec Kit + Copilot** turned my one-sentence pitch — *"the dist must be
secure"* — into fourteen named, testable invariants. That's the whole value: "secure"
stopped being an opinion and became a grep with a non-zero exit code. The ceremony was
real, though: several spec artifacts were verbose checklists I skimmed, and the first
spec was written before the workspace was even a git repo. The file says so. I left it
in.

**An edit-time review agent** caught genuine drift — copy sliding toward fortune-telling
("gain insight", "discover your future"), storage surface widening without consent — and
caught nothing on half its runs. Sometimes "clearing its findings" meant writing the
sentence the checker likes, which is not the same as writing an honest sentence. It did
not replace me reading the diff.

**The boring stack** — strict TypeScript, esbuild, Node's test runner — is what I
actually trust, and none of it is AI. The division of labor that worked: *I* defined
what "secure" and "honest" meant in testable terms; the agents wrote code against the
definitions; the verifiers checked the artifacts without caring what any of us
believed. The AI can't weasel a `fetch` past a build-time audit that has no opinions.

The honest cost: there's no real CI, just four scripts I run in order by hand like a
monk's ritual. The test suite is a `.ts`/`.js` mix that is history, not design. I never
A/B tested the pacing decisions that are the entire UX. And I read every diff — ~2,200
lines — which I can't remember doing on any project in years. The tools didn't make me
faster. They made the project a size I could still hold in my head, and I kept my hands
on all of it.

## Where the two stories are the same story

The I Ching's oldest idea is that the ritual's value depends on your sincerity — *cheng*
(誠), the old commentaries' word for it. A cast you didn't mean, in an app that didn't
mean it, holding a text it invented, logging a question you didn't consent to give —
that's not a mirror. That's a slot machine with a serif font.

So the product rule and the engineering rule turned out to be one rule: **say what it
does, do what you said, and let anyone check.** Reflection, not prediction. Trust you
can prove, not ask for. Invariants first, generate second, verify mechanically.

It's MIT-licensed: one HTML file, ~105 KB, runs offline on a phone from your Downloads
folder, forever. Open the verifier first if you like. It's the most honest part of the
whole thing, because it's the only part that can't be charmed.

#IChing #PrivacyByDesign #BuildInPublic #AIEngineering #TypeScript #WebSecurity
