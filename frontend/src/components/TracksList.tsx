import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ExternalLink, Settings2, X } from 'lucide-react'
import { Button } from './ui/button'
import { useLanguage } from '../context/LanguageContext'
import { TrackDetails } from './TrackDetails'
import { ExtendedTrack, PaginationState } from './tracks/types'
import { TracksTableHeaders } from './tracks/TracksTableHeaders'
import { PaginationControls } from './tracks/PaginationControls'
import { ColumnSelector } from './tracks/ColumnSelector'
import { useTrackColumns } from './tracks/columns'
const spotifyUrl = (uri?: string) => uri && /^(spotify:track:[A-Za-z0-9]+|https:\/\/open\.spotify\.com\/track\/[A-Za-z0-9]+(?:\?[^\s]*)?)$/.test(uri) ? uri : undefined
const defaultColumns: (keyof ExtendedTrack)[] = ['trackName', 'albumName', 'totalPlays', 'totalMinutes', 'lastPlay']
interface TracksListProps {
    tracks: ExtendedTrack[]; loading?: boolean; error?: Error | null; onRetry?: () => void; profileId?: string
    pagination?: PaginationState; onPageChange?: (page: number) => void; onPageSizeChange?: (size: number) => void
    onSort?: (field: string, order: 'asc' | 'desc') => void; currentSort?: { field: string; order: 'asc' | 'desc' }
    toolbar?: (controls: ReactNode) => ReactNode
}
export function TracksList({ tracks, loading, error, onRetry, profileId, pagination, onPageChange, onPageSizeChange, onSort, currentSort, toolbar }: TracksListProps) {
    const { t, language } = useLanguage()
    const { formatCellValue, getAvailableColumns } = useTrackColumns()
    const [params, setParams] = useSearchParams()
    const selected = params.get('track')
    const [visibleColumns, setColumns] = useState<(keyof ExtendedTrack)[]>(() => {
        try { const value = JSON.parse(localStorage.getItem('music-columns') || 'null'); return Array.isArray(value) ? ['trackName', ...value.filter((key: keyof ExtendedTrack) => key !== 'trackName' && getAvailableColumns().some(c => c.key === key))] : defaultColumns } catch { return defaultColumns }
    })
    const [dense, setDense] = useState(() => localStorage.getItem('music-density') === 'dense')
    const [columnsOpen, setColumnsOpen] = useState(false)
    const panel = useRef<HTMLDivElement>(null)
    const opener = useRef<HTMLElement | null>(null)
    useEffect(() => { localStorage.setItem('music-columns', JSON.stringify(visibleColumns)) }, [visibleColumns])
    useEffect(() => { localStorage.setItem('music-density', dense ? 'dense' : 'comfortable') }, [dense])
    const close = () => setParams(current => { const next = new URLSearchParams(current); next.delete('track'); return next }, { replace: true, preventScrollReset: true })
    useEffect(() => {
        if (!selected) return
        opener.current = document.activeElement as HTMLElement
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        panel.current?.focus()
        return () => { document.body.style.overflow = previousOverflow; opener.current?.focus({ preventScroll: true }) }
    }, [selected])
    const open = (id: string) => setParams(current => { const next = new URLSearchParams(current); next.set('track', id); return next }, { preventScrollReset: true })
    const controls = <>
        <Button variant="outline" aria-expanded={columnsOpen} onClick={() => setColumnsOpen(!columnsOpen)}><Settings2 className="mr-2 h-4 w-4" />{t('columns')}</Button>
        <Button className="hidden sm:inline-flex" variant="ghost" aria-pressed={dense} onClick={() => setDense(!dense)}>{language === 'pl' ? 'Gęstość' : 'Density'}</Button>
    </>
    const numeric = (key: string) => ['totalPlays','totalMinutes','avgPlayDuration','skipPercentage'].includes(key)
    return <section className="space-y-3" aria-label={t('tracks')}>
        {toolbar ? toolbar(controls) : <div className="flex justify-end gap-2">{controls}</div>}
        {columnsOpen && <ColumnSelector visibleColumns={visibleColumns} onChangeVisibility={key => { if (key !== 'trackName') setColumns(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]) }} onReset={() => setColumns(defaultColumns)} />}
        <div className="overflow-hidden rounded-lg border border-border bg-card">
            {error ? <div role="alert" className="p-8 text-center"><p>{language === 'pl' ? 'Nie udało się pobrać utworów.' : 'Could not load tracks.'}</p><Button variant="outline" className="mt-3" onClick={onRetry}>{language === 'pl' ? 'Spróbuj ponownie' : 'Try again'}</Button></div> : loading ? <div role="status" className="p-10 text-center text-muted-foreground">{t('loading')}</div> : !tracks.length ? <div className="p-10 text-center text-muted-foreground">{t('noTracks')}</div> : <>
                <div className="hidden max-h-[calc(100vh-390px)] min-h-48 overflow-auto md:block">
                    <table className="w-full text-sm"><TracksTableHeaders visibleColumns={visibleColumns} currentSort={currentSort} onSort={onSort} /><tbody>
                        {tracks.map(track => <tr key={track.trackId} className="border-b border-border last:border-0 hover:bg-muted/50">
                            {visibleColumns.map(key => <td key={key} className={`${dense ? 'px-4 py-0.5' : 'px-4 py-1.5'} ${numeric(key) ? 'text-right tabular-nums whitespace-nowrap' : ''}`}>
                                {key === 'trackName' ? <div className="flex min-w-48 items-center gap-3"><div className="min-w-0 flex-1"><button className="block max-w-[35vw] truncate text-left font-semibold hover:underline" onClick={() => open(track.trackId)}>{track.trackName}</button><p className="truncate text-xs text-muted-foreground">{track.artistName}</p></div>{spotifyUrl(track.uri) && <a href={spotifyUrl(track.uri)} target="_blank" rel="noreferrer" title={language === 'pl' ? 'Otwórz w Spotify' : 'Open in Spotify'} className="rounded p-2 text-muted-foreground hover:text-primary"><ExternalLink className="h-3.5 w-3.5" /><span className="sr-only">{language === 'pl' ? 'Otwórz w Spotify' : 'Open in Spotify'}</span></a>}</div> : <span className={key === 'albumName' ? 'line-clamp-1 max-w-80 text-muted-foreground' : ''}>{formatCellValue(track,key)}</span>}
                            </td>)}
                        </tr>)}
                    </tbody></table>
                </div>
                <ul className="divide-y divide-border md:hidden">{tracks.map(track => <li key={track.trackId} className="flex items-center gap-3 p-4"><button className="min-w-0 flex-1 text-left" onClick={() => open(track.trackId)}><span className="block truncate font-medium">{track.trackName}</span><span className="block truncate text-sm text-muted-foreground">{track.artistName}</span><span className="block truncate text-xs text-muted-foreground">{track.albumName}</span></button><div className="text-right text-sm tabular-nums"><p>{track.totalPlays.toLocaleString()} {t('plays')}</p><p className="text-xs text-muted-foreground">{Math.round(track.totalMinutes).toLocaleString()} min</p></div></li>)}</ul>
            </>}
            {pagination && <div className="border-t border-border px-4 pb-3"><PaginationControls pagination={pagination} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} /></div>}
        </div>
        {selected && <div className="fixed inset-0 z-50 flex justify-end bg-background/60" onMouseDown={event => { if (event.target === event.currentTarget) close() }}>
            <div ref={panel} role="dialog" aria-modal="true" aria-label={language === 'pl' ? 'Szczegóły utworu' : 'Track details'} tabIndex={-1} className="h-full w-full overflow-y-auto border-l border-border bg-background p-4 shadow-xl sm:w-[460px] sm:p-5" onKeyDown={event => {
                if (event.key === 'Escape') { event.stopPropagation(); close() }
                if (event.key === 'Tab') { const nodes = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input,select,[tabindex="0"]') || []); const first = nodes[0]; const last = nodes[nodes.length-1]; if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last?.focus() } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel.current)) { event.preventDefault(); first?.focus() } }
            }}><div className="mb-4 flex items-center justify-between"><span className="text-sm text-muted-foreground">{language === 'pl' ? 'Szczegóły utworu' : 'Track details'}</span><Button variant="ghost" size="icon" onClick={close} aria-label={t('close')}><X className="h-4 w-4" /></Button></div><TrackDetails trackId={selected} profileId={profileId} onBack={close} /></div>
        </div>}
    </section>
}
