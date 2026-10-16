import { Select } from '@/components/ui/Select'
import { Database } from 'lucide-react'
import { useApiQuery } from '../lib/api'
import { useLanguage } from '../context/LanguageContext'
import { Button } from './ui/button'
import type { Profile } from './profiles/types'
interface HeaderProfileSelectorProps {
    selectedProfile: string | null
    onProfileSelect: (id: string | null) => void
    onImportRequested: () => void
    isLoading?: boolean
    refreshTrigger?: number
}
export const HeaderProfileSelector = ({ selectedProfile, onProfileSelect, onImportRequested, isLoading = false }: HeaderProfileSelectorProps) => {
    const { t, language } = useLanguage()
    const profileQuery = useApiQuery<Profile[]>('/api/import/profiles')
    const profiles = Array.isArray(profileQuery.data?.data) ? profileQuery.data.data : []
    return <div className="flex min-w-0 items-center justify-between gap-2">
        <label className="flex min-w-0 items-center gap-2 text-sm">
            <span className="text-muted-foreground">{language === 'pl' ? 'Biblioteka' : 'Library'}</span>
            <Select aria-label={t('profileSelection')} value={selectedProfile || ''} disabled={isLoading} onValueChange={value => onProfileSelect(value || null)} className="h-9 min-w-0 max-w-36 rounded-md border border-input px-2 text-sm sm:max-w-44">
                <option value="">{t('allProfiles')}</option>
                {profiles.map(profile => <option key={profile._id} value={profile._id}>{profile.name}</option>)}
            </Select>
        </label>
        <Button variant="outline" size="sm" onClick={onImportRequested} disabled={isLoading} className="gap-2"><Database className="h-4 w-4" /><span>{language === 'pl' ? 'Dane i import' : 'Data & import'}</span></Button>
    </div>
}
