// T006 / T015 / T022 — User Cast controller and interaction tests (US1, US2, US3)
import { test } from "node:test";
import assert from "node:assert/strict";
import { mountApp } from "../src/ui/main.ts";
import { createDomEnvironment } from "./helpers/dom-env.js";

function makeSpyRandom(bytes = [1, 1, 1, 1, 1, 1]) {
  let calls = 0;
  return {
    get calls() {
      return calls;
    },
    source: {
      randomBytes(out) {
        for (let i = 0; i < out.length; i++) {
          out[i] = bytes[calls % bytes.length];
          calls++;
        }
        return out;
      },
    },
  };
}

test("shell offers Three coins, Yarrow stalks, and User cast; manual step has four numbered choices and no line-value text/number input", () => {
  const env = createDomEnvironment();
  try {
    const rng = makeSpyRandom();
    const app = mountApp({
      secureRandomAvailable: true,
      randomSource: rng.source,
      initialMethodId: "coins",
    });

    assert.equal(app.shell.methodCoins.checked, true);
    assert.equal(app.shell.methodYarrow.checked, false);
    assert.equal(app.shell.methodUser.checked, false);

    // Inspect manual casting markup: 4 radios (6..9) inside tappable labels, zero text/number inputs.
    const castingStep = app.shell.steps.casting;
    const textOrNumberInputs = castingStep.querySelectorAll('input[type="text"], input[type="number"]');
    assert.equal(textOrNumberInputs.length, 0, "manual casting must not include a text or numeric field");

    const choiceLabels = castingStep.querySelectorAll("label.value-choice");
    assert.equal(choiceLabels.length, 4);
    const radios = castingStep.querySelectorAll('input[type="radio"][name="line-value"]');
    assert.deepEqual(radios.map((r) => r.value), ["6", "7", "8", "9"]);
    for (const label of choiceLabels) {
      assert.match(label.textContent, /[6789]/);
      assert.match(label.textContent, /yin|yang/i);
    }

    // Progress and instructions sit below the Add line / Undo last line controls as supporting help text.
    const manualIds = app.shell.manualCasting.children.map((c) => c.id);
    const controlsIdx = manualIds.indexOf("manual-controls");
    const progressIdx = manualIds.indexOf("manual-progress");
    const instructionsIdx = manualIds.indexOf("manual-instructions");
    assert.ok(controlsIdx >= 0 && progressIdx > controlsIdx && instructionsIdx > progressIdx);
    assert.match(app.shell.manualInstructions.textContent, /Three coins:/);
    assert.match(app.shell.manualInstructions.textContent, /heads = 3 and tails = 2/);
    assert.match(app.shell.manualInstructions.textContent, /Yarrow stalks:/);
    assert.match(app.shell.manualInstructions.textContent, /24 = 6/);
  } finally {
    env.restore();
  }
});

