// T021 / T012 — aria-live announcer (R-5, FR-016, FR-017, C-4). textContent-only writes.
import { lineValueName, lineDescriptor } from "../core/line-values.ts";
import type { LineValue } from "../core/line-values.ts";
import {
  announceManualSelection as formatManualSelection,
  announceManualLineAdded,
  announceManualFinalLineAndResult,
  announceManualUndo as formatManualUndo,
} from "../data/app-strings.ts";

export interface Announcer {
  announceLine(position: number, value: LineValue): void;
  announceHexagram(kwNumber: number, name: string): void;
  announceStatus(message: string): void;
  announceManualSelection(value: LineValue, position: number): void;
  announceManualLine(position: number, value: LineValue): void;
  announceManualCompletion(
    value: LineValue,
    kwNumber: number,
    name: string,
    related: { readonly num: number; readonly name: string } | null,
  ): void;
  announceManualUndo(removedPosition: number, removedValue: LineValue): void;
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
    },
    announceManualSelection(value: LineValue, position: number): void {
      write(formatManualSelection(value, position));
    },
    announceManualLine(position: number, value: LineValue): void {
      write(announceManualLineAdded(position, value, lineValueName(value, position)));
    },
    announceManualCompletion(
      value: LineValue,
      kwNumber: number,
      name: string,
      related: { readonly num: number; readonly name: string } | null,
    ): void {
      write(announceManualFinalLineAndResult(value, lineValueName(value, 6), kwNumber, name, related));
    },
    announceManualUndo(removedPosition: number, removedValue: LineValue): void {
      write(formatManualUndo(removedPosition, removedValue));
    },
  };
}
