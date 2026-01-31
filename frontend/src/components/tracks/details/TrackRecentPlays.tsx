import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '../../../context/LanguageContext'
import { Play } from '../../../hooks/useTrackDetails'

interface TrackRecentPlaysProps {
    plays: Play[]
    loading: boolean
    pagination: {
        page: number
        limit: number
        total: number
        pages: number
    }
    onPageChange: (page: number) => void
}

export function TrackRecentPlays({ plays, loading, pagination, onPageChange }: TrackRecentPlaysProps) {
    const { t, formatDate: localizedFormatDate } = useLanguage()

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('playHistory')}</CardTitle>
                <CardDescription>{t('playHistoryDesc')}</CardDescription>
            </CardHeader>

            <CardContent>
                {loading ? (
                    <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-sm text-muted-foreground">{t('loadingHistory')}</p>
                    </div>
                ) : plays.length > 0 ? (
                    <>
                        <div className="space-y-2">
                            {plays.map((play) => (
                                <div key={play.id} className="border rounded-lg p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <div className="font-medium">
                                                    {play.playedAt ? localizedFormatDate(play.playedAt, true) : t('notAvailable')}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {play.durationMinutes} min • {play.platform} • {play.country}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {play.shuffle && <span className="text-blue-500">🔀 {t('shuffleLabel') || 'Shuffle'}</span>}
                                            {play.offline && <span className="text-blue-500">📱 {t('offlineLabel') || 'Offline'}</span>}
                                            {play.incognitoMode && <span className="text-purple-500">🕵️ {t('incognitoLabel') || 'Incognito'}</span>}
                                            {play.skipped && <span className="text-orange-500">⏭ {t('skipped') || 'Skipped'}</span>}
                                        </div>
                                    </div>

                                    {(play.reasonStart || play.reasonEnd) && (
                                        <div className="text-xs text-muted-foreground border-t pt-2">
                                            {play.reasonStart && (
                                                <div>{t('startReason')} {play.reasonStart}</div>
                                            )}
                                            {play.reasonEnd && (
                                                <div>{t('endReason')} {play.reasonEnd}</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {pagination.pages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-4">
                                <button
                                    onClick={() => onPageChange(pagination.page - 1)}
                                    disabled={pagination.page <= 1}
                                    className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                                >
                                    {t('previous')}
                                </button>
                                <span className="text-sm">
                                    {t('pageLabel')} {pagination.page} {t('fromLabel')} {pagination.pages}
                                </span>
                                <button
                                    onClick={() => onPageChange(pagination.page + 1)}
                                    disabled={pagination.page >= pagination.pages}
                                    className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                                >
                                    {t('next')}
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center text-muted-foreground py-8">
                        {t('noPlaysFound')}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
