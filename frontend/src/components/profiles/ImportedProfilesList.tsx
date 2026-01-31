import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { User, Calendar } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import StatsRow from '../StatsRow'
import PlaysSummaryRow from '../PlaysSummaryRow'
import { Profile } from './types'

interface ImportedProfilesListProps {
    profiles: Profile[];
    selectedProfileId: string | null;
    onClearProfile: (id: string) => void;
}

export const ImportedProfilesList: React.FC<ImportedProfilesListProps> = ({
    profiles,
    selectedProfileId,
    onClearProfile
}) => {
    const { t, formatDate: localizedFormatDate } = useLanguage();

    if (profiles.length === 0) return null;

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t("importedProfiles")}</CardTitle>
                <CardDescription>{t("profilesReadyDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                    {profiles.map((profile) => (
                        <div
                            key={profile._id}
                            className={`border rounded-lg p-4 space-y-3 transition-colors ${selectedProfileId === profile._id
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                                : "hover:border-gray-300"
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    {profile.name}
                                </h4>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => onClearProfile(profile._id)}
                                >
                                    {t("removeAction")}
                                </Button>
                            </div>

                            {profile.lastImport && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    {localizedFormatDate(profile.lastImport, true)}
                                </div>
                            )}

                            <div className="space-y-2">
                                <PlaysSummaryRow
                                    musicPlays={profile.statistics?.totalPlays || 0}
                                    podcastPlays={profile.statistics?.totalPodcastPlays || 0}
                                />
                                <StatsRow
                                    stats={profile.statistics}
                                    formatDuration={formatDuration}
                                    showPlays={false}
                                    showPodcastPlays={false}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
