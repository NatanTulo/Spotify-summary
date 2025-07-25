import { Moon, Sun, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/useTheme'
import { useLanguage } from '@/context/LanguageContext'

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const { t } = useLanguage()

    const toggleTheme = () => {
        if (theme === 'light') {
            setTheme('dark')
        } else if (theme === 'dark') {
            setTheme('system')
        } else {
            setTheme('light')
        }
    }

    const getIcon = () => {
        switch (theme) {
            case 'light':
                return <Sun className="h-4 w-4" />
            case 'dark':
                return <Moon className="h-4 w-4" />
            case 'system':
                return <Monitor className="h-4 w-4" />
            default:
                return <Sun className="h-4 w-4" />
        }
    }

    const getTooltip = () => {
        switch (theme) {
            case 'light':
                return t('darkTheme')
            case 'dark':
                return t('systemTheme')
            case 'system':
                return t('lightTheme')
            default:
                return t('lightTheme')
        }
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={getTooltip()}
            className="h-9 w-9"
        >
            {getIcon()}
        </Button>
    )
}
