import { useState, useEffect } from 'react'
import { Progress } from './ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { X, Clock, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

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
        showsCreated?: number
        episodesCreated?: number
        videoPlaysCreated?: number
        skippedRecords: number
    }
}

interface ImportProgressDisplayProps {
    profileName?: string
    onClose?: () => void
    className?: string
}

export const ImportProgressDisplay = ({ profileName, onClose, className }: ImportProgressDisplayProps) => {
    const { t } = useLanguage()
    const [progress, setProgress] = useState<ImportProgress | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const fetchProgress = async () => {
        try {
            const url = profileName
                ? `/api/import/progress/${profileName}`
                : '/api/import/progress'

            const response = await fetch(url)
            if (response.ok) {
                const data = await response.json()
                if (data.success) {
                    if (profileName) {
                        setProgress(data.data)
                    } else {
                        // Jeśli nie ma konkretnego profilu, weź pierwszy aktywny import
                        const activeImports = data.data?.filter((p: ImportProgress) => p.isRunning) || []
                        setProgress(activeImports.length > 0 ? activeImports[0] : null)
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch import progress:', error)
        }
    }

    const cancelImport = async () => {
        if (!progress) return

        setIsLoading(true)
        try {
            const response = await fetch(`/api/import/progress/${progress.profileName}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                setProgress(null)
                onClose?.()
            }
        } catch (error) {
            console.error('Failed to cancel import:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchProgress()

        // Odświeżaj progress co 2 sekundy gdy import jest aktywny
        const interval = setInterval(() => {
            if (progress?.isRunning) {
                fetchProgress()
            }
        }, 2000)

        return () => clearInterval(interval)
    }, [profileName, progress?.isRunning])

    // Jeśli nie ma progress, nie wyświetlaj nic
    if (!progress) {
        return null
    }

    const formatDuration = (startTime: string) => {
        const start = new Date(startTime)
        const now = new Date()
        const diff = Math.floor((now.getTime() - start.getTime()) / 1000)
        const minutes = Math.floor(diff / 60)
        const seconds = diff % 60
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    const getStatusIcon = () => {
        switch (progress.status) {
            case 'completed':
                return <CheckCircle className="h-5 w-5 text-green-500" />
            case 'error':
            case 'cancelled':
                return <AlertCircle className="h-5 w-5 text-red-500" />
            default:
                return <FileText className="h-5 w-5 text-blue-500" />
        }
    }

    const getStatusText = () => {
        switch (progress.status) {
            case 'preparing':
                return t('preparingImport')
            case 'importing':
                return `${t('importingFile')} ${progress.currentFileIndex + 1}/${progress.totalFiles}: ${progress.currentFile}`
            case 'completed':
                return t('importCompleted')
            case 'error':
                return `${t('importErrorMsg')}: ${progress.error || t('unknownError')}`
            case 'cancelled':
                return t('importCancelled')
            default:
                return t('unknownStatus')
        }
    }

    return (
        <Card className={className}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {getStatusIcon()}
                        <CardTitle className="text-lg">Import: {progress.profileName}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {formatDuration(progress.startTime)}
                        </div>
                        {onClose && (<Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="h-8 w-8"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                        )}
                    </div>
                </div>
                <CardDescription>
                    {getStatusText()}
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{t('overallProgress')}</span>
                        <span>{progress.percentage}%</span>
                    </div>
                    <Progress value={progress.percentage} className="h-2" />
                </div>

                {/* File Progress */}
                {progress.status === 'importing' && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>{t('currentFile')}</span>
                            <span>{progress.currentRecord}/{progress.totalRecordsInFile}</span>
                        </div>
                        <Progress
                            value={progress.totalRecordsInFile > 0 ? (progress.currentRecord / progress.totalRecordsInFile) * 100 : 0}
                            className="h-1"
                        />
                    </div>
                )}

                {/* Statistics */}
                <div className={`grid gap-4 text-sm ${(progress.stats.showsCreated ?? 0) > 0 || (progress.stats.episodesCreated ?? 0) > 0 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    <div>
                        <div className="text-muted-foreground">{t('filesLabel')}</div>
                        <div className="font-medium">{progress.completedFiles}/{progress.totalFiles}</div>
                    </div>
                    <div>
                        <div className="text-muted-foreground">{t('recordsLabel')}</div>
                        <div className="font-medium">{progress.totalRecordsProcessed.toLocaleString()}</div>
                    </div>
                    <div>
                        <div className="text-muted-foreground">{t('artistsLabel')}</div>
                        <div className="font-medium">{progress.stats.artistsCreated.toLocaleString()}</div>
                    </div>
                    <div>
                        <div className="text-muted-foreground">{t('tracksLabel')}</div>
                        <div className="font-medium">{progress.stats.tracksCreated.toLocaleString()}</div>
                    </div>
                    {((progress.stats.showsCreated ?? 0) > 0 || (progress.stats.episodesCreated ?? 0) > 0) && (
                        <>
                            <div>
                                <div className="text-muted-foreground">{t('showsStats')}</div>
                                <div className="font-medium">{(progress.stats.showsCreated ?? 0).toLocaleString()}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">{t('episodesStats')}</div>
                                <div className="font-medium">{(progress.stats.episodesCreated ?? 0).toLocaleString()}</div>
                            </div>
                        </>
                    )}
                </div>

                {/* Actions */}
                {progress.isRunning && progress.status === 'importing' && (
                    <div className="flex justify-end">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={cancelImport}
                            disabled={isLoading}
                        >
                            {isLoading ? t('cancelling') : t('cancelImport')}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
