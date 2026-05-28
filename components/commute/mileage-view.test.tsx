import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MileageView } from "./mileage-view";
import { todaySeoul } from "@/lib/date";
import type { CommuteResult } from "@/types/commute";

const TODAY = todaySeoul();

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

function seed(records: CommuteResult[]) {
  const store = Object.fromEntries(records.map((r) => [r.date, r]));
  window.localStorage.setItem("commute-mileage:v1", JSON.stringify(store));
}

// 현재 달(오늘 기준) 안의 날짜 키를 만든다.
function thisMonthDate(day: number): string {
  const [y, m] = TODAY.split("-");
  return `${y}-${m}-${String(day).padStart(2, "0")}`;
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("MileageView", () => {
  it("3일치 기록 → 총 출근일 3, 누적 점수는 합계", async () => {
    seed([
      result(thisMonthDate(1), 10, "A"),
      result(thisMonthDate(2), 20, "B"),
      result(thisMonthDate(3), 30, "C"),
    ]);
    render(<MileageView />);

    const daysCard = (await screen.findByText("총 출근일")).closest(
      "[data-slot=card]",
    ) as HTMLElement;
    expect(within(daysCard).getByText("3")).toBeInTheDocument();
    const scoreCard = screen.getByText("누적 점수").closest(
      "[data-slot=card]",
    ) as HTMLElement;
    expect(within(scoreCard).getByText("60")).toBeInTheDocument();
  });

  it("기록 있는 날짜 셀에 칭호 표시, 날짜별로 독립적이다", async () => {
    seed([
      result(thisMonthDate(10), 15, "안개의 검객"),
      result(thisMonthDate(20), 80, "폭풍의 기사"),
    ]);
    render(<MileageView />);

    expect(await screen.findByText("안개의 검객")).toBeInTheDocument();
    expect(screen.getByText("폭풍의 기사")).toBeInTheDocument();
  });

  it("오늘 날짜 셀이 강조된다", async () => {
    seed([result(TODAY, 42, "오늘의 검객")]);
    const { container } = render(<MileageView />);

    expect(await screen.findByText("오늘의 검객")).toBeInTheDocument();
    const todayCell = container.querySelector("[data-today]");
    expect(todayCell).not.toBeNull();
    expect(within(todayCell as HTMLElement).getByText("오늘의 검객")).toBeInTheDocument();
  });

  it('"오늘" 탭이 메인(/)으로 연결된다', async () => {
    seed([result(TODAY, 42, "검객")]);
    render(<MileageView />);

    const todayTab = await screen.findByRole("link", { name: /오늘/ });
    expect(todayTab).toHaveAttribute("href", "/");
  });
});
