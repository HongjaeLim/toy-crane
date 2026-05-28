"use client";

import { useEffect, useState } from "react";
import { CalendarDays, MapPin, CloudOff, RotateCw } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { CommuteResult } from "@/types/commute";

const BIRTH_KEY = "commute-mileage:birth";

type Status = "idle" | "loading" | "error";

export function buildShareText(r: CommuteResult): string {
  const fortune = r.fortune ? `${r.fortune.animal}띠 · ${r.fortune.sign}자리\n` : "";
  return [
    `[출근 마일리지] ${formatKoreanDate(r.date)} · ${r.cityName}`,
    `오늘 난이도 ${r.score}`,
    `${fortune}${r.title}`,
    r.narrative,
  ].join("\n");
}

// navigator.clipboard가 실패·미지원·hang하는 환경(포커스 상실, 일부 모바일/확장)을
// 대비해 타임아웃 후 레거시 execCommand로 폴백한다.
async function copyText(text: string): Promise<boolean> {
  try {
    const write = navigator.clipboard?.writeText(text);
    if (write) {
      await Promise.race([
        write,
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 1500)),
      ]);
      return true;
    }
  } catch {
    // 아래 폴백으로 진행
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.top = "0";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function TodayView() {
  const { getResult, saveResult, hydrated } = useMileage();
  const today = todaySeoul();
  const todayResult = getResult(today);

  const [selectedCity, setSelectedCity] = useState("");
  const [birth, setBirth] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (todayResult) setSelectedCity(todayResult.cityId);
  }, [todayResult]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(BIRTH_KEY);
      if (saved) setBirth(saved);
    } catch {
      // ignore
    }
  }, []);

  function handleBirthChange(value: string) {
    setBirth(value);
    try {
      window.localStorage.setItem(BIRTH_KEY, value);
    } catch {
      // ignore
    }
    if (selectedCity) void fetchToday(selectedCity, value); // 생년월일 바꾸면 즉시 반영
  }

  async function fetchToday(cityId: string, birthValue: string = birth) {
    setStatus("loading");
    try {
      const query = birthValue ? `?city=${cityId}&birth=${birthValue}` : `?city=${cityId}`;
      const res = await fetch(`/api/commute${query}`);
      if (!res.ok) throw new Error("fetch failed");
      const data = (await res.json()) as CommuteResult;
      saveResult(data);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  function handleSelectCity(cityId: string) {
    setSelectedCity(cityId);
    void fetchToday(cityId); // 도시 바꾸면 다시 채점 (오늘 카드 갱신)
  }

  async function handleShare() {
    if (!todayResult) return;
    const text = buildShareText(todayResult);

    // 모바일 등 지원 환경: 네이티브 공유 시트 (카톡·메시지 등으로 바로 공유)
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "출근 마일리지", text });
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return; // 사용자가 취소
        // 그 외 실패는 아래 복사로 폴백
      }
    }

    const ok = await copyText(text);
    if (ok) toast.success("복사되었어요");
    else toast.error("복사하지 못했어요. 다시 시도해주세요.");
  }

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

      <div className="mb-3">
        <p className="mb-1 text-xs text-muted-foreground">생년월일 (선택 — 띠·별자리 반영)</p>
        <Input
          type="date"
          aria-label="생년월일"
          value={birth}
          max={today}
          onChange={(e) => handleBirthChange(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <p className="mb-1 text-xs text-muted-foreground">도시</p>
        <CitySelect value={selectedCity} onChange={handleSelectCity} />
        {todayResult && status !== "loading" && (
          <div className="mt-2 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => selectedCity && fetchToday(selectedCity)}
            >
              <RotateCw data-icon="inline-start" />
              다시 뽑기
            </Button>
          </div>
        )}
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
