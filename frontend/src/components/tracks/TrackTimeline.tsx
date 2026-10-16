import { useId, useState } from "react";
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
}: TrackTimelineProps) {
  const { t, language, formatDate: localizedFormatDate } = useLanguage();
  const extendId = useId();
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


  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <h4 className="font-semibold text-sm break-words">
          {t("timelineTitle")}: {trackName}
        </h4>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={extendId}
              checked={extendToToday}
              onChange={(e) => setExtendToToday(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0"
            />
            <label
              htmlFor={extendId}
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
        <div className="h-40 w-full sm:h-44" data-testid="track-timeline-chart">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={filteredData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                fontSize={12}
                type="category"
                tick={{ fill: "hsl(var(--foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                interval="preserveStartEnd"
                minTickGap={55}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString(language, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
                }}
              />
              <YAxis
                width={32}
                allowDecimals={false}
                fontSize={12}
                tick={{ fill: "hsl(var(--foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <Tooltip
                labelFormatter={(value) =>
                  `${t("date")}: ${localizedFormatDate(typeof value === 'string' ? value : undefined)}`
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
                  fontSize: 12,
                }}
              />
              <Bar dataKey="plays" fill="hsl(var(--primary))" minPointSize={2} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
