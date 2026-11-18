# I built an I Ching app that refuses to tell your fortune. Then I made it prove it.

The I Ching is not a fortune teller. It's a book — the Book of Changes — and the oldest
honest thing about it is how people use it: hold a question you already have, build six
lines bottom-up, and an ancient text holds your question back to you in different
light. The book is a mirror, not a window. Almost every app built around it sells you a
window — and wants your email first.

So I set three rules before writing any code:

1. Reflection, never prediction. No predictions, no advice. The texts are attributed
public-domain quotations (Legge, 1882). The meaning stays with you.
2. Private by construction. One HTML file, ~105 KB, zero runtime dependencies, works
from your Downloads folder with the network off. Your question dies with the tab.
3. Honest mechanics. Automatic casts use crypto.getRandomValues or nothing — no secure
source, no cast, no quiet fallback. A manual mode needs no randomness at all: real
coins, your own lines.

Then I made the app prove all three, because trust you can't check is just branding:

- a dist verifier that fails the build on innerHTML, eval, fetch, storage probes
- byte-deterministic builds — the file you audited is provably the file you ship
- corpus audits with SHA-256 provenance and an honest caveat on wording

Built in a week, ~7,000 lines, three tools — same honesty rule applies to them:

Spec Kit + Copilot turned "the dist must be secure" into fourteen named, testable
invariants. "Secure" stopped being an opinion and became a grep with a non-zero exit
code. Some spec artifacts were ceremony I skimmed; I say so.

A review agent caught real drift — copy sliding toward fortune-telling, storage
widening without consent — and caught nothing on half its runs. Not a replacement for
reading the diff.

Strict TypeScript, esbuild, Node's test runner: the parts I actually trust. Humans
define the invariants, agents generate, verifiers check without caring what anyone
believes.

No CI (four scripts I run by hand, like a monk's ritual), no users, no A/B tests — the
product doc forbids inventing testimonials, and I read every diff.

The I Ching's oldest idea is sincerity — cheng. A cast you didn't mean, in an app that
didn't mean it, logging a question you never consented to give, isn't a mirror. It's a
slot machine with a serif font.

One rule for product and process: say what it does, do what you said, let anyone check.
Invariants first, generate second, verify mechanically.

MIT-licensed, runs offline on a phone forever. Open the verifier first — it's the only
part that can't be charmed.

#IChing #PrivacyByDesign #BuildInPublic #AIEngineering #TypeScript #WebSecurity
