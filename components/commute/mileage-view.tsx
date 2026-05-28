"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MileageCalendar } from "./mileage-calendar";
import { CommuteNav } from "./commute-nav";
import { useMileage } from "@/hooks/use-mileage";

export function MileageView() {
  const { store, stats, hydrated } = useMileage();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 py-8">
      <header className="mb-4">
        <h1 className="text-base font-bold">나의 마일리지</h1>
        <p className="text-xs text-muted-foreground">출근일마다 쌓인 칭호와 점수</p>
      </header>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <Card size="sm">
          <CardContent className="text-center">
            <div className="mb-1 text-xs text-muted-foreground">총 출근일</div>
            {hydrated ? (
              <div className="text-2xl font-bold">
                {stats.totalDays}
                <span className="text-sm font-normal text-muted-foreground">일</span>
              </div>
            ) : (
              <Skeleton className="mx-auto h-8 w-12" />
            )}
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="text-center">
            <div className="mb-1 text-xs text-muted-foreground">누적 점수</div>
            {hydrated ? (
              <div className="text-2xl font-bold">
                {stats.totalScore}
                <span className="text-sm font-normal text-muted-foreground">점</span>
              </div>
            ) : (
              <Skeleton className="mx-auto h-8 w-12" />
            )}
          </CardContent>
        </Card>
      </div>

      <MileageCalendar resultsByDate={store} />

      <CommuteNav />
    </main>
  );
}
