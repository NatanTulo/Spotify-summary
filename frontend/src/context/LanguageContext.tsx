import { createContext, useContext, useState, ReactNode } from 'react'

type Language = 'pl' | 'en'

interface LanguageContextType {
    language: Language
    setLanguage: (language: Language) => void
    t: (key: string) => string
}

const translations = {
    pl: {
        // Navigation
        tracks: 'Lista utworów',
        analytics: 'Analityka',
        dashboard: 'Panel główny',

        // TracksList
        clickHeaders: 'Kliknij nagłówki kolumn aby sortować według różnych kryteriów.',
        noTracks: 'Nie znaleziono utworów spełniających kryteria',
        loading: 'Ładowanie utworów...',
        track: 'Utwór',
        artist: 'Artysta',
        album: 'Album',
        plays: 'Odtworzenia',
        minutes: 'Minuty',
        avgDuration: 'Śr. długość',
        skipPercentageColumn: '% pominiętych',
        timelineTitle: 'Historia odtworzeń',
        noTimelineData: 'Brak danych timeline dla tego utworu',
        page: 'Strona',
        of: 'z',
        tracksCount: 'utworów',
        previous: 'Poprzednia',
        next: 'Następna',
        columns: 'Kolumny',
        selectColumns: 'Wybierz kolumny do wyświetlenia',

        // Column names
        trackName: 'Utwór',
        artistName: 'Artysta',
        albumName: 'Album',
        totalPlays: 'Odtworzenia',
        totalMinutes: 'Minuty',
        avgPlayDuration: 'Śr. długość',
        skipPercentage: '% pominiętych',
        duration: 'Długość utworu',
        firstPlay: 'Pierwsze odtworzenie',
        lastPlay: 'Ostatnie odtworzenie',
        platforms: 'Platformy',
        countries: 'Kraje',
        uri: 'URI Spotify',
        username: 'Użytkownik',
        reasonStart: 'Powód rozpoczęcia',
        reasonEnd: 'Powód zakończenia',
        shuffle: 'Losowo',
        offline: 'Offline',
        incognitoMode: 'Tryb incognito',

        // General
        yes: 'Tak',
        no: 'Nie',
        unknown: 'Nieznane',
        notAvailable: 'Niedostępne'
    },
    en: {
        // Navigation
        tracks: 'Tracks List',
        analytics: 'Analytics',
        dashboard: 'Dashboard',

        // TracksList
        clickHeaders: 'Click column headers to sort by different criteria.',
        noTracks: 'No tracks found matching the criteria',
        loading: 'Loading tracks...',
        track: 'Track',
        artist: 'Artist',
        album: 'Album',
        plays: 'Plays',
        minutes: 'Minutes',
        avgDuration: 'Avg. Duration',
        skipPercentageColumn: '% Skipped',
        timelineTitle: 'Play History',
        noTimelineData: 'No timeline data for this track',
        page: 'Page',
        of: 'of',
        tracksCount: 'tracks',
        previous: 'Previous',
        next: 'Next',
        columns: 'Columns',
        selectColumns: 'Select columns to display',

        // Column names
        trackName: 'Track',
        artistName: 'Artist',
        albumName: 'Album',
        totalPlays: 'Plays',
        totalMinutes: 'Minutes',
        avgPlayDuration: 'Avg. Duration',
        skipPercentage: '% Skipped',
        duration: 'Track Duration',
        firstPlay: 'First Play',
        lastPlay: 'Last Play',
        platforms: 'Platforms',
        countries: 'Countries',
        uri: 'Spotify URI',
        username: 'Username',
        reasonStart: 'Start Reason',
        reasonEnd: 'End Reason',
        shuffle: 'Shuffle',
        offline: 'Offline',
        incognitoMode: 'Incognito Mode',

        // General
        yes: 'Yes',
        no: 'No',
        unknown: 'Unknown',
        notAvailable: 'N/A'
    }
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>('pl')

    const t = (key: string): string => {
        return translations[language][key as keyof typeof translations[typeof language]] || key
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider')
    }
    return context
}
