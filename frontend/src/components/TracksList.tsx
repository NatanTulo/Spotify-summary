import { Fragment, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronDown, ExternalLink, Settings2 } from 'lucide-react'
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
    const [desktop, setDesktop] = useState(() => typeof window.matchMedia !== 'function' || window.matchMedia('(min-width: 768px)').matches)
    useEffect(() => {
        if (typeof window.matchMedia !== 'function') return
        const media = window.matchMedia('(min-width: 768px)')
        const update = () => setDesktop(media.matches)
        media.addEventListener('change', update)
        return () => media.removeEventListener('change', update)
    }, [])
    const [visibleColumns, setColumns] = useState<(keyof ExtendedTrack)[]>(() => {
        try { const value = JSON.parse(localStorage.getItem('music-columns') || 'null'); return Array.isArray(value) ? ['trackName', ...value.filter((key: keyof ExtendedTrack) => key !== 'trackName' && getAvailableColumns().some(c => c.key === key))] : defaultColumns } catch { return defaultColumns }
    })
    const [dense, setDense] = useState(() => localStorage.getItem('music-density') === 'dense')
    const [columnsOpen, setColumnsOpen] = useState(false)
    const listId = useId()
    const opener = useRef<HTMLElement | null>(null)
    useEffect(() => { localStorage.setItem('music-columns', JSON.stringify(visibleColumns)) }, [visibleColumns])
    useEffect(() => { localStorage.setItem('music-density', dense ? 'dense' : 'comfortable') }, [dense])
    const close = () => setParams(current => { const next = new URLSearchParams(current); next.delete('track'); return next }, { replace: true, preventScrollReset: true })
    useEffect(() => {
        if (!selected) return
        return () => { opener.current?.focus({ preventScroll: true }) }
    }, [selected])
    const toggle = (id: string, element: HTMLElement) => {
        if (selected === id) { close(); return }
        opener.current = element
        setParams(current => { const next = new URLSearchParams(current); next.set('track', id); return next }, { preventScrollReset: true })
    }
    const details = (id: string, suffix: string) => <div id={`${listId}-${suffix}-${id}`} role="region" aria-label={language === 'pl' ? 'Szczegóły utworu' : 'Track details'} className="min-w-0 space-y-3 bg-background/60 p-4 sm:p-6">
        <TrackDetails trackId={id} profileId={profileId} onBack={close} inline />
    </div>
    const controls = <>
        <Button variant="outline" aria-expanded={columnsOpen} onClick={() => setColumnsOpen(!columnsOpen)}><Settings2 className="mr-2 h-4 w-4" />{t('columns')}</Button>
        <Button className="hidden sm:inline-flex" variant="ghost" aria-pressed={dense} onClick={() => setDense(!dense)}>{language === 'pl' ? 'Gęstość' : 'Density'}</Button>
    </>
    const numeric = (key: string) => ['totalPlays','totalMinutes','avgPlayDuration','skipPercentage'].includes(key)
    return <section className="space-y-3" aria-label={t('tracks')} onKeyDown={event => { if (selected && event.key === 'Escape') { event.stopPropagation(); close() } }}>
        {toolbar ? toolbar(controls) : <div className="flex justify-end gap-2">{controls}</div>}
        {columnsOpen && <ColumnSelector visibleColumns={visibleColumns} onChangeVisibility={key => { if (key !== 'trackName') setColumns(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]) }} onReset={() => setColumns(defaultColumns)} />}
        <div className="overflow-hidden rounded-lg border border-border bg-card">
            {error ? <div role="alert" className="p-8 text-center"><p>{language === 'pl' ? 'Nie udało się pobrać utworów.' : 'Could not load tracks.'}</p><Button variant="outline" className="mt-3" onClick={onRetry}>{language === 'pl' ? 'Spróbuj ponownie' : 'Try again'}</Button></div> : loading ? <div role="status" className="p-10 text-center text-muted-foreground">{t('loading')}</div> : !tracks.length ? <div className="p-10 text-center text-muted-foreground">{t('noTracks')}</div> : <>
                <div className={`hidden min-h-48 overflow-auto md:block ${selected ? '' : 'max-h-[calc(100vh-390px)]'}`}>
                    <table className="w-full text-sm"><TracksTableHeaders visibleColumns={visibleColumns} currentSort={currentSort} onSort={onSort} /><tbody>
                        {tracks.map(track => <Fragment key={track.trackId}><tr tabIndex={0} aria-expanded={selected === track.trackId} aria-controls={selected === track.trackId ? `${listId}-desktop-${track.trackId}` : undefined} className={`cursor-pointer border-b border-border hover:bg-muted/50 ${selected === track.trackId ? 'bg-accent/50' : ''}`} onClick={event => {
                            if ((event.target as HTMLElement).closest('button,a,input,select')) return
                            event.currentTarget.focus({ preventScroll: true }); toggle(track.trackId, event.currentTarget)
                        }} onKeyDown={event => {
                            if (event.target !== event.currentTarget || !['Enter', ' '].includes(event.key)) return
                            event.preventDefault(); toggle(track.trackId, event.currentTarget)
                        }}>
                            {visibleColumns.map(key => <td key={key} className={`${dense ? 'px-4 py-0.5' : 'px-4 py-1.5'} ${numeric(key) ? 'text-right tabular-nums whitespace-nowrap' : ''}`}>
                                {key === 'trackName' ? <div className="flex min-w-48 items-center gap-3"><ChevronDown aria-hidden="true" className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${selected === track.trackId ? 'rotate-180' : ''}`} /><div className="min-w-0 flex-1"><button tabIndex={-1} aria-expanded={selected === track.trackId} aria-controls={selected === track.trackId ? `${listId}-desktop-${track.trackId}` : undefined} className="block max-w-[35vw] truncate text-left font-semibold hover:underline" onClick={event => toggle(track.trackId, event.currentTarget)}>{track.trackName}</button><p className="truncate text-xs text-muted-foreground">{track.artistName}</p></div>{spotifyUrl(track.uri) && <a href={spotifyUrl(track.uri)} target="_blank" rel="noreferrer" title={language === 'pl' ? 'Otwórz w Spotify' : 'Open in Spotify'} className="rounded p-2 text-muted-foreground hover:text-primary"><ExternalLink className="h-3.5 w-3.5" /><span className="sr-only">{language === 'pl' ? 'Otwórz w Spotify' : 'Open in Spotify'}</span></a>}</div> : <span className={key === 'albumName' ? 'line-clamp-1 max-w-80 text-muted-foreground' : ''}>{formatCellValue(track,key)}</span>}
                            </td>)}
                        </tr>{desktop && selected === track.trackId && <tr><td colSpan={visibleColumns.length} className="p-0">{details(track.trackId, 'desktop')}</td></tr>}</Fragment>)}
                    </tbody></table>
                </div>
                <ul className="divide-y divide-border md:hidden">{tracks.map(track => <li key={track.trackId}><button aria-expanded={selected === track.trackId} aria-controls={selected === track.trackId ? `${listId}-mobile-${track.trackId}` : undefined} className={`flex w-full items-center gap-3 p-4 text-left ${selected === track.trackId ? 'bg-accent/50' : 'hover:bg-muted/50'}`} onClick={event => toggle(track.trackId, event.currentTarget)}><ChevronDown aria-hidden="true" className={`h-4 w-4 shrink-0 text-muted-foreground ${selected === track.trackId ? 'rotate-180' : ''}`} /><span className="min-w-0 flex-1"><span className="block truncate font-medium">{track.trackName}</span><span className="block truncate text-sm text-muted-foreground">{track.artistName}</span><span className="block truncate text-xs text-muted-foreground">{track.albumName}</span></span><span className="shrink-0 text-right text-sm tabular-nums"><span className="block">{track.totalPlays.toLocaleString()} {t('plays')}</span><span className="block text-xs text-muted-foreground">{Math.round(track.totalMinutes).toLocaleString()} min</span></span></button>{!desktop && selected === track.trackId && details(track.trackId, 'mobile')}</li>)}</ul>
            </>}
            {pagination && <div className="border-t border-border px-4 pb-3"><PaginationControls pagination={pagination} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} /></div>}
        </div>
    </section>
}
