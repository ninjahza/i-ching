// T021 — User Cast preference & privacy integration tests (US3)
import { test } from "node:test";
import assert from "node:assert/strict";
import { mountApp } from "../src/ui/main.ts";
import { STORAGE_KEYS } from "../src/ui/method-pref.ts";
import { CONSENT_ON, CONSENT_OFF } from "../src/data/app-strings.ts";
import { createDomEnvironment } from "./helpers/dom-env.js";

test("without consent, selecting User cast and completing a consultation writes nothing to storage", () => {
  const env = createDomEnvironment();
  try {
    const app = mountApp({
      secureRandomAvailable: false,
      randomSource: null,
      initialMethodId: "coins",
    });

    assert.equal(app.shell.rememberMethod.checked, false);
    app.shell.methodUser.click();
    app.shell.questionInput.value = "Private question never saved";
    app.shell.castButton.click();

    for (const v of [6, 7, 8, 9, 6, 7]) {
      app.shell.lineValueRadios.find((r) => r.value === String(v)).click();
      app.shell.addLineButton.click();
    }
    assert.equal(app.shell.steps.result.hidden, false);
    assert.equal(env.storageMap.size, 0, "no key may be written without explicit consent");
  } finally {
    env.restore();
  }
});

test("consent remembers only iching.method = user, restores with empty consultation on reload, and deletes immediately on opt-out while keeping session choice", () => {
  const env1 = createDomEnvironment();
  let snapshotAfterOptIn;
  try {
    const app1 = mountApp({
      secureRandomAvailable: false,
      randomSource: null,
      initialMethodId: "coins",
    });

    app1.shell.methodUser.click();
    app1.shell.questionInput.value = "Transient question";
    app1.shell.rememberMethod.click(); // opt in

    assert.equal(app1.shell.rememberMethod.checked, true);
    assert.equal(app1.shell.live.textContent, CONSENT_ON);
    assert.deepEqual([...env1.storageMap.keys()], STORAGE_KEYS);
    assert.equal(env1.storageMap.get("iching.method"), "user");

    // Complete a manual consultation; verify neither question nor lines enter storage.
    app1.shell.castButton.click();
    for (const v of [9, 9, 9, 9, 9, 9]) {
      app1.shell.lineValueRadios.find((r) => r.value === String(v)).click();
      app1.shell.addLineButton.click();
    }
    assert.deepEqual([...env1.storageMap.entries()], [["iching.method", "user"]]);
    snapshotAfterOptIn = Object.fromEntries(env1.storageMap.entries());
  } finally {
    env1.restore();
  }

  // Simulate reload with persisted storage: User cast restored, consultation completely empty.
  const env2 = createDomEnvironment({ storageInitial: snapshotAfterOptIn });
  try {
    const app2 = mountApp({
      secureRandomAvailable: false,
      randomSource: null,
      initialMethodId: "coins",
    });

    assert.equal(app2.methodId(), "user");
    assert.equal(app2.shell.methodUser.checked, true);
    assert.equal(app2.shell.methodCoins.checked, false);
    assert.equal(app2.shell.methodYarrow.checked, false);
    assert.equal(app2.shell.rememberMethod.checked, true);
    assert.equal(app2.shell.castButton.disabled, false);
    assert.equal(app2.shell.noRandom.hidden, true);
    assert.equal(app2.shell.steps.question.hidden, false);
    assert.equal(app2.shell.steps.casting.hidden, true);
    assert.equal(app2.shell.steps.result.hidden, true);
    assert.equal(app2.shell.questionInput.value, "");
    assert.equal(app2.shell.primaryIdentity.textContent, "");

    // Withdraw consent: deletes stored preference immediately, session keeps User cast.
    app2.shell.rememberMethod.click();
    assert.equal(app2.shell.rememberMethod.checked, false);
    assert.equal(app2.shell.live.textContent, CONSENT_OFF);
    assert.equal(env2.storageMap.size, 0);
    assert.equal(app2.methodId(), "user");
    assert.equal(app2.shell.methodUser.checked, true);
  } finally {
    env2.restore();
  }
});

test("legacy coins and yarrow preferences still restore accurately and corrupt values fall back to default coins", () => {
  for (const legacy of ["coins", "yarrow"]) {
    const env = createDomEnvironment({ storageInitial: { "iching.method": legacy } });
    try {
      const app = mountApp({
        secureRandomAvailable: true,
        randomSource: { randomBytes: (b) => b },
        initialMethodId: "coins",
      });
      assert.equal(app.methodId(), legacy);
      assert.equal(app.shell.rememberMethod.checked, true);
      assert.equal(app.shell.methodCoins.checked, legacy === "coins");
      assert.equal(app.shell.methodYarrow.checked, legacy === "yarrow");
      assert.equal(app.shell.methodUser.checked, false);
    } finally {
      env.restore();
    }
  }

  const corruptEnv = createDomEnvironment({ storageInitial: { "iching.method": "tarot" } });
  try {
    const app = mountApp({
      secureRandomAvailable: true,
      randomSource: { randomBytes: (b) => b },
      initialMethodId: "coins",
    });
    assert.equal(app.methodId(), "coins");
    assert.equal(app.shell.rememberMethod.checked, false);
    assert.equal(app.shell.methodCoins.checked, true);
  } finally {
    corruptEnv.restore();
  }
});

test("blocked or throwing localStorage degrades cleanly in-session for User cast", () => {
  const env = createDomEnvironment();
  try {
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem() {
          throw new Error("SecurityError");
        },
        setItem() {
          throw new Error("SecurityError");
        },
        removeItem() {
          throw new Error("SecurityError");
        },
      },
      configurable: true,
      writable: true,
    });

    const app = mountApp({
      secureRandomAvailable: false,
      randomSource: null,
      initialMethodId: "coins",
    });

    app.shell.methodUser.click();
    assert.doesNotThrow(() => app.shell.rememberMethod.click());
    app.shell.castButton.click();
    for (let i = 0; i < 6; i++) {
      app.shell.lineValueRadios[2].click(); // 8
      app.shell.addLineButton.click();
    }
    assert.equal(app.shell.steps.result.hidden, false);
    assert.match(app.shell.primaryIdentity.textContent, /^2 ·/);
  } finally {
    env.restore();
  }
});
