import { expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LanguageProvider } from '../context/LanguageContext'
import Dashboard from './Dashboard'

vi.mock('../context/ProfileContext', () => ({ useProfile: () => ({ selectedProfile: '1' }) }))
vi.mock('@/components/DataImportGuide', () => ({ DataImportGuide: () => null }))
vi.mock('../hooks/useDashboardStats', () => ({
    useDashboardStats: () => ({
        stats: { totalPlays: 0, totalMinutes: 0, uniqueTracks: 0, uniqueArtists: 0, topCountry: '', avgSessionDuration: 177 },
        podcastStats: { totalPodcastPlays: 0, uniqueShows: 0 },
        topTracks: [], topArtists: [], topShows: [], topEpisodes: [],
    }),
}))

it('shows average playback seconds as minutes:seconds rather than session minutes', () => {
    render(<LanguageProvider><Dashboard /></LanguageProvider>)
    expect(screen.getByRole('heading', { name: 'Śr. długość' })).toBeInTheDocument()
    expect(screen.getByText('2:57')).toBeInTheDocument()
    expect(screen.getByText('min:sek na odtworzenie')).toBeInTheDocument()
    expect(screen.queryByText('177 min')).not.toBeInTheDocument()
})
