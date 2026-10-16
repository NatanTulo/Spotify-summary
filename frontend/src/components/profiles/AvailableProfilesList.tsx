import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import { useLanguage } from '../../context/LanguageContext'
import { AvailableProfile, ImportProgress } from './types'

interface AvailableProfilesListProps {
    availableProfiles: AvailableProfile[];
    importProgress: Record<string, ImportProgress>;
    activeImports: Set<string>;
    importingProfile: string | null;
    onImportProfile: (name: string) => void;
}

export const AvailableProfilesList: React.FC<AvailableProfilesListProps> = ({
    availableProfiles,
    importProgress,
    activeImports,
    importingProfile,
    onImportProfile
}) => {
    const { t, language } = useLanguage();

    if (availableProfiles.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t("availableDataImport")}</CardTitle>
                <CardDescription>{t("availableDataImportDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="mb-4 max-w-3xl text-sm text-muted-foreground">{language === 'pl' ? 'Foldery pochodzą z lokalnego katalogu data. Import zastępuje historię wybranego profilu danymi z folderu. Przed rozpoczęciem sprawdź, czy folder zawiera wszystkie pliki historii.' : 'Folders come from the local data directory. Import replaces the selected profile history with the folder contents. Check that the folder contains all history files before starting.'}</p>
                <div className="grid gap-4 md:grid-cols-2">
                    {availableProfiles.map((profile) => {
                        const progress = importProgress[profile.name];
                        const isImporting =
                            activeImports.has(profile.name) ||
                            importingProfile === profile.name;

                        return (
                            <div
                                key={profile.name}
                                className="border rounded-lg p-4 space-y-2"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <h4 className="min-w-0 break-all font-medium">{profile.name}</h4>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onImportProfile(profile.name)}
                                        disabled={isImporting || profile.files.length === 0}
                                    >
                                        {isImporting ? t("importingStatus") : t("importAction")}
                                    </Button>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    <span>
                                        {profile.files.length} {t("jsonFiles")}
                                    </span>
                                </p>

                                {/* Progress Bar */}
                                {progress && (
                                    <div className="space-y-2 pt-2 border-t">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                {progress.status === "preparing"
                                                    ? t("preparingStatus")
                                                    : progress.status === "importing"
                                                        ? `${t("fileProgress")} ${progress.currentFileIndex + 1
                                                        }/${progress.totalFiles}`
                                                        : progress.status === "completed"
                                                            ? t("completedStatus")
                                                            : progress.status === "error"
                                                                ? t("errorStatus")
                                                                : t("importStatusGeneral")}
                                            </span>
                                            <span className="font-medium">
                                                {Math.round(progress.percentage)}%
                                            </span>
                                        </div>
                                        <Progress value={progress.percentage} className="h-2" />
                                        {progress.currentFile && (
                                            <p className="text-xs text-muted-foreground truncate">
                                                {progress.currentFile}
                                            </p>
                                        )}
                                        {progress.totalRecordsProcessed > 0 && (
                                            <p className="text-xs text-muted-foreground">
                                                {progress.totalRecordsProcessed.toLocaleString()} /{" "}
                                                {progress.estimatedTotalRecords.toLocaleString()}{" "}
                                                {t("recordsStats")}
                                            </p>
                                        )}
                                        {progress.error && <p role="alert" className="text-sm text-destructive">{progress.error}</p>}
                                        {progress.status === 'cancelled' && <p className="text-sm">{t('importCancelled')}</p>}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
