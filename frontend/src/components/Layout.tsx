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
                <div className="container mx-auto px-4 py-3">
                    <div className="relative flex items-center justify-between">
                        <div className="absolute inset-0 -z-10 pointer-events-none">
                            {/* Usunięto zielone blob-y przy tytule i na środku dla czystszego wyglądu */}
                            <div className="blob w-48 h-48 -right-16 -bottom-24 bg-chart-4/25 animate-blob [animation-delay:3s]" />
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="app-brand-glow flex items-center gap-2 relative">
                                <Music className="h-8 w-8 text-spotify-green drop-shadow-sm" />
                                <h1 className="text-xl md:text-2xl font-semibold md:font-bold tracking-tight text-foreground">
                                    {t('appTitle')}
                                </h1>
                            </div>
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
                            </nav>
                        </div>

                        <div className="flex items-center gap-2 md:gap-4">
                            {/* Wybór języka */}
                            <Button
                                onClick={() => setLanguage(language === 'pl' ? 'en' : 'pl')}
                                variant="outline"
                                size="sm"
                            >
                                {language === 'pl' ? 'EN' : 'PL'}
                            </Button>

                            <HeaderProfileSelector
                                selectedProfile={selectedProfile}
                                onProfileSelect={setSelectedProfile}
                                onImportRequested={handleImportRequested}
                                isLoading={false}
                                refreshTrigger={profileRefreshTrigger}
                            />
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </header>

            {/* Profile Manager Modal */}
            {showProfileManager && (
                <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="glass max-w-4xl w-full max-h-[82vh] overflow-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-semibold tracking-tight">{t('dataManagement')}</h2>
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
            <main className="container mx-auto px-4 py-8">
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
                <div className="container mx-auto px-4 py-6">
                    <div className="text-center text-xs md:text-sm text-muted-foreground">
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
