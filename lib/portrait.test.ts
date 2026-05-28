import { describe, it, expect } from "vitest";
import { portraitUrl } from "@/lib/portrait";
import type { CommuteResult } from "@/types/commute";

function result(overrides: Partial<CommuteResult> = {}): CommuteResult {
  return {
    date: "2026-05-28",
    cityId: "seoul",
    cityName: "서울",
    score: 12,
    title: "안개 속의 검객",
    narrative: "서사.",
    source: "ai",
    env: { pm2_5: 12, pm10: 12, precipitation: 0, windSpeed: 1, uvIndex: 1, severe: false },
    fortune: { animal: "용", sign: "쌍둥이" },
    ...overrides,
  };
}

describe("portraitUrl", () => {
  it("Pollinations 이미지 URL을 만든다", () => {
    const url = portraitUrl(result());
    expect(url.startsWith("https://image.pollinations.ai/prompt/")).toBe(true);
    expect(url).toContain("width=512");
    expect(url).toContain("nologo=true");
  });

  it("같은 칭호는 같은 seed(=같은 그림), 다른 칭호는 다른 seed", () => {
    const a = portraitUrl(result({ title: "안개 속의 검객" }));
    const b = portraitUrl(result({ title: "안개 속의 검객" }));
    const c = portraitUrl(result({ title: "폭풍의 기사" }));
    const seed = (u: string) => new URL(u).searchParams.get("seed");
    expect(seed(a)).toBe(seed(b));
    expect(seed(a)).not.toBe(seed(c));
  });

  it("띠가 있으면 프롬프트에 동물(영문)이 반영된다", () => {
    const url = portraitUrl(result({ fortune: { animal: "용", sign: "쌍둥이" } }));
    expect(decodeURIComponent(url)).toContain("dragon");
  });
});
