import { Card, CardContent } from '../ui/card'
import { User } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

interface EmptyStateProps {
    profilesLength: number;
    availableProfilesLength: number;
    isLoading: boolean;
    onRefresh: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    profilesLength,
    availableProfilesLength,
    isLoading,
    onRefresh
}) => {
    const { t } = useLanguage();

    if (profilesLength > 0 || availableProfilesLength > 0 || isLoading) return null;

    return (
        <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
                <User className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">{t("noDataState")}</h3>
                <p className="text-muted-foreground text-center mb-4">
                    {t("noDataMessage")}
                </p>
                <button
                    onClick={onRefresh}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {t("refresh")}
                </button>
            </CardContent>
        </Card>
    )
}
