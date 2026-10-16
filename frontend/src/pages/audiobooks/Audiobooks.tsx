import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApiQuery } from '../../lib/api'
import { useLanguage } from '../../context/LanguageContext'
import { useProfile } from '../../context/ProfileContext'
import { Button } from '../../components/ui/button'

interface Audiobook { id: number; name: string; author?: string; spotifyUri?: string }
interface AudiobookPlay { id: number; timestamp: string; msPlayed: number; platform?: string; skipped?: boolean; offline?: boolean }
interface Pagination { current: number; pages: number; total: number }
const Audiobooks = () => {
    const { selectedProfile } = useProfile()
    const profile = selectedProfile || 'all'
    return <AudiobookLibrary key={profile} profile={profile} />
}
const AudiobookLibrary = ({ profile }: { profile: string }) => {
    const { t, language } = useLanguage()
    const pl = language === 'pl'
    const [bookPage, setBookPage] = useState(1)
    const [playPage, setPlayPage] = useState(1)
    const [selection, setSelection] = useState<{ profile: string; book: Audiobook } | null>(null)
    const selected = selection?.profile === profile ? selection.book : null
    const library = useApiQuery<{ audiobooks: Audiobook[]; pagination: Pagination }>(`/api/audiobooks/${profile}?page=${bookPage}&limit=20`)
    const history = useApiQuery<{ plays: AudiobookPlay[]; pagination: Pagination }>(`/api/audiobooks/${profile}/audiobook/${selected?.id}/plays?page=${playPage}&limit=50`, !!selected)
    const books = library.data?.data.audiobooks || []
    const plays = history.data?.data.plays || []
    const duration = (ms: number) => `${Math.floor(ms / 60000)}:${Math.floor(ms % 60000 / 1000).toString().padStart(2, '0')}`
    const retry = (action: () => unknown) => <Button variant="outline" onClick={() => void action()}>{pl ? 'Spróbuj ponownie' : 'Try again'}</Button>
    const pager = (pagination: Pagination | undefined, page: number, setPage: (value: number) => void, label: string) => pagination && pagination.pages > 1 ? <nav aria-label={label} className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs"><span className="tabular-nums">{pl ? 'Strona' : 'Page'} {page} / {pagination.pages} · {pagination.total} {pl ? 'łącznie' : 'total'}</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>{pl ? 'Poprzednia' : 'Previous'}</Button><Button variant="outline" size="sm" disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}>{pl ? 'Następna' : 'Next'}</Button></div></nav> : null
    return <div className="space-y-5">
        <header><h1 className="text-3xl font-bold tracking-tight">{t('audiobooks')}</h1><p className="mt-1 text-sm text-muted-foreground">{pl ? 'Audiobooki zapisane w Twojej historii słuchania w wybranym okresie.' : 'Audiobooks recorded in your listening history in the selected period.'}</p></header>
        {library.isPending ? <p role="status" className="py-12 text-sm text-muted-foreground">{t('loading')}</p> : library.error ? <div role="alert" className="space-y-3 rounded-xl border border-destructive/40 bg-card p-6"><p>{pl ? 'Nie udało się pobrać audiobooków.' : 'Audiobooks could not be loaded.'}</p>{retry(library.refetch)}</div> : !books.length ? <section className="rounded-xl border bg-card p-6"><h2 className="text-lg font-semibold">{pl ? 'Brak audiobooków w tym okresie' : 'No audiobooks in this period'}</h2><p className="mt-2 text-sm text-muted-foreground">{pl ? 'Wybierz inny zakres lub sprawdź, czy import zawiera historię audiobooków.' : 'Select another range or check whether your import contains audiobook history.'}</p><Link to="/data" className="mt-4 inline-flex min-h-10 items-center text-sm font-medium text-primary hover:underline">{pl ? 'Dane i import' : 'Data and import'}</Link></section> : <div className="grid items-start gap-5 lg:grid-cols-[minmax(240px,1fr)_minmax(0,2fr)]">
            <section className="rounded-xl border bg-card p-4"><h2 className="mb-3 text-lg font-semibold">{t('audiobooksList')}</h2><ul className="divide-y">{books.map(book => <li key={book.id}><button type="button" aria-pressed={selected?.id === book.id} onClick={() => { setSelection({ profile, book }); setPlayPage(1) }} className={`w-full rounded-md p-3 text-left ${selected?.id === book.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}><span className="block break-words text-sm font-medium">{book.name}</span>{book.author && <span className="mt-1 block text-xs text-muted-foreground">{book.author}</span>}</button></li>)}</ul>{pager(library.data?.data.pagination, bookPage, setBookPage, pl ? 'Strony audiobooków' : 'Audiobook pages')}</section>
            <section className="min-w-0 rounded-xl border bg-card p-4 sm:p-5" aria-live="polite">{!selected ? <p className="py-16 text-center text-sm text-muted-foreground">{t('selectAudiobook')}</p> : <><h2 className="break-words text-xl font-semibold">{selected.name}</h2>{selected.author && <p className="mt-1 text-sm text-muted-foreground">{selected.author}</p>}<p className="my-4 text-xs text-muted-foreground">{pl ? 'Historia odtworzeń w wybranym okresie · UTC' : 'Playback history in the selected period · UTC'}</p>
                {history.isPending ? <p role="status" className="py-8 text-sm text-muted-foreground">{t('loading')}</p> : history.error ? <div role="alert" className="space-y-3 py-8"><p>{pl ? 'Nie udało się pobrać odtworzeń.' : 'Playback history could not be loaded.'}</p>{retry(history.refetch)}</div> : !plays.length ? <p className="py-8 text-sm text-muted-foreground">{t('noPlaysFound')}</p> : <ul className="divide-y">{plays.map(play => <li key={play.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><div><p className="tabular-nums">{new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(play.timestamp))}</p>{play.platform && <p className="mt-1 text-xs text-muted-foreground">{play.platform}</p>}</div><span className="tabular-nums">{duration(play.msPlayed)}</span></li>)}</ul>}
                {!history.isPending && !history.error && pager(history.data?.data.pagination, playPage, setPlayPage, pl ? 'Strony odtworzeń' : 'Playback pages')}
            </>}</section>
        </div>}
    </div>
}
export default Audiobooks
