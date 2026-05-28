import { describe, it, expect } from "vitest";
import { chineseZodiac, westernZodiac, getFortune } from "@/lib/zodiac";

describe("chineseZodiac (띠)", () => {
  it("연도별 12지를 반환한다", () => {
    expect(chineseZodiac(2020)).toBe("쥐");
    expect(chineseZodiac(2024)).toBe("용");
    expect(chineseZodiac(1988)).toBe("용");
    expect(chineseZodiac(1995)).toBe("돼지");
  });
});

describe("westernZodiac (별자리)", () => {
  it("월/일 경계에서 올바른 별자리를 반환한다", () => {
    expect(westernZodiac(5, 28)).toBe("쌍둥이");
    expect(westernZodiac(3, 21)).toBe("양");
    expect(westernZodiac(3, 20)).toBe("물고기");
    expect(westernZodiac(1, 19)).toBe("염소");
    expect(westernZodiac(1, 20)).toBe("물병");
    expect(westernZodiac(12, 25)).toBe("염소");
  });
});

describe("getFortune", () => {
  it("생년월일 문자열에서 띠와 별자리를 함께 계산한다", () => {
    expect(getFortune("1988-05-28")).toEqual({ animal: "용", sign: "쌍둥이" });
  });
});
