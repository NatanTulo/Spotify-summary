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
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <Card className="py-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 py-2 pb-0">
                    <CardTitle className="text-xs font-medium">{t('totalPlays')}</CardTitle>
                    <Play className="h-3.5 w-3.5 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-3 py-1 pt-1">
                    <div className="text-xl font-bold tabular-nums">{totalPlays.toLocaleString()}</div>
                </CardContent>
            </Card>

            <Card className="py-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 py-2 pb-0">
                    <CardTitle className="text-xs font-medium">{t('totalMinutes')}</CardTitle>
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-3 py-1 pt-1">
                    <div className="text-xl font-bold tabular-nums">{totalMinutes.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                        ≈ {Math.round(totalMinutes / 60)} {t('hours')}
                    </p>
                </CardContent>
            </Card>

            <Card className="py-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 py-2 pb-0">
                    <CardTitle className="text-xs font-medium">{t('avgPlayDuration')}</CardTitle>
                    <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-3 py-1 pt-1">
                    <div className="text-xl font-bold tabular-nums">{formatDuration(avgPlayDuration * 1000)}</div>
                </CardContent>
            </Card>

            <Card className="py-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 py-2 pb-0">
                    <CardTitle className="text-xs font-medium">{t('skipPercentage')}</CardTitle>
                    <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-3 py-1 pt-1">
                    <div className="text-xl font-bold tabular-nums">
                        {skipPercentage.toFixed(1)}%
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
