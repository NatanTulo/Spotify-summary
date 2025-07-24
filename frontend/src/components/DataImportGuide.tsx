import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Download, FolderOpen, FileJson, Database, Info, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from './ui/button'
import { useLanguage } from '@/context/LanguageContext'

export const DataImportGuide = () => {
    const { t } = useLanguage()
    const [isExpanded, setIsExpanded] = useState(false)
    
    return (
        <Card className="mt-8">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Download className="h-5 w-5" />
                        <CardTitle>{t('howToImportTitle')}</CardTitle>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-2"
                    >
                        <span className="text-sm">
                            {isExpanded ? t('collapseGuide') : t('expandGuide')}
                        </span>
                        {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                    </Button>
                </div>
                <CardDescription>
                    {t('importGuideDescription')}
                </CardDescription>
            </CardHeader>
            
            {isExpanded && (
                <CardContent className="space-y-6">
                {/* Krok 1 */}
                <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">
                        1
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-medium">{t('step1Title')}</h4>
                        <ol className="text-sm space-y-1 list-decimal list-inside ml-4 text-muted-foreground">
                            <li>{t('step1GoTo')} <a href="https://www.spotify.com/account/privacy/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Spotify Privacy Settings</a></li>
                            <li>{t('step1Login')}</li>
                            <li>{t('step1ScrollTo')}</li>
                            <li>{t('step1SelectExtended')}</li>
                            <li>{t('step1FillForm')}</li>
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
                            {t('step2Title')}
                        </h4>
                        <div className="text-sm text-muted-foreground space-y-2">
                            <p>{t('step2Description')} <code className="bg-muted px-1 rounded">data/</code>:</p>
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
                            <div className="bg-orange-50 dark:bg-orange-950/30 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                                <p className="text-sm text-orange-800 dark:text-orange-200 font-medium mb-1">
                                    {t('step2FolderNaming')}
                                </p>
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
                            {t('step3Title')}
                        </h4>
                        <div className="text-sm text-muted-foreground space-y-1">
                            <p>{t('step3Description')}</p>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                                <li><strong>Streaming_History_Audio_*.json</strong> - {t('step3Audio')}</li>
                                <li><strong>Streaming_History_Video_*.json</strong> - {t('step3Video')}</li>
                                <li><strong>ReadMeFirst_*.pdf</strong> - {t('step3Readme')}</li>
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
                            {t('step4Title')}
                        </h4>
                        <div className="text-sm text-muted-foreground space-y-2">
                            <p>{t('step4Description')}</p>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                                <li>{t('step4UseButton')}</li>
                                <li>{t('step4SelectProfile')}</li>
                                <li>{t('step4Wait')}</li>
                                <li>{t('step4AfterImport')}</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Informacje dodatkowe */}
                <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        {t('importantInfo')}
                    </h5>
                    <ul className="text-sm space-y-1 text-blue-800 dark:text-blue-200">
                        <li>• {t('info1')}</li>
                        <li>• {t('info2')}</li>
                        <li>• {t('info3')}</li>
                        <li>• {t('info4')}</li>
                        <li>• {t('info5')}</li>
                        <li>• {t('info6')}</li>
                    </ul>
                </div>
            </CardContent>
            )}
        </Card>
    )
}
