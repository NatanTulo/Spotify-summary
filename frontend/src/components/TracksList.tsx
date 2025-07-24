import { useState, Fragment, useEffect, useCallback } from "react";
import {
  ChevronUp,
  ChevronDown,
  Play,
  TrendingUp,
  Settings2,
  Eye,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useLanguage } from "../context/LanguageContext";
import { TrackDetails } from "./TrackDetails";

// Rozszerzony interface dla utworu z wszystkimi dostępnymi danymi
interface ExtendedTrack {
  trackId: string;
  trackName: string;
  artistName: string;
  albumName: string;
  totalPlays: number;
  totalMinutes: number;
  avgPlayDuration: number;
  skipPercentage: number;
  // Dodatkowe pola z API response
  artist?: {
    id: string;
    name: string;
  };
  album?: {
    id: string;
    name: string;
  };
  // Dodatkowe pola z dokumentacji Spotify
  uri?: string;
  duration?: number;
  platforms?: string[];
  countries?: string[];
  firstPlay?: Date;
  lastPlay?: Date;
  username?: string;
  reasonStart?: string[];
  reasonEnd?: string[];
  shuffle?: boolean | null;
  offline?: boolean | null;
  incognitoMode?: boolean | null;
}

// Dostępne kolumny
interface ColumnConfig {
  key: keyof ExtendedTrack;
  sortable: boolean;
  format?: (value: any) => string;
  labelKey: string; // Changed from label object to single key
}

interface TracksListProps {
  tracks: ExtendedTrack[];
  loading?: boolean;
  profileId?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSort?: (field: string, order: "asc" | "desc") => void;
  currentSort?: {
    field: string;
    order: "asc" | "desc";
  };
}

