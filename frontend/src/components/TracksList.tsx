import { useState, Fragment, useEffect, useCallback, useMemo } from "react";
import { Play, Settings2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { useLanguage } from "../context/LanguageContext";
import { TrackDetails } from "./TrackDetails";
import { ExtendedTrack, PaginationState } from "./tracks/types";
import { TrackRow } from "./tracks/TrackRow";
import { TracksTableHeaders } from "./tracks/TracksTableHeaders";
import { PaginationControls } from "./tracks/PaginationControls";
import { ColumnSelector } from "./tracks/ColumnSelector";

interface TracksListProps {
  tracks: ExtendedTrack[];
  loading?: boolean;
  profileId?: string;
  pagination?: PaginationState;
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
  const { t } = useLanguage();

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

  const [visibleColumns, setVisibleColumns] = useState<(keyof ExtendedTrack)[]>(
    defaultColumns
  );
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  // Inteligentny prefetching dla top utworów - użyjemy useMemo dla stability
  const topTracksForPrefetch = useMemo(() => {
    if (tracks.length === 0) return [];
    return tracks
      .filter((t) => t.totalPlays > 10) // Tylko utwory z więcej niż 10 odtworzeń
      .sort((a, b) => b.totalPlays - a.totalPlays)
      .slice(0, 3);
  }, [tracks]);

  const prefetchPopularTracks = useCallback(async () => {
    if (topTracksForPrefetch.length === 0) return;

    for (const track of topTracksForPrefetch) {
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
  }, [topTracksForPrefetch, profileId, timelineCache]);

  // Prefetch po załadowaniu utworów - MUSI BYĆ PRZED WARUNKOWYMI RETURNAMI
  useEffect(() => {
    if (topTracksForPrefetch.length > 0) {
      // Delay prefetch by 1 second to not interfere with main UI
      const timer = setTimeout(prefetchPopularTracks, 1000);
      return () => clearTimeout(timer);
    }
  }, [prefetchPopularTracks, topTracksForPrefetch.length, currentSort]);

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

  const toggleTrackExpansion = async (trackId: string) => {
    if (expandedTrack === trackId) {
      setExpandedTrack(null);
      return;
    }

    setExpandedTrack(trackId);

    // Check cache first
    const cacheKey = `${trackId}-${profileId || "all"}`;
    if (timelineCache.has(cacheKey)) {
      setTrackTimelineData(timelineCache.get(cacheKey)!);
      return;
    }

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
        }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const timelineData = data.data || [];

        setTrackTimelineData(timelineData);
        // Cache result
        setTimelineCache((prev) => new Map(prev).set(cacheKey, timelineData));
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
          <ColumnSelector
            visibleColumns={visibleColumns}
            onChangeVisibility={toggleColumnVisibility}
            onReset={resetColumnsToDefault}
          />
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
              <table className="w-full min-w-[600px]">
                <TracksTableHeaders
                  visibleColumns={visibleColumns}
                  currentSort={currentSort}
                  onSort={onSort}
                />
                <tbody>
                  {tracks.map((track) => (
                    <Fragment key={track.trackId}>
                      <TrackRow
                        track={track}
                        visibleColumns={visibleColumns}
                        isExpanded={expandedTrack === track.trackId}
                        onToggleExpand={() => toggleTrackExpansion(track.trackId)}
                        onSelectDetails={setSelectedTrackForDetails}
                        timelineData={trackTimelineData}
                        timelineLoading={timelineLoading === track.trackId}
                      />
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginacja */}
            {pagination && (
              <PaginationControls
                pagination={pagination}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