test("US1 manual flow: empty initial selection, explicit Add, selection consumption, repeated activation guard, no timer/RNG, hidden/guarded Reveal all, sixth-line completion & announcements", () => {
  const env = createDomEnvironment();
  try {
    const rng = makeSpyRandom();
    const app = mountApp({
      secureRandomAvailable: true,
      randomSource: rng.source,
      initialMethodId: "coins",
    });

    // Select User cast via label/radio and enter a question.
    app.shell.methodUser.click();
    assert.equal(app.methodId(), "user");
    app.shell.questionInput.value = "How should I reflect on change?";
    app.shell.castButton.click();

    // Casting step visible; question echoed during casting; line 1 explicitly named bottom line; no line generated; no timer; no RNG.
    assert.equal(app.shell.steps.casting.hidden, false);
    assert.equal(app.shell.castingEchoCard.hidden, false);
    assert.equal(app.shell.castingQuestionEcho.textContent, "How should I reflect on change?");
    assert.match(app.shell.manualProgress.textContent, /line 1 of 6/i);
    assert.match(app.shell.manualProgress.textContent, /bottom line/i);
    assert.equal(app.shell.addLineButton.disabled, true);
    assert.equal(app.shell.lineValueRadios.every((r) => !r.checked), true);
    assert.equal(app.shell.revealAllButton.isEffectivelyHidden(), true, "Reveal all must be hidden in User cast");
    assert.equal(env.getIntervalCalls(), 0);
    assert.equal(rng.calls, 0);

    // Guarded Reveal all: programmatic call does nothing in manual mode.
    app.steps.revealAll();
    const visibleRowsAfterRevealAll = app.shell.castingFigure
      .querySelectorAll(".hex-row")
      .filter((r) => !r.hidden);
    assert.equal(visibleRowsAfterRevealAll.length, 0);
    assert.equal(app.shell.steps.result.hidden, true);

    // Method is fixed during a cast even if setMethod is called mid-cast.
    app.setMethod("coins");
    app.steps.revealAll();
    assert.equal(rng.calls, 0);

    // Tapping a label selects the choice and shows its meaning, without adding a line yet.
    const labels = app.shell.steps.casting.querySelectorAll("label.value-choice");
    labels[0].click(); // value 6
    assert.equal(app.shell.lineValueRadios[0].checked, true);
    assert.equal(app.shell.addLineButton.disabled, false);
    assert.match(app.shell.manualSelection.textContent, /6/);
    assert.match(app.shell.manualSelection.textContent, /old yin/i);
    assert.equal(
      app.shell.castingFigure.querySelectorAll(".hex-row").filter((r) => !r.hidden).length,
      0,
      "selecting a choice must not record a line before Add line",
    );

    // Activate Add line: records line 1 at bottom, consumes selection, focuses first choice.
    app.shell.addLineButton.click();
    const slot1 = app.shell.castingFigure.querySelector('.hex-row[data-position="1"]');
    assert.equal(slot1.hidden, false);
    assert.match(slot1.textContent, /changing/);
    assert.equal(app.shell.lineValueRadios.every((r) => !r.checked), true);
    assert.equal(app.shell.addLineButton.disabled, true);
    assert.match(app.shell.manualProgress.textContent, /line 2 of 6/i);
    assert.equal(env.document.activeElement, app.shell.lineValueRadios[0]);
    assert.match(app.shell.live.textContent, /line 1 of 6/i);
    assert.match(app.shell.live.textContent, /line 2 of 6/i);

    // Repeated activation without selecting again cannot reuse previous selection.
    app.shell.addLineButton.click(); // disabled button ignored
    const addedOnRepeat = app.steps.addLine(); // programmatic repeat rejected
    assert.equal(addedOnRepeat, false);
    assert.equal(
      app.shell.castingFigure.querySelectorAll(".hex-row").filter((r) => !r.hidden).length,
      1,
    );
    assert.equal(app.shell.manualError.hidden, false);

    // Enter remaining 5 lines: 9, 7, 8, 7, 9 -> sequence [6, 9, 7, 8, 7, 9]
    const rest = [9, 7, 8, 7, 9];
    for (let i = 0; i < rest.length; i++) {
      const val = rest[i];
      const radio = app.shell.lineValueRadios.find((r) => r.value === String(val));
      radio.click();
      assert.equal(app.shell.manualError.hidden, true, "selecting a valid choice clears error");
      app.shell.addLineButton.click();
      if (i < rest.length - 1) {
        assert.equal(app.shell.steps.result.hidden, true);
        assert.equal(env.document.activeElement, app.shell.lineValueRadios[0]);
      }
    }

    // Sixth confirmation immediately opens Result, announces BOTH line 6 AND result, focuses result heading.
    assert.equal(app.shell.steps.result.hidden, false);
    assert.equal(app.shell.steps.casting.hidden, true);
    assert.equal(env.document.activeElement, app.shell.resultHeading);
    assert.match(app.shell.live.textContent, /line 6 of 6/i);
    assert.match(app.shell.live.textContent, /Hexagram \d+/);
    assert.match(app.shell.live.textContent, /becoming hexagram \d+/i);

    // Primary bits for [6, 9, 7, 8, 7, 9]: yang at pos 2,3,5,6 => 0b110110 = 54
    // Changing at pos 1,2,6 => mask 0b100011 = 35 => related 54 ^ 35 = 0b010101 = 21
    assert.equal(app.shell.relatedCard.hidden, false);
    assert.equal(app.shell.stableMessage.hidden, true);
    assert.equal(app.shell.questionEcho.textContent, "How should I reflect on change?");
    assert.ok(app.shell.primaryIdentity.textContent.length > 0);
    assert.ok(app.shell.primaryJudgement.textContent.length > 0);
    assert.equal(env.getIntervalCalls(), 0);
    assert.equal(rng.calls, 0);
  } finally {
    env.restore();
  }
});

