import { Button } from "../ui/button";
import { useLanguage } from "../../context/LanguageContext";
import { useTrackColumns } from "./columns";
import { ExtendedTrack } from "./types";

interface ColumnSelectorProps {
  visibleColumns: (keyof ExtendedTrack)[];
  onChangeVisibility: (key: keyof ExtendedTrack) => void;
  onReset: () => void;
}

export function ColumnSelector({
  visibleColumns,
  onChangeVisibility,
  onReset,
}: ColumnSelectorProps) {
  const { t } = useLanguage();
  const { getAvailableColumns } = useTrackColumns();
  const availableColumns = getAvailableColumns();

  return (
    <div className="mt-4 p-4 border rounded-lg bg-muted/50 w-full">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium">{t("selectColumns")}</h4>
        <Button
          onClick={onReset}
          className="px-2 py-1 text-xs h-auto"
          variant="outline"
        >
          {t("resetColumns")}
        </Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {availableColumns.map((column) => (
          <label
            key={column.key}
            className="flex items-center space-x-2 text-sm"
          >
            <input
              type="checkbox"
              checked={visibleColumns.includes(column.key)}
              onChange={() => onChangeVisibility(column.key)}
              className="rounded"
            />
            <span>{t(column.labelKey)}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
