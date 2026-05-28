import type { CommuteResult } from "@/types/commute";

const ANIMAL_EN: Record<string, string> = {
  쥐: "rat",
  소: "ox",
  호랑이: "tiger",
  토끼: "rabbit",
  용: "dragon",
  뱀: "snake",
  말: "horse",
  양: "goat",
  원숭이: "monkey",
  닭: "rooster",
  개: "dog",
  돼지: "pig",
};

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function mood(score: number): string {
  if (score <= 30) return "calm, soft morning light, peaceful";
  if (score <= 60) return "determined, breezy, a little dramatic";
  return "epic, stormy, intense, dramatic lighting";
}

// 칭호로 결정되는 무료 Pollinations 캐릭터 일러스트 URL.
// 같은 칭호 → 같은 seed → 같은 그림 (안정적), 다른 칭호 → 다른 그림.
export function portraitUrl(result: CommuteResult): string {
  const companion = result.fortune ? `${ANIMAL_EN[result.fortune.animal] ?? "spirit"} spirit companion, ` : "";
  const prompt = `minimal flat vector illustration of a heroic Korean office commuter character, ${companion}${mood(result.score)}, simple shapes, soft pastel palette, centered, square, no text`;
  const seed = hashSeed(result.title);
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true&seed=${seed}`;
}
