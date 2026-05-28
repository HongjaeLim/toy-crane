import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

function isoHours(count = 11): string[] {
  return Array.from(
    { length: count },
    (_, i) => `2026-05-28T${String(i).padStart(2, "0")}:00`,
  );
}

function fill(count: number, value: number): number[] {
  return Array.from({ length: count }, () => value);
}

interface MockOpts {
  forecastStatus?: number;
  airStatus?: number;
}

function mockOpenMeteo(opts: MockOpts = {}) {
  const time = isoHours();
  const forecastBody = {
    hourly: {
      time,
      precipitation: fill(time.length, 0),
      wind_speed_10m: fill(time.length, 3),
      uv_index: fill(time.length, 4),
      weather_code: fill(time.length, 0),
    },
  };
  const airBody = {
    hourly: {
      time,
      pm10: fill(time.length, 40),
      pm2_5: fill(time.length, 47),
    },
  };
  return vi.fn(async (url: string | URL) => {
    const u = String(url);
    if (u.includes("air-quality")) {
      return new Response(JSON.stringify(airBody), { status: opts.airStatus ?? 200 });
    }
    return new Response(JSON.stringify(forecastBody), {
      status: opts.forecastStatus ?? 200,
    });
  });
}

function request(city: string | null) {
  const url = city
    ? `http://localhost/api/commute?city=${city}`
    : `http://localhost/api/commute`;
  return new NextRequest(url);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GET /api/commute", () => {
  it("유효한 도시 → 200, 비음수 정수 점수와 환경 데이터를 반환한다", async () => {
    vi.stubGlobal("fetch", mockOpenMeteo());
    const res = await GET(request("seoul"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.cityName).toBe("서울");
    expect(Number.isInteger(body.score)).toBe(true);
    expect(body.score).toBeGreaterThanOrEqual(0);
    expect(body.score).toBe(43); // 47*0.5 + 40*0.3 + 3 + 4
    expect(body.env).toMatchObject({ pm2_5: 47, pm10: 40, severe: false });
    expect(body.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("유효하지 않은 도시 → 400", async () => {
    vi.stubGlobal("fetch", mockOpenMeteo());
    const res = await GET(request("atlantis"));
    expect(res.status).toBe(400);
  });

  it("도시 누락 → 400", async () => {
    vi.stubGlobal("fetch", mockOpenMeteo());
    const res = await GET(request(null));
    expect(res.status).toBe(400);
  });

  it("Open-Meteo 응답 실패 → 502, 점수 없음", async () => {
    vi.stubGlobal("fetch", mockOpenMeteo({ airStatus: 503 }));
    const res = await GET(request("seoul"));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.score).toBeUndefined();
    expect(body.error).toBeTruthy();
  });
});
