"use client";

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
} from "lucide-react";
import { formatKoreanDate } from "@/lib/date";
import type { CommuteResult } from "@/types/commute";

interface ScoreCardProps {
  result: CommuteResult;
  onShare?: () => void;
}

export function ScoreCard({ result, onShare }: ScoreCardProps) {
  const { env } = result;
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
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