test("tampered control values and invalid programmatic submissions are rejected with accessible feedback and no state mutation", () => {
  const env = createDomEnvironment();
  try {
    const rng = makeSpyRandom();
    const app = mountApp({
      secureRandomAvailable: true,
      randomSource: rng.source,
      initialMethodId: "user",
    });

    app.shell.castButton.click();

    // Case 1: Radio value tampered before clicking radio.
    const r6 = app.shell.lineValueRadios[0];
    r6.value = "42";
    r6.click();
    assert.equal(app.shell.addLineButton.disabled, true);
    assert.equal(app.shell.manualError.hidden, false);
    assert.match(app.shell.manualError.textContent, /6, 7, 8, or 9/);
    assert.match(app.shell.live.textContent, /6, 7, 8, or 9/);

    // Restore r6 value, select validly, then tamper BEFORE clicking Add line.
    r6.value = "6";
    r6.click();
    assert.equal(app.shell.addLineButton.disabled, false);
    r6.value = "6.5";
    app.shell.addLineButton.click();
    assert.equal(
      app.shell.castingFigure.querySelectorAll(".hex-row").filter((r) => !r.hidden).length,
      0,
      "tampered radio value at confirmation time must be rejected",
    );
    assert.equal(app.shell.manualError.hidden, false);

    // Case 2: Programmatic invalid calls to selectLineValue / addLine.
    r6.value = "6";
    for (const invalid of [undefined, null, 5, 10, 7.5, "eight", NaN]) {
      assert.equal(app.steps.addLine(invalid), false);
    }
    assert.equal(
      app.shell.castingFigure.querySelectorAll(".hex-row").filter((r) => !r.hidden).length,
      0,
    );
  } finally {
    env.restore();
  }
});

test("stable manual cast renders stable message and hides related card; automatic coins cast remains unchanged", () => {
  const env = createDomEnvironment();
  try {
    const rng = makeSpyRandom([1, 1, 1, 1, 1, 1]);
    const app = mountApp({
      secureRandomAvailable: true,
      randomSource: rng.source,
      initialMethodId: "user",
    });

    app.shell.castButton.click();
    for (let i = 0; i < 6; i++) {
      app.shell.lineValueRadios[1].click(); // 7 (young yang, stable)
      app.shell.addLineButton.click();
    }
    assert.equal(app.shell.steps.result.hidden, false);
    assert.match(app.shell.primaryIdentity.textContent, /^1 ·/);
    assert.equal(app.shell.relatedCard.hidden, true);
    assert.equal(app.shell.stableMessage.hidden, false);
    assert.equal(rng.calls, 0);

    // Switch to automatic Three coins and verify automatic timer + Reveal all still work.
    app.shell.castAgainButton.click();
    app.shell.methodCoins.click();
    app.shell.castButton.click();
    assert.equal(env.getIntervalCalls(), 1);
    assert.equal(app.shell.revealAllButton.isEffectivelyHidden(), false);
    assert.equal(app.shell.manualCasting.hidden, true);
    app.shell.revealAllButton.click();
    assert.equal(app.shell.steps.result.hidden, false);
    assert.equal(rng.calls, 6);
  } finally {
    env.restore();
  }
});

// ---- Feature 004: User Story 2 correction & undo interaction tests (T015) ----

