import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Music } from 'lucide-react'
import { useProfile } from '../context/ProfileContext'
import { useLanguage } from '../context/LanguageContext'
import { ThemeToggle } from './theme/ThemeToggle'
import { PalettePicker } from './theme/PalettePicker'
import { HeaderProfileSelector } from './HeaderProfileSelector'
import { Button } from './ui/button'

const Layout = ({ children }: { children: React.ReactNode }) => {
    const { selectedProfile, setSelectedProfile } = useProfile()
    const { language, setLanguage, t } = useLanguage()
    const navigate = useNavigate()
    const location = useLocation()
    const rangeSearch = new URLSearchParams()
    for (const key of ['dateFrom', 'dateTo']) { const value = new URLSearchParams(location.search).get(key); if (value) rangeSearch.set(key, value) }
    const target = (pathname: string) => ({ pathname, search: rangeSearch.toString() })
    const links = [ ['/', t('dashboard')], ['/music', t('music')], ['/podcasts', t('podcastsTitle')], ['/audiobooks', t('audiobooks')] ]
    return (
        <div className="flex min-h-screen flex-col bg-background">
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-card focus:p-3">{language === 'pl' ? 'Przejdź do treści' : 'Skip to content'}</a>
            <header className="sticky top-0 z-40 border-b bg-background">
                <div className="container flex min-h-16 flex-wrap items-center justify-between gap-x-5 gap-y-2 py-2">
                    <NavLink to={target("/")} className="flex min-w-0 items-center gap-2 text-base font-semibold tracking-tight">
                        <Music className="h-5 w-5 shrink-0 text-primary" />
                        <span className="truncate">{t('appTitle')}</span>
                    </NavLink>
                    <nav aria-label={language === 'pl' ? 'Nawigacja główna' : 'Main navigation'} className="order-3 flex w-full flex-wrap gap-1 lg:order-none lg:w-auto">
                        {links.map(([path, label]) => <NavLink key={path} to={target(path)} end={path === '/'} className={({ isActive }) => `flex min-h-11 sm:min-h-10 shrink-0 items-center rounded-md px-2 text-sm font-medium transition-colors sm:px-3 ${isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>{label}</NavLink>)}
                    </nav>
                    <div className="ml-auto flex items-center gap-2">
                        <Button onClick={() => setLanguage(language === 'pl' ? 'en' : 'pl')} variant="ghost" size="sm" aria-label={language === 'pl' ? 'Switch language to English' : 'Zmień język na polski'}>{language === 'pl' ? 'EN' : 'PL'}</Button>
                        <ThemeToggle />
                        <PalettePicker />
                    </div>
                    <div className="order-4 w-full border-t pt-2 lg:order-none lg:w-auto lg:border-0 lg:pt-0">
                        <HeaderProfileSelector selectedProfile={selectedProfile} onProfileSelect={setSelectedProfile} onImportRequested={() => navigate(target('/data'))} refreshTrigger={location.pathname === '/data' ? 0 : 1} />
                    </div>
                </div>
            </header>
            <main id="main-content" className="container flex-1 py-5 sm:py-6" tabIndex={-1}>
                <div className="profile-context min-w-0" data-profile={selectedProfile}>{children}</div>
            </main>
            <footer className="border-t py-4"><div className="container text-xs text-muted-foreground">{t('appDescription')} <span className="hidden sm:inline">{t('footerCredit')}</span></div></footer>
        </div>
    )
}
export default Layout
