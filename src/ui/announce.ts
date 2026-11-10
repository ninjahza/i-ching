// T021 — aria-live announcer (R-5, FR-017, C-4). textContent-only writes.
import { lineValueName, lineDescriptor } from "../core/line-values.ts";
import type { LineValue } from "../core/line-values.ts";

export interface Announcer {
  announceLine(position: number, value: LineValue): void;
  announceHexagram(kwNumber: number, name: string): void;
  announceStatus(message: string): void;
}

export function createAnnouncer(region: HTMLElement): Announcer {
  const write = (text: string): void => {
    region.textContent = text; // never markup (constitution III)
  };
  return {
    announceLine(position: number, value: LineValue): void {
      write(`Line ${String(position)}: ${lineValueName(value, position)} - ${lineDescriptor(value)}.`);
    },
    announceHexagram(kwNumber: number, name: string): void {
      write(`Hexagram ${String(kwNumber)} - ${name}.`);
    },
    announceStatus(message: string): void {
      write(message);
    }
  };
}
