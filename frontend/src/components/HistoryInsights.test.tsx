import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LanguageProvider } from '../context/LanguageContext'
import { setRequestRange } from '../lib/api'
import { HistoryInsights } from './HistoryInsights'

vi.mock('../context/ProfileContext', () => ({ useProfile: () => ({ selectedProfile: '1' }) }))
vi.mock('../context/DateRangeContext', () => ({ useDateRange: () => ({ range: { dateFrom: '2026-09-01', dateTo: '2026-09-30' } }) }))
const summary = { plays: 1, minutes: 3, tracks: 1, artists: 1, albums: 1, podcastPlays: 0, podcastMinutes: 0, audiobookPlays: 0, audiobookMinutes: 0 }
let urls: string[] = []
beforeEach(() => {
    urls = []
    setRequestRange({ dateFrom: '2026-09-01', dateTo: '2026-09-30' })
    vi.spyOn(window, 'fetch').mockImplementation(async input => {
        const url = new URL(String(input), 'http://local')
        urls.push(url.pathname + url.search)
        const data = url.pathname.endsWith('library-range') ? { first: '2017-01-02T00:00:00Z', last: '2026-09-14T00:00:00Z', years: [2026, 2024, 2017] }
            : url.pathname.endsWith('/calendar') ? [{ date: `${url.searchParams.get('dateFrom')?.slice(0, 4)}-02-01`, plays: 7, minutes: 21 }]
            : { current: summary, previous: summary, currentRange: { dateFrom: '2026-09-01', dateTo: '2026-09-30' }, previousRange: { dateFrom: '2026-08-02', dateTo: '2026-08-31' }, calendar: [{ date: '2026-09-01', plays: 1, minutes: 3 }], discoveries: [] }
        return new Response(JSON.stringify({ success: true, data }))
    })
    Element.prototype.scrollIntoView = vi.fn()
})
afterEach(() => { vi.restoreAllMocks(); setRequestRange({ dateFrom: '', dateTo: '' }) })
const show = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><LanguageProvider><HistoryInsights /></LanguageProvider></QueryClientProvider>)
async function chooseYear(year: string) {
    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Rok kalendarza' }), { key: 'ArrowDown' })
    fireEvent.click(await screen.findByRole('option', { name: year }))
}
it('loads the latest full library year independently from a September comparison and offers all import years', async () => {
    show()
    const february = await screen.findByRole('button', { name: '2026-02-01: 7 odtworzeń, 21 minut' })
    expect(february).toBeEnabled()
    expect(screen.getByRole('button', { name: '2026-01-01: brak wpisów w eksporcie' })).toBeEnabled()
    expect(screen.getByText(/Okres A: 2026-09-01 – 2026-09-30/)).toBeInTheDocument()
    expect(urls.some(url => url.includes('library-range') && !url.includes('dateFrom'))).toBe(true)
    expect(urls).toContain('/api/analytics/calendar?profileId=1&dateFrom=2026-01-01&dateTo=2026-12-31')
    await chooseYear('2017')
    expect(await screen.findByRole('button', { name: '2017-02-01: 7 odtworzeń, 21 minut' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '2017-01-01: poza pokryciem importu' })).toBeEnabled()
    expect(urls).toContain('/api/analytics/calendar?profileId=1&dateFrom=2017-01-01&dateTo=2017-12-31')
    expect(screen.getByText(/Okres A: 2026-09-01 – 2026-09-30/)).toBeInTheDocument()
})
it('renders leap day and aligns month labels with their actual week columns', async () => {
    show()
    await screen.findByRole('combobox', { name: 'Rok kalendarza' })
    await chooseYear('2024')
    const group = await screen.findByRole('group', { name: /Aktywność w roku 2024/ })
    expect(within(group).getAllByRole('button')).toHaveLength(366)
    expect(within(group).getByRole('button', { name: '2024-02-29: brak wpisów w eksporcie' })).toBeEnabled()
    // 2024 starts on Monday; February 1 falls in week column 5.
    expect(screen.getByText('lut')).toHaveStyle({ gridColumn: '5 / span 4' })
    fireEvent.focus(within(group).getByRole('button', { name: '2024-02-29: brak wpisów w eksporcie' }))
    await waitFor(() => expect(screen.getByText('2024-02-29: brak wpisów w eksporcie')).toBeInTheDocument())
})
