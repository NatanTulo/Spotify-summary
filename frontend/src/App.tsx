import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Layout from './components/Layout'
import { LanguageProvider } from './context/LanguageContext'

// Lazy load głównych stron dla code-splitting
const Dashboard = lazy(() => import('./pages/Dashboard'))
const MusicAnalytics = lazy(() => import('./pages/music/Analytics'))
const Podcasts = lazy(() => import('./pages/podcasts/Podcasts'))
const Audiobooks = lazy(() => import('./pages/audiobooks/Audiobooks'))

// Loading component
const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-64">
        <div className="relative h-10 w-10">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/60 via-spotify-green/60 to-chart-4/60 animate-pulse blur-[2px]" />
            <div className="absolute inset-[2px] rounded-full bg-background border border-border" />
        </div>
    </div>
)

function App() {
    return (
        <LanguageProvider>
            <Layout>
                <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/music" element={<MusicAnalytics />} />
                        <Route path="/analytics" element={<MusicAnalytics />} />
                        <Route path="/podcasts" element={<Podcasts />} />
                        <Route path="/audiobooks" element={<Audiobooks />} />
                    </Routes>
                </Suspense>
            </Layout>
        </LanguageProvider>
    )
}

export default App
