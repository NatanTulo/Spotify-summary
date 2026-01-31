import React, { useState } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Brush,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { brushStyles } from "./common/brushStyles";

interface ListeningTimelineProps {
  data: Array<{
    date: string;
    plays: number;
    minutes: number;
  }>;
}

export function ListeningTimelineChart({ data }: ListeningTimelineProps) {
  const { t } = useLanguage();
  const [zoomState, setZoomState] = useState<{
    startIndex?: number;
    endIndex?: number;
    isZoomed: boolean;
  }>({ isZoomed: false });
  const brushDebounceRef = React.useRef<number | null>(null);

  // Konfiguracja agregacji
  const RAW_POINT_THRESHOLD = 500; // powyżej tej liczby punktów pokazujemy wersję zagregowaną
  const TARGET_POINTS = 300; // docelowa liczba punktów po agregacji (orientacyjny trend)

  // Prosta agregacja bucketowa (sumowanie) – szybka i wystarczająca dla trendu
  const aggregateBuckets = React.useCallback((rows: ListeningTimelineProps["data"], target: number) => {
    if (rows.length <= target) return rows;
    const bucketSize = Math.ceil(rows.length / target);
    const aggregated: ListeningTimelineProps["data"] = [];
    for (let i = 0; i < rows.length; i += bucketSize) {
      const slice = rows.slice(i, i + bucketSize);
      if (!slice.length) continue;
      const plays = slice.reduce((a, r) => a + (r.plays || 0), 0);
      const minutes = slice.reduce((a, r) => a + (r.minutes || 0), 0);
      // Używamy daty środkowego elementu (albo pierwszej jeśli 1) aby utrzymać względny układ na osi X
      const mid = slice[Math.floor(slice.length / 2)];
      aggregated.push({
        date: mid.date, // zachowujemy jedną datę (opcjonalnie można byłoby dodać zakres)
        plays,
        minutes,
        // @ts-ignore – adnotacja pomocnicza (nie przeszkadza w tooltipie)
        _aggregated: true,
        // @ts-ignore – początek i koniec zakresu (można wykorzystać w tooltipie)
        _range: { start: slice[0].date, end: slice[slice.length - 1].date },
      });
    }
    return aggregated;
  }, []);

  // Dane surowe dla ewentualnego zoomu
  const baseData = data || [];

  // Top 5 dni o największej liczbie odtworzeń (plays, a przy remisie minutes)
  const topDays = React.useMemo(() => {
    if (!baseData.length) return [] as ListeningTimelineProps["data"];
    return [...baseData]
      .sort((a, b) => (b.plays - a.plays) || (b.minutes - a.minutes))
      .slice(0, 5);
  }, [baseData]);
  const topDaySet = React.useMemo(() => new Set(topDays.map(d => d.date)), [topDays]);

  // Wyliczamy czy powinniśmy użyć agregacji (tylko gdy NIE jesteśmy w trybie zoom)
  const useAggregation = !zoomState.isZoomed && baseData.length > RAW_POINT_THRESHOLD;

  // Dane po ewentualnej agregacji (memo dla wydajności)
  const aggregatedData = React.useMemo(() => {
    if (!useAggregation) return baseData;
    const buckets = aggregateBuckets(baseData, TARGET_POINTS);
    const existing = new Set(buckets.map(b => b.date));
    // Wstrzykuj pojedyncze top dni jeśli zniknęły w agregacji aby zachować markery
    const extended = [...buckets];
    for (const td of topDays) {
      if (!existing.has(td.date)) {
        extended.push({ ...td, _topDay: true } as any);
      }
    }
    extended.sort((a,b)=> a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
    return extended;
  }, [baseData, useAggregation, aggregateBuckets, topDays]);

  // Inject custom styles for brush
  React.useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.textContent = brushStyles;
    document.head.appendChild(styleElement);

    return () => {
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("listeningTimeline")}</CardTitle>
          <CardDescription>{t("dailyMusicActivity")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            {t("noDataToDisplay")}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Dane do wyświetlenia - agregujemy także w powiększeniu jeśli zakres nadal zbyt duży
  const { displayData, displayAggregated } = React.useMemo(() => {
    if (
      zoomState.isZoomed &&
      zoomState.startIndex !== undefined &&
      zoomState.endIndex !== undefined
    ) {
      const slice = baseData.slice(
        zoomState.startIndex,
        zoomState.endIndex + 1
      );
      if (slice.length > RAW_POINT_THRESHOLD) {
        const aggr = aggregateBuckets(slice, TARGET_POINTS);
        const dates = new Set(aggr.map(d => d.date));
        for (const td of topDays) {
          const idx = baseData.findIndex(r => r.date === td.date);
            if (idx >= zoomState.startIndex && idx <= zoomState.endIndex && !dates.has(td.date)) {
              aggr.push({ ...td, _topDay: true } as any);
            }
        }
        aggr.sort((a,b)=> a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
        return { displayData: aggr, displayAggregated: true };
      }
      return { displayData: slice, displayAggregated: false };
    }
    return { displayData: aggregatedData, displayAggregated: useAggregation };
  }, [zoomState, baseData, aggregatedData, useAggregation, aggregateBuckets, topDays]);

  // Sterowanie tickami osi X w zależności od gęstości danych
  const dense = displayData.length <= 120;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t("listeningTimelineDaily")}</CardTitle>
            <CardDescription>
              {t("dailyMusicActivity")}
              {zoomState.isZoomed &&
                ` (${displayData.length} z ${baseData.length} dni)`}
              {displayAggregated && ` • ${t("approximateTrend") || "przybliżony trend"}`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Główny wykres */}
          <ResponsiveContainer width="100%" height={300} minWidth={0}>
            <LineChart data={displayData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="date"
                tick={
                  dense
                    ? { fill: "hsl(var(--foreground))", fontSize: 11 }
                    : false
                }
                axisLine={{ stroke: "hsl(var(--border))" }}
                angle={dense ? -45 : 0}
                textAnchor={dense ? "end" : "middle"}
                height={dense ? 60 : 20}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: "hsl(var(--foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickFormatter={(v: number) => v.toLocaleString()}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: "hsl(var(--foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickFormatter={(v: number) => Math.round(v).toLocaleString()}
              />
              <Tooltip
                content={(tpProps: any) => {
                  const { active, payload, label } = tpProps || {};
                  if (!active || !payload || !payload.length) return null;
                  // Usuń duplikaty po dataKey (np. drugi 'plays' z linii markerów)
                  const seen = new Set();
                  const filtered = payload.filter((p: any) => {
                    const key = p.dataKey || p.name;
                    if (!key) return false;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                  });
                  const pointPayload = filtered[0]?.payload || {};
                  const isAggregated = pointPayload._aggregated && pointPayload._range;
                  const isTop = topDaySet.has(pointPayload.date);
                  return (
                    <div style={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                      padding: '0.5rem 0.75rem',
                      fontSize: '12px'
                    }}>
                      <div className="font-medium mb-1">{label}</div>
                      {filtered.map((entry: any) => {
                        const isPlays = entry.dataKey === 'plays';
                        const rawVal = entry.value;
                        const val = isPlays ? rawVal : Math.round(rawVal);
                        let nameLabel = isPlays ? t('playsTooltip') : t('minutesTooltip');
                        if (isAggregated && isPlays) {
                          nameLabel += ` (${pointPayload._range.start} – ${pointPayload._range.end})`;
                        }
                        return (
                          <div key={entry.dataKey} className="flex items-center gap-2">
                            <span style={{
                              display: 'inline-block',
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: entry.color || 'hsl(var(--primary))'
                            }} />
                            <span>{nameLabel}:</span>
                            <span className="font-semibold">{isPlays ? val.toLocaleString() : `${val.toLocaleString()} min`}</span>
                          </div>
                        );
                      })}
                      {isTop && (
                        <div className="mt-1 text-xs text-destructive font-semibold">Top day</div>
                      )}
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="plays"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                yAxisId="left"
                dot={zoomState.isZoomed || displayData.length <= 200 ? { r: 2 } : false}
              />
              <Line
                type="monotone"
                dataKey="minutes"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                yAxisId="right"
                dot={zoomState.isZoomed || displayData.length <= 200 ? { r: 2 } : false}
              />
              {/* Markery top dni (kliknięcie przybliża) */}
              <Line
                type="linear"
                dataKey="plays"
                stroke="none"
                yAxisId="left"
                isAnimationActive={false}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  const isTop = payload && topDaySet.has(payload.date);
                  const handleClick = () => {
                    if (!isTop) return;
                    const idx = baseData.findIndex(r => r.date === payload.date);
                    if (idx !== -1) {
                      const span = 30;
                      const start = Math.max(0, idx - span);
                      const end = Math.min(baseData.length - 1, idx + span);
                      setZoomState({ startIndex: start, endIndex: end, isZoomed: true });
                    }
                  };
                  return (
                    <g
                      key={payload?.date || `${cx}-${cy}`}
                      style={{ cursor: isTop ? 'pointer' : 'default', display: isTop ? undefined : 'none' }}
                      onClick={handleClick}
                    >
                      <circle cx={cx} cy={cy} r={6} fill="hsl(var(--destructive))" />
                      <circle cx={cx} cy={cy} r={10} fill="none" stroke="hsl(var(--destructive))" strokeWidth={2} opacity={0.6} />
                    </g>
                  );
                }}
                activeDot={false}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Mały wykres overview z brush do zoom */}
          <div className="border-t pt-4">
            <div className="text-sm font-medium mb-2 text-muted-foreground">
              {t("selectPeriodToZoom")}
            </div>
            <ResponsiveContainer width="100%" height={80} minWidth={0}>
              <LineChart data={baseData}>
                <XAxis
                  dataKey="date"
                  tick={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis hide />
                <Line
                  type="monotone"
                  dataKey="plays"
                  stroke="hsl(var(--primary))"
                  strokeWidth={1}
                  dot={false}
                />
                <Brush
                  dataKey="date"
                  height={32}
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--muted))"
                  fillOpacity={0.3}
                  travellerWidth={14}
                  gap={2}
                  onChange={(brushData) => {
                    if (
                      brushData &&
                      brushData.startIndex !== undefined &&
                      brushData.endIndex !== undefined
                    ) {
                      // Debounce aktualizacji aby ograniczyć re-render podczas przeciągania
                      if (brushDebounceRef.current) {
                        window.clearTimeout(brushDebounceRef.current);
                      }
                      const { startIndex, endIndex } = brushData;
                      brushDebounceRef.current = window.setTimeout(() => {
                        const fullRange =
                          startIndex === 0 &&
                          endIndex === baseData.length - 1;
                        setZoomState({
                          startIndex: fullRange ? undefined : startIndex,
                          endIndex: fullRange ? undefined : endIndex,
                          isZoomed: !fullRange,
                        });
                      }, 100);
                    }
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
            {displayAggregated && !zoomState.isZoomed && (
              <div className="mt-2 text-xs text-muted-foreground">
                {t("aggregatedInfo") || "Dane zagregowane (sumy w przedziałach) dla szybszego renderu – przybliżone wartości."}
              </div>
            )}
            {zoomState.isZoomed && (
              <div className="mt-2 text-xs flex gap-2 flex-wrap">
                <button
                  className="underline text-muted-foreground hover:text-foreground"
                  onClick={() => setZoomState({ isZoomed: false })}
                >
                  {t("resetZoom") || "Resetuj zoom"}
                </button>
                <span className="text-muted-foreground">|</span>
                <span className="text-muted-foreground">Top 5 dni oznaczone czerwonymi okręgami – kliknij aby przybliżyć.</span>
              </div>
            )}
            {!zoomState.isZoomed && (
              <div className="mt-2 text-xs text-muted-foreground">
                Top 5 najaktywniejszych dni zaznaczono czerwonymi okręgami – kliknij aby przybliżyć.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
