export const HEAVENLY_STEMS = [
  { hanja: "甲", korean: "갑", element: "wood", yinYang: "yang" },
  { hanja: "乙", korean: "을", element: "wood", yinYang: "yin" },
  { hanja: "丙", korean: "병", element: "fire", yinYang: "yang" },
  { hanja: "丁", korean: "정", element: "fire", yinYang: "yin" },
  { hanja: "戊", korean: "무", element: "earth", yinYang: "yang" },
  { hanja: "己", korean: "기", element: "earth", yinYang: "yin" },
  { hanja: "庚", korean: "경", element: "metal", yinYang: "yang" },
  { hanja: "辛", korean: "신", element: "metal", yinYang: "yin" },
  { hanja: "壬", korean: "임", element: "water", yinYang: "yang" },
  { hanja: "癸", korean: "계", element: "water", yinYang: "yin" },
] as const;

export const EARTHLY_BRANCHES = [
  { hanja: "子", korean: "자" },
  { hanja: "丑", korean: "축" },
  { hanja: "寅", korean: "인" },
  { hanja: "卯", korean: "묘" },
  { hanja: "辰", korean: "진" },
  { hanja: "巳", korean: "사" },
  { hanja: "午", korean: "오" },
  { hanja: "未", korean: "미" },
  { hanja: "申", korean: "신" },
  { hanja: "酉", korean: "유" },
  { hanja: "戌", korean: "술" },
  { hanja: "亥", korean: "해" },
] as const;

export type Element = (typeof HEAVENLY_STEMS)[number]["element"];

