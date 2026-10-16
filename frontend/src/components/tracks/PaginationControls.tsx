import { countLabel } from '../../lib/countLabel'
import { PaginationState } from "./types";
import { useLanguage } from "../../context/LanguageContext";

interface PaginationControlsProps {
  pagination: PaginationState;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export function PaginationControls({
  pagination,
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps) {
  const { t, language } = useLanguage();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-sm text-muted-foreground">
          {t("page")} {pagination.page} {t("of")} {Math.max(1, pagination.pages)} (
          {countLabel(pagination.total, "tracks", language)})
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t("perPage")}</span>
          <select
            aria-label={t("perPage")}
            value={pagination.limit}
            onChange={(e) => onPageSizeChange?.(parseInt(e.target.value))}
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
  );
}
