export const MODERN_GUIDE_CSS = `:root {
  color-scheme: light;
  --paper: #f7f5ef;
  --ink: #1c2520;
  --muted: #4e5e56;
  --rule: #c9d0c8;
  --link: #174d73;
  --focus: #8a3d08;
  --panel: #eeece4;
}
* { box-sizing: border-box; }
html { background: var(--paper); color: var(--ink); font: 100%/1.65 system-ui, sans-serif; scroll-behavior: auto; }
body { margin: 0 auto; max-width: 76rem; padding: 1.25rem clamp(1rem, 4vw, 3rem) 4rem; }
a { color: var(--link); text-decoration-thickness: .08em; text-underline-offset: .16em; }
a:hover { text-decoration-thickness: .14em; }
a:focus-visible { outline: .2rem solid var(--focus); outline-offset: .2rem; border-radius: .12rem; }
h1, h2, h3, h4 { line-height: 1.2; text-wrap: balance; }
h1 { max-width: 22ch; font-size: clamp(2rem, 5vw, 3.5rem); margin: 1.5rem 0 .6rem; }
h2 { margin-top: 3rem; padding-top: 1rem; border-top: .12rem solid var(--rule); font-size: clamp(1.6rem, 3vw, 2.2rem); }
h3 { margin-top: 2rem; font-size: clamp(1.25rem, 2vw, 1.65rem); }
h4 { font-size: 1.05rem; }
p, li, dd { max-width: 75ch; }
.skip-link { display: inline-block; padding: .5rem .75rem; }
.edition, .metadata, .citation, .muted { color: var(--muted); }
.metadata { overflow-wrap: anywhere; font-size: .95rem; }
nav { margin: 2rem 0; padding: 1rem 1.25rem; background: var(--panel); border: .08rem solid var(--rule); }
nav h2 { margin: 0 0 .5rem; padding: 0; border: 0; font-size: 1.3rem; }
nav ol { columns: 2 18rem; padding-left: 1.5rem; }
nav li { break-inside: avoid; padding: .12rem 0; }
section, article { scroll-margin-top: 1rem; }
.guide-block { margin: 1.25rem 0 2rem; }
.citation { font-size: .92rem; margin-top: .4rem; }
.table-wrap { max-width: 100%; overflow-x: auto; }
table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
th, td { border: .08rem solid var(--rule); padding: .5rem .65rem; text-align: left; }
th { background: var(--panel); }
.trigrams { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr)); gap: .6rem; padding: 0; list-style: none; }
.trigrams li { display: flex; flex-wrap: wrap; align-items: center; gap: .75rem; border: .08rem solid var(--rule); padding: .65rem .8rem; }
.trigram-chinese { flex: 0 0 auto; font-size: 2rem; line-height: 1; }
.trigrams li span:last-child { flex: 1 1 5rem; min-width: 0; overflow-wrap: anywhere; }
.example, .glossary-entry { background: var(--panel); border-left: .25rem solid var(--muted); padding: .75rem 1rem; margin: 1rem 0; }
.hexagram { border-top: .08rem solid var(--rule); padding: .5rem 0 1.5rem; }
.hexagram h3 { margin-bottom: .35rem; }
.trigram-note { color: var(--muted); }
figure { display: flex; flex-wrap: wrap; align-items: center; gap: .75rem; margin: 1rem 0; padding: .75rem; border: .08rem solid var(--rule); width: min(100%, 40ch); }
.figure-chinese { font-size: clamp(3.25rem, 10vw, 4rem); line-height: 1; }
.diagram { display: flex; flex-direction: column-reverse; gap: .3rem; width: 8rem; margin: .25rem 0; }
.diagram span { display: block; height: .42rem; background: var(--ink); }
.diagram .yin { background: transparent; display: flex; justify-content: space-between; }
.diagram .yin::before, .diagram .yin::after { content: ""; display: block; width: 42%; height: .42rem; background: var(--ink); }
figcaption { flex: 0 0 100%; font-size: .95rem; }
.reading { margin: 1.25rem 0; }
.line-label { font-weight: 700; }
footer { margin-top: 3rem; border-top: .12rem solid var(--rule); padding-top: 1rem; color: var(--muted); }
@media (max-width: 38rem) { nav ol { columns: 1; } body { padding-inline: 1rem; } }
`;
