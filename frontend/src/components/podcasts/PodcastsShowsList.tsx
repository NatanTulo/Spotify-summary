import React, { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Clock, Filter, SortAsc, SortDesc } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card'
import { Button } from '../ui/button'
import { useProfile } from '../../context/ProfileContext'
import { useLanguage } from '../../context/LanguageContext'
import EpisodeDetails from './EpisodeDetails'

type SortKey = 'name' | 'plays' | 'time' | 'lastPlayed'
type SortOrder = 'asc' | 'desc'

// Domyślne kierunki (pierwsze kliknięcie) – wymaganie: zawsze malejąco
const DEFAULT_ORDER: Record<SortKey, SortOrder> = {
  plays: 'desc',
  time: 'desc',
  lastPlayed: 'desc',
  name: 'desc'
}

interface ShowRow {
  id: number
  name: string
  playCount: number
  totalTime: number
  lastPlayed?: string | null
}

interface EpisodeRow {
  id: number
  name: string
  playCount: number
  totalTime: number
  lastPlayed?: string | null
  spotifyUri?: string | null
}

interface ApiResponse<T> { success: boolean; data: T }

export const PodcastsShowsList: React.FC = () => {
  const { selectedProfile } = useProfile()
  const { t } = useLanguage()

  const [shows, setShows] = useState<ShowRow[]>([])
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [episodesByShow, setEpisodesByShow] = useState<Record<number, EpisodeRow[]>>({})
  const [episodesSort, setEpisodesSort] = useState<Record<number, { sortBy: SortKey; order: SortOrder }>>({})
  const [selectedEpisode, setSelectedEpisode] = useState<{ id: number; name: string; showName: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('plays')
  const [order, setOrder] = useState<SortOrder>('desc')
  const [limit, setLimit] = useState(50)
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchShows()
  }, [selectedProfile, sortBy, order, offset])

  const fetchShows = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
        sortBy,
        order,
        profileId: selectedProfile || 'all',
      })
      if (search) params.append('search', search)
      const res = await fetch(`/api/podcasts/shows?${params.toString()}`)
      const json: ApiResponse<{ shows: ShowRow[]; total: number; limit: number; offset: number }> = await res.json()
      if (json.success) {
        setShows(json.data.shows)
        setTotal(json.data.total || 0)
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchEpisodes = async (showId: number) => {
    const es = episodesSort[showId] || { sortBy: 'plays' as SortKey, order: 'desc' as SortOrder }
    const params = new URLSearchParams({
      limit: '500',
      sortBy: es.sortBy,
      order: es.order,
      profileId: selectedProfile || 'all',
    })
    const res = await fetch(`/api/podcasts/shows/${showId}/episodes?${params.toString()}`)
    const json: ApiResponse<{ episodes: EpisodeRow[] }> = await res.json()
    if (json.success) {
      setEpisodesByShow(prev => ({ ...prev, [showId]: json.data.episodes }))
      // Jeżeli pierwszy raz ładujemy epizody i nie ma jeszcze ustawionego sortowania dla tego show
      // zainicjalizuj je, aby pierwsze kliknięcie kolumny "plays" spowodowało realną zmianę (toggle na asc)
      setEpisodesSort(prev => {
        if (prev[showId]) return prev
        return { ...prev, [showId]: { sortBy: 'plays', order: 'desc' } }
      })
    }
  }

  const toggleExpand = async (showId: number) => {
    const isOpen = !!expanded[String(showId)]
    setExpanded(prev => ({ ...prev, [String(showId)]: !isOpen }))
    if (isOpen) return
    if (!episodesByShow[showId]) {
      await fetchEpisodes(showId)
    }
  }

  const sortEpisodes = async (showId: number, column: 'plays' | 'time' | 'lastPlayed') => {
    setEpisodesByShow(prev => ({ ...prev, [showId]: [] })) // pokaż loader
    setEpisodesSort(prev => {
      const current = prev[showId]
      let next: { sortBy: SortKey; order: SortOrder }
      if (!current) {
  // Pierwsze kliknięcie w kolumnę – ustaw domyślny kierunek (desc)
  next = { sortBy: column, order: DEFAULT_ORDER[column] }
      } else if (current.sortBy === column) {
        // Kolejne kliknięcie tej samej kolumny – przełącz kierunek
        next = { sortBy: column, order: current.order === 'asc' ? 'desc' : 'asc' }
      } else {
  // Zmiana na inną kolumnę – ustaw jej domyślny kierunek (desc)
  next = { sortBy: column, order: DEFAULT_ORDER[column] }
      }
      return { ...prev, [showId]: next }
    })
    // Bezpośredni refetch – stan episodesSort zostanie uwzględniony przy następnym renderze;
    // przekazujemy parametry jawnie aby nie czekać na re-render.
    const next = episodesSort[showId] ? (() => {
      const current = episodesSort[showId]
      if (current.sortBy === column) {
        return { sortBy: column, order: current.order === 'asc' ? 'desc' : 'asc' as SortOrder }
      }
      return { sortBy: column as SortKey, order: DEFAULT_ORDER[column] }
    })() : { sortBy: column as SortKey, order: DEFAULT_ORDER[column] }
    await fetchEpisodesWithParams(showId, next.sortBy, next.order)
  }

  const fetchEpisodesWithParams = async (showId: number, s: SortKey, o: SortOrder) => {
    const params = new URLSearchParams({ 
      limit: '500', 
      sortBy: s, 
      order: o,
      profileId: selectedProfile || 'all',
    })
    const res = await fetch(`/api/podcasts/shows/${showId}/episodes?${params.toString()}`)
    const json: ApiResponse<{ episodes: EpisodeRow[] }> = await res.json()
    if (json.success) {
      setEpisodesByShow(prev => ({ ...prev, [showId]: json.data.episodes }))
    }
  }

  const formatMs = (ms: number) => {
    const m = Math.floor((ms || 0) / 60000)
    const h = Math.floor(m / 60)
    return h > 0 ? `${h}h ${m % 60}m` : `${m}m`
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return shows
    const q = search.toLowerCase()
    return shows.filter(s => s.name.toLowerCase().includes(q))
  }, [shows, search])

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const currentPage = Math.floor(offset / limit) + 1
  const canPrev = offset > 0
  const canNext = offset + limit < total

  // Show episode details if selected
  if (selectedEpisode && selectedProfile) {
    return (
      <EpisodeDetails
        episodeId={selectedEpisode.id}
        episodeName={selectedEpisode.name}
        showName={selectedEpisode.showName}
        profileId={selectedProfile}
        onBack={() => setSelectedEpisode(null)}
      />
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <CardTitle>{t('shows') || t('showsAndEpisodes') || 'Shows'}</CardTitle>
            <CardDescription>{t('clickToExpand') || 'Click a show to see played episodes'}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
      <div className="relative">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { setOffset(0); fetchShows() } }}
                placeholder={t('search') || 'Search shows'}
        className="border border-border bg-background text-foreground placeholder:text-muted-foreground rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <Button onClick={() => { setOffset(0); fetchShows() }} variant="secondary" className="px-3 py-1 text-xs text-foreground" title={t('filter') || 'Filter'}>
              <Filter className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => setOrder(o => (o === 'asc' ? 'desc' : 'asc'))}
              variant="secondary"
              className="px-3 py-1 text-xs text-foreground"
              title={t('toggleSortOrder') || 'Toggle sort order'}
            >
              {order === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </Button>
            <select
              value={sortBy}
              onChange={(e) => { const val = e.target.value as SortKey; setSortBy(val); setOrder(DEFAULT_ORDER[val]); setOffset(0) }}
              className="border border-border bg-background text-foreground rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              title={t('sortBy') || 'Sort by'}
            >
              <option value="plays">{t('totalPlays') || 'Plays'}</option>
              <option value="time">{t('totalMinutes') || 'Time'}</option>
              <option value="lastPlayed">{t('lastPlayed') || 'Last played'}</option>
              <option value="name">{t('name') || 'Name'}</option>
            </select>
            <select
              value={String(limit)}
              onChange={(e) => { setLimit(parseInt(e.target.value, 10)); setOffset(0) }}
              className="border border-border bg-background text-foreground rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              title={t('pageSize') || 'Page size'}
            >
              {[25, 50, 100].map(sz => (
                <option key={sz} value={sz}>{sz}/{t('page') || 'Page'}</option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center text-muted-foreground py-8">{t('loading') || 'Loading...'}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">{t('noData') || 'No data'}</div>
        ) : (
          <div className="divide-y">
            {filtered.map(show => (
              <div key={show.id} className="py-3">
                <button
                  onClick={() => toggleExpand(show.id)}
                  className="w-full flex items-center justify-between hover:bg-muted/50 rounded px-2 py-1"
                >
                  <div className="flex items-center gap-2">
                    {expanded[String(show.id)] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <span className="font-medium">{show.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{show.playCount.toLocaleString()} {t('plays') || 'plays'}</span>
                    <span>{formatMs(show.totalTime)}</span>
                    {show.lastPlayed && (
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(show.lastPlayed).toLocaleDateString()}</span>
                    )}
                  </div>
                </button>

                {expanded[String(show.id)] && (
                  <div className="mt-2 ml-6 border-l pl-4">
                    {!episodesByShow[show.id] ? (
                      <div className="text-sm text-muted-foreground py-2">{t('loading') || 'Loading...'}</div>
                    ) : episodesByShow[show.id].length === 0 ? (
                      <div className="text-sm text-muted-foreground py-2">{t('noEpisodes') || 'No played episodes'}</div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-muted-foreground select-none">
                            <th className="text-left py-1 pr-2 font-medium">{t('episode') || 'Episode'}</th>
                            {(['plays','time','lastPlayed'] as const).map(col => {
                              const es = episodesSort[show.id]
                              const active = es?.sortBy === (col === 'plays' ? 'plays' : col === 'time' ? 'time' : 'lastPlayed')
                              const label = col === 'plays' ? (t('totalPlays') || 'Plays') : col === 'time' ? (t('totalMinutes') || 'Time') : (t('lastPlayed') || 'Last played')
                              return (
                                <th
                                  key={col}
                                  onClick={() => sortEpisodes(show.id, col)}
                                  className="text-right py-1 pr-2 cursor-pointer hover:text-foreground transition-colors group"
                                  title={t('toggleSortOrder') || 'Toggle sort order'}
                                >
                                  <span className={active ? 'text-foreground font-semibold inline-flex items-center gap-1' : 'inline-flex items-center gap-1'}>
                                    {label}
                                    {active && (
                                      <span className="text-xs opacity-70">{(es!.order === 'asc') ? '▲' : '▼'}</span>
                                    )}
                                  </span>
                                </th>
                              )
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {episodesByShow[show.id].map(ep => (
                            <tr key={ep.id} className="border-t">
                              <td className="py-1 pr-2">
                                <button 
                                  onClick={() => setSelectedEpisode({ id: ep.id, name: ep.name, showName: show.name })}
                                  className="text-left hover:underline text-blue-600 dark:text-blue-400"
                                >
                                  {ep.name}
                                </button>
                              </td>
                              <td className="text-right py-1 pr-2">{ep.playCount.toLocaleString()}</td>
                              <td className="text-right py-1 pr-2">{formatMs(ep.totalTime)}</td>
                              <td className="text-right py-1">{ep.lastPlayed ? new Date(ep.lastPlayed).toLocaleDateString() : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div className="flex items-center justify-between pt-3">
              <div className="text-sm text-foreground">
                {t('page') || 'Page'} {currentPage} / {totalPages} • {t('total') || 'Total'} {total}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="text-foreground" disabled={!canPrev} onClick={() => setOffset(Math.max(0, offset - limit))}>
                  {t('prev') || 'Prev'}
                </Button>
                <Button variant="outline" className="text-foreground" disabled={!canNext} onClick={() => setOffset(offset + limit)}>
                  {t('next') || 'Next'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default PodcastsShowsList
