import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Play, Clock, Hash } from 'lucide-react'
import { useLanguage } from '../../../context/LanguageContext'

interface TrackStatsProps {
    totalPlays: number
    totalMinutes: number
    avgPlayDuration: number
    skipPercentage: number
}

export function TrackStats({ totalPlays, totalMinutes, avgPlayDuration, skipPercentage }: TrackStatsProps) {
    const { t } = useLanguage()

    const formatDuration = (ms: number) => {
        if (!ms) return t('notAvailable')
        const minutes = Math.floor(ms / 60000)
        const seconds = Math.floor((ms % 60000) / 1000)
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('totalPlays')}</CardTitle>
                    <Play className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalPlays.toLocaleString()}</div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('totalMinutes')}</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalMinutes.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                        ≈ {Math.round(totalMinutes / 60)} {t('hours')}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('avgPlayDuration')}</CardTitle>
                    <Hash className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatDuration(avgPlayDuration * 1000)}</div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('skipPercentage')}</CardTitle>
                    <Hash className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${
                        skipPercentage > 50 ? 'text-red-500' :
                        skipPercentage > 20 ? 'text-yellow-500' :
                        'text-green-500'
                    }`}>
                        {skipPercentage.toFixed(1)}%
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
