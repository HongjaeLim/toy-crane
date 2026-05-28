import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMileage, aggregate, type MileageStore } from "@/hooks/use-mileage";
import type { CommuteResult } from "@/types/commute";

function result(date: string, score: number, title: string): CommuteResult {
  return {
    date,
    cityId: "seoul",
    cityName: "서울",
    score,
    title,
    narrative: "서사.",
    source: "fallback",
    env: { pm2_5: 1, pm10: 1, precipitation: 0, windSpeed: 1, uvIndex: 1, severe: false },
  };
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("useMileage", () => {
  it("saveResult로 저장한 레코드를 getResult로 다시 읽는다", () => {
    const { result: hook } = renderHook(() => useMileage());
    act(() => hook.current.saveResult(result("2026-05-28", 47, "검객")));
    expect(hook.current.getResult("2026-05-28")?.title).toBe("검객");
  });

  it("저장은 localStorage에 영속되어 새 인스턴스에서 읽힌다", () => {
    const first = renderHook(() => useMileage());
    act(() => first.result.current.saveResult(result("2026-05-28", 47, "검객")));
    const second = renderHook(() => useMileage());
    expect(second.result.current.getResult("2026-05-28")?.score).toBe(47);
  });

  it("같은 날짜에 다시 저장하면 덮어쓴다 (날짜당 1 레코드)", () => {
    const { result: hook } = renderHook(() => useMileage());
    act(() => hook.current.saveResult(result("2026-05-28", 10, "A")));
    act(() => hook.current.saveResult(result("2026-05-28", 99, "B")));
    expect(hook.current.records).toHaveLength(1);
    expect(hook.current.getResult("2026-05-28")?.title).toBe("B");
  });
});

describe("aggregate", () => {
  it("총 출근일과 누적 점수를 계산한다", () => {
    const store: MileageStore = {
      "2026-05-26": result("2026-05-26", 10, "A"),
      "2026-05-27": result("2026-05-27", 20, "B"),
      "2026-05-28": result("2026-05-28", 30, "C"),
    };
    expect(aggregate(store)).toEqual({ totalDays: 3, totalScore: 60 });
  });

  it("빈 store는 0을 반환한다", () => {
    expect(aggregate({})).toEqual({ totalDays: 0, totalScore: 0 });
  });
});
