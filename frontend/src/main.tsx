import { queryClient } from './lib/api'
import { DateRangeProvider } from './context/DateRangeContext'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { ProfileProvider } from './context/ProfileContext'
import App from './App.tsx'
import '@fontsource-variable/inter/wght.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <DateRangeProvider><ProfileProvider>
                    <App />
                </ProfileProvider></DateRangeProvider>
            </BrowserRouter>
        </QueryClientProvider>
    </React.StrictMode>,
)
