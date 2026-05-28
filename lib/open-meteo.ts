import type { City, EnvSnapshot } from "@/types/commute";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";

const COMMUTE_HOURS = [7, 8, 9, 10];

// WMO weather codes treated as "기상특보" level: heavy rain(65), heavy snow(75),
// violent rain showers(82), heavy snow showers(86), thunderstorm(95/96/99).
const SEVERE_CODES = new Set([65, 75, 82, 86, 95, 96, 99]);

interface ForecastHourly {
  time: string[];
  precipitation: number[];
  wind_speed_10m: number[];
  uv_index: number[];
  weather_code: number[];
}

interface AirHourly {
  time: string[];
  pm10: number[];
  pm2_5: number[];
}

function hourOf(iso: string): number {
  return Number(iso.slice(11, 13));
}

function avgAtCommuteHours(times: string[], values: number[]): number {
  const picked: number[] = [];
  for (let i = 0; i < times.length; i++) {
    if (COMMUTE_HOURS.includes(hourOf(times[i]))) picked.push(values[i]);
  }
  if (picked.length === 0) return 0;
  const sum = picked.reduce((a, b) => a + b, 0);
  return Math.round((sum / picked.length) * 10) / 10;
}

export async function fetchEnvSnapshot(city: City): Promise<EnvSnapshot> {
  const common = `latitude=${city.latitude}&longitude=${city.longitude}&timezone=Asia%2FSeoul&forecast_days=1`;
  const forecastUrl = `${FORECAST_URL}?${common}&hourly=precipitation,wind_speed_10m,uv_index,weather_code&wind_speed_unit=ms`;
  const airUrl = `${AIR_QUALITY_URL}?${common}&hourly=pm10,pm2_5`;

  const [forecastRes, airRes] = await Promise.all([fetch(forecastUrl), fetch(airUrl)]);
  if (!forecastRes.ok || !airRes.ok) {
    throw new Error("Open-Meteo fetch failed");
  }

  const forecast = (await forecastRes.json()) as { hourly: ForecastHourly };
  const air = (await airRes.json()) as { hourly: AirHourly };
  const fh = forecast.hourly;
  const ah = air.hourly;

  const severe = fh.weather_code.some(
    (code, i) => COMMUTE_HOURS.includes(hourOf(fh.time[i])) && SEVERE_CODES.has(code),
  );

  return {
    pm2_5: avgAtCommuteHours(ah.time, ah.pm2_5),
    pm10: avgAtCommuteHours(ah.time, ah.pm10),
    precipitation: avgAtCommuteHours(fh.time, fh.precipitation),
    windSpeed: avgAtCommuteHours(fh.time, fh.wind_speed_10m),
    uvIndex: avgAtCommuteHours(fh.time, fh.uv_index),
    severe,
  };
}
