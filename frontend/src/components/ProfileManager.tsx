import { useState, useEffect } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Progress } from './ui/progress'
import { Calendar, User, Play, Clock, Music, Users } from 'lucide-react'
import { ImportProgressDisplay } from './ImportProgressDisplay'

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

interface ImportProgress {
    profileName: string
    isRunning: boolean
    currentFile: string
    currentFileIndex: number
    totalFiles: number
    currentRecord: number
    totalRecordsInFile: number
    completedFiles: number
    totalRecordsProcessed: number
    estimatedTotalRecords: number
    startTime: string
    lastUpdate: string
    status: 'preparing' | 'importing' | 'completed' | 'error' | 'cancelled'
    error?: string
    percentage: number
    stats: {
        filesProcessed: number
        totalRecords: number
        artistsCreated: number
        albumsCreated: number
        tracksCreated: number
        playsCreated: number
        skippedRecords: number
    }
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
    const [activeImportProfile, setActiveImportProfile] = useState<string | null>(null)
    const [importProgress, setImportProgress] = useState<Record<string, ImportProgress>>({})

    // Fetch import progress for specific profile
    const fetchImportProgress = async (profileName: string) => {
        try {
            const response = await fetch(`/api/import/progress/${profileName}`)
            if (response.ok) {
                const data = await response.json()
                if (data.success && data.data) {
                    setImportProgress(prev => ({
                        ...prev,
                        [profileName]: data.data
                    }))
                    
                    // If import is completed or stopped, clean up
                    if (!data.data.isRunning) {
                        setTimeout(() => {
                            setImportProgress(prev => {
                                const newProgress = { ...prev }
                                delete newProgress[profileName]
                                return newProgress
                            })
                            if (activeImportProfile === profileName) {
                                setActiveImportProfile(null)
                            }
                        }, 3000) // Clean up after 3 seconds
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching import progress:', error)
        }
    }

    // Monitor active import progress
    useEffect(() => {
        if (activeImportProfile) {
            const interval = setInterval(() => {
                fetchImportProgress(activeImportProfile)
            }, 1000) // Update every second

            return () => clearInterval(interval)
        }
    }, [activeImportProfile])

    // Auto-refresh profiles periodically
    useEffect(() => {
        const interval = setInterval(() => {
            fetchProfiles()
        }, 1000) // Refresh every second

        return () => clearInterval(interval)
    }, [])

    const fetchProfiles = async () => {
        setIsLoadingProfiles(true)
        try {
            const [profilesRes, availableRes] = await Promise.all([
                fetch('/api/import/profiles'),
                fetch('/api/import/available')
            ])

            if (profilesRes.ok) {
                const profilesData = await profilesRes.json()
                setProfiles(profilesData.data || [])
            }

            if (availableRes.ok) {
                const availableData = await availableRes.json()
                setAvailableProfiles(availableData.data || [])
                
                // Check for active imports for each available profile
                for (const profile of availableData.data || []) {
                    const progressRes = await fetch(`/api/import/progress/${profile.name}`)
                    if (progressRes.ok) {
                        const progressData = await progressRes.json()
                        if (progressData.success && progressData.data && progressData.data.isRunning) {
                            setActiveImportProfile(profile.name)
                            setImportProgress(prev => ({
                                ...prev,
                                [profile.name]: progressData.data
                            }))
                        }
                    }
                }
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
                const data = await response.json()
                if (data.success && data.data.importStarted) {
                    setActiveImportProfile(profileName)
                    // Start monitoring progress immediately
                    fetchImportProgress(profileName)
                }
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
                        <button
                            className={`px-4 py-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${selectedProfile === null
                                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                    : "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                                }`}
                            onClick={() => onProfileSelect(null)}
                            disabled={isLoading}
                        >
                            Wszystkie Profile
                        </button>
                        {profiles.map((profile) => (
                            <button
                                key={profile._id}
                                className={`px-4 py-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 flex items-center gap-2 ${selectedProfile === profile._id
                                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                        : "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                                    }`}
                                onClick={() => onProfileSelect(profile._id)}
                                disabled={isLoading}
                            >
                                <User className="h-4 w-4" />
                                {profile.name}
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Active Import Progress */}
            {activeImportProfile && (
                <ImportProgressDisplay
                    profileName={activeImportProfile}
                    onClose={() => setActiveImportProfile(null)}
                />
            )}

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
                            {availableProfiles.map((profile) => {
                                const progress = importProgress[profile.name]
                                const isImporting = activeImportProfile === profile.name || importingProfile === profile.name
                                
                                return (
                                    <div
                                        key={profile.name}
                                        className="border rounded-lg p-4 space-y-2"
                                    >
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-medium">{profile.name}</h4>
                                            <button
                                                className="h-9 rounded-md px-3 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                                                onClick={() => handleImportProfile(profile.name)}
                                                disabled={isImporting}
                                            >
                                                {isImporting ? 'Importowanie...' : 'Importuj'}
                                            </button>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {profile.files.length} plików JSON
                                        </p>
                                        
                                        {/* Progress Bar */}
                                        {progress && progress.isRunning && (
                                            <div className="space-y-2 pt-2 border-t">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">
                                                        {progress.status === 'preparing' ? 'Przygotowywanie...' :
                                                         progress.status === 'importing' ? `Plik ${progress.currentFileIndex + 1}/${progress.totalFiles}` :
                                                         progress.status === 'completed' ? 'Zakończono' :
                                                         progress.status === 'error' ? 'Błąd' : 'Import...'}
                                                    </span>
                                                    <span className="font-medium">{Math.round(progress.percentage)}%</span>
                                                </div>
                                                <Progress value={progress.percentage} className="h-2" />
                                                {progress.currentFile && (
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {progress.currentFile}
                                                    </p>
                                                )}
                                                {progress.totalRecordsProcessed > 0 && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {progress.totalRecordsProcessed.toLocaleString()} / {progress.estimatedTotalRecords.toLocaleString()} rekordów
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* Debug info */}
                                        {process.env.NODE_ENV === 'development' && (
                                            <div className="text-xs text-gray-500 mt-2">
                                                <div>Active: {activeImportProfile}</div>
                                                <div>Progress exists: {progress ? 'YES' : 'NO'}</div>
                                                <div>Progress running: {progress?.isRunning ? 'YES' : 'NO'}</div>
                                                <div>Progress %: {progress?.percentage}</div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
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
                                        <button
                                            className="h-9 rounded-md px-3 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            onClick={() => handleClearProfile(profile._id)}
                                        >
                                            Usuń
                                        </button>
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
                                            {(profile.statistics?.totalPlays || 0).toLocaleString()} odtworzeń
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatDuration(profile.statistics?.totalMinutes || 0)}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Music className="h-3 w-3" />
                                            {(profile.statistics?.uniqueTracks || 0).toLocaleString()} utworów
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            {(profile.statistics?.uniqueArtists || 0).toLocaleString()} artystów
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
                        <button
                            onClick={fetchProfiles}
                            disabled={isLoadingProfiles}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Odśwież
                        </button>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
