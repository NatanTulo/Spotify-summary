import { useLanguage } from "../../context/LanguageContext";
import { ExtendedTrack, ColumnConfig } from "./types";

export const useTrackColumns = () => {
  const { t, formatDate: localizedFormatDate } = useLanguage();

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
      format: (val) => (val && val.length > 0 ? val.join(", ") : "N/A"),
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

    const config = getAvailableColumns().find((c) => c.key === columnKey);
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

  return { getAvailableColumns, formatCellValue };
};
