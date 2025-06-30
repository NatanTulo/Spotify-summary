import { Moon, Sun, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/useTheme'

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()

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
                return 'Switch to dark mode'
            case 'dark':
                return 'Switch to system mode'
            case 'system':
                return 'Switch to light mode'
            default:
                return 'Toggle theme'
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
