import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ProfileManager } from '../components/ProfileManager'
import { DataImportGuide } from '../components/DataImportGuide'
import { useProfile } from '../context/ProfileContext'
import { useLanguage } from '../context/LanguageContext'
export default function DataManagement() {
    const { selectedProfile, setSelectedProfile } = useProfile()
    const { language } = useLanguage()
    const queryClient = useQueryClient()
    const refresh = useCallback(() => { void queryClient.invalidateQueries() }, [queryClient])
    return <div className="mx-auto max-w-6xl space-y-6">
        <header><h1 className="text-3xl font-semibold tracking-tight">{language === 'pl' ? 'Dane i import' : 'Data & import'}</h1><p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{language === 'pl' ? 'Zarządzaj lokalną biblioteką. Umieść rozpakowane pliki JSON w folderze data/nazwa-profilu, a następnie odśwież listę folderów.' : 'Manage your local library. Place extracted JSON files in data/profile-name, then refresh the folder list.'}</p></header>
        <ProfileManager selectedProfile={selectedProfile} onProfileSelect={setSelectedProfile} onImportProfile={() => undefined} onClearProfile={id => { if (selectedProfile === id) setSelectedProfile(null) }} onProfilesChanged={refresh} />
        <DataImportGuide />
    </div>
}
