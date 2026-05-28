import type { EnvSnapshot } from "@/types/commute";

export function computeScore(env: EnvSnapshot): number {
  const raw =
    env.pm2_5 * 0.5 +
    env.pm10 * 0.3 +
    env.precipitation * 1.5 +
    env.windSpeed * 1.0 +
    env.uvIndex * 1.0 +
    (env.severe ? 20 : 0);
  return Math.max(0, Math.round(raw));
}
