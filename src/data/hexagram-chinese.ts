// Classical Chinese hexagram names (卦名), traditional characters as used in
// Legge's 1882 era and the Kangxi dictionary, by King Wen number (index 0 unused).
// Standard public-domain names; presentation data only (identity is kwNumber).

export const HEXAGRAM_CHINESE: readonly (string | null)[] = [
  null,
  "乾",   // 1  Ch'ien
  "坤",   // 2  K'uen
  "屯",   // 3  Chun
  "蒙",   // 4  Meng
  "需",   // 5  Hsu
  "訟",   // 6  Sung
  "師",   // 7  Shih
  "比",   // 8  Pi
  "小畜", // 9  Hsiao Ch'u
  "履",   // 10 Lu
  "泰",   // 11 T'ai
  "否",   // 12 P'i
  "同人", // 13 T'ung Jên
  "大有", // 14 Ta Yu
  "謙",   // 15 Ch'ien (Modesty)
  "豫",   // 16 Yü
  "隨",   // 17 Sui
  "蠱",   // 18 Ku
  "臨",  // 19 Lin
  "觀",   // 20 Kuan
  "噬嗑", // 21 Shih Ho
  "賁",   // 22 Pii (Adornment)
  "剝",   // 23 Po
  "復",   // 24 Fu
  "无妄", // 25 Wu Wang
  "大畜", // 26 Ta Ch'u
  "頤",   // 27 I
  "大過", // 28 Ta Wo
  "坎",   // 29 K'an
  "離",   // 30 Li
  "咸",   // 31 Hsien
  "恆",   // 32 Hêng
  "遯",   // 33 Thun (retreat)
  "大壯", // 34 Ta Chuang
  "晉",   // 35 Tsing
  "明夷", // 36 Ming I
  "家人", // 37 Chia Jên
  "睽",   // 38 K'uei
  "蹇",   // 39 Kien (Obstruction)
  "解",   // 40 Hsieh
  "損",   // 41 Sun
  "益",   // 42 I (Increase)
  "夬",   // 43 Kuai
  "姤",   // 44 Kou
  "萃",   // 45 Ts'ui
  "升",   // 46 Shêng
  "困",   // 47 K'un (Oppression)
  "井",   // 48 Ching (The Well)
  "革",   // 49 Ko (Revolution)
  "鼎",   // 50 Ting (The Cauldron)
  "震",   // 51 Chên
  "艮",   // 52 Kên
  "漸",   // 53 Chien (Gradual Progress)
  "歸妹", // 54 Kuei Mei
  "豐",   // 55 Pheng (Abundance)
  "旅",   // 56 Lu (The Wanderer)
  "巽",   // 57 Sun
  "兌",   // 58 Tui
  "渙",   // 59 Hwan (Dispersion)
  "節",   // 60 Tsieh (Regulations)
  "中孚", // 61 Chung Fu (Inner Truth)
  "小過", // 62 Hsiao Kuo
  "既濟", // 63 Chi Ching
  "未濟", // 64 Wei Ching
];

/** Chinese name for a King Wen number; throws when out of range. */
export function chineseName(kwNumber: number): string {
  const name = kwNumber >= 1 && kwNumber <= 64 ? HEXAGRAM_CHINESE[kwNumber] : undefined;
  if (typeof name !== "string") throw new Error(`no Chinese name for KW ${kwNumber}`);
  return name;
}
