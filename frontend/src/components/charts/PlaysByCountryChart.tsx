import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";

interface PlaysByCountryProps {
  data: Array<{
    country: string;
    plays: number;
    percentage?: number;
  }>;
  loading?: boolean;
}

export function PlaysByCountryChart({
  data,
  loading = false,
}: PlaysByCountryProps) {
  const { t } = useLanguage();

  // Obliczamy procenty w frontendzie
  const totalPlays = (data || []).reduce(
    (sum, country) => sum + country.plays,
    0
  );

  // Sortujemy dane malejąco i dodajemy procenty
  const sortedData = [...(data || [])]
    .map((country) => ({
      ...country,
      percentage: totalPlays > 0 ? (country.plays / totalPlays) * 100 : 0,
    }))
    .sort((a, b) => b.plays - a.plays);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("playsByCountry")}</CardTitle>
          <CardDescription>{t("playsByCountryDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[350px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sortedData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("playsByCountry")}</CardTitle>
          <CardDescription>{t("playsByCountryDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[350px] text-muted-foreground">
            {t("noData")}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("playsByCountry")}</CardTitle>
        <CardDescription>{t("playsByCountryDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedData.slice(0, 10).map((country, index) => (
            <div
              key={country.country}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </div>
                <span className="font-medium">{country.country}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-semibold">
                    {country.plays.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {(country.percentage || 0).toFixed(1)}%
                  </div>
                </div>
                <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        ((country.percentage || 0) /
                          Math.max(
                            ...sortedData.map((c) => c.percentage || 0)
                          )) *
                          100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
