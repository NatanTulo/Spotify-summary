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
                throw new Error('Failed to fetch audiobooks')
            }

            const data = await response.json()
            if (data.success) {
                setAudiobooks(data.data.audiobooks)
            } else {
                throw new Error(data.error || 'Failed to fetch audiobooks')
            }
        } catch (err) {
            console.error('Error fetching audiobooks:', err)
            setError(err instanceof Error ? err.message : 'Unknown error occurred')
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

            {error && (
                <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-lg mb-6">
                    {error}
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
