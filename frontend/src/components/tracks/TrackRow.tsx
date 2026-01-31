import { TrendingUp, Eye, Play } from "lucide-react";
import { ExtendedTrack } from "./types";
import { TrackTimeline } from "./TrackTimeline";
import { useTrackColumns } from "./columns";

interface TrackRowProps {
  track: ExtendedTrack;
  visibleColumns: (keyof ExtendedTrack)[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSelectDetails: (trackId: string) => void;
  timelineData: any[];
  timelineLoading: boolean;
}

export function TrackRow({
  track,
  visibleColumns,
  isExpanded,
  onToggleExpand,
  onSelectDetails,
  timelineData,
  timelineLoading,
}: TrackRowProps) {
  const { formatCellValue } = useTrackColumns();

  return (
    <>
      <tr
        className="border-b hover:bg-muted/50 cursor-pointer"
        onClick={onToggleExpand}
      >
        {visibleColumns.map((columnKey) => (
          <td key={columnKey} className="p-2">
            {columnKey === "trackName" ? (
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <div className="font-medium">{track.trackName}</div>
                <div className="ml-auto flex items-center gap-1">
                  <button
                    className="h-6 w-6 hover:bg-accent hover:text-accent-foreground rounded flex items-center justify-center transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDetails(track.trackId);
                    }}
                    title="Pokaż szczegóły utworu"
                  >
                    <Eye className="h-3 w-3" />
                  </button>
                  {track.uri && track.uri !== "null" && track.uri !== null && (
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
      {isExpanded && (
        <tr key={`${track.trackId}-expanded`}>
          <td colSpan={visibleColumns.length} className="p-4 bg-muted/30">
            <TrackTimeline
              isLoading={timelineLoading}
              data={timelineData}
              trackName={track.trackName}
              totalPlays={track.totalPlays}
            />
          </td>
        </tr>
      )}
    </>
  );
}
