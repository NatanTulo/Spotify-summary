import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";

interface YearlyStatsProps {
  data: Array<{
    year: number;
    plays: number;
    minutes: number;
    topArtist?: string;
  }>;
}

export function YearlyStatsChart({ data }: YearlyStatsProps) {
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("yearlyStats")}</CardTitle>
        <CardDescription>{t("yearlyStatsDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300} minWidth={0}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="year"
              tick={{ fill: "hsl(var(--foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: "hsl(var(--foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: "hsl(var(--foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <Tooltip
              formatter={((value: number, name: string) => [
                name === "plays"
                  ? value.toLocaleString()
                  : `${Math.round(value).toLocaleString()} min`,
                name === "plays" ? t("playsTooltip") : t("minutesTooltip"),
              ]) as any}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
                color: "hsl(var(--foreground))",
              }}
            />
            <Bar
              yAxisId="left"
              dataKey="plays"
              fill="hsl(var(--primary))"
              name="plays"
            />
            <Bar
              yAxisId="right"
              dataKey="minutes"
              fill="hsl(var(--chart-2))"
              name="minutes"
            />
          </BarChart>
        </ResponsiveContainer>
        
        {/* Detailed Stats Table */}
        <div className="mt-6 overflow-hidden rounded-lg border">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="px-4 py-2 text-left font-medium">{t("year")}</th>
                <th className="px-4 py-2 text-right font-medium">{t("playsLabel")}</th>
                <th className="px-4 py-2 text-right font-medium">{t("minutesLabel")}</th>
                <th className="px-4 py-2 text-right font-medium">{t("hoursLabel")}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((stat, index) => (
                <tr key={stat.year} className={index % 2 === 0 ? "bg-muted/25" : ""}>
                  <td className="px-4 py-2 font-medium">{stat.year}</td>
                  <td className="px-4 py-2 text-right">{stat.plays.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">{stat.minutes.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">{(stat.minutes / 60).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
