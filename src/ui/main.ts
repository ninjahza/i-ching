// T026 — composition root: wires shell, announcer, steps, casting session (R-12).
import { queryShell } from "./shell-bind.ts";
import type { Shell } from "./shell-bind.ts";
import { createAnnouncer } from "./announce.ts";
import { createSteps } from "./steps.ts";
import type { Steps } from "./steps.ts";
import { createConsultation, createManualConsultation } from "../core/consultation.ts";
import type { Consultation } from "../core/consultation.ts";
import { COINS, YARROW } from "../core/casting.ts";
import type { CastingMethod, RandomSource } from "../core/casting.ts";
import { renderExplanation } from "./explanation.ts";
import { renderAttribution } from "./attribution.ts";
import type { AutomaticMethodId, MethodId } from "./method-pref.ts";
import { USER_METHOD_ID, readStoredMethod, writeMethod, forgetMethod } from "./method-pref.ts";
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
  const methodFor = (id: AutomaticMethodId): CastingMethod => (id === "yarrow" ? YARROW : COINS);

  const syncMethodRadios = (id: MethodId): void => {
    shell.methodCoins.checked = id === "coins";
    shell.methodYarrow.checked = id === "yarrow";
    shell.methodUser.checked = id === USER_METHOD_ID;
  };

  const hasSecureRandom = options.secureRandomAvailable && options.randomSource !== null;
  const canStartCast = (): boolean => methodId === USER_METHOD_ID || hasSecureRandom;

  // User cast never needs randomness; only automatic methods decline when crypto is absent.
  const syncStartAvailability = (): void => {
    const allowed = canStartCast();
    shell.castButton.disabled = !allowed;
    if (allowed) {
      shell.noRandom.textContent = "";
      shell.noRandom.hidden = true;
    } else {
      shell.noRandom.textContent = DECLINE_NO_RANDOM;
      shell.noRandom.hidden = false;
    }
  };

  // US2/C-9: consent-gated restore — stored value applies only because the key
  // exists (opt-in wrote it); otherwise the default (coins) stands, and the UI
  // reflects whichever is in force.
  const stored = readStoredMethod();
  const optedInAtBoot = stored !== null;
  if (stored !== null) methodId = stored;
  syncMethodRadios(methodId);
  shell.rememberMethod.checked = optedInAtBoot;
  syncStartAvailability();

  renderExplanation(shell.introCard, EXPLANATION);
  renderExplanation(shell.reExplanation, EXPLANATION);

  const steps = createSteps({
    shell,
    announcer,
    canStartCast,
    beginConsultation(question: string | null): Consultation {
      if (methodId === USER_METHOD_ID) {
        return createManualConsultation({ question });
      }
      if (!hasSecureRandom || options.randomSource === null) {
        throw new Error("automatic casting without a secure random source is refused");
      }
      return createConsultation({ method: methodFor(methodId), random: options.randomSource, question });
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
  shell.addLineButton.addEventListener("click", () => {
    steps.addLine();
  });
  shell.undoLineButton.addEventListener("click", () => {
    steps.undoLastLine();
  });
  shell.changeMethodButton.addEventListener("click", () => {
    steps.cancelManualCast();
  });
  for (const radio of shell.lineValueRadios) {
    radio.addEventListener("change", () => {
      steps.selectLineValue(radio.value);
    });
  }
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
  const readRadio = (): MethodId =>
    shell.methodUser.checked
      ? USER_METHOD_ID
      : shell.methodYarrow.checked
        ? "yarrow"
        : "coins";
  const onMethodChange = (): void => {
    if (!shell.steps.casting.hidden) {
      syncMethodRadios(methodId);
      return;
    }
    methodId = readRadio();
    syncStartAvailability();
    if (shell.rememberMethod.checked) writeMethod(methodId);
  };
  shell.methodCoins.addEventListener("change", onMethodChange);
  shell.methodYarrow.addEventListener("change", onMethodChange);
  shell.methodUser.addEventListener("change", onMethodChange);
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
      if (!shell.steps.casting.hidden) {
        syncMethodRadios(methodId);
        return;
      }
      methodId = id;
      syncMethodRadios(id);
      syncStartAvailability();
    },
    methodId(): MethodId {
      return methodId;
    }
  };
}
