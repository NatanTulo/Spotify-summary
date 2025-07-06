import { useState, useEffect } from 'react'
import { User, Download } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

interface Profile {
    _id: string
    name: string
    username?: string
    lastImport?: string
    statistics: {
        totalPlays: number
        totalMinutes: number
        uniqueTracks: number
        uniqueArtists: number
        uniqueAlbums: number
    }
    createdAt: string
}

interface HeaderProfileSelectorProps {
    selectedProfile: string | null
    onProfileSelect: (profileId: string | null) => void
    onImportRequested: () => void
    isLoading?: boolean
    refreshTrigger?: number // Dodajemy trigger do odświeżania profili
}

export const HeaderProfileSelector = ({
    selectedProfile,
    onProfileSelect,
    onImportRequested,
    isLoading = false,
    refreshTrigger = 0
}: HeaderProfileSelectorProps) => {
    const { t } = useLanguage()
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [availableProfiles, setAvailableProfiles] = useState<Array<{ name: string, files: any[] }>>([])

    const fetchProfiles = async () => {
        try {
            const [profilesRes, statusRes] = await Promise.all([
                fetch('/api/import/profiles'),
                fetch('/api/import/status')
            ])

            if (profilesRes.ok) {
                const profilesData = await profilesRes.json()
                const newProfiles = profilesData.data || []
                setProfiles(newProfiles)
                
                // Sprawdź czy wybrany profil nadal istnieje
                if (selectedProfile && !newProfiles.find((p: Profile) => p._id === selectedProfile)) {
                    onProfileSelect(null)
                }
                
                // Automatycznie wybierz pierwszy profil jeśli nie ma wybranego
                if (!selectedProfile && newProfiles.length > 0) {
                    onProfileSelect(newProfiles[0]._id)
                }
            }

            if (statusRes.ok) {
                const statusData = await statusRes.json()
                setAvailableProfiles(statusData.data?.profiles || [])
            }
        } catch (error) {
            console.error('Error fetching profiles:', error)
        }
    }

    useEffect(() => {
        fetchProfiles()
    }, [refreshTrigger]) // Odświeżaj gdy refreshTrigger się zmieni

    const hasDataToImport = availableProfiles.length > 0
    const hasMultipleProfiles = profiles.length > 1

    return (
        <div className="flex items-center gap-3">
            {/* Profile Selection - tylko jeśli jest więcej niż jeden profil */}
            {hasMultipleProfiles && (
                <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div className="flex gap-1">
                        <button
                            onClick={() => onProfileSelect(null)}
                            disabled={isLoading}
                            className={`h-9 rounded-md px-3 text-sm border transition-colors ${selectedProfile === null
                                    ? 'bg-primary text-primary-foreground'
                                    : 'border-input bg-background hover:bg-accent hover:text-accent-foreground'
                                } disabled:pointer-events-none disabled:opacity-50`}
                        >
                            {t('allProfiles')}
                        </button>
                        {profiles.map((profile) => (
                            <button
                                key={profile._id}
                                onClick={() => onProfileSelect(profile._id)}
                                disabled={isLoading}
                                className={`h-9 rounded-md px-3 text-sm border transition-colors ${selectedProfile === profile._id
                                        ? 'bg-primary text-primary-foreground'
                                        : 'border-input bg-background hover:bg-accent hover:text-accent-foreground'
                                    } disabled:pointer-events-none disabled:opacity-50`}
                            >
                                {profile.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Import Button - zawsze widoczny */}
            <button
                onClick={onImportRequested}
                disabled={isLoading}
                className="inline-flex items-center gap-2 h-9 rounded-md px-3 text-sm font-medium bg-spotify-green text-white hover:bg-spotify-green/90 disabled:pointer-events-none disabled:opacity-50"
            >
                <Download className="h-4 w-4" />
                {hasDataToImport ? t('importData') : t('dataManagement')}
            </button>
        </div>
    )
}
