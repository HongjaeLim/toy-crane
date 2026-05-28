import { describe, it, expect } from "vitest";
import { fallbackTitle } from "@/lib/title-fallback";

describe("fallbackTitle", () => {
  it("낮은 점수 → 평온한 구간 칭호 + 마침표로 끝나는 1줄 서사", () => {
    const { title, narrative } = fallbackTitle(20);
    expect(title).toBeTruthy();
    expect(typeof title).toBe("string");
    expect(narrative.endsWith(".")).toBe(true);
  });

  it("높은 점수 → 낮은 점수와 다른 칭호", () => {
    expect(fallbackTitle(75).title).not.toBe(fallbackTitle(20).title);
  });

  it("구간 경계에서도 항상 칭호와 서사를 반환한다", () => {
    for (const score of [0, 30, 31, 60, 61, 200]) {
      const r = fallbackTitle(score);
      expect(r.title.length).toBeGreaterThan(0);
      expect(r.narrative.length).toBeGreaterThan(0);
    }
  });
});
