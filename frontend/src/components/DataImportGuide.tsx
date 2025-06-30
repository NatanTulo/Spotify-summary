import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Download, FolderOpen, FileJson, Database, Info } from 'lucide-react'

export const DataImportGuide = () => {
    return (
        <Card className="mt-8">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Jak Uzyskać i Zaimportować Dane Spotify
                </CardTitle>
                <CardDescription>
                    Szczegółowy przewodnik po procesie pobierania i importowania danych z Spotify
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Krok 1 */}
                <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">
                        1
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-medium">Pobierz Swoje Dane ze Spotify</h4>
                        <ol className="text-sm space-y-1 list-decimal list-inside ml-4 text-muted-foreground">
                            <li>Przejdź na stronę <a href="https://www.spotify.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Spotify Privacy Settings</a></li>
                            <li>Zaloguj się na swoje konto Spotify</li>
                            <li>Przewiń do sekcji "Download your data"</li>
                            <li>Wybierz <strong>"Extended streaming history"</strong> (nie "Account data")</li>
                            <li>Wypełnij formularz i poczekaj na email (może potrwać do 30 dni)</li>
                        </ol>
                    </div>
                </div>

                {/* Krok 2 */}
                <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-semibold">
                        2
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-medium flex items-center gap-2">
                            <FolderOpen className="h-4 w-4" />
                            Przygotuj Strukturę Folderów
                        </h4>
                        <div className="text-sm text-muted-foreground space-y-2">
                            <p>Po otrzymaniu danych, utwórz następującą strukturę w folderze <code className="bg-muted px-1 rounded">data/</code>:</p>
                            <div className="bg-muted p-3 rounded-lg font-mono text-xs">
                                <div>data/</div>
                                <div>├── Jan/</div>
                                <div>│   ├── Streaming_History_Audio_2017-2019_0.json</div>
                                <div>│   ├── Streaming_History_Audio_2019-2020_1.json</div>
                                <div>│   └── ...</div>
                                <div>├── Adam/</div>
                                <div>│   ├── Streaming_History_Audio_2021_3.json</div>
                                <div>│   └── ...</div>
                                <div>└── Anna/</div>
                                <div>    └── ...</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Krok 3 */}
                <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 font-semibold">
                        3
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-medium flex items-center gap-2">
                            <FileJson className="h-4 w-4" />
                            Rodzaje Plików Danych
                        </h4>
                        <div className="text-sm text-muted-foreground space-y-1">
                            <p>Spotify dostarcza różne typy plików:</p>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                                <li><strong>Streaming_History_Audio_*.json</strong> - Historia odtwarzania muzyki</li>
                                <li><strong>Streaming_History_Video_*.json</strong> - Historia odtwarzania podcastów video</li>
                                <li><strong>ReadMeFirst_*.pdf</strong> - Dokumentacja (pomijana podczas importu)</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Krok 4 */}
                <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-semibold">
                        4
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-medium flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            Importuj Dane
                        </h4>
                        <div className="text-sm text-muted-foreground space-y-2">
                            <p>Po przygotowaniu folderów:</p>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                                <li>Użyj przycisku <strong>"Importuj Dane"</strong> w nagłówku strony</li>
                                <li>Wybierz profil do zaimportowania lub importuj wszystkie</li>
                                <li>Poczekaj na zakończenie procesu (może potrwać kilka minut)</li>
                                <li>Po imporcie możesz przełączać się między profilami</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Informacje dodatkowe */}
                <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Ważne Informacje
                    </h5>
                    <ul className="text-sm space-y-1 text-blue-800 dark:text-blue-200">
                        <li>• Extended Streaming History zawiera pełną historię odtwarzania (każde kliknięcie play)</li>
                        <li>• Dane mogą sięgać nawet kilku lat wstecz</li>
                        <li>• Rozmiar plików może być duży (kilkaset MB dla aktywnych użytkowników)</li>
                        <li>• Import większych danych może potrwać kilka minut</li>
                        <li>• Aplikacja jest tylko do odczytu - nie modyfikuje oryginalnych danych</li>
                        <li>• Możesz mieć wiele profili i porównywać między nimi</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    )
}
