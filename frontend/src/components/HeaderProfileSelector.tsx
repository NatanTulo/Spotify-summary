import { useState, useEffect } from 'react'
import { User, Download } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { Button } from './ui/button'

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
        <div className="flex items-center gap-2 sm:gap-3">
            {/* Profile Selection - tylko jeśli jest więcej niż jeden profil */}
            {hasMultipleProfiles && (
                <div className="flex items-center gap-1 sm:gap-2">
                    <User className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    <div className="segmented">
                        <Button
                            onClick={() => onProfileSelect(null)}
                            disabled={isLoading}
                            variant={selectedProfile === null ? 'default' : 'outline'}
                            size="sm"
                            className={`segmented-btn text-xs sm:text-sm px-2 sm:px-3 ${selectedProfile === null ? 'segmented-btn-active' : ''}`}
                        >
                            {t('allProfiles')}
                        </Button>
                        {profiles.map((profile) => (
                            <Button
                                key={profile._id}
                                onClick={() => onProfileSelect(profile._id)}
                                disabled={isLoading}
                                variant={selectedProfile === profile._id ? 'default' : 'outline'}
                                size="sm"
                                className={`segmented-btn text-xs sm:text-sm px-2 sm:px-3 ${selectedProfile === profile._id ? 'segmented-btn-active' : ''}`}
                            >
                                <span className="truncate max-w-[60px] sm:max-w-none">
                                    {profile.name}
                                </span>
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            {/* Import Button - zawsze widoczny */}
            <Button
                onClick={onImportRequested}
                disabled={isLoading}
                variant="spotify"
                size="sm"
                className="inline-flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
            >
                <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">
                    {hasDataToImport ? t('importData') : t('dataManagement')}
                </span>
            </Button>
        </div>
    )
}
