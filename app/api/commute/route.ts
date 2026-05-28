import { NextRequest, NextResponse } from "next/server";
import { getCity } from "@/config/cities";
import { fetchEnvSnapshot } from "@/lib/open-meteo";
import { computeScore } from "@/lib/score";
import { todaySeoul } from "@/lib/date";

export async function GET(req: NextRequest) {
  const city = getCity(req.nextUrl.searchParams.get("city"));
  if (!city) {
    return NextResponse.json({ error: "유효하지 않은 도시입니다." }, { status: 400 });
  }

  try {
    const env = await fetchEnvSnapshot(city);
    const score = computeScore(env);
    return NextResponse.json({
      date: todaySeoul(),
      cityId: city.id,
      cityName: city.name,
      score,
      env,
    });
  } catch {
    return NextResponse.json(
      { error: "환경 데이터를 받지 못했어요. 잠시 후 다시 시도해주세요." },
      { status: 502 },
    );
  }
}
