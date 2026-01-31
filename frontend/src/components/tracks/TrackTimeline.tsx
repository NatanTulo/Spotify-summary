import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useLanguage } from "../../context/LanguageContext";

interface TrackTimelineProps {
  isLoading: boolean;
  data: any[];
  trackName: string;
  totalPlays: number;
}

export function TrackTimeline({
  isLoading,
  data,
  trackName,
  totalPlays,
}: TrackTimelineProps) {
  const { t, formatDate: localizedFormatDate } = useLanguage();
  const [extendToToday, setExtendToToday] = useState<boolean>(false);

  const getFilteredTimelineData = (data: any[]) => {
    if (!data || data.length === 0) return [];

    if (extendToToday) {
      return data;
    } else {
      let lastPlayIndex = data.length - 1;
      for (let i = data.length - 1; i >= 0; i--) {
        if (data[i].plays > 0) {
          lastPlayIndex = i;
          break;
        }
      }
      return data.slice(0, lastPlayIndex + 1);
    }
  };

  const filteredData = getFilteredTimelineData(data);
  const displayedPlays = filteredData.reduce((sum, day) => sum + day.plays, 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-sm">
          {t("timelineTitle")}: {trackName}
        </h4>
        <div className="flex items-center gap-3">
          {data && data.length > 0 && (
            <span className="text-xs text-muted-foreground font-mono">
              Timeline: {displayedPlays} / Total: {totalPlays}
              {displayedPlays !== totalPlays && " ⚠️"}
            </span>
          )}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`extend-to-today-timeline`}
              checked={extendToToday}
              onChange={(e) => setExtendToToday(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0"
            />
            <label
              htmlFor={`extend-to-today-timeline`}
              className="text-xs text-muted-foreground cursor-pointer"
            >
              {t("extendToToday")}
            </label>
          </div>
        </div>
      </div>
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">
              {t("loading")}...
            </span>
          </div>
        </div>
      ) : !data || data.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          {t("noTimelineData")}
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height={256} minWidth={0}>
            <BarChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                fontSize={12}
                type="category"
                tick={{ fill: "hsl(var(--foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                interval="preserveStartEnd"
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getDate()}/${date.getMonth() + 1}`;
                }}
              />
              <YAxis
                fontSize={12}
                tick={{ fill: "hsl(var(--foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <Tooltip
                labelFormatter={(value) =>
                  `${t("date")}: ${localizedFormatDate(value)}`
                }
                formatter={(((value: any, name: string) => [
                  value,
                  name === "plays" ? t("plays") : t("minutes"),
                ]) as any)}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  color: "hsl(var(--foreground))",
                }}
              />
              <Bar dataKey="plays" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
