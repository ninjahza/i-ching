// T014 — Line values (data-model §1, R-3/R-6). Pure logic, no DOM (T010).

/** Traditional changing numbers: 6 old yin · 7 young yang · 8 young yin · 9 old yang. */
export type LineValue = 6 | 7 | 8 | 9;

export function isYang(v: LineValue): boolean {
  return (v & 1) === 1;
}

export function isChanging(v: LineValue): boolean {
  return v === 6 || v === 9;
}

/** Runtime validation for values decoded from injected random sources. */
export function assertLineValue(v: number): LineValue {
  if (v === 6 || v === 7 || v === 8 || v === 9) return v;
  throw new Error(`not a line value: ${String(v)}`);
}

const ORDINALS = ["first", "second", "third", "fourth", "fifth", "top"] as const;

/**
 * Traditional line designation, e.g. lineValueName(9, 2) =
 * "nine in the second place" (yang = nine, yin = six; R-6/FR-017).
 */
export function lineValueName(v: LineValue, position: number): string {
  const ordinal = ORDINALS[position - 1] as string;
  return `${isYang(v) ? "nine" : "six"} in the ${ordinal} place`;
}

/** Changing-line marker glyphs (traditional shape markers, R-6). */
export const MARKER_OLD_YANG = "○" as const; // 9 — a circle (old yang)
export const MARKER_OLD_YIN = "✕" as const;  // 6 — a cross (old yin)

/** English descriptor for announcements and visible text (C-4: shape + word). */
export function lineDescriptor(v: LineValue): string {
  return `${isYang(v) ? "unbroken line" : "broken line"}${isChanging(v) ? ", changing" : ""}`;
}
