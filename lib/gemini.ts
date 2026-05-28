import type { EnvSnapshot, Fortune } from "@/types/commute";
import type { TitleResult } from "@/lib/title-fallback";

// NOTE: 이 모듈은 route handler(서버)에서만 import된다. GEMINI_API_KEY는
// process.env로만 읽으며 클라이언트 번들에 포함되지 않는다.

const MODEL = "gemini-2.5-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

interface GenerateParams {
  cityName: string;
  score: number;
  env: EnvSnapshot;
  fortune?: Fortune | null;
}

function buildPrompt({ cityName, score, env, fortune }: GenerateParams): string {
  const fortuneLine = fortune
    ? `\n이 사람은 ${fortune.animal}띠, ${fortune.sign}자리다. 칭호와 서사에 이 띠·별자리의 기운을 자연스럽게 녹여 더 개인화하라.`
    : "";
  return `너는 매일 아침 직장인의 출근을 영웅 서사시로 변환하는 RPG 내레이터다.
오늘 ${cityName}의 출근 환경(07~10시 평균):
- 초미세먼지 PM2.5: ${env.pm2_5}
- 미세먼지 PM10: ${env.pm10}
- 강수량: ${env.precipitation}mm
- 풍속: ${env.windSpeed}m/s
- 자외선 지수: ${env.uvIndex}
- 기상특보 수준: ${env.severe ? "있음" : "없음"}
- 종합 출근 난이도 점수: ${score} (높을수록 험난)${fortuneLine}

규칙:
1. title: 위 환경을 적군으로 본 4~14자 한국어 영웅 칭호. 매번 새로운 어휘로 짓고, 흔한 예시를 그대로 쓰지 마라.
2. narrative: 출근을 영웅담처럼 묘사한 한 문장(40~80자, 마침표로 끝). 위트있고 약간 과장되게.
3. 점수가 낮으면 평온한 톤, 높으면 비장하고 장엄한 톤으로.
JSON으로만 답하라.`;
}

export async function generateTitle(params: GenerateParams): Promise<TitleResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const res = await fetch(ENDPOINT, {
    method: "POST",
    signal: AbortSignal.timeout(8000),
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(params) }] }],
      generationConfig: {
        temperature: 1.3,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            narrative: { type: "string" },
          },
          required: ["title", "narrative"],
        },
      },
    }),
  });

  if (!res.ok) throw new Error(`Gemini error ${res.status}`);

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini empty response");

  const parsed = JSON.parse(text) as Partial<TitleResult>;
  if (!parsed.title || !parsed.narrative) throw new Error("Gemini malformed response");
  return { title: parsed.title, narrative: parsed.narrative };
}
