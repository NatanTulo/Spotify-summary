import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Layout from './components/Layout'
import { LanguageProvider } from './context/LanguageContext'

// Lazy load głównych stron dla code-splitting
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Podcasts = lazy(() => import('./pages/podcasts/Podcasts'))
const Audiobooks = lazy(() => import('./pages/audiobooks/Audiobooks'))

// Loading component
const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/podcasts" element={<Podcasts />} />
                        <Route path="/audiobooks" element={<Audiobooks />} />
                    </Routes>
                </Suspense>
            </Layout>
        </LanguageProvider>
    )
}

export default App
