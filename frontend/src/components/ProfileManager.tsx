import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Calendar, User, Play, Clock, Music, Users } from 'lucide-react'

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

interface ProfileManagerProps {
    selectedProfile: string | null
    onProfileSelect: (profileId: string | null) => void
    onImportProfile: (profileName: string) => void
    onClearProfile: (profileId: string) => void
    isLoading?: boolean
}

export const ProfileManager: React.FC<ProfileManagerProps> = ({
    selectedProfile,
    onProfileSelect,
    onImportProfile,
    onClearProfile,
    isLoading = false
}) => {
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [availableProfiles, setAvailableProfiles] = useState<Array<{ name: string, files: any[] }>>([])
    const [isLoadingProfiles, setIsLoadingProfiles] = useState(false)
    const [importingProfile, setImportingProfile] = useState<string | null>(null)

    const fetchProfiles = async () => {
        setIsLoadingProfiles(true)
        try {
            const [profilesRes, statusRes] = await Promise.all([
                fetch('/api/import/profiles'),
                fetch('/api/import/status')
            ])

            if (profilesRes.ok) {
                const profilesData = await profilesRes.json()
                setProfiles(profilesData.data || [])
            }

            if (statusRes.ok) {
                const statusData = await statusRes.json()
                setAvailableProfiles(statusData.data?.profiles || [])
            }
        } catch (error) {
            console.error('Error fetching profiles:', error)
        } finally {
            setIsLoadingProfiles(false)
        }
    }

    useEffect(() => {
        fetchProfiles()
    }, [])

    const handleImportProfile = async (profileName: string) => {
        setImportingProfile(profileName)
        try {
            const response = await fetch(`/api/import/profile/${profileName}`, {
                method: 'POST'
            })

            if (response.ok) {
                onImportProfile(profileName)
                // Refresh profiles after a delay to allow import to start
                setTimeout(fetchProfiles, 2000)
            }
        } catch (error) {
            console.error('Error importing profile:', error)
        } finally {
            setImportingProfile(null)
        }
    }

    const handleClearProfile = async (profileId: string) => {
        if (!confirm('Czy na pewno chcesz usunąć wszystkie dane tego profilu?')) return

        try {
            const response = await fetch(`/api/import/clear?profileId=${profileId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                onClearProfile(profileId)
                await fetchProfiles()
                if (selectedProfile === profileId) {
                    onProfileSelect(null)
                }
            }
        } catch (error) {
            console.error('Error clearing profile:', error)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pl-PL', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        if (hours > 0) {
            return `${hours}h ${mins}m`
        }
        return `${mins}m`
    }

    return (
        <div className="space-y-6">
            {/* Profile Selection */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Wybór Profilu
                    </CardTitle>
                    <CardDescription>
                        Wybierz profil do analizy lub wyświetl dane ze wszystkich profili
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant={selectedProfile === null ? "default" : "outline"}
                            onClick={() => onProfileSelect(null)}
                            disabled={isLoading}
                        >
                            Wszystkie Profile
                        </Button>
                        {profiles.map((profile) => (
                            <Button
                                key={profile._id}
                                variant={selectedProfile === profile._id ? "default" : "outline"}
                                onClick={() => onProfileSelect(profile._id)}
                                disabled={isLoading}
                                className="flex items-center gap-2"
                            >
                                <User className="h-4 w-4" />
                                {profile.name}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Available Data Sources */}
            {availableProfiles.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Dostępne Dane do Importu</CardTitle>
                        <CardDescription>
                            Profile wykryte w folderze data, które można zaimportować
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            {availableProfiles.map((profile) => (
                                <div
                                    key={profile.name}
                                    className="border rounded-lg p-4 space-y-2"
                                >
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium">{profile.name}</h4>
                                        <Button
                                            size="sm"
                                            onClick={() => handleImportProfile(profile.name)}
                                            disabled={importingProfile === profile.name}
                                        >
                                            {importingProfile === profile.name ? 'Importowanie...' : 'Importuj'}
                                        </Button>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {profile.files.length} plików JSON
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Imported Profiles */}
            {profiles.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Zaimportowane Profile</CardTitle>
                        <CardDescription>
                            Profile z danymi gotowymi do analizy
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            {profiles.map((profile) => (
                                <div
                                    key={profile._id}
                                    className={`border rounded-lg p-4 space-y-3 transition-colors ${selectedProfile === profile._id
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                                        : 'hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            {profile.name}
                                        </h4>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleClearProfile(profile._id)}
                                        >
                                            Usuń
                                        </Button>
                                    </div>

                                    {profile.lastImport && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Calendar className="h-3 w-3" />
                                            {formatDate(profile.lastImport)}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="flex items-center gap-1">
                                            <Play className="h-3 w-3" />
                                            {profile.statistics.totalPlays.toLocaleString()} odtworzeń
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatDuration(profile.statistics.totalMinutes)}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Music className="h-3 w-3" />
                                            {profile.statistics.uniqueTracks.toLocaleString()} utworów
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            {profile.statistics.uniqueArtists.toLocaleString()} artystów
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Empty State */}
            {profiles.length === 0 && availableProfiles.length === 0 && !isLoadingProfiles && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                        <User className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">Brak Danych</h3>
                        <p className="text-muted-foreground text-center mb-4">
                            Umieść foldery z danymi Spotify w folderze /data aby rozpocząć import
                        </p>
                        <Button onClick={fetchProfiles} disabled={isLoadingProfiles}>
                            Odśwież
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
