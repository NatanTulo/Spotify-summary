import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { LanguageProvider } from '../context/LanguageContext'
import { TrackDetails } from './TrackDetails'
const { retry } = vi.hoisted(() => ({ retry: vi.fn() }))
vi.mock('../hooks/useTrackDetails', () => ({ useTrackDetails: () => ({ track: null, loading: false, error: new Error('offline'), retry }) }))
it('shows an actionable detail error instead of an endless loading spinner', () => {
    render(<LanguageProvider><TrackDetails trackId="1" onBack={() => {}} /></LanguageProvider>)
    expect(screen.getByRole('alert')).toHaveTextContent('Nie udało się pobrać szczegółów utworu.')
    expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Spróbuj ponownie' }))
    expect(retry).toHaveBeenCalledOnce()
})
