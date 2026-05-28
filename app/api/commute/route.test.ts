import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

type GeminiMode = "success" | "fail";

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
  gemini?: GeminiMode;
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
    if (u.includes("generativelanguage")) {
      if (opts.gemini === "fail") {
        return new Response("upstream error", { status: 500 });
      }
      const text = JSON.stringify({ title: "AI 칭호", narrative: "AI 서사입니다." });
      return new Response(
        JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }),
        { status: 200 },
      );
    }
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
  vi.unstubAllEnvs();
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

  it("Gemini 성공 → title·narrative가 AI 값, source=ai", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubGlobal("fetch", mockOpenMeteo({ gemini: "success" }));
    const res = await GET(request("seoul"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.title).toBe("AI 칭호");
    expect(body.narrative).toBe("AI 서사입니다.");
    expect(body.source).toBe("ai");
  });

  it("Gemini 실패 → 점수 정상 + fallback 칭호, source=fallback, 에러 문구 없음", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubGlobal("fetch", mockOpenMeteo({ gemini: "fail" }));
    const res = await GET(request("seoul"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.score).toBe(43);
    expect(body.source).toBe("fallback");
    expect(body.title).toBeTruthy();
    expect(body.narrative).toBeTruthy();
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain("에러");
    expect(serialized).not.toContain("실패");
  });

  it("GEMINI_API_KEY 미설정 → 200, source=fallback", async () => {
    vi.stubGlobal("fetch", mockOpenMeteo());
    const res = await GET(request("seoul"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.source).toBe("fallback");
  });

  it("birth 파라미터 → 응답에 띠·별자리(fortune)가 포함된다", async () => {
    vi.stubGlobal("fetch", mockOpenMeteo());
    const res = await GET(new NextRequest("http://localhost/api/commute?city=seoul&birth=1988-05-28"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.fortune).toEqual({ animal: "용", sign: "쌍둥이" });
  });

  it("birth 없으면 fortune은 null", async () => {
    vi.stubGlobal("fetch", mockOpenMeteo());
    const res = await GET(request("seoul"));
    const body = await res.json();
    expect(body.fortune).toBeNull();
  });

  it("일부 시간대 결측(null)이 있어도 점수는 유한한 정수다", async () => {
    const time = isoHours();
    const pm2_5 = time.map((_, i) => (i >= 7 ? null : 30)); // 출근 시간대 전부 null
    const airBody = { hourly: { time, pm10: fill(time.length, 40), pm2_5 } };
    const forecastBody = {
      hourly: {
        time,
        precipitation: fill(time.length, 0),
        wind_speed_10m: fill(time.length, 3),
        uv_index: fill(time.length, 4),
        weather_code: fill(time.length, 0),
      },
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string | URL) =>
        String(url).includes("air-quality")
          ? new Response(JSON.stringify(airBody), { status: 200 })
          : new Response(JSON.stringify(forecastBody), { status: 200 }),
      ),
    );
    const res = await GET(request("seoul"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Number.isInteger(body.score)).toBe(true);
    expect(body.env.pm2_5).toBe(0); // 결측은 0으로 집계
  });
});
