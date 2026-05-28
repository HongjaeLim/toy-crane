import { describe, it, expect } from "vitest";
import { computeScore } from "@/lib/score";
import type { EnvSnapshot } from "@/types/commute";

const base: EnvSnapshot = {
  pm2_5: 47,
  pm10: 40,
  precipitation: 0,
  windSpeed: 3,
  uvIndex: 4,
  severe: false,
};

describe("computeScore", () => {
  it("가중치 공식대로 정수 점수를 계산한다", () => {
    // 47*0.5 + 40*0.3 + 0*1.5 + 3*1 + 4*1 = 23.5 + 12 + 3 + 4 = 42.5 → 43
    expect(computeScore(base)).toBe(43);
  });

  it("severe=true면 동일 입력 대비 +20 큰 점수를 낸다", () => {
    const calm = computeScore(base);
    const stormy = computeScore({ ...base, severe: true });
    expect(stormy).toBe(calm + 20);
  });

  it("점수는 음수가 되지 않는다", () => {
    const empty: EnvSnapshot = {
      pm2_5: 0,
      pm10: 0,
      precipitation: 0,
      windSpeed: 0,
      uvIndex: 0,
      severe: false,
    };
    expect(computeScore(empty)).toBe(0);
  });
});
