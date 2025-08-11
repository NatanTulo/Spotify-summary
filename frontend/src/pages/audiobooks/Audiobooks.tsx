import React, { useState, useEffect } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useProfile } from '../../context/ProfileContext'

interface Audiobook {
    id: number
    name: string
    author?: string
    spotifyUri?: string
    description?: string
}

interface AudiobookPlay {
    id: number
    audiobookId: number
    timestamp: string
    msPlayed: number
    platform?: string
    country?: string
    reasonStart?: string
    reasonEnd?: string
    shuffle?: boolean
    skipped?: boolean
    offline?: boolean
    incognitoMode?: boolean
    audiobook?: Audiobook
}

const Audiobooks: React.FC = () => {
    const { t } = useLanguage()
    const { selectedProfile } = useProfile()
    const [audiobooks, setAudiobooks] = useState<Audiobook[]>([])
    const [plays, setPlays] = useState<AudiobookPlay[]>([])
    const [selectedAudiobook, setSelectedAudiobook] = useState<Audiobook | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (selectedProfile) {
            fetchAudiobooks()
        }
    }, [selectedProfile])

    const fetchAudiobooks = async () => {
        if (!selectedProfile) return

        setLoading(true)
        setError(null)

        try {
            const response = await fetch(`/api/audiobooks/${selectedProfile}`)
            if (!response.ok) {
                if (response.status >= 500) {
                    throw new Error('CONNECTION_ERROR')
                } else if (response.status === 404) {
                    throw new Error('ENDPOINT_NOT_FOUND')
                } else {
                    throw new Error('FETCH_ERROR')
                }
            }

            const data = await response.json()
            if (data.success) {
                setAudiobooks(data.data.audiobooks)
                // Clear error when successfully fetched data (even if empty)
                setError(null)
            } else {
                throw new Error(data.error || 'FETCH_ERROR')
            }
        } catch (err) {
            console.error('Error fetching audiobooks:', err)
            const errorMessage = err instanceof Error ? err.message : 'UNKNOWN_ERROR'
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const fetchAudiobookPlays = async (audiobookId: number) => {
        if (!selectedProfile) return

        setLoading(true)
        setError(null)

        try {
            const response = await fetch(`/api/audiobooks/${selectedProfile}/audiobook/${audiobookId}/plays`)
            if (!response.ok) {
                throw new Error('Failed to fetch audiobook plays')
            }

            const data = await response.json()
            if (data.success) {
                setPlays(data.data.plays)
            } else {
                throw new Error(data.error || 'Failed to fetch audiobook plays')
            }
        } catch (err) {
            console.error('Error fetching audiobook plays:', err)
            setError(err instanceof Error ? err.message : 'Unknown error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleAudiobookSelect = (audiobook: Audiobook) => {
        setSelectedAudiobook(audiobook)
        fetchAudiobookPlays(audiobook.id)
    }

    const formatDuration = (msPlayed: number) => {
        const minutes = Math.floor(msPlayed / 60000)
        const seconds = Math.floor((msPlayed % 60000) / 1000)
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    const formatDate = (timestamp: string) => {
        return new Date(timestamp).toLocaleString()
    }

    const getErrorMessage = (errorCode: string) => {
        switch (errorCode) {
            case 'NO_DATA':
                return t('noAudiobooksInDatabase') || 'No audiobook data in database for this profile'
            case 'CONNECTION_ERROR':
                return t('audiobooksConnectionError') || 'Connection error while fetching audiobooks'
            case 'FETCH_ERROR':
                return t('failedToFetchAudiobooks') || 'Failed to fetch audiobooks list'
            case 'ENDPOINT_NOT_FOUND':
                return t('endpointNotFound') || 'Endpoint not found - server configuration issue'
            case 'UNKNOWN_ERROR':
                return t('unknownAudiobooksError') || 'An unknown error occurred while loading audiobooks'
            default:
                return errorCode.includes('Failed to fetch') 
                    ? t('failedToFetchAudiobooks') || errorCode
                    : errorCode
        }
    }

    if (!selectedProfile) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">{t('selectProfile')}</p>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">{t('audiobooks') || 'Audiobooks'}</h1>

            {/* Spotify Audiobooks Info Banner */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 text-blue-600 dark:text-blue-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-blue-900 dark:text-blue-100">
                            {t('audiobooksInfoBanner') || 'Did you know? Spotify offers audiobooks through their Audiobooks Access plan (US only). Learn more about their audiobook catalog and subscription options.'}
                        </p>
                        <a 
                            href="https://support.spotify.com/us/article/audiobooks-access-plan/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                        >
                            {t('spotifyAudiobooksInfo') || 'Spotify Audiobooks Info'}
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-lg mb-6">
                    <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p className="font-medium">{getErrorMessage(error)}</p>
                            {error === 'CONNECTION_ERROR' && (
                                <p className="text-sm mt-1 opacity-90">
                                    {t('connectionErrorHelp') || 'Check your internet connection and if the server is running.'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Audiobooks List */}
                <div className="lg:col-span-1">
                    <h2 className="text-xl font-semibold mb-4">{t('audiobooksList') || 'Your Audiobooks'}</h2>
                    
                    {loading && !selectedAudiobook && (
                        <div className="flex items-center justify-center h-32">
                            <p className="text-muted-foreground">{t('loading') || 'Loading...'}</p>
                        </div>
                    )}

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {audiobooks.map((audiobook) => (
                            <div
                                key={audiobook.id}
                                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                    selectedAudiobook?.id === audiobook.id
                                        ? 'bg-primary text-primary-foreground'
                                        : 'hover:bg-muted'
                                }`}
                                onClick={() => handleAudiobookSelect(audiobook)}
                            >
                                <h3 className="font-medium truncate">{audiobook.name}</h3>
                                {audiobook.author && (
                                    <p className="text-sm opacity-75 truncate">{audiobook.author}</p>
                                )}
                            </div>
                        ))}
                    </div>

                    {!loading && audiobooks.length === 0 && (
                        <p className="text-muted-foreground text-center py-8">
                            {t('noAudiobooks') || 'No audiobooks found'}
                        </p>
                    )}
                </div>

                {/* Audiobook Plays */}
                <div className="lg:col-span-2">
                    {selectedAudiobook ? (
                        <>
                            <div className="mb-4">
                                <h2 className="text-xl font-semibold">{selectedAudiobook.name}</h2>
                                {selectedAudiobook.author && (
                                    <p className="text-muted-foreground">{t('by') || 'by'} {selectedAudiobook.author}</p>
                                )}
                            </div>

                            {loading && (
                                <div className="flex items-center justify-center h-32">
                                    <p className="text-muted-foreground">{t('loading') || 'Loading...'}</p>
                                </div>
                            )}

                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {plays.map((play) => (
                                    <div key={play.id} className="p-4 rounded-lg border">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium">{formatDate(play.timestamp)}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {t('duration') || 'Duration'}: {formatDuration(play.msPlayed)}
                                                </p>
                                                {play.platform && (
                                                    <p className="text-sm text-muted-foreground">
                                                        {t('platform') || 'Platform'}: {play.platform}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {play.skipped && <span className="text-orange-500">⏭ {t('skipped') || 'Skipped'}</span>}
                                                {play.offline && <span className="text-blue-500">📱 {t('offline') || 'Offline'}</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {!loading && plays.length === 0 && (
                                <p className="text-muted-foreground text-center py-8">
                                    {t('noPlaysFound') || 'No plays found for this audiobook'}
                                </p>
                            )}
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-64">
                            <p className="text-muted-foreground">
                                {t('selectAudiobook') || 'Select an audiobook to see listening history'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Audiobooks
