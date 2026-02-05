import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../api/client';
import type { Profile } from '../types';

interface ProfileContextType {
  profiles: Profile[];
  selectedProfile: Profile | null;
  selectedProfileId: number | 'all';
  setSelectedProfileId: (id: number | 'all') => void;
  isLoading: boolean;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [selectedProfileId, setSelectedProfileId] = useState<number | 'all'>('all');

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: () => apiGet<Profile[]>('/import/profiles'),
  });

  // Auto-select first profile if none selected
  useEffect(() => {
    if (profiles.length > 0 && selectedProfileId === 'all') {
      // Keep "all" as default, user can change
    }
  }, [profiles, selectedProfileId]);

  const selectedProfile = selectedProfileId === 'all' 
    ? null 
    : profiles.find(p => p.id === selectedProfileId) || null;

  return (
    <ProfileContext.Provider value={{
      profiles,
      selectedProfile,
      selectedProfileId,
      setSelectedProfileId,
      isLoading,
    }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
