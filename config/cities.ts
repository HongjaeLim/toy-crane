import type { City } from "@/types/commute";

export const CITIES: City[] = [
  { id: "seoul", name: "서울", latitude: 37.5665, longitude: 126.978 },
  { id: "busan", name: "부산", latitude: 35.1796, longitude: 129.0756 },
  { id: "daegu", name: "대구", latitude: 35.8714, longitude: 128.6014 },
  { id: "incheon", name: "인천", latitude: 37.4563, longitude: 126.7052 },
  { id: "gwangju", name: "광주", latitude: 35.1595, longitude: 126.8526 },
  { id: "daejeon", name: "대전", latitude: 36.3504, longitude: 127.3845 },
  { id: "ulsan", name: "울산", latitude: 35.5384, longitude: 129.3114 },
  { id: "sejong", name: "세종", latitude: 36.4801, longitude: 127.289 },
];

export function getCity(id: string | null | undefined): City | undefined {
  if (!id) return undefined;
  return CITIES.find((c) => c.id === id);
}
