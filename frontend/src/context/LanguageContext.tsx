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

        // App branding
        appTitle: 'Spotify Analytics',
        appDescription: 'Analiza danych ze Spotify GDPR Export',
        footerCredit: 'Projekt edukacyjny - Natan Tułodziecki',

        // Profile management
        dataManagement: 'Zarządzanie Danymi',
        importData: 'Importuj dane',
        selectProfile: 'Wybierz profil',
        noProfileSelected: 'Nie wybrano profilu',

        // General actions
        close: 'Zamknij',
        save: 'Zapisz',
        cancel: 'Anuluj',
        delete: 'Usuń',
        edit: 'Edytuj',
        loading: 'Ładowanie...',

        // TracksList
        clickHeaders: 'Kliknij nagłówki kolumn aby sortować według różnych kryteriów.',
        noTracks: 'Nie znaleziono utworów spełniających kryteria',
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
        showing: 'Wyświetlono',
        pageSize: 'Rozmiar strony',

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
        notAvailable: 'Niedostępne',
        back: 'Powrót',
        hours: 'godzin',
        technicalInfo: 'Informacje techniczne',
        listeningBehavior: 'Zachowania słuchania',
        playHistoryDescription: 'Wykres odtworzeń w czasie',

        // DataImportGuide
        howToImportTitle: 'Jak Uzyskać i Zaimportować Dane Spotify',
        importGuideDescription: 'Szczegółowy przewodnik po procesie pobierania i importowania danych z Spotify',
        step1Title: 'Pobierz Swoje Dane ze Spotify',
        step1GoTo: 'Przejdź na stronę',
        step1Login: 'Zaloguj się na swoje konto Spotify',
        step1ScrollTo: 'Przewiń do sekcji "Download your data"',
        step1SelectExtended: 'Wybierz "Extended streaming history" (nie "Account data")',
        step1FillForm: 'Wypełnij formularz i poczekaj na email (może potrwać do 30 dni)',
        step2Title: 'Przygotuj Strukturę Folderów',
        step2Description: 'Po otrzymaniu danych, utwórz następującą strukturę w folderze',
        step3Title: 'Rodzaje Plików Danych',
        step3Description: 'Spotify dostarcza różne typy plików:',
        step3Audio: 'Historia odtwarzania muzyki',
        step3Video: 'Historia odtwarzania podcastów video',
        step3Readme: 'Dokumentacja (pomijana podczas importu)',
        step4Title: 'Importuj Dane',
        step4Description: 'Po przygotowaniu folderów:',
        step4UseButton: 'Użyj przycisku "Importuj Dane" w nagłówku strony',
        step4SelectProfile: 'Wybierz profil do zaimportowania lub importuj wszystkie',
        step4Wait: 'Poczekaj na zakończenie procesu (może potrwać kilka minut)',
        step4AfterImport: 'Po imporcie możesz przełączać się między profilami',
        importantInfo: 'Ważne Informacje',
        info1: 'Extended Streaming History zawiera pełną historię odtwarzania (każde kliknięcie play)',
        info2: 'Dane mogą sięgać nawet kilku lat wstecz',
        info3: 'Rozmiar plików może być duży (kilkaset MB dla aktywnych użytkowników)',
        info4: 'Import większych danych może potrwać kilka minut',
        info5: 'Aplikacja jest tylko do odczytu - nie modyfikuje oryginalnych danych',
        info6: 'Możesz mieć wiele profili i porównywać między nimi',

        // Filters
        filters: 'Filtry',
        advancedFilters: 'Zaawansowane filtry',
        search: 'Szukaj',
        searchPlaceholder: 'Szukaj utworów, artystów lub albumów...',
        minPlays: 'Min. odtworzeń',
        dateRange: 'Zakres dat',
        from: 'Od',
        to: 'Do',
        country: 'Kraj',
        allCountries: 'Wszystkie kraje',
        platform: 'Platforma',
        allPlatforms: 'Wszystkie platformy',
        sortBy: 'Sortuj według',
        sortOrder: 'Kolejność sortowania',
        ascending: 'Rosnąco',
        descending: 'Malejąco',
        showSkipped: 'Pokaż pominięte utwory',
        showShuffle: 'Pokaż tylko tryb losowy',
        resetFilters: 'Resetuj filtry',
        applyFilters: 'Zastosuj filtry',
        activeFilters: 'aktywnych filtrów',

        // Profile actions
        addProfile: 'Dodaj profil',
        editProfile: 'Edytuj profil',
        deleteProfile: 'Usuń profil',
        confirmDeleteProfile: 'Czy na pewno chcesz usunąć ten profil?',
        confirmDeleteDescription: 'Ta akcja jest nieodwracalna i usunie wszystkie dane powiązane z tym profilem.',
        profileName: 'Nazwa profilu',
        enterProfileName: 'Wprowadź nazwę profilu',
        createProfile: 'Utwórz profil',
        updateProfile: 'Aktualizuj profil',

        // Import actions
        importDataAction: 'Importuj dane',
        selectFiles: 'Wybierz pliki',
        selectAllProfiles: 'Wybierz wszystkie profile',
        importProgress: 'Postęp importu',
        filesProcessed: 'plików przetworzonych',
        importing: 'Importowanie...',
        importComplete: 'Import zakończony',
        importError: 'Błąd importu',

        // Data legend
        dataLegend: 'Legenda danych',
        totalTime: 'Całkowity czas',
        totalTracks: 'Liczba utworów',
        uniqueArtists: 'Unikalni artyści',
        uniqueAlbums: 'Unikalne albumy',
        avgPerDay: 'Średnio dziennie',
        firstListen: 'Pierwszy odsłuch',
        lastListen: 'Ostatni odsłuch',
        topGenres: 'Najczęściej słuchane gatunki',
        listeningPatterns: 'Wzorce słuchania',

        // Theme
        lightTheme: 'Jasny motyw',
        darkTheme: 'Ciemny motyw',
        systemTheme: 'Motyw systemowy',

        // Charts
        playsByCountry: 'Odtworzenia według krajów',
        playsByCountryDesc: 'Kraje, w których słuchasz muzyki',
        playsByPlatform: 'Odtworzenia według platform',
        playsByPlatformDesc: 'Platformy, na których słuchasz muzyki',
        timeline: 'Timeline aktywności',
        timelineDesc: 'Twoja aktywność słuchania w czasie',
        noData: 'Brak danych do wyświetlenia',
        playsLabel: 'Odtworzeń',
        daysLabel: 'Dni',
        hoursLabel: 'Godziny',

        // Dashboard
        totalPlaysCard: 'Łączne odtworzenia',
        listeningMinutes: 'Minuty słuchania',
        uniqueTracksCard: 'Unikalne utwory',
        uniqueArtistsCard: 'Unikalni artyści',
        mainCountry: 'Główny kraj',
        approxHours: 'godzin',
        differentSongs: 'Różne piosenki',
        differentArtists: 'Różni wykonawcy',
        topTracksTitle: 'Najpopularniejsze utwory',
        topArtistsTitle: 'Najpopularniejszi artyści',
        viewAll: 'Zobacz wszystkie',
        generalStats: 'Ogólne statystyki',
        generalStatsDesc: 'Podsumowanie Twojej aktywności słuchania',
        
        // ProfileManager
        allProfiles: 'Wszystkie Profile',
        activeImports: 'Aktywne Importy',
        activeImportsDesc: 'Profile aktualnie importowane',
        importedProfiles: 'Zaimportowane Profile',
        importedProfilesDesc: 'Profile dostępne w bazie danych',
        availableProfiles: 'Dostępne Profile do Importu',
        availableProfilesDesc: 'Profile znalezione w folderze data/',
        noImportedProfiles: 'Brak zaimportowanych profili',
        noAvailableProfiles: 'Brak dostępnych profili do importu',
        totalPlaysShort: 'Odtworzeń',
        totalMinutesShort: 'Minut',
        uniqueTracksShort: 'Utworów',
        uniqueArtistsShort: 'Artystów',
        lastImport: 'Ostatni import',
        clearAllData: 'Wyczyść wszystkie dane',
        confirmClearAll: 'Czy na pewno chcesz usunąć wszystkie dane?',
        confirmClearAllDesc: 'Ta akcja usunie wszystkie profile, utwory, artystów i dane z bazy. Nie można jej cofnąć.',
        mostListenedIn: 'Najczęściej słuchasz',
        
        // Dashboard additional
        noTracksData: 'Brak danych o utworach',
        noArtistsData: 'Brak danych o artystach',
        importSpotifyData: 'Zaimportuj dane ze Spotify',
        topArtistsDesc: 'Twoja top 5 artystów według liczby odtworzeń',
        topTracksDesc: 'Twoja top 5 piosenek według liczby odtworzeń',
        avgSession: 'Średnia sesja',
        perSession: 'Na sesję',
        topCountries: 'Najczęściej słuchasz',
        
        // Analytics page
        analyticsTitle: 'Analytics',
        analyticsDescription: 'Szczegółowa analiza Twoich danych muzycznych',
        refreshData: 'Odśwież dane',
        overview: 'Przegląd',
        charts: 'Wykresy',
        tracksList: 'Lista utworów',
        
        // Analytics tabs content
        listeningPatternsAnalysis: 'Analiza wzorców słuchania',
        listeningTrendsDescription: 'Trendy i wzorce w Twojej aktywności muzycznej',
        avgPlaysPerActiveDay: 'Średnie odtworzenia dziennie (dni aktywne)',
        avgMinutesPerActiveDay: 'Średnie minuty dziennie (dni aktywne)',
        longestSession: 'Najdłuższa sesja (min)',
        
        // Charts 
        yearlyStats: 'Statystyki roczne',
        yearlyStatsDescription: 'Twoja aktywność słuchania przez lata',
        listeningTimeline: 'Timeline słuchania',
        listeningTimelineDaily: 'Timeline słuchania (dzienne)',
        dailyMusicActivity: 'Twoja codzienna aktywność muzyczna w czasie',
        noDataToDisplay: 'Brak danych do wyświetlenia',
        resetZoom: 'Resetuj zoom',
        selectPeriodToZoom: 'Wybierz okres do przybliżenia:',
        
        // Tooltip labels
        playsTooltip: 'Odtworzenia',
        minutesTooltip: 'Minuty',
        
        // ImportProgressDisplay
        preparingImport: 'Przygotowywanie importu...',
        importingFile: 'Importowanie pliku',
        importCompleted: 'Import ukończony pomyślnie!',
        importErrorMsg: 'Błąd',
        importCancelled: 'Import anulowany',
        unknownStatus: 'Status nieznany',
        unknownError: 'Nieznany błąd',
        overallProgress: 'Postęp ogólny',
        currentFile: 'Aktualny plik',
        filesLabel: 'Pliki',
        recordsLabel: 'Rekordy',
        artistsLabel: 'Artyści',
        tracksLabel: 'Utwory',
        cancelling: 'Anulowanie...',
        cancelImport: 'Anuluj Import',
        
        // TopArtistsChart
        topArtists: 'Top artyści',
        topArtistsDescription: 'Najczęściej słuchani wykonawcy',
        
        // DataLegend
        dataFieldsLegend: 'Legenda Pól Danych Spotify',
        dataFieldsDescription: 'Opis wszystkich pól dostępnych w danych ze Spotify Extended Streaming History',
        legendFields: 'Legenda Pól',
        playbackTime: 'Czas odtwarzania',
        playbackTimeDesc: 'Liczba milisekund przez które utwór był odtwarzany',
        countryField: 'Kraj',
        countryFieldDesc: 'Kod kraju z którego utwór był odtwarzany (np. PL - Polska)',
        platformField: 'Platforma',
        platformFieldDesc: 'Urządzenie/platforma na której był odtwarzany utwór (np. Android, iOS, Desktop)',
        shuffleField: 'Shuffle',
        shuffleFieldDesc: 'Czy tryb losowego odtwarzania był włączony (True/False)',
        skippedField: 'Pominięty',
        skippedFieldDesc: 'Czy użytkownik przeskoczył do następnego utworu (True/False)',
        offlineField: 'Offline',
        offlineFieldDesc: 'Czy utwór był odtwarzany w trybie offline (True/False)',
        incognitoField: 'Tryb incognito',
        incognitoFieldDesc: 'Czy odtwarzanie było w trybie prywatnym (True/False)',
        additionalInfo: 'Informacje dodatkowe:',
        gdprDataInfo: 'Dane pochodzą z eksportu GDPR Spotify (Extended Streaming History)',
        emptyFieldsInfo: 'Niektóre pola mogą być puste lub niedostępne w starszych rekordach',
        playTimeInfo: 'Czas odtwarzania (ms_played) może być krótszy niż długość utworu jeśli został pominięty',
        privacyInfo: 'Adresy IP i dane user agent mogą być zanonimizowane ze względów prywatności',
        podcastFilterInfo: 'Podcasty i audioserialne są filtrowane i nie są uwzględniane w statystykach',
        exampleLabel: 'Przykład:'
    },
    en: {
        // Navigation
        tracks: 'Tracks List',
        analytics: 'Analytics',
        dashboard: 'Dashboard',

        // App branding
        appTitle: 'Spotify Analytics',
        appDescription: 'Analysis of Spotify GDPR Export data',
        footerCredit: 'Educational project - Natan Tułodziecki',

        // Profile management
        dataManagement: 'Data Management',
        importData: 'Import data',
        selectProfile: 'Select profile',
        noProfileSelected: 'No profile selected',

        // General actions
        close: 'Close',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        loading: 'Loading...',

        // TracksList
        clickHeaders: 'Click column headers to sort by different criteria.',
        noTracks: 'No tracks found matching the criteria',
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
        showing: 'Showing',
        pageSize: 'Page size',

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
        notAvailable: 'N/A',
        back: 'Back',
        hours: 'hours',
        technicalInfo: 'Technical Information',
        listeningBehavior: 'Listening Behavior',
        playHistoryDescription: 'Play count over time',
        
        // DataImportGuide
        howToImportTitle: 'How to Get and Import Spotify Data',
        importGuideDescription: 'Detailed guide for downloading and importing Spotify data',
        step1Title: 'Download Your Spotify Data',
        step1GoTo: 'Go to',
        step1Login: 'Log in to your Spotify account',
        step1ScrollTo: 'Scroll to "Download your data" section',
        step1SelectExtended: 'Select "Extended streaming history" (not "Account data")',
        step1FillForm: 'Fill out the form and wait for email (may take up to 30 days)',
        step2Title: 'Prepare Folder Structure',
        step2Description: 'After receiving data, create the following structure in the folder',
        step3Title: 'Data File Types',
        step3Description: 'Spotify provides different types of files:',
        step3Audio: 'Music playback history',
        step3Video: 'Video podcast playback history',
        step3Readme: 'Documentation (skipped during import)',
        step4Title: 'Import Data',
        step4Description: 'After preparing folders:',
        step4UseButton: 'Use the "Import Data" button in the page header',
        step4SelectProfile: 'Select a profile to import or import all',
        step4Wait: 'Wait for the process to complete (may take a few minutes)',
        step4AfterImport: 'After import, you can switch between profiles',
        importantInfo: 'Important Information',
        info1: 'Extended Streaming History contains full playback history (every play click)',
        info2: 'Data can go back several years',
        info3: 'File sizes can be large (hundreds of MB for active users)',
        info4: 'Importing larger data may take several minutes',
        info5: 'Application is read-only - does not modify original data',
        info6: 'You can have multiple profiles and compare between them',

        // Filters
        filters: 'Filters',
        advancedFilters: 'Advanced filters',
        search: 'Search',
        searchPlaceholder: 'Search tracks, artists or albums...',
        minPlays: 'Min. plays',
        dateRange: 'Date range',
        from: 'From',
        to: 'To',
        country: 'Country',
        allCountries: 'All countries',
        platform: 'Platform',
        allPlatforms: 'All platforms',
        sortBy: 'Sort by',
        sortOrder: 'Sort order',
        ascending: 'Ascending',
        descending: 'Descending',
        showSkipped: 'Show skipped tracks',
        showShuffle: 'Show only shuffle mode',
        resetFilters: 'Reset filters',
        applyFilters: 'Apply filters',
        activeFilters: 'active filters',

        // Profile actions
        addProfile: 'Add profile',
        editProfile: 'Edit profile',
        deleteProfile: 'Delete profile',
        confirmDeleteProfile: 'Are you sure you want to delete this profile?',
        confirmDeleteDescription: 'This action is irreversible and will remove all data associated with this profile.',
        profileName: 'Profile name',
        enterProfileName: 'Enter profile name',
        createProfile: 'Create profile',
        updateProfile: 'Update profile',

        // Import actions
        importDataAction: 'Import data',
        selectFiles: 'Select files',
        selectAllProfiles: 'Select all profiles',
        importProgress: 'Import progress',
        filesProcessed: 'files processed',
        importing: 'Importing...',
        importComplete: 'Import complete',
        importError: 'Import error',

        // Data legend
        dataLegend: 'Data legend',
        totalTime: 'Total time',
        totalTracks: 'Total tracks',
        uniqueArtists: 'Unique artists',
        uniqueAlbums: 'Unique albums',
        avgPerDay: 'Average per day',
        firstListen: 'First listen',
        lastListen: 'Last listen',
        topGenres: 'Top genres',
        listeningPatterns: 'Listening patterns',

        // Theme
        lightTheme: 'Light theme',
        darkTheme: 'Dark theme',
        systemTheme: 'System theme',
        
        // Charts
        playsByCountry: 'Plays by Country',
        playsByCountryDesc: 'Countries where you listen to music',
        playsByPlatform: 'Plays by Platform',
        playsByPlatformDesc: 'Platforms where you listen to music',
        timeline: 'Activity Timeline',
        timelineDesc: 'Your listening activity over time',
        noData: 'No data to display',
        playsLabel: 'Plays',
        daysLabel: 'Days',
        hoursLabel: 'Hours',
        
        // Dashboard
        totalPlaysCard: 'Total Plays',
        listeningMinutes: 'Listening Minutes',
        uniqueTracksCard: 'Unique Tracks',
        uniqueArtistsCard: 'Unique Artists',
        mainCountry: 'Main Country',
        approxHours: 'hours',
        differentSongs: 'Different songs',
        differentArtists: 'Different artists',
        topTracksTitle: 'Top Tracks',
        topArtistsTitle: 'Top Artists',
        viewAll: 'View all',
        generalStats: 'General Statistics',
        generalStatsDesc: 'Summary of your listening activity',
        
        // ProfileManager
        allProfiles: 'All Profiles',
        activeImports: 'Active Imports',
        activeImportsDesc: 'Profiles currently being imported',
        importedProfiles: 'Imported Profiles',
        importedProfilesDesc: 'Profiles available in database',
        availableProfiles: 'Available Profiles for Import',
        availableProfilesDesc: 'Profiles found in data/ folder',
        noImportedProfiles: 'No imported profiles',
        noAvailableProfiles: 'No available profiles for import',
        totalPlaysShort: 'Plays',
        totalMinutesShort: 'Minutes',
        uniqueTracksShort: 'Tracks',
        uniqueArtistsShort: 'Artists',
        lastImport: 'Last import',
        clearAllData: 'Clear all data',
        confirmClearAll: 'Are you sure you want to delete all data?',
        confirmClearAllDesc: 'This action will remove all profiles, tracks, artists and data from database. Cannot be undone.',
        mostListenedIn: 'Most listened in',
        
        // Dashboard additional
        noTracksData: 'No tracks data',
        noArtistsData: 'No artists data',
        importSpotifyData: 'Import Spotify data',
        topArtistsDesc: 'Your top 5 artists by play count',
        topTracksDesc: 'Your top 5 songs by play count',
        avgSession: 'Average session',
        perSession: 'Per session',
        topCountries: 'Most listened in',
        
        // Analytics page
        analyticsTitle: 'Analytics',
        analyticsDescription: 'Detailed analysis of your music data',
        refreshData: 'Refresh data',
        overview: 'Overview',
        charts: 'Charts',
        tracksList: 'Track List',
        
        // Analytics tabs content
        listeningPatternsAnalysis: 'Listening Patterns Analysis',
        listeningTrendsDescription: 'Trends and patterns in your music activity',
        avgPlaysPerActiveDay: 'Average plays per day (active days)',
        avgMinutesPerActiveDay: 'Average minutes per day (active days)',
        longestSession: 'Longest session (min)',
        
        // Charts 
        yearlyStats: 'Yearly Statistics',
        yearlyStatsDescription: 'Your listening activity over the years',
        listeningTimeline: 'Listening Timeline',
        listeningTimelineDaily: 'Listening Timeline (daily)',
        dailyMusicActivity: 'Your daily music activity over time',
        noDataToDisplay: 'No data to display',
        resetZoom: 'Reset zoom',
        selectPeriodToZoom: 'Select period to zoom:',
        
        // Tooltip labels
        playsTooltip: 'Plays',
        minutesTooltip: 'Minutes',
        
        // ImportProgressDisplay
        preparingImport: 'Preparing import...',
        importingFile: 'Importing file',
        importCompleted: 'Import completed successfully!',
        importErrorMsg: 'Error',
        importCancelled: 'Import cancelled',
        unknownStatus: 'Unknown status',
        unknownError: 'Unknown error',
        overallProgress: 'Overall progress',
        currentFile: 'Current file',
        filesLabel: 'Files',
        recordsLabel: 'Records',
        artistsLabel: 'Artists',
        tracksLabel: 'Tracks',
        cancelling: 'Cancelling...',
        cancelImport: 'Cancel Import',
        
        // TopArtistsChart
        topArtists: 'Top Artists',
        topArtistsDescription: 'Most listened artists',
        
        // DataLegend
        dataFieldsLegend: 'Spotify Data Fields Legend',
        dataFieldsDescription: 'Description of all fields available in Spotify Extended Streaming History data',
        legendFields: 'Fields Legend',
        playbackTime: 'Playback time',
        playbackTimeDesc: 'Number of milliseconds the track was played',
        countryField: 'Country',
        countryFieldDesc: 'Country code from which the track was played (e.g. PL - Poland)',
        platformField: 'Platform',
        platformFieldDesc: 'Device/platform on which the track was played (e.g. Android, iOS, Desktop)',
        shuffleField: 'Shuffle',
        shuffleFieldDesc: 'Whether shuffle mode was enabled (True/False)',
        skippedField: 'Skipped',
        skippedFieldDesc: 'Whether user skipped to next track (True/False)',
        offlineField: 'Offline',
        offlineFieldDesc: 'Whether track was played in offline mode (True/False)',
        incognitoField: 'Incognito mode',
        incognitoFieldDesc: 'Whether playback was in private mode (True/False)',
        additionalInfo: 'Additional information:',
        gdprDataInfo: 'Data comes from Spotify GDPR export (Extended Streaming History)',
        emptyFieldsInfo: 'Some fields may be empty or unavailable in older records',
        playTimeInfo: 'Play time (ms_played) may be shorter than track length if skipped',
        privacyInfo: 'IP addresses and user agent data may be anonymized for privacy',
        podcastFilterInfo: 'Podcasts and audio serials are filtered and not included in statistics',
        exampleLabel: 'Example:'
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
