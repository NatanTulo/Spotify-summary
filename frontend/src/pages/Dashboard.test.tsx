import { expect, it, vi, beforeEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LanguageProvider } from '../context/LanguageContext'
import Dashboard from './Dashboard'
const state = vi.hoisted(() => ({
    statsAvailable: true,
    stats: { totalPlays: 40, totalMinutes: 90, uniqueTracks: 12, uniqueArtists: 5, topCountry: '', avgSessionDuration: 177 },
    podcastStats: { totalPodcastPlays: 0, totalPodcastMinutes: 0, uniqueShows: 0 },
    topTracks: [{ name: 'A favourite track', artist: 'Artist', plays: 4 }], topArtists: [],
    rankingsLoading: false, rankingsError: null as Error | null, retryRankings: vi.fn(),
    loading: false, error: null as Error | null, fetchDashboardData: vi.fn(),
}))
vi.mock('../components/HistoryInsights', () => ({ HistoryInsights: () => <p>Secondary insights</p> }))
vi.mock('../components/charts/ListeningTimelineChart', () => ({ ListeningTimelineChart: ({ onRangeChange }: { onRangeChange: (range: { dateFrom: string; dateTo: string } | null) => void }) => <><p>Listening timeline</p><button onClick={() => onRangeChange({ dateFrom: '2025-01-03', dateTo: '2025-02-04' })}>Zoom chart</button><button onClick={() => onRangeChange(null)}>Reset chart</button></> }))
vi.mock('../context/ProfileContext', () => ({ useProfile: () => ({ selectedProfile: '1' }) }))
const statsHook = vi.hoisted(() => vi.fn())
vi.mock('../hooks/useDashboardStats', () => ({ useDashboardStats: (...args: unknown[]) => { statsHook(...args); return state } }))
beforeEach(() => { cleanup(); localStorage.clear(); statsHook.mockClear(); state.rankingsLoading = false; state.rankingsError = null; state.retryRankings.mockClear(); state.loading = false; state.error = null; state.stats.totalPlays = 40; state.fetchDashboardData.mockClear() })
const show = () => render(<MemoryRouter><LanguageProvider><Dashboard /></LanguageProvider></MemoryRouter>)
it('prioritizes four music metrics and timeline, without the import guide or empty podcast cards', () => {
    show()
    expect(screen.getByRole('region', { name: 'Muzyka w wybranym okresie' }).querySelectorAll('h2')).toHaveLength(4)
    expect(screen.getByText('Listening timeline')).toBeInTheDocument()
    expect(screen.getByText('A favourite track')).toBeInTheDocument()
    expect(screen.getByText('Brak odtworzeń podcastów w wybranym okresie.')).toBeInTheDocument()
    expect(screen.queryByText('2:57')).not.toBeInTheDocument()
    expect(screen.queryByText('Dane i import')).not.toBeInTheDocument()
})
it('offers range/import guidance for a confirmed empty result', () => {
    state.stats.totalPlays = 0
    show()
    expect(screen.getByText('Brak aktywności w tym zakresie')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Dane i import' })).toHaveAttribute('href', '/data')
    expect(screen.getByText('Secondary insights')).toBeInTheDocument()
})
it('separates loading and failures from a confirmed empty library and supports retry', () => {
    state.stats.totalPlays = 0
    state.loading = true
    const view = show()
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByText('Brak aktywności w tym zakresie')).not.toBeInTheDocument()
    state.loading = false
    state.error = new Error('Offline')
    view.rerender(<MemoryRouter><LanguageProvider><Dashboard /></LanguageProvider></MemoryRouter>)
    expect(screen.getByRole('alert')).toHaveTextContent('Nie udało się pobrać części podsumowania.')
    expect(screen.queryByText('Brak aktywności w tym zakresie')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Spróbuj ponownie' }))
    expect(state.fetchDashboardData).toHaveBeenCalledOnce()
})

it('follows chart zoom by default, can opt out persistently, and restores full-period ranks on reset', () => {
    show()
    const toggle = screen.getByRole('checkbox', { name: 'Dopasuj rankingi do zakresu wykresu' })
    expect(toggle).toBeChecked()
    fireEvent.click(screen.getByRole('button', { name: 'Zoom chart' }))
    expect(statsHook).toHaveBeenLastCalledWith('1', { dateFrom: '2025-01-03', dateTo: '2025-02-04' })
    expect(screen.getByText('Zakres rankingu: 2025-01-03 – 2025-02-04 · UTC')).toBeVisible()
    fireEvent.click(toggle)
    expect(statsHook).toHaveBeenLastCalledWith('1', null)
    expect(localStorage.getItem('dashboard-follow-chart-range')).toBe('false')
    fireEvent.click(toggle)
    expect(statsHook).toHaveBeenLastCalledWith('1', { dateFrom: '2025-01-03', dateTo: '2025-02-04' })
    fireEvent.click(screen.getByRole('button', { name: 'Reset chart' }))
    expect(statsHook).toHaveBeenLastCalledWith('1', null)
})
it('restores the saved preference on a later visit', () => {
    localStorage.setItem('dashboard-follow-chart-range', 'false')
    show()
    expect(screen.getByRole('checkbox', { name: 'Dopasuj rankingi do zakresu wykresu' })).not.toBeChecked()
    fireEvent.click(screen.getByRole('button', { name: 'Zoom chart' }))
    expect(statsHook).toHaveBeenLastCalledWith('1', null)
})
it('keeps the chart and full-period headline visible while ranks load, and hides stale rank entries', () => {
    state.rankingsLoading = true
    const view = show()
    expect(screen.getByText('Listening timeline')).toBeVisible()
    expect(screen.getByText('40')).toBeVisible()
    expect(screen.getByRole('status')).toHaveTextContent('Wczytywanie rankingów')
    expect(screen.queryByText('A favourite track')).not.toBeInTheDocument()
    state.rankingsLoading = false
    state.rankingsError = new Error('offline')
    view.rerender(<MemoryRouter><LanguageProvider><Dashboard /></LanguageProvider></MemoryRouter>)
    expect(screen.getByRole('alert')).toHaveTextContent('Nie udało się pobrać rankingów')
    fireEvent.click(screen.getByRole('button', { name: 'Spróbuj ponownie' }))
    expect(state.retryRankings).toHaveBeenCalledOnce()
    expect(screen.queryByText('A favourite track')).not.toBeInTheDocument()
})
