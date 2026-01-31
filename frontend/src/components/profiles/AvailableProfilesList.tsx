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
    const { t } = useLanguage();

    if (availableProfiles.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t("availableDataImport")}</CardTitle>
                <CardDescription>{t("availableDataImportDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
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
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium">{profile.name}</h4>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onImportProfile(profile.name)}
                                        disabled={isImporting}
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
                                {progress && progress.isRunning && (
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
