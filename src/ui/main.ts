// T026 — composition root: wires shell, announcer, steps, casting session (R-12).
import { queryShell } from "./shell-bind.ts";
import type { Shell } from "./shell-bind.ts";
import { createAnnouncer } from "./announce.ts";
import { createSteps } from "./steps.ts";
import type { Steps } from "./steps.ts";
import { createConsultation } from "../core/consultation.ts";
import type { Consultation } from "../core/consultation.ts";
import { COINS, YARROW } from "../core/casting.ts";
import type { CastingMethod, RandomSource } from "../core/casting.ts";
import { renderExplanation } from "./explanation.ts";
import { renderAttribution } from "./attribution.ts";
import type { MethodId } from "./method-pref.ts";
import { readStoredMethod, writeMethod, forgetMethod } from "./method-pref.ts";
import { DECLINE_NO_RANDOM, CONSENT_ON, CONSENT_OFF, EXPLANATION } from "../data/app-strings.ts";

export interface BootOptions {
  /** Secure-random availability, probed ONCE at boot (C-3, R-4). */
  readonly secureRandomAvailable: boolean;
  /** Adapter over crypto.getRandomValues when available; otherwise null —
   * and casting is honestly declined, never backed by a weaker source (B-7). */
  readonly randomSource: RandomSource | null;
  /** Method in force for this session; default coins unless US2 opt-in says otherwise. */
  readonly initialMethodId: MethodId;
}

export interface App {
  steps: Steps;
  shell: Shell;
  setMethod(id: MethodId): void;
  methodId(): MethodId;
}

export function mountApp(options: BootOptions): App {
  const shell = queryShell();
  const announcer = createAnnouncer(shell.live);

  let methodId: MethodId = options.initialMethodId;
  const methodFor = (id: MethodId): CastingMethod => (id === "yarrow" ? YARROW : COINS);

  // US2/C-9: consent-gated restore — stored value applies only because the key
  // exists (opt-in wrote it); otherwise the default (coins) stands, and the UI
  // reflects whichever is in force.
  const stored = readStoredMethod();
  const optedInAtBoot = stored !== null;
  if (stored !== null) methodId = stored;
  shell.methodCoins.checked = methodId === "coins";
  shell.methodYarrow.checked = methodId === "yarrow";
  shell.rememberMethod.checked = optedInAtBoot;

  // Honest decline on boot (C-3, FR-003): control disabled + plain message,
  // set via textContent; never attempted, never a weak fallback.
  if (!options.secureRandomAvailable || options.randomSource === null) {
    shell.castButton.disabled = true;
    shell.noRandom.textContent = DECLINE_NO_RANDOM;
    shell.noRandom.hidden = false;
  }

  renderExplanation(shell.introCard, EXPLANATION);
  renderExplanation(shell.reExplanation, EXPLANATION);

  const steps = createSteps({
    shell,
    announcer,
    beginConsultation(question: string | null): Consultation {
      const source = options.randomSource;
      if (source === null) throw new Error("casting without a secure source is refused");
      return createConsultation({ method: methodFor(methodId), random: source, question });
    }
  });

  // Visible translation credit (FR-008), linking the attribution to its
  // Wikipedia article (new tab; no referrer, no opener channel).
  renderAttribution(shell.appAttribution);

  // Wire controls (native buttons; keyboard-operable for free — FR-016).
  shell.castButton.addEventListener("click", () => {
    steps.startCast();
  });
  shell.revealAllButton.addEventListener("click", () => {
    steps.revealAll();
  });
  shell.castAgainButton.addEventListener("click", () => {
    steps.castAgain();
  });
  shell.explainToggle.addEventListener("click", () => {
    steps.toggleExplanation();
  });
  shell.primarySummary.toggle.addEventListener("click", () => {
    steps.togglePrimarySummary();
  });
  shell.relatedSummary.toggle.addEventListener("click", () => {
    steps.toggleRelatedSummary();
  });

  // US2 (C-9, FR-022): method selection is in-session unless consent is on;
  // writes happen ONLY through these explicit consent-gated paths.
  const readRadio = (): MethodId => (shell.methodYarrow.checked ? "yarrow" : "coins");
  const onMethodChange = (): void => {
    methodId = readRadio();
    if (shell.rememberMethod.checked) writeMethod(methodId);
  };
  shell.methodCoins.addEventListener("change", onMethodChange);
  shell.methodYarrow.addEventListener("change", onMethodChange);
  shell.rememberMethod.addEventListener("change", () => {
    if (shell.rememberMethod.checked) {
      methodId = readRadio();
      writeMethod(methodId); // opt-in moment: store the current choice now
      announcer.announceStatus(CONSENT_ON);
    } else {
      forgetMethod(); // opt-out deletes immediately (C-9), session choice stays active
      announcer.announceStatus(CONSENT_OFF);
    }
  });

  steps.showQuestion();

  return {
    steps,
    shell,
    setMethod(id: MethodId): void {
      methodId = id;
    },
    methodId(): MethodId {
      return methodId;
    }
  };
}
