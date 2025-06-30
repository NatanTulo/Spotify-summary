import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Info, X } from 'lucide-react'

interface FieldDescription {
    field: string
    description: string
    example?: string
    type: string
}

const fieldDescriptions: FieldDescription[] = [
    {
        field: 'ts',
        description: 'Timestamp kiedy utwór został odtworzony',
        example: '2023-01-15T14:30:00Z',
        type: 'Date'
    },
    {
        field: 'username',
        description: 'Nazwa użytkownika Spotify (jeśli dostępna)',
        example: 'john_doe',
        type: 'String'
    },
    {
        field: 'platform',
        description: 'Platforma/urządzenie na którym odtworzono utwór',
        example: 'Android OS 13 API 33 (samsung, SM-G998B)',
        type: 'String'
    },
    {
        field: 'ms_played',
        description: 'Ile milisekund utwór był odtwarzany',
        example: '215000 (3 minuty 35 sekund)',
        type: 'Number'
    },
    {
        field: 'conn_country',
        description: 'Kraj z którego nastąpiło połączenie (kod ISO)',
        example: 'PL, US, DE',
        type: 'String'
    },
    {
        field: 'ip_addr',
        description: 'Adres IP użytkownika (może być zanonimizowany)',
        example: '192.168.1.1',
        type: 'String'
    },
    {
        field: 'master_metadata_track_name',
        description: 'Nazwa utworu',
        example: 'Bohemian Rhapsody',
        type: 'String'
    },
    {
        field: 'master_metadata_album_artist_name',
        description: 'Nazwa artysty',
        example: 'Queen',
        type: 'String'
    },
    {
        field: 'master_metadata_album_album_name',
        description: 'Nazwa albumu',
        example: 'A Night at the Opera',
        type: 'String'
    },
    {
        field: 'spotify_track_uri',
        description: 'Unikalny identyfikator utworu w Spotify',
        example: 'spotify:track:4u7EnebtmKWzUH433cf5Qv',
        type: 'String'
    },
    {
        field: 'reason_start',
        description: 'Powód rozpoczęcia odtwarzania',
        example: 'clickrow, playbtn, trackdone',
        type: 'String'
    },
    {
        field: 'reason_end',
        description: 'Powód zakończenia odtwarzania',
        example: 'trackdone, endplay, fwdbtn',
        type: 'String'
    },
    {
        field: 'shuffle',
        description: 'Czy odtwarzanie w trybie losowym było włączone',
        example: 'true/false',
        type: 'Boolean'
    },
    {
        field: 'skipped',
        description: 'Czy utwór został pominięty przez użytkownika',
        example: 'true/false',
        type: 'Boolean'
    },
    {
        field: 'offline',
        description: 'Czy utwór był odtwarzany w trybie offline',
        example: 'true/false',
        type: 'Boolean'
    },
    {
        field: 'offline_timestamp',
        description: 'Timestamp kiedy utwór został pobrany offline',
        example: '2023-01-14T10:00:00Z',
        type: 'Date'
    },
    {
        field: 'incognito_mode',
        description: 'Czy odtwarzanie było w trybie prywatnym',
        example: 'true/false',
        type: 'Boolean'
    }
]

interface DataLegendProps {
    isOpen: boolean
    onClose: () => void
}

export const DataLegend = ({ isOpen, onClose }: DataLegendProps) => {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <Card className="max-w-4xl max-h-[90vh] overflow-y-auto w-full">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Info className="h-5 w-5" />
                            Legenda Pól Danych Spotify
                        </CardTitle>
                        <CardDescription>
                            Opis wszystkich pól dostępnych w danych ze Spotify Extended Streaming History
                        </CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">
                        {fieldDescriptions.map((field) => (
                            <div key={field.field} className="border-b pb-3 last:border-b-0">
                                <div className="flex items-start gap-4">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                                                {field.field}
                                            </code>
                                            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                {field.type}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-1">
                                            {field.description}
                                        </p>
                                        {field.example && (
                                            <p className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded">
                                                Przykład: {field.example}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-medium mb-2">Informacje dodatkowe:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Dane pochodzą z eksportu GDPR Spotify (Extended Streaming History)</li>
                            <li>• Niektóre pola mogą być puste lub niedostępne w starszych rekordach</li>
                            <li>• Czas odtwarzania (ms_played) może być krótszy niż długość utworu jeśli został pominięty</li>
                            <li>• Adresy IP i dane user agent mogą być zanonimizowane ze względów prywatności</li>
                            <li>• Podcasty i audioserialne są filtrowane i nie są uwzględniane w statystykach</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

interface DataLegendButtonProps {
    className?: string
}

export const DataLegendButton = ({ className }: DataLegendButtonProps) => {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(true)}
                className={className}
            >
                <Info className="h-4 w-4 mr-2" />
                Legenda Pól
            </Button>
            <DataLegend isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    )
}
