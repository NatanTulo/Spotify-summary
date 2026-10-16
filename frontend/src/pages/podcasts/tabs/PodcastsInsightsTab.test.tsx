import { expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LanguageProvider } from '../../../context/LanguageContext'
import { PodcastsInsightsTab } from './PodcastsInsightsTab'
it('treats gaps between recorded days as a broken streak', () => {
    render(<LanguageProvider><PodcastsInsightsTab dailyStats={[
        { date: '2025-01-04', plays: 2, minutes: 12 },
        { date: '2025-01-01', plays: 3, minutes: 15 },
        { date: '2025-01-05', plays: 1, minutes: 6 },
    ]} /></LanguageProvider>)
    const streak = screen.getByText('Najdłuższa seria dni').parentElement
    expect(streak?.querySelector('dd')).toHaveTextContent('2')
    const activeDays = screen.getByText('Dni z odtworzeniami').parentElement
    expect(activeDays?.querySelector('dd')).toHaveTextContent('3')
    expect(screen.queryByText(/Current streak|Bieżąca seria/)).not.toBeInTheDocument()
})
