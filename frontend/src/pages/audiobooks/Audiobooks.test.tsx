import { beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LanguageProvider } from '../../context/LanguageContext'
import Audiobooks from './Audiobooks'
const state = vi.hoisted(() => ({ profile: '1', urls: [] as string[] }))
vi.mock('../../context/ProfileContext', () => ({ useProfile: () => ({ selectedProfile: state.profile }) }))
vi.mock('../../lib/api', () => ({ useApiQuery: (url: string) => {
    state.urls.push(url)
    const page = Number(new URL(url, 'http://local').searchParams.get('page'))
    const isPlays = url.includes('/plays?')
    return { isPending: false, error: null, refetch: vi.fn(), data: { data: isPlays ? {
        plays: Array.from({ length: page === 1 ? 50 : 1 }, (_, index) => ({ id: (page - 1) * 50 + index + 1, timestamp: '2025-01-01T12:00:00Z', msPlayed: 60000, platform: `Record ${(page - 1) * 50 + index + 1}` })), pagination: { current: page, pages: 2, total: 51 },
    } : {
        audiobooks: Array.from({ length: page === 1 ? 20 : 1 }, (_, index) => ({ id: (page - 1) * 20 + index + 1, name: `Book ${(page - 1) * 20 + index + 1}` })), pagination: { current: page, pages: 2, total: 21 },
    } } }
} }))
beforeEach(() => { cleanup(); state.profile = '1'; state.urls = [] })
const app = () => <MemoryRouter><LanguageProvider><Audiobooks /></LanguageProvider></MemoryRouter>
it('reaches books beyond the first twenty and playback beyond the first fifty, resetting history on selection', () => {
    render(app())
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Strony audiobooków' })).getByRole('button', { name: 'Następna' }))
    fireEvent.click(screen.getByRole('button', { name: 'Book 21' }))
    expect(screen.getByText('Record 50')).toBeInTheDocument()
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Strony odtworzeń' })).getByRole('button', { name: 'Następna' }))
    expect(screen.getByText('Record 51')).toBeInTheDocument()
    expect(state.urls).toContain('/api/audiobooks/1/audiobook/21/plays?page=2&limit=50')
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Strony audiobooków' })).getByRole('button', { name: 'Poprzednia' }))
    fireEvent.click(screen.getByRole('button', { name: 'Book 1' }))
    expect(screen.getByText('Record 1')).toBeInTheDocument()
    expect(state.urls).toContain('/api/audiobooks/1/audiobook/1/plays?page=1&limit=50')
})
it('resets list page and selection when the active profile changes', () => {
    const view = render(app())
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Strony audiobooków' })).getByRole('button', { name: 'Następna' }))
    fireEvent.click(screen.getByRole('button', { name: 'Book 21' }))
    state.profile = '2'
    view.rerender(app())
    expect(screen.getByRole('button', { name: 'Book 1' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Book 21' })).not.toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Strony odtworzeń' })).not.toBeInTheDocument()
    expect(state.urls).toContain('/api/audiobooks/2?page=1&limit=20')
})