test("US2 correction: changing pending choice, Undo disabled at zero, Undo clears pending choice & latest slot without reordering, repeated undo to zero, announcements & focus", () => {
  const env = createDomEnvironment();
  try {
    const rng = makeSpyRandom();
    const app = mountApp({
      secureRandomAvailable: true,
      randomSource: rng.source,
      initialMethodId: "user",
    });

    app.shell.castButton.click();

    // At zero confirmed lines, Undo is disabled and programmatic undo is a no-op.
    assert.equal(app.shell.undoLineButton.disabled, true);
    assert.equal(app.steps.undoLastLine(), false);

    // Changing a pending selection before Add only updates pending selection, not confirmed lines.
    app.shell.lineValueRadios[0].click(); // 6
    assert.match(app.shell.manualSelection.textContent, /6/);
    app.shell.lineValueRadios[1].click(); // switch pending choice to 7
    assert.equal(app.shell.lineValueRadios[0].checked, false);
    assert.equal(app.shell.lineValueRadios[1].checked, true);
    assert.match(app.shell.manualSelection.textContent, /7/);
    assert.equal(
      app.shell.castingFigure.querySelectorAll(".hex-row").filter((r) => !r.hidden).length,
      0,
    );

    // Confirm three lines: 7, 8, 9 (9 at position 3 is a mistake).
    app.shell.addLineButton.click(); // pos 1 = 7
    assert.equal(app.shell.undoLineButton.disabled, false);

    app.shell.lineValueRadios[2].click(); // 8
    app.shell.addLineButton.click(); // pos 2 = 8

    app.shell.lineValueRadios[3].click(); // 9
    app.shell.addLineButton.click(); // pos 3 = 9

    const slotOrderBefore = app.shell.castingFigure.children.map((c) => c.dataset.position);
    assert.deepEqual(slotOrderBefore, ["6", "5", "4", "3", "2", "1"]);
    assert.equal(app.shell.castingFigure.querySelector('.hex-row[data-position="3"]').hidden, false);

    // Select a pending choice for line 4 (6), then activate Undo last line:
    // line 3 must be removed, pending selection cleared, Add disabled, progress restored to line 3,
    // Undo announced, and focus moved to first numbered choice.
    app.shell.lineValueRadios[0].click(); // pending 6
    assert.equal(app.shell.addLineButton.disabled, false);

    app.shell.undoLineButton.click();
    const slot3 = app.shell.castingFigure.querySelector('.hex-row[data-position="3"]');
    assert.equal(slot3.hidden, true);
    assert.equal(slot3.textContent, "");
    assert.deepEqual(
      app.shell.castingFigure.children.map((c) => c.dataset.position),
      ["6", "5", "4", "3", "2", "1"],
      "remaining figure slots must not be rebuilt or reordered",
    );
    assert.equal(app.shell.castingFigure.querySelector('.hex-row[data-position="1"]').hidden, false);
    assert.equal(app.shell.castingFigure.querySelector('.hex-row[data-position="2"]').hidden, false);
    assert.equal(app.shell.lineValueRadios.every((r) => !r.checked), true);
    assert.equal(app.shell.addLineButton.disabled, true);
    assert.equal(app.shell.undoLineButton.disabled, false);
    assert.match(app.shell.manualProgress.textContent, /line 3 of 6/i);
    assert.match(app.shell.live.textContent, /removed line 3 of 6/i);
    assert.match(app.shell.live.textContent, /line 3 of 6/i);
    assert.equal(env.document.activeElement, app.shell.lineValueRadios[0]);

    // Undo repeatedly down to zero confirmed lines.
    app.shell.undoLineButton.click(); // removes line 2
    assert.match(app.shell.manualProgress.textContent, /line 2 of 6/i);
    app.shell.undoLineButton.click(); // removes line 1
    assert.match(app.shell.manualProgress.textContent, /line 1 of 6/i);
    assert.equal(app.shell.undoLineButton.disabled, true);
    assert.equal(
      app.shell.castingFigure.querySelectorAll(".hex-row").filter((r) => !r.hidden).length,
      0,
    );
    assert.equal(app.steps.undoLastLine(), false);

    // Record 3 lines, undo the 3rd (mistaken changing 6), replace with stable 7, complete with 7s -> stable KW 1!
    for (const v of [7, 7, 6]) {
      app.shell.lineValueRadios.find((r) => r.value === String(v)).click();
      app.shell.addLineButton.click();
    }
    app.shell.undoLineButton.click();
    for (const v of [7, 7, 7, 7]) {
      app.shell.lineValueRadios.find((r) => r.value === String(v)).click();
      app.shell.addLineButton.click();
    }
    assert.equal(app.shell.steps.result.hidden, false);
    assert.match(app.shell.primaryIdentity.textContent, /^1 ·/);
    assert.equal(app.shell.relatedCard.hidden, true);
    assert.equal(app.shell.stableMessage.hidden, false);
    assert.equal(app.steps.undoLastLine(), false, "undo after completion must do nothing");
  } finally {
    env.restore();
  }
});

