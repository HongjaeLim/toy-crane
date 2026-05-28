"use client";

import { useEffect, useState } from "react";
import { CalendarDays, MapPin, CloudOff } from "lucide-react";
import { CitySelect } from "./city-select";
import { ScoreCard } from "./score-card";
import { CommuteNav } from "./commute-nav";
import { useMileage } from "@/hooks/use-mileage";
import { todaySeoul, formatKoreanDate } from "@/lib/date";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { CommuteResult } from "@/types/commute";

type Status = "idle" | "loading" | "error";

export function buildShareText(r: CommuteResult): string {
  return [
    `[출근 마일리지] ${formatKoreanDate(r.date)} · ${r.cityName}`,
    `오늘 난이도 ${r.score}`,
    r.title,
    r.narrative,
  ].join("\n");
}

export function TodayView() {
  const { getResult, saveResult, hydrated } = useMileage();
  const today = todaySeoul();
  const todayResult = getResult(today);

  const [selectedCity, setSelectedCity] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (todayResult) setSelectedCity(todayResult.cityId);
  }, [todayResult]);

  async function fetchToday(cityId: string) {
    setStatus("loading");
    try {
      const res = await fetch(`/api/commute?city=${cityId}`);
      if (!res.ok) throw new Error("fetch failed");
      const data = (await res.json()) as CommuteResult;
      saveResult(data);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  function handleSelectCity(cityId: string) {
    if (todayResult) return; // 같은 날은 첫 기록 잠금 (미결정 a)
    setSelectedCity(cityId);
    void fetchToday(cityId);
  }

  async function handleShare() {
    if (!todayResult) return;
    try {
      await navigator.clipboard.writeText(buildShareText(todayResult));
      toast.success("복사되었어요");
    } catch {
      toast.error("복사하지 못했어요. 다시 시도해주세요.");
    }
  }

  const locked = Boolean(todayResult);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 py-8">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold">출근 마일리지</h1>
          <p className="text-xs text-muted-foreground">매일 출근을 채점하는 미니 RPG</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">
          <CalendarDays className="size-3" />
          {formatKoreanDate(today)}
        </span>
      </header>

      <div className="mb-4">
        <p className="mb-1 text-xs text-muted-foreground">도시</p>
        <CitySelect
          value={locked ? todayResult!.cityId : selectedCity}
          onChange={handleSelectCity}
          disabled={locked}
        />
      </div>

      {status === "error" ? (
        <Empty className="rounded-xl border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CloudOff />
            </EmptyMedia>
            <EmptyTitle>환경 데이터를 받지 못했어요.</EmptyTitle>
            <EmptyDescription>잠시 후 다시 시도해주세요.</EmptyDescription>
          </EmptyHeader>
          <Button onClick={() => fetchToday(selectedCity)}>다시 시도</Button>
        </Empty>
      ) : status === "loading" || !hydrated ? (
        <div className="flex flex-col gap-3 rounded-xl border p-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-14 w-20" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full" />
        </div>
      ) : todayResult ? (
        <ScoreCard result={todayResult} onShare={handleShare} />
      ) : (
        <Empty className="rounded-xl border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MapPin />
            </EmptyMedia>
            <EmptyTitle>도시를 선택하세요</EmptyTitle>
            <EmptyDescription>도시를 고르면 오늘의 출근 점수가 나옵니다.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      <CommuteNav />
    </main>
  );
}
