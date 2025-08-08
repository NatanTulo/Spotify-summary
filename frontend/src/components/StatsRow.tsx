import React from "react";
import { Play, Clock, Music, User, Disc, Podcast, Tv, List } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export interface StatsData {
  totalPlays?: number;
  totalMinutes?: number;
  uniqueTracks?: number;
  uniqueArtists?: number;
  uniqueAlbums?: number;
  totalPodcastPlays?: number;
  uniqueShows?: number;
  uniqueEpisodes?: number;
}

interface StatsRowProps {
  stats: StatsData;
  formatDuration: (minutes: number) => string;
  className?: string;
  compact?: boolean;
  showAlbums?: boolean;
  showMinutes?: boolean;
}

export const StatsRow: React.FC<StatsRowProps> = ({
  stats,
  formatDuration,
  className = "",
  compact = false,
  showAlbums = true,
  showMinutes = true,
}) => {
  const { t } = useLanguage();
  const textSize = compact ? "text-xs" : "text-sm";
  const iconSize = compact ? "h-3 w-3" : "h-4 w-4";

  const items: Array<React.ReactNode> = [];

  items.push(
    <div key="plays" className={`flex items-center gap-1 whitespace-nowrap truncate ${textSize}`}>
      <Play className={`${iconSize}`} />
      {(stats.totalPlays ?? 0).toLocaleString()} {t("playsStats")}
    </div>
  );

  if (showMinutes) {
    items.push(
      <div key="minutes" className={`flex items-center gap-1 whitespace-nowrap truncate ${textSize}`}>
        <Clock className={`${iconSize}`} />
        {formatDuration(stats.totalMinutes ?? 0)}
      </div>
    );
  }

  items.push(
    <div key="tracks" className={`flex items-center gap-1 whitespace-nowrap truncate ${textSize}`}>
      <Music className={`${iconSize}`} />
      {(stats.uniqueTracks ?? 0).toLocaleString()} {t("songsStats")}
    </div>
  );

  items.push(
    <div key="artists" className={`flex items-center gap-1 whitespace-nowrap truncate ${textSize}`}>
      <User className={`${iconSize}`} />
      {(stats.uniqueArtists ?? 0).toLocaleString()} {t("artistsStats")}
    </div>
  );

  if (showAlbums) {
    items.push(
      <div key="albums" className={`flex items-center gap-1 whitespace-nowrap truncate ${textSize}`}>
        <Disc className={`${iconSize}`} />
        {(stats.uniqueAlbums ?? 0).toLocaleString()} {t("albumsStats")}
      </div>
    );
  }

  if ((stats.totalPodcastPlays ?? 0) > 0) {
    items.push(
      <div key="podcastplays" className={`flex items-center gap-1.5 whitespace-nowrap truncate ${textSize}`}>
        <Podcast className={`${iconSize} relative top-px`} />
        {(stats.totalPodcastPlays ?? 0).toLocaleString()} {t("podcastplaysStats")}
      </div>
    );
    items.push(
      <div key="shows" className={`flex items-center gap-1.5 whitespace-nowrap truncate ${textSize}`}>
        <Tv className={`${iconSize} relative top-px`} />
        {(stats.uniqueShows ?? 0).toLocaleString()} {t("showsStats")}
      </div>
    );
    items.push(
      <div key="episodes" className={`flex items-center gap-1.5 whitespace-nowrap truncate ${textSize}`}>
        <List className={`${iconSize} relative top-px`} />
        {(stats.uniqueEpisodes ?? 0).toLocaleString()} {t("episodesStats")}
      </div>
    );
  }

  return (
    <div className={`grid gap-2 grid-cols-2 sm:grid-cols-3 ${className}`}>
      {items}
    </div>
  );
};

export default StatsRow;