// ---- Feature 004: User Story 3 no-random availability & Cast again reset tests (T022) ----

test("US3 without secure randomness: automatic methods are refused with explanation, User cast completes with zero random calls, Cast again clears all transient data and focuses question heading, and switching back re-disables automatic casting", () => {
  const env = createDomEnvironment();
  try {
    const app = mountApp({
      secureRandomAvailable: false,
      randomSource: null,
      initialMethodId: "coins",
    });

    // Default Three coins declined without secure random.
    assert.equal(app.shell.castButton.disabled, true);
    assert.equal(app.shell.noRandom.hidden, false);
    assert.match(app.shell.noRandom.textContent, /crypto\.getRandomValues/);
    assert.match(app.shell.noRandom.textContent, /User cast/);
    app.steps.startCast(); // programmatic attempt refused
    assert.equal(app.shell.steps.question.hidden, false);

    // Yarrow stalks also declined without secure random.
    app.shell.methodYarrow.click();
    assert.equal(app.shell.castButton.disabled, true);
    assert.equal(app.shell.noRandom.hidden, false);
    app.steps.startCast();
    assert.equal(app.shell.steps.question.hidden, false);

    // Switch to User cast: enabled immediately, no-random warning hidden.
    app.shell.methodUser.click();
    assert.equal(app.shell.castButton.disabled, false);
    assert.equal(app.shell.noRandom.hidden, true);
    assert.equal(app.shell.noRandom.textContent, "");

    // Enter a >500-char question to exercise truncation notice + echo + summaries + explanation open, then Cast again.
    app.shell.questionInput.value = "Q".repeat(510);
    app.shell.castButton.click();
    assert.equal(app.shell.steps.casting.hidden, false);

    for (const v of [6, 6, 6, 6, 6, 6]) {
      app.shell.lineValueRadios.find((r) => r.value === String(v)).click();
      app.shell.addLineButton.click();
    }

    // Six 6s => primary hexagram 2 becoming related hexagram 1.
    assert.equal(app.shell.steps.result.hidden, false);
    assert.match(app.shell.primaryIdentity.textContent, /^2 ·/);
    assert.match(app.shell.relatedIdentity.textContent, /^1 ·/);
    assert.equal(app.shell.relatedCard.hidden, false);
    assert.equal(app.shell.echoCard.hidden, false);

    // Open both summary disclosures and the re-explanation before Cast again.
    app.shell.primarySummary.toggle.click();
    app.shell.relatedSummary.toggle.click();
    app.shell.explainToggle.click();
    assert.equal(app.shell.primarySummary.region.hidden, false);
    assert.equal(app.shell.relatedSummary.region.hidden, false);
    assert.equal(app.shell.reExplanation.hidden, false);

    // Activate Cast again: clears everything, retains User cast, moves focus to visible question heading.
    app.shell.castAgainButton.click();
    assert.equal(app.shell.steps.question.hidden, false);
    assert.equal(app.shell.steps.casting.hidden, true);
    assert.equal(app.shell.steps.result.hidden, true);
    assert.equal(env.document.activeElement, app.shell.questionHeading);
    assert.equal(app.methodId(), "user");
    assert.equal(app.shell.methodUser.checked, true);
    assert.equal(app.shell.castButton.disabled, false);
    assert.equal(app.shell.noRandom.hidden, true);

    assert.equal(app.shell.questionInput.value, "");
    assert.equal(app.shell.truncationNotice.hidden, true);
    assert.equal(app.shell.truncationNotice.textContent, "");
    assert.equal(app.shell.castingFigure.children.length, 0);
    assert.equal(app.shell.lineValueRadios.every((r) => !r.checked), true);
    assert.equal(app.shell.manualSelection.textContent, "");
    assert.equal(app.shell.primaryIdentity.textContent, "");
    assert.equal(app.shell.primaryTrigrams.textContent, "");
    assert.equal(app.shell.primarySymbol.textContent, "");
    assert.equal(app.shell.primaryChinese.textContent, "");
    assert.equal(app.shell.primaryJudgement.textContent, "");
    assert.equal(app.shell.primaryImage.textContent, "");
    assert.equal(app.shell.primaryFigure.getAttribute("aria-label"), "");
    assert.equal(app.shell.primarySummary.region.hidden, true);
    assert.equal(app.shell.primarySummary.first.textContent, "");
    assert.equal(app.shell.relatedCard.hidden, true);
    assert.equal(app.shell.relatedIdentity.textContent, "");
    assert.equal(app.shell.relatedTrigrams.textContent, "");
    assert.equal(app.shell.relatedSymbol.textContent, "");
    assert.equal(app.shell.relatedChinese.textContent, "");
    assert.equal(app.shell.relatedJudgement.textContent, "");
    assert.equal(app.shell.relatedImage.textContent, "");
    assert.equal(app.shell.relatedFigure.getAttribute("aria-label"), "");
    assert.equal(app.shell.relatedSummary.region.hidden, true);
    assert.equal(app.shell.relatedSummary.first.textContent, "");
    assert.equal(app.shell.stableMessage.hidden, true);
    assert.equal(app.shell.stableMessage.textContent, "");
    assert.equal(app.shell.echoCard.hidden, true);
    assert.equal(app.shell.questionEcho.textContent, "");
    assert.equal(app.shell.reExplanation.hidden, true);
    assert.equal(app.shell.explainToggle.getAttribute("aria-expanded"), "false");

    // Switching back to Three coins without crypto disables Cast and shows explanation again.
    app.shell.methodCoins.click();
    assert.equal(app.shell.castButton.disabled, true);
    assert.equal(app.shell.noRandom.hidden, false);
  } finally {
    env.restore();
  }
});

