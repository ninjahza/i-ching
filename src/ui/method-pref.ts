// T027 — the ONLY persistence module in the app (R-8, C-9, FR-022, B-8, data-model §9).
// Single consent-gated key: "iching.method". Questions and cast results never
// pass through this module under any call path (FR-023, C-2). Every localStorage
// access is try/caught: storage disabled degrades silently to session-only.

import type { CastingMethod } from "../core/casting.ts";

/** Allowed localStorage keys — frozen allow-list used by the audit scan (T029/B-8). */
export const STORAGE_KEYS: readonly string[] = Object.freeze(["iching.method"]);

export type MethodId = CastingMethod["id"]; // "coins" | "yarrow"

const METHOD_KEY = STORAGE_KEYS[0] as string; // "iching.method"

// Values we ever write are <= 6 chars; a hostile same-origin page could park a
// huge string under this key. The synchronous getItem read of an oversized
// value cannot be avoided, but nothing larger than this cap is ever processed
// or retained: oversized values are deleted on sight (security review F-9).
const READ_CAP_CHARS = 64;

function safely(fn: () => void): void {
  try {
    fn();
  } catch {
    // storage disabled / private mode / quota: degrade silently (NFR-003)
  }
}

function readString(key: string): string | null {
  try {
    const holder = globalThis as { localStorage?: Storage };
    const value = holder.localStorage?.getItem(key) ?? null;
    if (value !== null && value.length > READ_CAP_CHARS) {
      safely(() => holder.localStorage?.removeItem(key));
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

/** Valid stored method id, or null when absent/corrupt/disabled. */
export function readStoredMethod(): MethodId | null {
  const v = readString(METHOD_KEY);
  return v === "coins" || v === "yarrow" ? v : null;
}

/** Has the seeker opted in? (true only while the key exists.) */
export function isPersistenceOptedIn(): boolean {
  return readStoredMethod() !== null;
}

/** Write the method — ONLY through an explicit opt-in UI path (FR-022). */
export function writeMethod(id: MethodId): void {
  safely(() => {
    const holder = globalThis as { localStorage?: Storage };
    holder.localStorage?.setItem(METHOD_KEY, id);
  });
}

/** Opt-out: delete the key immediately (C-9). */
export function forgetMethod(): void {
  safely(() => {
    const holder = globalThis as { localStorage?: Storage };
    holder.localStorage?.removeItem(METHOD_KEY);
  });
}
