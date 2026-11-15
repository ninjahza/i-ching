// T002 — Preference tests for manual method identifier alongside coins and yarrow
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  STORAGE_KEYS,
  readStoredMethod,
  isPersistenceOptedIn,
  writeMethod,
  forgetMethod,
} from "../src/ui/method-pref.ts";

function installMockStorage(initial = {}, { throwOnGet = false, throwOnSet = false, throwOnRemove = false } = {}) {
  const map = new Map(Object.entries(initial));
  const ops = [];
  const storage = {
    get length() {
      return map.size;
    },
    key(index) {
      return [...map.keys()][index] ?? null;
    },
    getItem(k) {
      ops.push(["getItem", k]);
      if (throwOnGet) throw new Error("storage getItem blocked");
      return map.has(k) ? map.get(k) : null;
    },
    setItem(k, v) {
      ops.push(["setItem", k, String(v)]);
      if (throwOnSet) throw new Error("storage setItem blocked");
      map.set(k, String(v));
    },
    removeItem(k) {
      ops.push(["removeItem", k]);
      if (throwOnRemove) throw new Error("storage removeItem blocked");
      map.delete(k);
    },
    clear() {
      map.clear();
    },
  };
  const prev = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    value: storage,
    configurable: true,
    writable: true,
  });
  return {
    map,
    ops,
    restore() {
      if (prev) Object.defineProperty(globalThis, "localStorage", prev);
      else delete globalThis.localStorage;
    },
  };
}

test("STORAGE_KEYS freezes only iching.method", () => {
  assert.deepEqual(STORAGE_KEYS, ["iching.method"]);
  assert.equal(Object.isFrozen(STORAGE_KEYS), true);
});

test("accepts coins, yarrow, and user under iching.method only", () => {
  const mock = installMockStorage();
  try {
    assert.equal(readStoredMethod(), null);
    assert.equal(isPersistenceOptedIn(), false);

    for (const id of ["coins", "yarrow", "user"]) {
      writeMethod(id);
      assert.equal(readStoredMethod(), id);
      assert.equal(isPersistenceOptedIn(), true);
      assert.deepEqual([...mock.map.keys()], ["iching.method"]);
      assert.equal(mock.map.get("iching.method"), id);
    }

    forgetMethod();
    assert.equal(readStoredMethod(), null);
    assert.equal(isPersistenceOptedIn(), false);
    assert.equal(mock.map.size, 0);
  } finally {
    mock.restore();
  }
});

test("rejects corrupt, unknown, and oversized stored values and ignores invalid writes", () => {
  for (const bad of ["", "dice", "USER", "Coins", "coins ", "6", "null", "{}"]) {
    const mock = installMockStorage({ "iching.method": bad });
    try {
      assert.equal(readStoredMethod(), null, `expected null for corrupt value ${JSON.stringify(bad)}`);
      assert.equal(isPersistenceOptedIn(), false);
    } finally {
      mock.restore();
    }
  }

  const oversized = installMockStorage({ "iching.method": "u".repeat(100) });
  try {
    assert.equal(readStoredMethod(), null);
    assert.equal(oversized.map.has("iching.method"), false, "oversized value must be evicted");
  } finally {
    oversized.restore();
  }

  const guardWrite = installMockStorage();
  try {
    writeMethod("invalid-method");
    assert.equal(guardWrite.map.size, 0, "invalid method id must not be persisted");
  } finally {
    guardWrite.restore();
  }
});

test("degrades silently when localStorage is absent or throws", () => {
  const prev = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    value: undefined,
    configurable: true,
    writable: true,
  });
  try {
    assert.equal(readStoredMethod(), null);
    assert.equal(isPersistenceOptedIn(), false);
    assert.doesNotThrow(() => writeMethod("user"));
    assert.doesNotThrow(() => forgetMethod());
  } finally {
    if (prev) Object.defineProperty(globalThis, "localStorage", prev);
    else delete globalThis.localStorage;
  }

  const throwing = installMockStorage(
    { "iching.method": "user" },
    { throwOnGet: true, throwOnSet: true, throwOnRemove: true },
  );
  try {
    assert.equal(readStoredMethod(), null);
    assert.equal(isPersistenceOptedIn(), false);
    assert.doesNotThrow(() => writeMethod("user"));
    assert.doesNotThrow(() => forgetMethod());
  } finally {
    throwing.restore();
  }
});
