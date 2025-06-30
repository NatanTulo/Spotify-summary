import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Info, X, Clock, MapPin, Monitor, Shuffle, SkipForward, WifiOff, EyeOff } from 'lucide-react'

interface DataLegendProps {
    variant?: 'button' | 'inline'
}

export const DataLegend = ({ variant = 'button' }: DataLegendProps) => {
    const [isOpen, setIsOpen] = useState(false)

    const legendItems = [
        {
            icon: <Clock className="h-4 w-4" />,
            field: 'ms_played',
            label: 'Czas odtwarzania',
            description: 'Liczba milisekund przez które utwór był odtwarzany'
        },
        {
            icon: <MapPin className="h-4 w-4" />,
            field: 'conn_country',
            label: 'Kraj',
            description: 'Kod kraju z którego utwór był odtwarzany (np. PL - Polska)'
        },
        {
            icon: <Monitor className="h-4 w-4" />,
            field: 'platform',
            label: 'Platforma',
            description: 'Urządzenie/platforma na której był odtwarzany utwór (np. Android, iOS, Desktop)'
        },
        {
            icon: <Shuffle className="h-4 w-4" />,
            field: 'shuffle',
            label: 'Shuffle',
            description: 'Czy tryb losowego odtwarzania był włączony (True/False)'
        },
        {
            icon: <SkipForward className="h-4 w-4" />,
            field: 'skipped',
            label: 'Pominięty',
            description: 'Czy użytkownik przeskoczył do następnego utworu (True/False)'
        },
        {
            icon: <WifiOff className="h-4 w-4" />,
            field: 'offline',
            label: 'Offline',
            description: 'Czy utwór był odtwarzany w trybie offline (True/False)'
        },
        {
            icon: <EyeOff className="h-4 w-4" />,
            field: 'incognito_mode',
            label: 'Tryb prywatny',
            description: 'Czy utwór był odtwarzany w sesji prywatnej (True/False)'
        }
    ]

    const additionalFields = [
        {
            field: 'ts',
            label: 'Timestamp',
            description: 'Data i czas zakończenia odtwarzania w UTC'
        },
        {
            field: 'username',
            label: 'Nazwa użytkownika',
            description: 'Nazwa użytkownika Spotify'
        },
        {
            field: 'ip_addr',
            label: 'Adres IP',
            description: 'Adres IP z którego odtwarzano utwór'
        },
        {
            field: 'user_agent',
            label: 'User Agent',
            description: 'Informacje o przeglądarce/aplikacji użytej do odtwarzania'
        },
        {
            field: 'reason_start',
            label: 'Powód rozpoczęcia',
            description: 'Dlaczego utwór zaczął się odtwarzać (np. "trackdone", "playbtn")'
        },
        {
            field: 'reason_end',
            label: 'Powód zakończenia',
            description: 'Dlaczego utwór przestał się odtwarzać (np. "endplay", "logout")'
        },
        {
            field: 'offline_timestamp',
            label: 'Timestamp offline',
            description: 'Kiedy tryb offline został użyty (jeśli był)'
        }
    ]

    if (variant === 'inline') {
        return (
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        Legenda Pól
                    </CardTitle>
                    <CardDescription>
                        Objaśnienie pól danych ze Spotify Extended Streaming History
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <h4 className="font-medium mb-3">Główne pola</h4>
                            <div className="space-y-2">
                                {legendItems.map((item) => (
                                    <div key={item.field} className="flex items-start gap-2">
                                        {item.icon}
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium">{item.label}</p>
                                            <p className="text-xs text-muted-foreground">{item.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-medium mb-3">Dodatkowe pola</h4>
                            <div className="space-y-2">
                                {additionalFields.map((item) => (
                                    <div key={item.field} className="flex items-start gap-2">
                                        <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium">{item.label}</p>
                                            <p className="text-xs text-muted-foreground">{item.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center gap-2 h-9 rounded-md px-3 text-sm border border-input bg-background hover:bg-accent hover:text-accent-foreground"
            >
                <Info className="h-4 w-4" />
                Legenda pól
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <Card className="w-full max-w-4xl max-h-[80vh] overflow-auto">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Info className="h-5 w-5" />
                                    Legenda Pól Danych Spotify
                                </CardTitle>
                                <CardDescription>
                                    Objaśnienie wszystkich pól dostępnych w Extended Streaming History
                                </CardDescription>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent hover:text-accent-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6 md:grid-cols-2">
                                <div>
                                    <h4 className="font-medium mb-4 text-lg">Główne pola</h4>
                                    <div className="space-y-3">
                                        {legendItems.map((item) => (
                                            <div key={item.field} className="flex items-start gap-3 p-3 rounded-lg border">
                                                {item.icon}
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-medium">{item.label}</p>
                                                    <p className="text-sm text-muted-foreground mb-1">
                                                        Pole: <code className="bg-muted px-1 rounded">{item.field}</code>
                                                    </p>
                                                    <p className="text-sm">{item.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-medium mb-4 text-lg">Dodatkowe pola</h4>
                                    <div className="space-y-3">
                                        {additionalFields.map((item) => (
                                            <div key={item.field} className="flex items-start gap-3 p-3 rounded-lg border">
                                                <Info className="h-4 w-4 mt-1 text-muted-foreground" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-medium">{item.label}</p>
                                                    <p className="text-sm text-muted-foreground mb-1">
                                                        Pole: <code className="bg-muted px-1 rounded">{item.field}</code>
                                                    </p>
                                                    <p className="text-sm">{item.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 p-4 bg-muted rounded-lg">
                                <h5 className="font-medium mb-2">Informacje dodatkowe</h5>
                                <ul className="text-sm space-y-1 text-muted-foreground">
                                    <li>• Wszystkie czasy są podane w UTC (Coordinated Universal Time)</li>
                                    <li>• Czas odtwarzania jest mierzony w milisekundach</li>
                                    <li>• Kody krajów używają standardu ISO (PL = Polska, US = USA, itp.)</li>
                                    <li>• Wartości boolean: True/False lub null (jeśli nieznane)</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </>
    )
}
