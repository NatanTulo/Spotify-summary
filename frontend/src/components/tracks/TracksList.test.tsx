import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import { LanguageProvider } from '../../context/LanguageContext'
import { TracksList } from '../TracksList'
vi.mock('../TrackDetails', () => ({ TrackDetails: () => <p>Details loaded</p> }))
function Location() { const location = useLocation(); const navigate = useNavigate(); return <><output data-testid="url">{location.search}</output><button onClick={() => navigate(-1)}>Browser back</button></> }
it('opens details in the URL, restores focus on Escape, and supports browser back', async () => {
    render(<MemoryRouter initialEntries={['/music?musicPage=3&dateFrom=2024-01-01']}><LanguageProvider><Location /><TracksList tracks={[{ trackId: '42', trackName: 'Long track title', artistName: 'Artist', albumName: 'Album', totalPlays: 7, totalMinutes: 10, avgPlayDuration: 80, skipPercentage: 0 }]} /></LanguageProvider></MemoryRouter>)
    const opener = screen.getAllByRole('button', { name: /Long track title/ })[0]
    opener.focus()
    fireEvent.click(opener)
    expect(screen.getByTestId('url')).toHaveTextContent('track=42')
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveFocus()
    fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
    expect(screen.getByTestId('url')).toHaveTextContent('musicPage=3')
    expect(screen.getByTestId('url')).toHaveTextContent('dateFrom=2024-01-01')
    fireEvent.click(opener)
    fireEvent.click(screen.getByRole('button', { name: 'Browser back' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
})
