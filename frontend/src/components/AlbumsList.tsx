import { Disc } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { useLanguage } from "../context/LanguageContext";
import { PaginationState } from "./tracks/types";
import { PaginationControls } from "./tracks/PaginationControls";

interface Album {
  id: number;
  name: string;
  artist: string;
  plays: number;
  minutes: number;
}

interface AlbumsListProps {
  albums: Album[];
  loading?: boolean;
  pagination?: PaginationState;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSort?: (field: string, order: "asc" | "desc") => void;
  currentSort?: {
    field: string;
    order: "asc" | "desc";
  };
}

export function AlbumsList({
  albums,
  loading = false,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSort,
  currentSort,
}: AlbumsListProps) {
  const { t } = useLanguage();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">{t("loading")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Disc className="h-5 w-5" />
              <span>{t("albumsList")}</span>
              {pagination && (
                <span className="text-sm text-muted-foreground">
                  ({pagination.total.toLocaleString()} {t("albumsStats")})
                </span>
              )}
            </CardTitle>
            <CardDescription>{t("clickHeaders")}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {albums.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">{t("noAlbums")}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left font-medium text-muted-foreground cursor-pointer" onClick={() => onSort?.('name', currentSort?.field === 'name' && currentSort.order === 'asc' ? 'desc' : 'asc')}>
                      {t("album")} {currentSort?.field === 'name' && (currentSort.order === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="p-2 text-left font-medium text-muted-foreground cursor-pointer" onClick={() => onSort?.('artist', currentSort?.field === 'artist' && currentSort.order === 'asc' ? 'desc' : 'asc')}>
                      {t("artist")} {currentSort?.field === 'artist' && (currentSort.order === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="p-2 text-right font-medium text-muted-foreground cursor-pointer" onClick={() => onSort?.('plays', currentSort?.field === 'plays' && currentSort.order === 'asc' ? 'desc' : 'asc')}>
                      {t("plays")} {currentSort?.field === 'plays' && (currentSort.order === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="p-2 text-right font-medium text-muted-foreground cursor-pointer" onClick={() => onSort?.('minutes', currentSort?.field === 'minutes' && currentSort.order === 'asc' ? 'desc' : 'asc')}>
                      {t("minutes")} {currentSort?.field === 'minutes' && (currentSort.order === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {albums.map((album) => (
                    <tr key={album.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="p-2 font-medium">{album.name}</td>
                      <td className="p-2 text-muted-foreground">{album.artist}</td>
                      <td className="p-2 text-right">{album.plays.toLocaleString()}</td>
                      <td className="p-2 text-right">{album.minutes.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && (
              <PaginationControls
                pagination={pagination}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
