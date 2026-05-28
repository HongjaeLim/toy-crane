export interface City {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface EnvSnapshot {
  pm2_5: number;
  pm10: number;
  precipitation: number;
  windSpeed: number;
  uvIndex: number;
  severe: boolean;
}

export type ResultSource = "ai" | "fallback";

export interface Fortune {
  animal: string; // 띠
  sign: string; // 별자리
}

export interface CommuteResult {
  date: string; // YYYY-MM-DD, Asia/Seoul
  cityId: string;
  cityName: string;
  score: number;
  title: string;
  narrative: string;
  source: ResultSource;
  env: EnvSnapshot;
  fortune?: Fortune | null;
}
