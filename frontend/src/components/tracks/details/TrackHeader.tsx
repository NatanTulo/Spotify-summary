import { ArrowLeft } from 'lucide-react'
import { useLanguage } from '../../../context/LanguageContext'

interface TrackHeaderProps {
    trackName: string
    artistName: string
    albumName: string
    onBack: () => void
}

export function TrackHeader({ trackName, artistName, albumName, onBack }: TrackHeaderProps) {
    const { t } = useLanguage()
    
    return (
        <div className="flex items-center gap-4">
            <button
                onClick={onBack}
                className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-accent hover:text-accent-foreground"
            >
                <ArrowLeft className="h-4 w-4" />
                {t('back')}
            </button>
            <div>
                <h1 className="text-2xl font-bold">{trackName}</h1>
                <p className="text-muted-foreground">{artistName} • {albumName}</p>
            </div>
        </div>
    )
}
