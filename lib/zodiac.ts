import type { Fortune } from "@/types/commute";

const CHINESE = ["원숭이", "닭", "개", "돼지", "쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양"];

export function chineseZodiac(year: number): string {
  return CHINESE[((year % 12) + 12) % 12];
}

// 각 월에서 다음 별자리가 시작되는 날(이 날부터 signs[month])
const CUTOFFS = [20, 19, 21, 20, 21, 21, 23, 23, 23, 23, 22, 22];
const SIGNS = [
  "염소", "물병", "물고기", "양", "황소", "쌍둥이",
  "게", "사자", "처녀", "천칭", "전갈", "사수", "염소",
];

export function westernZodiac(month: number, day: number): string {
  return day < CUTOFFS[month - 1] ? SIGNS[month - 1] : SIGNS[month];
}

export function getFortune(birth: string): Fortune | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birth);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { animal: chineseZodiac(year), sign: westernZodiac(month, day) };
}
