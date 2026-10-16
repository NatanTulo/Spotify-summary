import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import { LanguageProvider } from '../../context/LanguageContext'
import { TracksList } from '../TracksList'
vi.mock('../TrackDetails', () => ({ TrackDetails: () => <p>Details loaded</p> }))
function Location() { const location = useLocation(); const navigate = useNavigate(); return <><output data-testid="url">{location.search}</output><button onClick={() => navigate(-1)}>Browser back</button></> }
it('expands details below the entire clicked row, restores focus on Escape, and supports browser back', async () => {
    render(<MemoryRouter initialEntries={['/music?musicPage=3&dateFrom=2024-01-01']}><LanguageProvider><Location /><TracksList tracks={[{ trackId: '42', trackName: 'Long track title', artistName: 'Artist', albumName: 'Album', totalPlays: 7, totalMinutes: 10, avgPlayDuration: 80, skipPercentage: 0 }]} /></LanguageProvider></MemoryRouter>)
    const opener = screen.getAllByRole('row').find(row => row.textContent?.includes('Long track title'))!
    opener.focus()
    fireEvent.click(opener.querySelectorAll('td')[1])
    expect(screen.getByTestId('url')).toHaveTextContent('track=42')
    const details = screen.getByRole('region', { name: 'Szczegóły utworu' })
    expect(details.closest('td')).toHaveAttribute('colspan', '5')
    expect(opener.nextElementSibling).toContainElement(details)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveAttribute('aria-expanded', 'true')
    fireEvent.keyDown(opener, { key: 'Escape' })
    expect(screen.queryByRole('region', { name: 'Szczegóły utworu' })).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
    expect(screen.getByTestId('url')).toHaveTextContent('musicPage=3')
    expect(screen.getByTestId('url')).toHaveTextContent('dateFrom=2024-01-01')
    fireEvent.click(opener)
    fireEvent.click(screen.getByRole('button', { name: 'Browser back' }))
    await waitFor(() => expect(screen.queryByRole('region', { name: 'Szczegóły utworu' })).not.toBeInTheDocument())
})

it('toggles a row with keyboard or a second click and does not expand from the Spotify link', () => {
    render(<MemoryRouter><LanguageProvider><TracksList tracks={[{ trackId: '7', trackName: 'Song', artistName: 'Artist', albumName: 'Album', totalPlays: 7, totalMinutes: 10, avgPlayDuration: 80, skipPercentage: 0, uri: 'spotify:track:abc123' }]} /></LanguageProvider></MemoryRouter>)
    const row = screen.getAllByRole('row').find(item => item.textContent?.includes('Song'))!
    fireEvent.click(screen.getByRole('link', { name: 'Otwórz w Spotify' }))
    expect(row).toHaveAttribute('aria-expanded', 'false')
    fireEvent.keyDown(row, { key: 'Enter' })
    expect(row).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(row.querySelectorAll('td')[2])
    expect(row).toHaveAttribute('aria-expanded', 'false')
    fireEvent.keyDown(row, { key: ' ' })
    expect(row).toHaveAttribute('aria-expanded', 'true')
})
