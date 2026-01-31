import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Users, User } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { Profile } from './types'

interface ProfileSelectorProps {
    profiles: Profile[];
    selectedProfileId: string | null;
    onProfileSelect: (id: string | null) => void;
    isLoading: boolean;
}

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({
    profiles,
    selectedProfileId,
    onProfileSelect,
    isLoading
}) => {
    const { t } = useLanguage();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {t("profileSelection")}
                </CardTitle>
                <CardDescription>{t("profileSelectionDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="segmented">
                    <Button
                        className={`segmented-btn ${selectedProfileId === null ? 'segmented-btn-active' : ''}`}
                        variant={selectedProfileId === null ? 'default' : 'outline-solid'}
                        onClick={() => onProfileSelect(null)}
                        disabled={isLoading}
                    >
                        {t("allProfiles")}
                    </Button>
                    {profiles.map((profile) => (
                        <Button
                            key={profile._id}
                            className={`segmented-btn flex items-center gap-2 ${selectedProfileId === profile._id ? 'segmented-btn-active' : ''}`}
                            variant={selectedProfileId === profile._id ? 'default' : 'outline-solid'}
                            onClick={() => onProfileSelect(profile._id)}
                            disabled={isLoading}
                        >
                            <User className="h-4 w-4" />
                            {profile.name}
                        </Button>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
