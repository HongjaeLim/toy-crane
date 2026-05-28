"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Share2,
  Wind,
  Gauge,
  CloudRain,
  Navigation,
  Sun,
  TriangleAlert,
  Loader2,
} from "lucide-react";
import { formatKoreanDate } from "@/lib/date";
import { portraitUrl } from "@/lib/portrait";
import { cn } from "@/lib/utils";
import type { CommuteResult } from "@/types/commute";

function Portrait({ result }: { result: CommuteResult }) {
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading");

  useEffect(() => {
    if (state !== "loading") return;
    const timer = setTimeout(() => setState((s) => (s === "loading" ? "error" : s)), 60000);
    return () => clearTimeout(timer);
  }, [state]);

  if (state === "error") return null;
  return (
    <div className="relative overflow-hidden rounded-lg">
      {state === "loading" && (
        <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 bg-muted text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          <span className="text-xs">오늘의 캐릭터 생성 중…</span>
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element -- 생성형 외부 URL이라 next/image 최적화 부적합 */}
      <img
        src={portraitUrl(result)}
        alt={`${result.title} 캐릭터`}
        referrerPolicy="no-referrer"
        className={cn("aspect-video w-full object-cover", state === "loading" && "hidden")}
        onLoad={() => setState("loaded")}
        onError={() => setState("error")}
      />
    </div>
  );
}

interface ScoreCardProps {
  result: CommuteResult;
  onShare?: () => void;
}

export function ScoreCard({ result, onShare }: ScoreCardProps) {
  const { env } = result;
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <Portrait result={result} />
        <div className="flex items-baseline justify-between text-xs text-muted-foreground">
          <span>오늘 난이도</span>
          <span>
            {result.cityName} · {formatKoreanDate(result.date)}
          </span>
        </div>

        <div className="text-6xl leading-none font-bold tracking-tight tabular-nums">
          {result.score}
        </div>

        <Separator />

        {result.fortune && (
          <div className="flex gap-1.5">
            <Badge variant="secondary">{result.fortune.animal}띠</Badge>
            <Badge variant="secondary">{result.fortune.sign}자리</Badge>
          </div>
        )}
        <div className="text-xl font-bold">{result.title}</div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {result.narrative}
        </p>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline">
            <Wind />
            PM2.5 {env.pm2_5}
          </Badge>
          <Badge variant="outline">
            <Gauge />
            PM10 {env.pm10}
          </Badge>
          <Badge variant="outline">
            <CloudRain />
            강수 {env.precipitation}mm
          </Badge>
          <Badge variant="outline">
            <Navigation />
            풍속 {env.windSpeed}m/s
          </Badge>
          <Badge variant="outline">
            <Sun />
            UV {env.uvIndex}
          </Badge>
          <Badge variant={env.severe ? "destructive" : "outline"}>
            <TriangleAlert />
            {env.severe ? "기상특보" : "특보 없음"}
          </Badge>
        </div>

        <Button className="mt-1 w-full" onClick={onShare}>
          <Share2 data-icon="inline-start" />
          카드 공유
        </Button>
      </CardContent>
    </Card>
  );
}
