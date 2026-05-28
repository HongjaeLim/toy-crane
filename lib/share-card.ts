import type { CommuteResult } from "@/types/commute";

// 카드를 URL 쿼리(?c=)에 담아 공유하기 위한 UTF-8 안전 base64url 인코딩.
export function encodeCard(result: CommuteResult): string {
  const bytes = new TextEncoder().encode(JSON.stringify(result));
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeCard(param: string): CommuteResult | null {
  if (!param) return null;
  try {
    const b64 = param.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const obj = JSON.parse(json) as CommuteResult;
    if (typeof obj.score !== "number" || typeof obj.title !== "string") return null;
    return obj;
  } catch {
    return null;
  }
}
