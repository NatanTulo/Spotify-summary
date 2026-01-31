import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { useLanguage } from '@/context/LanguageContext'
import { TopArtist, TimelineStat } from '../types'

interface InsightsTabProps {
    timelineData: TimelineStat[]
    topArtists: TopArtist[]
    yearlyStats: any[]
}

export function InsightsTab({ timelineData, topArtists, yearlyStats }: InsightsTabProps) {
    const { t } = useLanguage()

    return (
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">{t('quickInsights') || 'Quick insights'}</CardTitle>
                    <CardDescription className="text-sm">{t('quickInsightsDescription') || 'Highlights based on your recent listening'}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {(() => {
                            const days = timelineData || []
                            const totalDays = days.length
                            let longest = 0
                            let current = 0
                            let maxPlays = 0
                            let maxPlaysDate = '-'
                            let maxMinutes = 0
                            let activeDays = 0
                            for (const d of days) {
                                const hasPlays = (Number((d as any).plays) || 0) > 0
                                if (hasPlays) {
                                    current += 1
                                    activeDays += 1
                                } else {
                                    longest = Math.max(longest, current)
                                    current = 0
                                }
                                const p = Number((d as any).plays) || 0
                                const m = Number((d as any).minutes) || 0
                                if (p > maxPlays) {
                                    maxPlays = p
                                    maxPlaysDate = (d as any).date
                                }
                                if (m > maxMinutes) {
                                    maxMinutes = m
                                }
                            }
                            longest = Math.max(longest, current)
                            const activePct = totalDays ? Math.round((activeDays / totalDays) * 100) : 0
                            const avgPlaysActive = activeDays ? Math.round(days.filter((d: any) => (d.plays || 0) > 0).reduce((a: number, d: any) => a + (Number(d.plays) || 0), 0) / activeDays) : 0
                            const avgMinutesActive = activeDays ? Math.round(days.filter((d: any) => (d.minutes || 0) > 0).reduce((a: number, d: any) => a + (Number(d.minutes) || 0), 0) / activeDays) : 0
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
            <Card>
                <CardHeader>
                    <CardTitle>{t('listeningBehavior') || 'Listening Behavior'}</CardTitle>
                    <CardDescription>{t('musicInsightsMore') || 'Concentration and distribution of your listening'}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {(() => {
                            const totalPlays = (topArtists || []).reduce((a: number, x: TopArtist) => a + (Number(x.plays) || 0), 0)
                            const top1 = topArtists && topArtists[0] ? Math.round(((Number(topArtists[0].plays) || 0) / (totalPlays || 1)) * 100) : 0
                            const top3sum = (topArtists || []).slice(0, 3).reduce((a: number, x: TopArtist) => a + (Number(x.plays) || 0), 0)
                            const top3 = Math.round(((top3sum) / (totalPlays || 1)) * 100)
                            const sorted = yearlyStats && yearlyStats.length ? [...(yearlyStats as any[])].sort((a,b) => Number(a.year) - Number(b.year)) : []

                            // YoY change using last two years if available
                            let yoy = 0
                            if (sorted.length >= 2) {
                                const last = sorted[sorted.length - 1]
                                const prev = sorted[sorted.length - 2]
                                const lastMinutes = Number((last as any).minutes) || 0
                                const prevMinutes = Number((prev as any).minutes) || 0
                                yoy = prevMinutes ? Math.round(((lastMinutes - prevMinutes) / prevMinutes) * 100) : 0
                            }
                            
                            return (
                                <>
                                    <div className="space-y-1">
                                        <div className="text-2xl font-bold text-primary">{top1}%</div>
                                        <div className="text-sm text-muted-foreground">{t('topArtistShare') || 'Top artist share'}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-2xl font-bold text-primary">{top3}%</div>
                                        <div className="text-sm text-muted-foreground">{t('top3Share') || 'Top 3 artists share'}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className={`text-2xl font-bold ${yoy >= 0 ? 'text-spotify-green' : 'text-destructive'}`}>{yoy}%</div>
                                        <div className="text-sm text-muted-foreground">{t('yoyChange') || 'YoY change (minutes)'}</div>
                                    </div>
                                    {/* Country share logic was complex, removed for simplicity in first pass, or can be re-added */}
                                </>
                            )
                        })()}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
