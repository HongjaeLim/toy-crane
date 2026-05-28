import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TodayView } from "./today-view";
import { todaySeoul, formatKoreanDate } from "@/lib/date";
import type { CommuteResult } from "@/types/commute";

const TODAY = todaySeoul();
const TODAY_KO = formatKoreanDate(TODAY);

function payload(overrides: Partial<CommuteResult> = {}): CommuteResult {
  return {
    date: TODAY,
    cityId: "seoul",
    cityName: "서울",
    score: 47,
    title: "안개 속의 검객",
    narrative: "희뿌연 미세먼지를 가르며 책상에 다다랐다.",
    source: "ai",
    env: { pm2_5: 47, pm10: 40, precipitation: 0, windSpeed: 3, uvIndex: 4, severe: false },
    ...overrides,
  };
}

function mockFetchOnce(result: CommuteResult, ok = true) {
  return vi.fn(async () =>
    ok
      ? new Response(JSON.stringify(result), { status: 200 })
      : new Response(JSON.stringify({ error: "x" }), { status: 502 }),
  );
}

async function selectSeoul() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("combobox", { name: "도시 선택" }));
  await user.click(await screen.findByRole("option", { name: "서울" }));
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TodayView", () => {
  it("도시 미선택 진입 → 안내 Empty 표시, 점수 카드·fetch 없음", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    render(<TodayView />);

    expect(
      await screen.findByText("도시를 고르면 오늘의 출근 점수가 나옵니다."),
    ).toBeInTheDocument();
    expect(screen.queryByText("오늘 난이도")).not.toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("서울 선택 → 카드에 날짜·도시·점수·칭호·서사·환경 리본 표시", async () => {
    vi.stubGlobal("fetch", mockFetchOnce(payload()));
    render(<TodayView />);
    await selectSeoul();

    const score = await screen.findByText("47");
    const card = score.closest("[data-slot=card]") as HTMLElement;
    expect(within(card).getByText(new RegExp(TODAY_KO))).toBeInTheDocument();
    expect(within(card).getByText(/서울/)).toBeInTheDocument();
    expect(within(card).getByText("안개 속의 검객")).toBeInTheDocument();
    expect(
      within(card).getByText("희뿌연 미세먼지를 가르며 책상에 다다랐다."),
    ).toBeInTheDocument();
    expect(within(card).getByText(/PM2\.5 47/)).toBeInTheDocument();
    expect(within(card).getByText(/PM10 40/)).toBeInTheDocument();
    expect(within(card).getByText(/UV 4/)).toBeInTheDocument();
  });

  it("오늘 레코드가 저장돼 있으면 재마운트 시 같은 카드, fetch 미호출", async () => {
    window.localStorage.setItem(
      "commute-mileage:v1",
      JSON.stringify({ [TODAY]: payload({ score: 31, title: "보존된 칭호" }) }),
    );
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    render(<TodayView />);

    expect(await screen.findByText("보존된 칭호")).toBeInTheDocument();
    expect(screen.getByText("31")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("fetch 실패 → 에러 메시지+다시 시도, 재시도 클릭 시 재요청", async () => {
    const fetchSpy = mockFetchOnce(payload(), false);
    vi.stubGlobal("fetch", fetchSpy);
    render(<TodayView />);
    await selectSeoul();

    expect(await screen.findByText("환경 데이터를 받지 못했어요.")).toBeInTheDocument();
    const retry = screen.getByRole("button", { name: "다시 시도" });
    const callsBefore = fetchSpy.mock.calls.length;
    await userEvent.setup().click(retry);
    await waitFor(() => expect(fetchSpy.mock.calls.length).toBeGreaterThan(callsBefore));
  });

  it("source=fallback 응답 → 카드 표시, 에러/실패 문구 없음", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchOnce(payload({ source: "fallback", title: "끈기의 출근자" })),
    );
    render(<TodayView />);
    await selectSeoul();

    expect(await screen.findByText("끈기의 출근자")).toBeInTheDocument();
    expect(screen.queryByText(/에러/)).not.toBeInTheDocument();
    expect(screen.queryByText(/실패/)).not.toBeInTheDocument();
  });
});
