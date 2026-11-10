// T011 — Eight trigrams (data-model §4). bits: bottom line = bit 0 (R-3).
export interface Trigram {
  readonly id: number;
  readonly name: string;
  readonly nature: string;
  readonly bits: number; // 3-bit pattern, bottom line = bit 0, yang = 1
}

// Names: Wade-Giles transliterations of the trigram names with their classical
// natures (Shuo Kua associations per Legge, SBE XVI). Kept free of any modern
// rendering's distinctive phrasing (A-3).
export const TRIGRAMS: readonly Trigram[] = [
  { id: 0, name: "K'un", nature: "Earth", bits: 0b000 },
  { id: 1, name: "Chen", nature: "Thunder", bits: 0b001 },
  { id: 2, name: "K'an", nature: "Water", bits: 0b010 },
  { id: 3, name: "Tui", nature: "Lake", bits: 0b011 },
  { id: 4, name: "Ken", nature: "Mountain", bits: 0b100 },
  { id: 5, name: "Li", nature: "Fire", bits: 0b101 },
  { id: 6, name: "Hsün", nature: "Wind", bits: 0b110 },
  { id: 7, name: "Ch'ien", nature: "Heaven", bits: 0b111 }
] as const;
