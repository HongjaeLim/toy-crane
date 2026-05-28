"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { todaySeoul } from "@/lib/date";
import type { CommuteResult } from "@/types/commute";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

interface MileageCalendarProps {
  resultsByDate: Record<string, CommuteResult>;
}

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function MileageCalendar({ resultsByDate }: MileageCalendarProps) {
  const today = todaySeoul();
  const [y, m] = today.split("-").map(Number);
  const [view, setView] = useState({ year: y, month: m - 1 }); // month 0-indexed

  const firstWeekday = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function shift(delta: number) {
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon-sm" aria-label="이전 달" onClick={() => shift(-1)}>
          <ChevronLeft />
        </Button>
        <div className="text-sm font-bold">
          {view.year}년 {view.month + 1}월
        </div>
        <Button variant="outline" size="icon-sm" aria-label="다음 달" onClick={() => shift(1)}>
          <ChevronRight />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-xs text-muted-foreground">
            {w}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`pad-${i}`} />;
          const key = dateKey(view.year, view.month, day);
          const result = resultsByDate[key];
          const isToday = key === today;
          return (
            <div
              key={key}
              data-today={isToday || undefined}
              className={cn(
                "flex aspect-square flex-col justify-between rounded-md border p-1 text-[10px]",
                result ? "bg-card" : "bg-muted/40",
                isToday && "border-2 border-foreground font-bold",
              )}
            >
              <span className="text-muted-foreground">{day}</span>
              {result && (
                <span className="leading-tight text-foreground" title={result.title}>
                  {result.title}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
