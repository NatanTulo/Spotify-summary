import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Progress } from './ui/progress'
import { Calendar, User, Play, Clock, Music, Users } from 'lucide-react'
import { ImportProgressDisplay } from './ImportProgressDisplay'
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
        currentStats?: {
            totalPlays: number
            totalMinutes: number
            uniqueTracks: number
            uniqueArtists: number
            uniqueAlbums: number
        }
    }
}

interface ProfileManagerProps {
    selectedProfile: string | null
    onProfileSelect: (profileId: string | null) => void
    onImportProfile: (profileName: string) => void
    onClearProfile: (profileId: string) => void
    onProfilesChanged?: () => void // Callback gdy lista profili się zmieni
    isLoading?: boolean
}

export const ProfileManager: React.FC<ProfileManagerProps> = ({
    selectedProfile,
    onProfileSelect,
    onImportProfile,
    onClearProfile,
    onProfilesChanged,
    isLoading = false
}) => {
    const { t } = useLanguage()
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [availableProfiles, setAvailableProfiles] = useState<Array<{ name: string, files: any[] }>>([])
    const [isLoadingProfiles, setIsLoadingProfiles] = useState(false)
    const [importingProfile, setImportingProfile] = useState<string | null>(null)
    const [activeImports, setActiveImports] = useState<Set<string>>(new Set())
    const [importProgress, setImportProgress] = useState<Record<string, ImportProgress>>({})

    // Check for all active imports
    const checkActiveImports = async () => {
        try {
            console.log('🔍 Checking for active imports...')
            const response = await fetch('/api/import/progress')
            if (response.ok) {
                const data = await response.json()
                if (data.success && data.data) {
                    const activeProgressMap: Record<string, ImportProgress> = {}
                    const activeImportSet = new Set<string>()
                    
                    data.data.forEach((progress: ImportProgress) => {
                        if (progress.isRunning) {
                            console.log(`📥 Found active import for profile: ${progress.profileName}`)
                            activeProgressMap[progress.profileName] = progress
                            activeImportSet.add(progress.profileName)
                        }
                    })
                    
                    if (activeImportSet.size > 0) {
                        console.log(`🎯 Setting ${activeImportSet.size} active imports:`, Array.from(activeImportSet))
                    } else {
                        console.log('✅ No active imports found')
                    }
                    
                    setImportProgress(activeProgressMap)
                    setActiveImports(activeImportSet)
                }
            }
        } catch (error) {
            console.error('Error checking active imports:', error)
        }
    }

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
                            setActiveImports(prev => {
                                const newSet = new Set(prev)
                                newSet.delete(profileName)
                                return newSet
                            })
                        }, 3000) // Clean up after 3 seconds
                    } else {
                        // Add to active imports if running
                        setActiveImports(prev => new Set([...prev, profileName]))
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching import progress:', error)
        }
    }

    // Monitor active import progress for all active imports
    useEffect(() => {
        if (activeImports.size > 0) {
            const interval = setInterval(() => {
                activeImports.forEach(profileName => {
                    fetchImportProgress(profileName)
                })
            }, 2000) // Update every 2 seconds during import

            return () => clearInterval(interval)
        }
    }, [activeImports])

    // Auto-refresh profiles periodically and check for active imports
    useEffect(() => {
        const interval = setInterval(() => {
            fetchProfiles()
            // Also check for any new active imports
            checkActiveImports()
        }, 3000) // Refresh every 3 seconds

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
                // Powiadom parent component o zmianie profili
                onProfilesChanged?.()
            }

            if (availableRes.ok) {
                const availableData = await availableRes.json()
                setAvailableProfiles(availableData.data || [])
            }

            // Check for active imports after loading profiles
            await checkActiveImports()
            
        } catch (error) {
            console.error('Error fetching profiles:', error)
        } finally {
            setIsLoadingProfiles(false)
        }
    }

    useEffect(() => {
        console.log('🔄 ProfileManager component mounted, fetching profiles and checking imports...')
        fetchProfiles()
        // Also check for active imports immediately when component mounts
        checkActiveImports()
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
                    setActiveImports(prev => new Set([...prev, profileName]))
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
                            {t('allProfiles')}
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

            {/* Active Import Progress - Show multiple imports */}
            {Object.values(importProgress).some(p => p.isRunning) && (
                <Card>
                    <CardHeader>
                        <CardTitle>{t('activeImports')}</CardTitle>
                        <CardDescription>
                            {t('activeImportsDesc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {Object.values(importProgress).filter(p => p.isRunning).map(progress => (
                                <ImportProgressDisplay
                                    key={progress.profileName}
                                    profileName={progress.profileName}
                                    onClose={() => {
                                        setActiveImports(prev => {
                                            const newSet = new Set(prev)
                                            newSet.delete(progress.profileName)
                                            return newSet
                                        })
                                        setImportProgress(prev => {
                                            const newProgress = { ...prev }
                                            delete newProgress[progress.profileName]
                                            return newProgress
                                        })
                                    }}
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>
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
                                const isImporting = activeImports.has(profile.name) || importingProfile === profile.name
                                
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
                                                
                                                {/* Real-time Statistics */}
                                                {progress.stats.currentStats && (
                                                    <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 text-xs space-y-1">
                                                        <div className="font-medium text-gray-700 dark:text-gray-300">Bieżące statystyki:</div>
                                                        <div className="grid grid-cols-2 gap-1 text-gray-600 dark:text-gray-400">
                                                            <div>▶️ {progress.stats.currentStats.totalPlays.toLocaleString()} odtworzeń</div>
                                                            <div>🎵 {progress.stats.currentStats.uniqueTracks.toLocaleString()} utworów</div>
                                                            <div>👨‍🎤 {progress.stats.currentStats.uniqueArtists.toLocaleString()} artystów</div>
                                                            <div>💿 {progress.stats.currentStats.uniqueAlbums.toLocaleString()} albumów</div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* Debug info */}
                                        {process.env.NODE_ENV === 'development' && (
                                            <div className="text-xs text-gray-500 mt-2">
                                                <div>Active imports: {Array.from(activeImports).join(', ')}</div>
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
