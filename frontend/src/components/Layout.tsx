import { useState } from 'react'
import { Link } from 'react-router-dom'
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
            <header className="border-b bg-card">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <Music className="h-8 w-8 text-spotify-green" />
                                <h1 className="text-2xl font-bold text-foreground">
                                    {t('appTitle')}
                                </h1>
                            </div>
                            <nav className="flex space-x-4">
                                <Link
                                    to="/"
                                    className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {t('dashboard')}
                                </Link>
                                <Link
                                    to="/analytics"
                                    className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {t('analytics')}
                                </Link>
                            </nav>
                        </div>

                        <div className="flex items-center space-x-4">
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-background rounded-lg shadow-lg max-w-4xl w-full max-h-[80vh] overflow-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold">{t('dataManagement')}</h2>
                                <button
                                    onClick={() => setShowProfileManager(false)}
                                    className="p-2 hover:bg-muted rounded-md"
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
                    {children}
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t bg-card mt-auto">
                <div className="container mx-auto px-4 py-6">
                    <div className="text-center text-sm text-muted-foreground">
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
