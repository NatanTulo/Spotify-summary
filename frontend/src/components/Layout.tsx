import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Music } from 'lucide-react'
import { useProfile } from '../context/ProfileContext'
import { useLanguage } from '../context/LanguageContext'
import { ThemeToggle } from './theme/ThemeToggle'
import { HeaderProfileSelector } from './HeaderProfileSelector'
import { ProfileManager } from './ProfileManager'
import { Button } from './ui/button'

interface LayoutProps {
    children: React.ReactNode
}

const Layout = ({ children }: LayoutProps) => {
    const { selectedProfile, setSelectedProfile } = useProfile()
    const { language, setLanguage, t } = useLanguage()
    const [showProfileManager, setShowProfileManager] = useState(false)
    const [profileRefreshTrigger, setProfileRefreshTrigger] = useState(0)

    const handleImportRequested = () => {
        setShowProfileManager(true)
    }

    const handleProfileImport = (profileName: string) => {
        console.log('Importing profile:', profileName)
        // Nie zamykamy modalu od razu - pozwalamy progress bar się pokazać
        // Modal zostanie zamknięty automatycznie po zakończeniu importu lub przez użytkownika
    }

    const handleProfileClear = (profileId: string) => {
        console.log('Clearing profile:', profileId)
        if (selectedProfile === profileId) {
            setSelectedProfile(null)
        }
    }

    const handleProfilesChanged = () => {
        // Odświeżamy profile w header gdy coś się zmieni
        setProfileRefreshTrigger(prev => prev + 1)
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-40 border-b bg-card/60 backdrop-blur-xl supports-[backdrop-filter]:bg-card/60">
                <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
                    <div className="relative flex items-center justify-between">
                        <div className="absolute inset-0 -z-10 pointer-events-none">
                            {/* Usunięto zielone blob-y przy tytule i na środku dla czystszego wyglądu */}
                            <div className="blob w-48 h-48 -right-16 -bottom-24 bg-chart-4/25 animate-blob [animation-delay:3s]" />
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                            <div className="app-brand-glow flex items-center gap-1 sm:gap-2 relative min-w-0">
                                <Music className="h-6 w-6 sm:h-8 sm:w-8 text-spotify-green drop-shadow-sm flex-shrink-0" />
                                <h1 className="text-lg sm:text-xl md:text-2xl font-semibold md:font-bold tracking-tight text-foreground truncate">
                                    {t('appTitle')}
                                </h1>
                            </div>
                            
                            {/* Mobile Navigation */}
                            <nav className="flex md:hidden items-center gap-1 rounded-lg p-1 bg-muted/40 border border-border/60 ml-auto mr-2">
                                <NavLink
                                    to="/"
                                    className={({ isActive }) =>
                                        `px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                            isActive
                                                ? 'text-foreground bg-background/70 shadow-sm'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`
                                    }
                                    end
                                >
                                    📊
                                </NavLink>
                                <NavLink
                                    to="/music"
                                    className={({ isActive }) =>
                                        `px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                            isActive
                                                ? 'text-foreground bg-background/70 shadow-sm'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`
                                    }
                                >
                                    🎵
                                </NavLink>
                                <NavLink
                                    to="/podcasts"
                                    className={({ isActive }) =>
                                        `px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                            isActive
                                                ? 'text-foreground bg-background/70 shadow-sm'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`
                                    }
                                >
                                    🎙️
                                </NavLink>
                                <NavLink
                                    to="/audiobooks"
                                    className={({ isActive }) =>
                                        `px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                            isActive
                                                ? 'text-foreground bg-background/70 shadow-sm'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`
                                    }
                                >
                                    📚
                                </NavLink>
                            </nav>

                            {/* Desktop Navigation */}
                            <nav className="hidden md:flex items-center gap-1 rounded-xl p-1 bg-muted/40 border border-border/60">
                                <NavLink
                                    to="/"
                                    className={({ isActive }) =>
                                        `px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                            isActive
                                                ? 'text-foreground bg-background/70 shadow-sm'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`
                                    }
                                    end
                                >
                                    {t('dashboard')}
                                </NavLink>
                                <NavLink
                                    to="/music"
                                    className={({ isActive }) =>
                                        `px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                            isActive
                                                ? 'text-foreground bg-background/70 shadow-sm'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`
                                    }
                                >
                                    {t('music')}
                                </NavLink>
                                <NavLink
                                    to="/podcasts"
                                    className={({ isActive }) =>
                                        `px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                            isActive
                                                ? 'text-foreground bg-background/70 shadow-sm'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`
                                    }
                                >
                                    {t('podcastsTitle')}
                                </NavLink>
                                <NavLink
                                    to="/audiobooks"
                                    className={({ isActive }) =>
                                        `px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                            isActive
                                                ? 'text-foreground bg-background/70 shadow-sm'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`
                                    }
                                >
                                    {t('audiobooks') || 'Audiobooks'}
                                </NavLink>
                            </nav>
                        </div>

                        <div className="flex items-center gap-1 sm:gap-2 md:gap-4 flex-shrink-0">
                            {/* Wybór języka - ukryty na bardzo małych ekranach */}
                            <Button
                                onClick={() => setLanguage(language === 'pl' ? 'en' : 'pl')}
                                variant="outline"
                                size="sm"
                                className="hidden xs:flex text-xs sm:text-sm px-2 sm:px-3"
                            >
                                {language === 'pl' ? 'EN' : 'PL'}
                            </Button>

                            <div className="hidden sm:block">
                                <HeaderProfileSelector
                                    selectedProfile={selectedProfile}
                                    onProfileSelect={setSelectedProfile}
                                    onImportRequested={handleImportRequested}
                                    isLoading={false}
                                    refreshTrigger={profileRefreshTrigger}
                                />
                            </div>
                            
                            {/* Mobile Profile Selector - simplified */}
                            <div className="sm:hidden">
                                <Button
                                    onClick={handleImportRequested}
                                    variant="spotify"
                                    size="sm"
                                    className="px-2"
                                >
                                    📥
                                </Button>
                            </div>
                            
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </header>

            {/* Profile Manager Modal */}
            {showProfileManager && (
                <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
                    <div className="glass max-w-4xl w-full max-h-[90vh] sm:max-h-[82vh] overflow-auto">
                        <div className="p-3 sm:p-6">
                            <div className="flex items-center justify-between mb-4 sm:mb-6">
                                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">{t('dataManagement')}</h2>
                                <button
                                    onClick={() => setShowProfileManager(false)}
                                    className="p-2 hover:bg-muted rounded-md transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                            <ProfileManager
                                selectedProfile={selectedProfile}
                                onProfileSelect={setSelectedProfile}
                                onImportProfile={handleProfileImport}
                                onClearProfile={handleProfileClear}
                                onProfilesChanged={handleProfilesChanged}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
                <div className="profile-context" data-profile={selectedProfile}>
                    <div className="page-section elevated">
                        <div className="absolute -z-10 inset-0 overflow-hidden">
                            <div className="hero-gradient absolute inset-0 opacity-40" />
                        </div>
                        {children}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t bg-card/60 backdrop-blur mt-auto">
                <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
                    <div className="text-center text-xs sm:text-sm text-muted-foreground">
                        <p>{t('appDescription')}</p>
                        <p className="mt-1">
                            {t('footerCredit')}
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default Layout