test("Change method leaves an unfinished manual cast, discards partial entries without carrying them into another method, and focuses the method selector", () => {
  const env = createDomEnvironment();
  try {
    const rng = makeSpyRandom([1, 1, 1, 1, 1, 1]);
    const app = mountApp({
      secureRandomAvailable: true,
      randomSource: rng.source,
      initialMethodId: "user",
    });

    app.shell.questionInput.value = "Keep my typed question";
    app.shell.castButton.click();

    // Record two manual changing 6s, then decide to change casting method.
    for (const v of [6, 6]) {
      app.shell.lineValueRadios.find((r) => r.value === String(v)).click();
      app.shell.addLineButton.click();
    }
    app.shell.lineValueRadios[3].click(); // pending 9

    app.shell.changeMethodButton.click();

    // Back on question step: partial figure/entries cleared, question kept, focus on method radio.
    assert.equal(app.shell.steps.question.hidden, false);
    assert.equal(app.shell.steps.casting.hidden, true);
    assert.equal(app.shell.castingEchoCard.hidden, true);
    assert.equal(app.shell.castingQuestionEcho.textContent, "");
    assert.equal(app.shell.castingFigure.children.length, 0);
    assert.equal(app.shell.lineValueRadios.every((r) => !r.checked), true);
    assert.equal(app.shell.questionInput.value, "Keep my typed question");
    assert.equal(env.document.activeElement, app.shell.methodUser);

    // Switch to Three coins and cast: none of the partial 6s carry over (all scripted 1 => 7 => stable KW 1).
    app.shell.methodCoins.click();
    assert.equal(app.methodId(), "coins");
    app.shell.castButton.click();
    app.shell.revealAllButton.click();
    assert.equal(app.shell.steps.result.hidden, false);
    assert.match(app.shell.primaryIdentity.textContent, /^1 ·/);
    assert.equal(app.shell.relatedCard.hidden, true);
    assert.equal(rng.calls, 6);
  } finally {
    env.restore();
  }
});