export function TracksList({
  tracks,
  loading = false,
  profileId,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSort,
  currentSort,
}: TracksListProps) {
  const { t, formatDate: localizedFormatDate } = useLanguage();

  // Wszystkie hooki muszą być na początku - przed jakimikolwiek warunkowymi returnami
  const [expandedTrack, setExpandedTrack] = useState<string | null>(null);
  const [trackTimelineData, setTrackTimelineData] = useState<any[]>([]);
  const [timelineLoading, setTimelineLoading] = useState<string | null>(null);
  const [timelineCache, setTimelineCache] = useState<Map<string, any[]>>(
    new Map()
  );
  const [selectedTrackForDetails, setSelectedTrackForDetails] = useState<
    string | null
  >(null);
  const [extendToToday, setExtendToToday] = useState<boolean>(false);
  const [visibleColumns, setVisibleColumns] = useState<(keyof ExtendedTrack)[]>(
    [
      "trackName",
      "artistName",
      "albumName",
      "totalPlays",
      "totalMinutes",
      "avgPlayDuration",
      "skipPercentage",
      "firstPlay",
      "lastPlay",
    ]
  );
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  // Domyślne kolumny
  const defaultColumns: (keyof ExtendedTrack)[] = [
    "trackName",
    "artistName",
    "albumName",
    "totalPlays",
    "totalMinutes",
    "avgPlayDuration",
    "skipPercentage",
    "firstPlay",
    "lastPlay",
  ];

  // Inteligentny prefetching dla top utworów
  const prefetchPopularTracks = useCallback(async () => {
    if (tracks.length === 0) return;

    // Prefetch timeline dla top 3 utworów (które mają najwięcej odtworzeń)
    const topTracks = tracks
      .filter((t) => t.totalPlays > 10) // Tylko utwory z więcej niż 10 odtworzeń
      .sort((a, b) => b.totalPlays - a.totalPlays)
      .slice(0, 3);

    for (const track of topTracks) {
      const cacheKey = `${track.trackId}-${profileId || "all"}`;

      // Skip if already cached
      if (timelineCache.has(cacheKey)) continue;

      try {
        const params = new URLSearchParams();
        if (profileId) {
          params.append("profileId", profileId);
        }

        const response = await fetch(
          `/api/tracks/${track.trackId}/timeline?${params}`
        );
        if (response.ok) {
          const data = await response.json();
          setTimelineCache((prev) =>
            new Map(prev).set(cacheKey, data.data || [])
          );
        }
      } catch (error) {
        // Silent fail for prefetch
      }

      // Small delay between prefetch requests
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }, [tracks, profileId, timelineCache]);

  // Prefetch po załadowaniu utworów - MUSI BYĆ PRZED WARUNKOWYMI RETURNAMI
  useEffect(() => {
    if (tracks.length > 0) {
      // Delay prefetch by 1 second to not interfere with main UI
      const timer = setTimeout(prefetchPopularTracks, 1000);
      return () => clearTimeout(timer);
    }
  }, [prefetchPopularTracks, currentSort, tracks]);

  // Get available columns with translations (moved inside component to access localizedFormatDate)
  const getAvailableColumns = (): ColumnConfig[] => [
    { key: "trackName", sortable: true, labelKey: "trackNameFull" },
    { key: "artistName", sortable: true, labelKey: "artistFull" },
    { key: "albumName", sortable: true, labelKey: "albumFull" },
    { key: "totalPlays", sortable: true, labelKey: "playsFull" },
    {
      key: "totalMinutes",
      sortable: true,
      format: (val) => {
        const minutes = Number(val) || 0;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = Math.floor(minutes % 60);
        return hours > 0
          ? `${hours}h ${remainingMinutes}m`
          : `${remainingMinutes}m`;
      },
      labelKey: "timeMinutesFull",
    },
    {
      key: "avgPlayDuration",
      sortable: true,
      format: (val) => {
        const duration = Number(val) || 0;
        return `${Math.floor(duration / 60)}:${Math.floor(duration % 60)
          .toString()
          .padStart(2, "0")}`;
      },
      labelKey: "avgTimeFull",
    },
    {
      key: "skipPercentage",
      sortable: true,
      format: (val) => {
        const percentage = Number(val) || 0;
        return `${percentage.toFixed(1)}%`;
      },
      labelKey: "skipPercentageFull",
    },
    {
      key: "firstPlay",
      sortable: true,
      format: (val) => (val ? localizedFormatDate(val) : ""),
      labelKey: "firstPlayFull",
    },
    {
      key: "lastPlay",
      sortable: true,
      format: (val) => (val ? localizedFormatDate(val) : ""),
      labelKey: "lastPlayFull",
    },
    {
      key: "platforms",
      sortable: false,
      format: (val) => {
        console.log("Debug platforms:", val, Array.isArray(val));
        return val && val.length > 0 ? val.join(", ") : "N/A";
      },
      labelKey: "platformsFull",
    },
    {
      key: "countries",
      sortable: false,
      format: (val) => (val && val.length > 0 ? val.join(", ") : ""),
      labelKey: "countriesFull",
    },
    { key: "uri", sortable: false, labelKey: "uriFull" },
    {
      key: "reasonStart",
      sortable: false,
      format: (val) => (val && val.length > 0 ? val.join(", ") : ""),
      labelKey: "reasonStartFull",
    },
    {
      key: "reasonEnd",
      sortable: false,
      format: (val) => (val && val.length > 0 ? val.join(", ") : ""),
      labelKey: "reasonEndFull",
    },
  ];

  const availableColumns = getAvailableColumns();

  // Jeśli wybrano utwór do szczegółów, pokaż TrackDetails
  if (selectedTrackForDetails) {
    return (
      <TrackDetails
        trackId={selectedTrackForDetails}
        profileId={profileId}
        onBack={() => setSelectedTrackForDetails(null)}
      />
    );
  }

  const handleSort = (field: string) => {
    if (!onSort) return;
    const newOrder =
      currentSort?.field === field && currentSort.order === "desc"
        ? "asc"
        : "desc";
    
    onSort(field, newOrder);
  };

  const toggleTrackExpansion = async (trackId: string) => {
    if (expandedTrack === trackId) {
      setExpandedTrack(null);
      return;
    }

    setExpandedTrack(trackId);

    // Check cache first
    // DEBUG: Wyczyść cache dla testowania
    // if (timelineCache.has(cacheKey)) {
    //     setTrackTimelineData(timelineCache.get(cacheKey)!)
    //     return
    // }

    // Show loading state
    setTimelineLoading(trackId);
    setTrackTimelineData([]);

    // Fetch timeline data for track with timeout
    try {
      const params = new URLSearchParams();
      if (profileId) {
        params.append("profileId", profileId);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch(
        `/api/tracks/${trackId}/timeline?${params}`,
        {
          signal: controller.signal,
          cache: "no-cache", // Wymuś przeładowanie z serwera
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const timelineData = data.data || [];

        // Cache the result - TYMCZASOWO WYŁĄCZONE
        // setTimelineCache(prev => new Map(prev).set(cacheKey, timelineData))
        setTrackTimelineData(timelineData);
      } else {
        console.error(
          "Timeline response not ok:",
          response.status,
          response.statusText
        );
        setTrackTimelineData([]);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.warn("Timeline request timed out");
      } else {
        console.error("Error fetching track timeline:", error);
      }
      setTrackTimelineData([]);
    } finally {
      setTimelineLoading(null);
    }
  };

  const getSortIcon = (field: string) => {
    if (currentSort?.field !== field) return null;
    return currentSort.order === "desc" ? (
      <ChevronDown className="h-4 w-4" />
    ) : (
      <ChevronUp className="h-4 w-4" />
    );
  };

  // Funkcja filtrowania danych timeline
  const getFilteredTimelineData = (data: any[]) => {
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
  };

  const toggleColumnVisibility = (columnKey: keyof ExtendedTrack) => {
    setVisibleColumns((prev) =>
      prev.includes(columnKey)
        ? prev.filter((k) => k !== columnKey)
        : [...prev, columnKey]
    );
  };

  const resetColumnsToDefault = () => {
    setVisibleColumns([...defaultColumns]);
  };

  const getColumnConfig = (key: keyof ExtendedTrack) => {
    return availableColumns.find((col) => col.key === key);
  };

  const formatCellValue = (
    track: ExtendedTrack,
    columnKey: keyof ExtendedTrack
  ) => {
    // Fallback dla brakujących pól nazwy utworu i wykonawcy
    let rawValue: any = track[columnKey];
    if (columnKey === "trackName" && !rawValue) {
      rawValue = (track as any).name;
    }
    if (columnKey === "artistName" && !rawValue) {
      rawValue = track.artist?.name;
    }

    const config = getColumnConfig(columnKey);
    const value = rawValue;

    if (config?.format && value !== undefined && value !== null) {
      return config.format(value);
    }

    // Handle boolean values with translations
    if (typeof value === "boolean") {
      return value ? t("yes") : t("no");
    }

    // Handle null/undefined boolean values
    if (
      value === null &&
      (columnKey === "shuffle" ||
        columnKey === "offline" ||
        columnKey === "incognitoMode")
    ) {
      return t("notAvailable");
    }

    if (typeof value === "number") {
      return isNaN(value) ? t("notAvailable") : value.toLocaleString();
    }

    return value?.toString() || t("notAvailable");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">{t("loading")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Play className="h-5 w-5" />
              <span>{t("tracks")}</span>
              {pagination && (
                <span className="text-sm text-muted-foreground">
                  ({pagination.total.toLocaleString()} {t("tracksCount")})
                </span>
              )}
            </CardTitle>
            <CardDescription>{t("clickHeaders")}</CardDescription>{" "}
          </div>
          <div className="flex items-center space-x-2">
            {/* Wybór kolumn */}
            <Button
              onClick={() => setShowColumnSelector(!showColumnSelector)}
              className="px-3 py-1 text-xs"
            >
              <Settings2 className="h-4 w-4 mr-1" />
              {t("columns")}
            </Button>
          </div>
        </div>

        {/* Selektor kolumn */}
        {showColumnSelector && (
          <div className="mt-4 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">{t("selectColumns")}</h4>
              <Button
                onClick={resetColumnsToDefault}
                className="px-2 py-1 text-xs h-auto"
                variant="outline"
              >
                {t("resetColumns")}
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {availableColumns.map((column) => (
                <label
                  key={column.key}
                  className="flex items-center space-x-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={visibleColumns.includes(column.key)}
                    onChange={() => toggleColumnVisibility(column.key)}
                    className="rounded"
                  />
                  <span>{t(column.labelKey)}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {tracks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">{t("noTracks")}</p>
          </div>
        ) : (
          <>
            {/* Tabela */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    {visibleColumns.map((columnKey) => {
                      const config = getColumnConfig(columnKey);
                      if (!config) return null;

                      return (
                        <th key={columnKey} className="text-left p-2">
                          {config.sortable ? (
                            <button
                              className="flex items-center space-x-1 font-semibold hover:bg-transparent"
                              onClick={() => handleSort(columnKey)}
                            >
                              <span>{t(config.labelKey)}</span>
                              {getSortIcon(columnKey)}
                            </button>
                          ) : (
                            <span className="font-semibold">
                              {t(config.labelKey)}
                            </span>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {tracks.map((track) => (
                    <Fragment key={track.trackId}>
                      <tr
                        className="border-b hover:bg-muted/50 cursor-pointer"
                        onClick={() => toggleTrackExpansion(track.trackId)}
                      >
                        {visibleColumns.map((columnKey) => (
                          <td key={columnKey} className="p-2">
                            {columnKey === "trackName" ? (
                              <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                <div className="font-medium">
                                  {track.trackName}
                                </div>
                                <div className="ml-auto flex items-center gap-1">
                                  <button
                                    className="h-6 w-6 hover:bg-accent hover:text-accent-foreground rounded flex items-center justify-center transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedTrackForDetails(track.trackId);
                                    }}
                                    title="Pokaż szczegóły utworu"
                                  >
                                    <Eye className="h-3 w-3" />
                                  </button>
                                  {track.uri &&
                                    track.uri !== "null" &&
                                    track.uri !== null && (
                                      <a
                                        href={track.uri}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="h-6 w-6 text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded flex items-center justify-center transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                        title="Otwórz w Spotify"
                                      >
                                        <Play className="h-3 w-3 fill-current" />
                                      </a>
                                    )}
                                </div>
                              </div>
                            ) : columnKey === "skipPercentage" ? (
                              <span
                                className={`font-mono ${
                                  track.skipPercentage > 50
                                    ? "text-red-500"
                                    : track.skipPercentage > 20
                                    ? "text-yellow-500"
                                    : "text-green-500"
                                }`}
                              >
                                {formatCellValue(track, columnKey)}
                              </span>
                            ) : (
                              <span
                                className={
                                  columnKey === "totalPlays" ||
                                  columnKey === "totalMinutes" ||
                                  columnKey === "avgPlayDuration"
                                    ? "font-mono"
                                    : ""
                                }
                              >
                                {formatCellValue(track, columnKey)}
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                      {expandedTrack === track.trackId && (
                        <tr key={`${track.trackId}-expanded`}>
                          <td
                            colSpan={visibleColumns.length}
                            className="p-4 bg-muted/30"
                          >
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <h4 className="font-semibold text-sm">
                                  {t("timelineTitle")}: {track.trackName}
                                </h4>
                                <div className="flex items-center gap-3">
                                  {trackTimelineData &&
                                    trackTimelineData.length > 0 && (
                                      <span className="text-xs text-muted-foreground font-mono">
                                        Timeline:{" "}
                                        {getFilteredTimelineData(
                                          trackTimelineData
                                        ).reduce(
                                          (sum, day) => sum + day.plays,
                                          0
                                        )}{" "}
                                        / Total: {track.totalPlays}
                                        {getFilteredTimelineData(
                                          trackTimelineData
                                        ).reduce(
                                          (sum, day) => sum + day.plays,
                                          0
                                        ) !== track.totalPlays && " ⚠️"}
                                      </span>
                                    )}
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      id={`extend-to-today-${track.trackId}`}
                                      checked={extendToToday}
                                      onChange={(e) =>
                                        setExtendToToday(e.target.checked)
                                      }
                                      className="rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0"
                                    />
                                    <label
                                      htmlFor={`extend-to-today-${track.trackId}`}
                                      className="text-xs text-muted-foreground cursor-pointer"
                                    >
                                      {t("extendToToday")}
                                    </label>
                                  </div>
                                </div>
                              </div>
                              {timelineLoading === track.trackId ? (
                                <div className="h-64 flex items-center justify-center">
                                  <div className="flex flex-col items-center gap-2">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    <span className="text-sm text-muted-foreground">
                                      {t("loading")}...
                                    </span>
                                  </div>
                                </div>
                              ) : !trackTimelineData ||
                                trackTimelineData.length === 0 ? (
                                <div className="text-center text-muted-foreground py-8">
                                  {t("noTimelineData")}
                                </div>
                              ) : (
                                <div className="h-64">
                                  <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                  >
                                    <BarChart
                                      data={getFilteredTimelineData(
                                        trackTimelineData
                                      )}
                                    >
                                      <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="hsl(var(--border))"
                                      />
                                      <XAxis
                                        dataKey="date"
                                        fontSize={12}
                                        type="category"
                                        tick={{
                                          fill: "hsl(var(--foreground))",
                                        }}
                                        axisLine={{
                                          stroke: "hsl(var(--border))",
                                        }}
                                        interval="preserveStartEnd"
                                        tickFormatter={(value) => {
                                          const date = new Date(value);
                                          return `${date.getDate()}/${
                                            date.getMonth() + 1
                                          }`;
                                        }}
                                      />
                                      <YAxis
                                        fontSize={12}
                                        tick={{
                                          fill: "hsl(var(--foreground))",
                                        }}
                                        axisLine={{
                                          stroke: "hsl(var(--border))",
                                        }}
                                      />
                                      <Tooltip
                                        labelFormatter={(value) =>
                                          `${t("date")}: ${localizedFormatDate(
                                            value
                                          )}`
                                        }
                                        formatter={(
                                          value: any,
                                          name: string
                                        ) => [
                                          value,
                                          name === "plays"
                                            ? t("plays")
                                            : t("minutes"),
                                        ]}
                                        contentStyle={{
                                          backgroundColor: "hsl(var(--card))",
                                          border:
                                            "1px solid hsl(var(--border))",
                                          borderRadius: "var(--radius)",
                                          color: "hsl(var(--foreground))",
                                        }}
                                      />
                                      <Bar
                                        dataKey="plays"
                                        fill="hsl(var(--primary))"
                                      />
                                    </BarChart>
                                  </ResponsiveContainer>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginacja */}
            {pagination && (
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    {t("page")} {pagination.page} {t("of")} {pagination.pages}(
                    {pagination.total.toLocaleString()} {t("tracksCount")})
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {t("perPage")}
                    </span>
                    <select
                      value={pagination.limit}
                      onChange={(e) =>
                        onPageSizeChange?.(parseInt(e.target.value))
                      }
                      className="text-sm border rounded px-2 py-1 bg-background"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={200}>200</option>
                      <option value={500}>500</option>
                    </select>
                  </div>
                </div>
                {pagination.pages > 1 && (
                  <div className="flex space-x-2">
                    <button
                      className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                      onClick={() => onPageChange?.(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                    >
                      {t("previous")}
                    </button>

                    {/* Numeracja stron */}
                    {Array.from(
                      { length: Math.min(5, pagination.pages) },
                      (_, i) => {
                        const page = Math.max(1, pagination.page - 2) + i;
                        if (page > pagination.pages) return null;

                        return (
                          <button
                            key={page}
                            className={`px-3 py-1 text-sm border rounded ${
                              page === pagination.page
                                ? "bg-primary text-primary-foreground"
                                : ""
                            }`}
                            onClick={() => onPageChange?.(page)}
                          >
                            {page}
                          </button>
                        );
                      }
                    )}

                    <button
                      className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                      onClick={() => onPageChange?.(pagination.page + 1)}
                      disabled={pagination.page >= pagination.pages}
                    >
                      {t("next")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
