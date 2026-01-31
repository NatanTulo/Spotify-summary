import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { StatsRow } from './StatsRow'
import { useLanguage } from '../context/LanguageContext'

// Mock the useLanguage hook
vi.mock('../context/LanguageContext', () => ({
  useLanguage: vi.fn(),
  LanguageProvider: ({ children }: any) => children
}))

// Mock lucide-react with strings or very simple components
vi.mock('lucide-react', () => ({
  Play: () => React.createElement('div', { 'data-testid': 'play-icon' }),
  Clock: () => React.createElement('div', { 'data-testid': 'clock-icon' }),
  Music: () => React.createElement('div', { 'data-testid': 'music-icon' }),
  User: () => React.createElement('div', { 'data-testid': 'user-icon' }),
  Disc: () => React.createElement('div', { 'data-testid': 'disc-icon' }),
  Podcast: () => React.createElement('div', { 'data-testid': 'podcast-icon' }),
  Tv: () => React.createElement('div', { 'data-testid': 'tv-icon' }),
  List: () => React.createElement('div', { 'data-testid': 'list-icon' })
}))

describe('StatsRow component', () => {
  const mockT = vi.fn((key: string) => key)
  const mockFormatDuration = vi.fn((minutes: number) => `${minutes} min`)

  beforeEach(() => {
    vi.mocked(useLanguage).mockReturnValue({
      t: mockT,
      language: 'pl',
      setLanguage: vi.fn(),
      formatDate: vi.fn()
    })
  })

  it('renders all stats correctly', () => {
    const stats = {
      totalPlays: 1000,
      totalMinutes: 3000,
      uniqueTracks: 500,
      uniqueArtists: 200,
      uniqueAlbums: 100
    }

    render(
      React.createElement(StatsRow, { 
        stats: stats, 
        formatDuration: mockFormatDuration 
      })
    )

    // Using more flexible regex for numbers that might have different formatting
    expect(screen.getByText(/1[.,]?000/, { exact: false })).toBeInTheDocument()
    expect(screen.getByText(/3000 min/, { exact: false })).toBeInTheDocument()
    expect(screen.getByText(/500/, { exact: false })).toBeInTheDocument()
    expect(screen.getByText(/200/, { exact: false })).toBeInTheDocument()
    expect(screen.getByText(/100/, { exact: false })).toBeInTheDocument()
  })

  it('hides specific stats when props are passed', () => {
    const stats = {
      totalPlays: 1000,
      totalMinutes: 3000,
      uniqueTracks: 500,
      uniqueArtists: 200,
      uniqueAlbums: 100
    }

    render(
      React.createElement(StatsRow, { 
        stats: stats, 
        formatDuration: mockFormatDuration,
        showPlays: false,
        showAlbums: false
      })
    )

    expect(screen.queryByText(/playsStats/)).not.toBeInTheDocument()
    expect(screen.queryByText(/albumsStats/)).not.toBeInTheDocument()
    expect(screen.getByText(/500/, { exact: false })).toBeInTheDocument()
  })

  it('renders podcast stats when present', () => {
    const stats = {
      uniqueTracks: 10,
      uniqueArtists: 5,
      totalPodcastPlays: 50,
      uniqueShows: 5,
      uniqueEpisodes: 20
    }

    render(
      React.createElement(StatsRow, { 
        stats: stats, 
        formatDuration: mockFormatDuration
      })
    )

    expect(screen.getByText(/50/, { exact: false })).toBeInTheDocument()
    expect(screen.getByText(/5/, { exact: false })).toBeInTheDocument()
    expect(screen.getByText(/20/, { exact: false })).toBeInTheDocument()
  })
})
