import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";

interface TopArtistsProps {
  data: Array<{
    name: string;
    plays: number;
    minutes: number;
  }>;
  loading?: boolean;
}

export function TopArtistsChart({ data, loading = false }: TopArtistsProps) {
  const { t } = useLanguage();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("topArtists")}</CardTitle>
          <CardDescription>{t("topArtistsDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("topArtists")}</CardTitle>
          <CardDescription>{t("topArtistsDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            {t("noDataToDisplay")}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("topArtists")}</CardTitle>
        <CardDescription>{t("topArtistsDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.slice(0, 10).map((artist, index) => (
            <div
              key={artist.name}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </div>
                <span
                  className="font-medium truncate max-w-[150px]"
                  title={artist.name}
                >
                  {artist.name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-semibold">
                    {(artist.plays || 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {(artist.minutes || 0).toLocaleString()} min
                  </div>
                </div>
                <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        ((artist.plays || 0) /
                          Math.max(...data.map((a) => a.plays || 0))) *
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
