"use client";

import { useCallback, useEffect, useState } from "react";
import type { CommuteResult } from "@/types/commute";

const STORAGE_KEY = "commute-mileage:v1";

export type MileageStore = Record<string, CommuteResult>; // keyed by date (YYYY-MM-DD)

export function readStore(): MileageStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MileageStore) : {};
  } catch {
    return {};
  }
}

function writeStore(store: MileageStore) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export interface MileageStats {
  totalDays: number;
  totalScore: number;
}

export function aggregate(store: MileageStore): MileageStats {
  const records = Object.values(store);
  return {
    totalDays: records.length,
    totalScore: records.reduce((sum, r) => sum + r.score, 0),
  };
}

export function useMileage() {
  const [store, setStore] = useState<MileageStore>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setStore(readStore());
    setHydrated(true);
  }, []);

  const saveResult = useCallback((result: CommuteResult) => {
    setStore((prev) => {
      const next = { ...prev, [result.date]: result };
      writeStore(next);
      return next;
    });
  }, []);

  const getResult = useCallback(
    (date: string): CommuteResult | undefined => store[date],
    [store],
  );

  return {
    store,
    hydrated,
    records: Object.values(store),
    stats: aggregate(store),
    saveResult,
    getResult,
  };
}
