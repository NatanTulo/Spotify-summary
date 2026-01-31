import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useLanguage } from '@/context/LanguageContext'
import { DailyStats } from '../types'

interface PodcastsInsightsTabProps {
    dailyStats: DailyStats[]
}

export function PodcastsInsightsTab({ dailyStats }: PodcastsInsightsTabProps) {
    const { t } = useLanguage()

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('quickInsights') || 'Quick insights'}</CardTitle>
                <CardDescription>{t('podcastInsightsDescription') || 'Key takeaways from your podcast listening'}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {(() => {
                        const days = dailyStats || []
                        if (!days.length) {
                            return (
                                <div className="col-span-full text-muted-foreground text-sm">
                                    {t('noData') || 'No data to display'}
                                </div>
                            )
                        }
                        const totalDays = days.length
                        let longest = 0
                        let current = 0
                        let maxPlays = 0
                        let maxPlaysDate = '-'
                        let activeDays = 0
                        let maxMinutes = 0
                        
                        for (const d of days) {
                            const p = Number(d.plays) || 0
                            const m = Number(d.minutes) || 0
                            const hasPlays = p > 0
                            if (hasPlays) {
                                current += 1
                                activeDays += 1
                            } else {
                                longest = Math.max(longest, current)
                                current = 0
                            }
                            if (p > maxPlays) {
                                maxPlays = p
                                maxPlaysDate = d.date
                            }
                            if (m > maxMinutes) maxMinutes = m
                        }
                        longest = Math.max(longest, current)
                        const activePct = totalDays ? Math.round((activeDays / totalDays) * 100) : 0
                        const totalPlaysActive = days.filter(d => (d.plays || 0) > 0).reduce((a, d) => a + (d.plays || 0), 0)
                        const totalMinutesActive = days.filter(d => (d.minutes || 0) > 0).reduce((a, d) => a + (Number(d.minutes) || 0), 0)
                        const avgPlaysActive = activeDays ? Math.round(totalPlaysActive / activeDays) : 0
                        const avgMinutesActive = activeDays ? Math.round(totalMinutesActive / activeDays) : 0
                        
                        if (totalPlaysActive === 0) {
                            return (
                                <div className="col-span-full text-muted-foreground text-sm">
                                    {t('noData') || 'No data to display'}
                                </div>
                            )
                        }
                        
                        return (
                            <>
                                <div className="space-y-1">
                                    <div className="text-2xl font-bold text-primary">{longest}</div>
                                    <div className="text-sm text-muted-foreground">{t('longestStreak') || 'Longest streak (days)'}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-2xl font-bold text-primary">{current}</div>
                                    <div className="text-sm text-muted-foreground">{t('currentStreak') || 'Current streak (days)'}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-2xl font-bold text-primary">{activePct}%</div>
                                    <div className="text-sm text-muted-foreground">{t('activeDaysRatio') || 'Active days (last period)'}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-2xl font-bold text-primary">{maxPlays}</div>
                                    <div className="text-sm text-muted-foreground">{t('peakDayPlays') || `Peak day plays (${maxPlaysDate})`}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-2xl font-bold text-primary">{avgPlaysActive}</div>
                                    <div className="text-sm text-muted-foreground">{t('avgPlaysActiveDay') || 'Avg plays per active day'}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-2xl font-bold text-primary">{avgMinutesActive}</div>
                                    <div className="text-sm text-muted-foreground">{t('avgMinutesActiveDay') || 'Avg minutes per active day'}</div>
                                </div>
                            </>
                        )
                    })()}
                </div>
            </CardContent>
        </Card>
    )
}
