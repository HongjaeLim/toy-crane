import { describe, it, expect } from "vitest";
import { encodeCard, decodeCard } from "@/lib/share-card";
import type { CommuteResult } from "@/types/commute";

const sample: CommuteResult = {
  date: "2026-05-28",
  cityId: "seoul",
  cityName: "서울",
  score: 42,
  title: "안개 속의 검객",
  narrative: "희뿌연 미세먼지를 가르며 책상에 다다랐다.",
  source: "ai",
  env: { pm2_5: 42, pm10: 40, precipitation: 0, windSpeed: 3, uvIndex: 4, severe: false },
  fortune: { animal: "말", sign: "전갈" },
};

describe("encodeCard / decodeCard", () => {
  it("한글 포함 카드를 인코딩 후 디코딩하면 원본과 같다", () => {
    const decoded = decodeCard(encodeCard(sample));
    expect(decoded).toEqual(sample);
  });

  it("인코딩 결과는 URL-safe 문자만 포함한다", () => {
    expect(encodeCard(sample)).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("잘못된 문자열은 null을 반환한다", () => {
    expect(decodeCard("!!!not-valid!!!")).toBeNull();
    expect(decodeCard("")).toBeNull();
  });
});
