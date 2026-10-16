import { useDateRange } from './context/DateRangeContext'
import { DateRangeBar } from './components/DateRangeBar'
import { Routes, Route, useLocation, Link } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Layout from './components/Layout'
import { LanguageProvider } from './context/LanguageContext'
import { ErrorBoundary } from './components/common/ErrorBoundary'

// Lazy load głównych stron dla code-splitting
const Dashboard = lazy(() => import('./pages/Dashboard'))
const MusicAnalytics = lazy(() => import('./pages/music/Analytics'))
const Podcasts = lazy(() => import('./pages/podcasts/Podcasts'))
const Audiobooks = lazy(() => import('./pages/audiobooks/Audiobooks'))
const DataManagement = lazy(() => import('./pages/DataManagement'))

// Loading component
const LoadingSpinner = () => (
    <div role="status" aria-label="Loading" className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
    </div>
)

function App() {
    const { range, revision } = useDateRange()
    const { pathname } = useLocation()
    return (
        <ErrorBoundary>
            <LanguageProvider>
                <Layout>
                    {pathname.replace(/\/$/, '') !== '/data' && <DateRangeBar />}
                    <Suspense key={`${range.dateFrom}:${range.dateTo}:${revision}`} fallback={<LoadingSpinner />}>
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/music" element={<MusicAnalytics />} />
                            <Route path="/analytics" element={<MusicAnalytics />} />
                            <Route path="/podcasts" element={<Podcasts />} />
                            <Route path="/audiobooks" element={<Audiobooks />} />
                            <Route path="/data" element={<DataManagement />} />
                            <Route path="*" element={<div className="py-16 text-center"><h1 className="text-2xl font-semibold">404</h1><Link className="text-primary underline" to="/">Spotify Analytics</Link></div>} />
                        </Routes>
                    </Suspense>
                </Layout>
            </LanguageProvider>
        </ErrorBoundary>
    )
}

export default App
