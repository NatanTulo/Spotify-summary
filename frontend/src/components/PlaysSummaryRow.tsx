import React from "react";
import { Play, Podcast } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

interface PlaysSummaryRowProps {
  musicPlays: number;
  podcastPlays: number;
  className?: string;
}

const PlaysSummaryRow: React.FC<PlaysSummaryRowProps> = ({ musicPlays, podcastPlays, className = "" }) => {
  const { t } = useLanguage();
  return (
    <div
      className={
        `rounded-md border px-3 py-2 bg-white/70 dark:bg-white/5 backdrop-blur ${className}`
      }
    >
      <div className="w-full text-center text-[11px] sm:text-xs font-medium text-muted-foreground">
        {t("playsHeading")}
      </div>
      <div className="mt-1 flex items-center justify-center gap-4 sm:gap-6">
        <div className="flex items-center gap-2 text-sm sm:text-base">
          <Play className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
          <span className="font-semibold">{musicPlays.toLocaleString()}</span>
          <span className="text-muted-foreground">{t("songsStats")}</span>
        </div>
        <div className="flex items-center gap-2 text-sm sm:text-base">
          <Podcast className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600 dark:text-violet-400" />
          <span className="font-semibold">{podcastPlays.toLocaleString()}</span>
          <span className="text-muted-foreground">{t("videoplaysStats")}</span>
        </div>
      </div>
    </div>
  );
};

export default PlaysSummaryRow;
