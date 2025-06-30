import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'
import Layout from './components/Layout'
import { LanguageProvider } from './context/LanguageContext'

function App() {
    return (
        <LanguageProvider>
            <Layout>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/analytics" element={<Analytics />} />
                </Routes>
            </Layout>
        </LanguageProvider>
    )
}

export default App
