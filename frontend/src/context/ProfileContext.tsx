import { createContext, useContext, useState, ReactNode } from 'react'

interface ProfileContextType {
    selectedProfile: string | null
    setSelectedProfile: (profileId: string | null) => void
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export const useProfile = () => {
    const context = useContext(ProfileContext)
    if (context === undefined) {
        throw new Error('useProfile must be used within a ProfileProvider')
    }
    return context
}

interface ProfileProviderProps {
    children: ReactNode
}

export const ProfileProvider = ({ children }: ProfileProviderProps) => {
    const [selectedProfile, setSelectedProfile] = useState<string | null>(null)

    return (
        <ProfileContext.Provider value={{ selectedProfile, setSelectedProfile }}>
            {children}
        </ProfileContext.Provider>
    )
}
