import { NextRequest, NextResponse } from "next/server";
import { getCity } from "@/config/cities";
import { fetchEnvSnapshot } from "@/lib/open-meteo";
import { computeScore } from "@/lib/score";
import { generateTitle } from "@/lib/gemini";
import { fallbackTitle } from "@/lib/title-fallback";
import { todaySeoul } from "@/lib/date";
import { getFortune } from "@/lib/zodiac";
import type { EnvSnapshot, Fortune, ResultSource } from "@/types/commute";

async function resolveTitle(params: {
  cityName: string;
  score: number;
  env: EnvSnapshot;
  fortune: Fortune | null;
}): Promise<{ title: string; narrative: string; source: ResultSource }> {
  try {
    const ai = await generateTitle(params);
    return { ...ai, source: "ai" };
  } catch {
    return { ...fallbackTitle(params.score, params.fortune), source: "fallback" };
  }
}

export async function GET(req: NextRequest) {
  const city = getCity(req.nextUrl.searchParams.get("city"));
  if (!city) {
    return NextResponse.json({ error: "유효하지 않은 도시입니다." }, { status: 400 });
  }

  const birth = req.nextUrl.searchParams.get("birth");
  const fortune = birth ? getFortune(birth) : null;

  try {
    const env = await fetchEnvSnapshot(city);
    const score = computeScore(env);
    const { title, narrative, source } = await resolveTitle({
      cityName: city.name,
      score,
      env,
      fortune,
    });

    return NextResponse.json({
      date: todaySeoul(),
      cityId: city.id,
      cityName: city.name,
      score,
      title,
      narrative,
      source,
      env,
      fortune,
    });
  } catch {
    return NextResponse.json(
      { error: "환경 데이터를 받지 못했어요. 잠시 후 다시 시도해주세요." },
      { status: 502 },
    );
  }
}
