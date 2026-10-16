import { useEffect, useState } from 'react'
type Theme = 'light' | 'dark' | 'system'
const readTheme = (): Theme => {
    try {
        const saved = localStorage.getItem('theme')
        return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'dark'
    } catch { return 'dark' }
}
export function useTheme() {
    const [theme, setTheme] = useState<Theme>(readTheme)
    useEffect(() => {
        const media = window.matchMedia('(prefers-color-scheme: dark)')
        const apply = () => {
            const resolved = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme
            document.documentElement.classList.remove('light', 'dark')
            document.documentElement.classList.add(resolved)
        }
        apply()
        media.addEventListener('change', apply)
        return () => media.removeEventListener('change', apply)
    }, [theme])
    useEffect(() => {
        const sync = (event: StorageEvent) => { if (event.key === 'theme') setTheme(readTheme()) }
        window.addEventListener('storage', sync)
        return () => window.removeEventListener('storage', sync)
    }, [])
    return { theme, setTheme: (next: Theme) => {
        try { localStorage.setItem('theme', next) } catch { /* Theme still works if storage is unavailable. */ }
        setTheme(next)
    } }
}
