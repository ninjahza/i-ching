// T025 — static-node query + step visibility (R-12; C-1 exactly one step visible).
// All nodes exist in src/shell/index.html; nothing is created structurally here.

export interface Shell {
  live: HTMLElement;
  steps: { question: HTMLElement; casting: HTMLElement; result: HTMLElement };
  introCard: HTMLElement;
  questionHeading: HTMLElement;
  questionInput: HTMLTextAreaElement;
  truncationNotice: HTMLElement;
  castButton: HTMLButtonElement;
  noRandom: HTMLElement;
  castingHeading: HTMLElement;
  castingFigure: HTMLElement;
  revealAllButton: HTMLButtonElement;
  resultSection: HTMLElement;
  resultHeading: HTMLElement;
  primaryFigure: HTMLElement;
  primarySymbol: HTMLElement;
  primaryChinese: HTMLElement;
  primaryIdentity: HTMLElement;
  primaryTrigrams: HTMLElement;
  primaryJudgement: HTMLElement;
  primaryImage: HTMLElement;
  primarySummary: SummaryElements;
  relatedCard: HTMLElement;
  relatedFigure: HTMLElement;
  relatedSymbol: HTMLElement;
  relatedChinese: HTMLElement;
  relatedIdentity: HTMLElement;
  relatedTrigrams: HTMLElement;
  relatedJudgement: HTMLElement;
  relatedImage: HTMLElement;
  relatedSummary: SummaryElements;
  stableMessage: HTMLElement;
  echoCard: HTMLElement;
  questionEcho: HTMLElement;
  castAgainButton: HTMLButtonElement;
  explainToggle: HTMLButtonElement;
  reExplanation: HTMLElement;
  appAttribution: HTMLElement;
  methodCoins: HTMLInputElement;
  methodYarrow: HTMLInputElement;
  rememberMethod: HTMLInputElement;
}

export interface SummaryElements {
  toggle: HTMLButtonElement;
  region: HTMLElement;
  first: HTMLElement;
  second: HTMLElement;
}

function el(id: string): HTMLElement {
  const node = document.getElementById(id);
  if (node === null) throw new Error(`shell node missing: ${id}`);
  return node;
}

function btn(id: string): HTMLButtonElement {
  const node = el(id);
  if (node instanceof HTMLButtonElement) return node;
  throw new Error(`shell button missing: ${id}`);
}

function checkboxOrRadio(id: string): HTMLInputElement {
  const node = el(id);
  if (node instanceof HTMLInputElement) return node;
  throw new Error(`shell input missing: ${id}`);
}

function summary(prefix: "primary" | "related"): SummaryElements {
  return {
    toggle: btn(`${prefix}-summary-toggle`),
    region: el(`${prefix}-summary`),
    first: el(`${prefix}-summary-p1`),
    second: el(`${prefix}-summary-p2`)
  };
}

export function queryShell(): Shell {
  const question = el("step-question");
  const casting = el("step-casting");
  const result = el("step-result");
  const input = el("question");
  if (!(input instanceof HTMLTextAreaElement)) throw new Error("question must be a textarea");
  return {
    live: el("live"),
    steps: { question, casting, result },
    introCard: el("intro-card"),
    questionHeading: el("question-heading"),
    questionInput: input,
    truncationNotice: el("truncation-notice"),
    castButton: btn("cast"),
    noRandom: el("no-random"),
    castingHeading: el("casting-heading"),
    castingFigure: el("casting-figure") as HTMLElement,
    revealAllButton: btn("reveal-all"),
    resultSection: result,
    resultHeading: el("result-heading"),
    primaryFigure: el("primary-figure"),
    primarySymbol: el("primary-symbol"),
    primaryChinese: el("primary-chinese"),
    primaryIdentity: el("primary-identity"),
    primaryTrigrams: el("primary-trigrams"),
    primaryJudgement: el("primary-judgement"),
    primaryImage: el("primary-image"),
    primarySummary: summary("primary"),
    relatedCard: el("related-card"),
    relatedFigure: el("related-figure"),
    relatedSymbol: el("related-symbol"),
    relatedChinese: el("related-chinese"),
    relatedIdentity: el("related-identity"),
    relatedTrigrams: el("related-trigrams"),
    relatedJudgement: el("related-judgement"),
    relatedImage: el("related-image"),
    relatedSummary: summary("related"),
    stableMessage: el("stable-message"),
    echoCard: el("echo-card"),
    questionEcho: el("question-echo"),
    castAgainButton: btn("cast-again"),
    explainToggle: btn("explain-toggle"),
    reExplanation: el("re-explanation"),
    appAttribution: el("app-attribution"),
    methodCoins: checkboxOrRadio("method-coins"),
    methodYarrow: checkboxOrRadio("method-yarrow"),
    rememberMethod: checkboxOrRadio("remember-method")
  };
}

/** C-1: exactly one step visible; focus moved to the step heading. */
export function showStep(shell: Shell, which: "question" | "casting" | "result"): void {
  shell.steps.question.hidden = which !== "question";
  shell.steps.casting.hidden = which !== "casting";
  shell.steps.result.hidden = which !== "result";
  const heading = which === "question"
    ? shell.questionHeading
    : which === "casting"
      ? shell.castingHeading
      : shell.resultHeading;
  heading.focus();
}
