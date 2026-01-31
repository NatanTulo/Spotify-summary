import { ChevronUp, ChevronDown } from "lucide-react";
import { ExtendedTrack } from "./types";
import { useLanguage } from "../../context/LanguageContext";
import { useTrackColumns } from "./columns";

interface TracksTableHeadersProps {
  visibleColumns: (keyof ExtendedTrack)[];
  currentSort?: {
    field: string;
    order: "asc" | "desc";
  };
  onSort?: (field: string, order: "asc" | "desc") => void;
}

export function TracksTableHeaders({
  visibleColumns,
  currentSort,
  onSort,
}: TracksTableHeadersProps) {
  const { t } = useLanguage();
  const { getAvailableColumns } = useTrackColumns();
  const availableColumns = getAvailableColumns();

  const getSortIcon = (field: string) => {
    if (currentSort?.field !== field) return null;
    return currentSort.order === "desc" ? (
      <ChevronDown className="h-4 w-4" />
    ) : (
      <ChevronUp className="h-4 w-4" />
    );
  };

  const handleSort = (field: string) => {
    if (!onSort) return;
    const newOrder =
      currentSort?.field === field && currentSort.order === "desc"
        ? "asc"
        : "desc";
    
    onSort(field, newOrder);
  };

  const getColumnConfig = (key: keyof ExtendedTrack) => {
    return availableColumns.find((col) => col.key === key);
  };

  return (
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
                <span className="font-semibold">{t(config.labelKey)}</span>
              )}
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
