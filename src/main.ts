// T020 — thin entry (R-12): probe secure-random ONCE at boot and mount.
// The ONLY place crypto is touched (constitution IV; B-7). No weak fallback.
import { mountApp } from "./ui/main.ts";
import type { RandomSource } from "./core/casting.ts";

function secureRandomAvailable(): boolean {
  return typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function";
}

function makeRandomSource(): RandomSource | null {
  if (!secureRandomAvailable()) return null;
  return {
    randomBytes(out: Uint8Array): Uint8Array {
      crypto.getRandomValues(out as Uint8Array<ArrayBuffer>);
      return out;
    }
  };
}

const available = secureRandomAvailable();

mountApp({
  secureRandomAvailable: available,
  randomSource: makeRandomSource(),
  initialMethodId: "coins" // US2 replaces with consent-gated restore; seam only
});
