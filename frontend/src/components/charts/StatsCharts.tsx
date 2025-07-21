import React, { useState } from "react";
import {
  BarChart,
  Bar,
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

// Custom CSS for better brush styling
const brushStyles = `
  .recharts-brush {
    user-select: none;
  }
  
  .recharts-brush .recharts-brush-traveller {
    fill: hsl(var(--primary)) !important;
    stroke: hsl(var(--background)) !important;
    stroke-width: 2px !important;
    cursor: ew-resize !important;
    opacity: 0.8;
    transition: all 0.2s ease;
  }
  
  .recharts-brush .recharts-brush-traveller:hover {
    fill: hsl(var(--primary)) !important;
    stroke: hsl(var(--background)) !important;
    opacity: 1;
    transform: scaleY(1.1);
  }
  
  .recharts-brush .recharts-brush-slide {
    fill: hsl(var(--primary)/0.15) !important;
    stroke: hsl(var(--primary)) !important;
    stroke-width: 1px !important;
    cursor: move !important;
    transition: all 0.2s ease;
  }
  
  .recharts-brush .recharts-brush-slide:hover {
    fill: hsl(var(--primary)/0.25) !important;
    stroke: hsl(var(--primary)) !important;
    stroke-width: 1.5px !important;
  }
  
  .recharts-brush .recharts-brush-texts {
    fill: hsl(var(--foreground)) !important;
    font-size: 11px !important;
    font-weight: 500 !important;
  }
  
  /* Better mobile responsiveness */
  @media (max-width: 640px) {
    .recharts-brush .recharts-brush-traveller {
      width: 14px !important;
      cursor: grab !important;
    }
    
    .recharts-brush .recharts-brush-traveller:active {
      cursor: grabbing !important;
    }
    
    .recharts-brush .recharts-brush-texts {
      font-size: 10px !important;
    }
  }
  
  @media (max-width: 480px) {
    .recharts-brush .recharts-brush-traveller {
      width: 16px !important;
    }
  }
`;

interface PlaysByCountryProps {
  data: Array<{
    country: string;
    plays: number;
    percentage?: number;
  }>;
  loading?: boolean;
}

export function PlaysByCountryChart({
  data,
  loading = false,
}: PlaysByCountryProps) {
  const { t } = useLanguage();

  // Obliczamy procenty w frontendzie
  const totalPlays = (data || []).reduce(
    (sum, country) => sum + country.plays,
    0
  );

  // Sortujemy dane malejąco i dodajemy procenty
  const sortedData = [...(data || [])]
    .map((country) => ({
      ...country,
      percentage: totalPlays > 0 ? (country.plays / totalPlays) * 100 : 0,
    }))
    .sort((a, b) => b.plays - a.plays);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("playsByCountry")}</CardTitle>
          <CardDescription>{t("playsByCountryDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[350px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sortedData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("playsByCountry")}</CardTitle>
          <CardDescription>{t("playsByCountryDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[350px] text-muted-foreground">
            {t("noData")}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("playsByCountry")}</CardTitle>
        <CardDescription>{t("playsByCountryDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedData.slice(0, 10).map((country, index) => (
            <div
              key={country.country}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </div>
                <span className="font-medium">{country.country}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-semibold">
                    {country.plays.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {(country.percentage || 0).toFixed(1)}%
                  </div>
                </div>
                <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        ((country.percentage || 0) /
                          Math.max(
                            ...sortedData.map((c) => c.percentage || 0)
                          )) *
                          100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface YearlyStatsProps {
  data: Array<{
    year: number;
    plays: number;
    minutes: number;
    topArtist?: string;
  }>;
}

export function YearlyStatsChart({ data }: YearlyStatsProps) {
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("yearlyStats")}</CardTitle>
        <CardDescription>{t("yearlyStatsDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="year"
              tick={{ fill: "hsl(var(--foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: "hsl(var(--foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: "hsl(var(--foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <Tooltip
              formatter={(value: any, name: string) => [
                name === "plays"
                  ? value.toLocaleString()
                  : `${Math.round(value).toLocaleString()} min`,
                name === "plays" ? t("playsTooltip") : t("minutesTooltip"),
              ]}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
                color: "hsl(var(--foreground))",
              }}
            />
            <Bar
              yAxisId="left"
              dataKey="plays"
              fill="hsl(var(--primary))"
              name="plays"
            />
            <Bar
              yAxisId="right"
              dataKey="minutes"
              fill="hsl(var(--chart-2))"
              name="minutes"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface TopArtistsProps {
  data: Array<{
    name: string;
    plays: number;
    minutes: number;
  }>;
  loading?: boolean;
}

export function TopArtistsChart({ data, loading = false }: TopArtistsProps) {
  const { t } = useLanguage();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("topArtists")}</CardTitle>
          <CardDescription>{t("topArtistsDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("topArtists")}</CardTitle>
          <CardDescription>{t("topArtistsDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            {t("noDataToDisplay")}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("topArtists")}</CardTitle>
        <CardDescription>{t("topArtistsDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.slice(0, 10).map((artist, index) => (
            <div
              key={artist.name}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </div>
                <span
                  className="font-medium truncate max-w-[150px]"
                  title={artist.name}
                >
                  {artist.name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-semibold">
                    {(artist.plays || 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {(artist.minutes || 0).toLocaleString()} min
                  </div>
                </div>
                <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        ((artist.plays || 0) /
                          Math.max(...data.map((a) => a.plays || 0))) *
                          100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

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
  const [extendToToday, setExtendToToday] = useState<boolean>(true);

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

  const handleResetZoom = () => {
    setZoomState({ isZoomed: false });
  };

  // Filtruj dane w zależności od ustawienia extendToToday
  const processedData = React.useMemo(() => {
    if (!data || data.length === 0) return [];

    if (extendToToday) {
      // Zwróć wszystkie dane (od pierwszego do dzisiaj z zerami)
      return data;
    } else {
      // Znajdź ostatnie odtworzenie (ostatni dzień z plays > 0)
      let lastPlayIndex = data.length - 1;
      for (let i = data.length - 1; i >= 0; i--) {
        if (data[i].plays > 0) {
          lastPlayIndex = i;
          break;
        }
      }
      // Zwróć dane tylko do ostatniego odtworzenia
      return data.slice(0, lastPlayIndex + 1);
    }
  }, [data, extendToToday]);

  // Resetuj zoom gdy zmieniamy tryb extendToToday
  React.useEffect(() => {
    if (zoomState.isZoomed) {
      setZoomState({ isZoomed: false });
    }
  }, [extendToToday]); // eslint-disable-line react-hooks/exhaustive-deps

  // Dane do wyświetlenia - cały zestaw lub przefiltrowany według zoom
  const baseData = processedData; // Użyj przefiltrowanych danych zamiast oryginalnych
  const displayData =
    zoomState.isZoomed &&
    zoomState.startIndex !== undefined &&
    zoomState.endIndex !== undefined
      ? baseData.slice(zoomState.startIndex, zoomState.endIndex + 1)
      : baseData;

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
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {zoomState.isZoomed && (
              <button
                onClick={handleResetZoom}
                className="px-3 py-1 text-sm border rounded-md hover:bg-accent hover:text-accent-foreground"
              >
                {t("resetZoom")}
              </button>
            )}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="extend-to-today"
                checked={extendToToday}
                onChange={(e) => setExtendToToday(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0"
              />
              <label
                htmlFor="extend-to-today"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                {t("extendToToday")}
              </label>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Główny wykres */}
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={displayData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="date"
                tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tick={{ fill: "hsl(var(--foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <Tooltip
                formatter={(value: any, name: string) => [
                  name === "plays"
                    ? value.toLocaleString()
                    : `${Math.round(value).toLocaleString()} min`,
                  name === "plays" ? t("playsTooltip") : t("minutesTooltip"),
                ]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  color: "hsl(var(--foreground))",
                }}
              />
              <Line
                type="monotone"
                dataKey="plays"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="minutes"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Mały wykres overview z brush do zoom */}
          <div className="border-t pt-4">
            <div className="text-sm font-medium mb-2 text-muted-foreground">
              {t("selectPeriodToZoom")}
            </div>
            <ResponsiveContainer width="100%" height={80}>
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
                      setZoomState({
                        startIndex: brushData.startIndex,
                        endIndex: brushData.endIndex,
                        isZoomed: true,
                      });
                    }
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
