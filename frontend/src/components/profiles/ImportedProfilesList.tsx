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
    const { t, language, formatDate: localizedFormatDate } = useLanguage();

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
                                ? "border-primary bg-accent/30"
                                : "border-border"
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    {profile.name}
                                </h4>

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
                <section className="mt-6 space-y-3 border-t border-destructive/40 pt-5">
                    <h3 className="font-semibold">{language === 'pl' ? 'Usuń historię profilu' : 'Delete profile history'}</h3>
                    <p className="max-w-3xl text-sm text-muted-foreground">{language === 'pl' ? 'Usunięcie profilu trwale usuwa jego historię z tej aplikacji. Pliki źródłowe pozostają w folderze data. Każde usunięcie wymaga potwierdzenia.' : 'Deleting a profile permanently removes its history from this app. Source files remain in the data folder. Each deletion requires confirmation.'}</p>
                    <div className="flex flex-wrap gap-3">{profiles.map(profile => <Button key={profile._id} variant="outline" size="sm" className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => onClearProfile(profile._id)}>{t('removeAction')}: {profile.name}</Button>)}</div>
                </section>
            </CardContent>
        </Card>
    )
}
