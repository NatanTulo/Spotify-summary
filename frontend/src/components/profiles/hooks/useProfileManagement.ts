import { apiFetch } from '../../../lib/api'
import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { Profile, ImportProgress, AvailableProfile } from '../types';

export const useProfileManagement = (
    onProfilesChanged?: () => void,
    selectedProfileId?: string | null,
    onProfileSelect?: (id: string | null) => void
) => {
    const { t, language } = useLanguage();
    const [error, setError] = useState<string | null>(null);
    const [progressErrors, setProgressErrors] = useState<Record<string, string>>({});
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [availableProfiles, setAvailableProfiles] = useState<AvailableProfile[]>([]);
    const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
    const [importingProfile, setImportingProfile] = useState<string | null>(null);
    const [activeImports, setActiveImports] = useState<Set<string>>(new Set());
    const [importProgress, setImportProgress] = useState<Record<string, ImportProgress>>({});
    const refreshedResults = useRef(new Set<string>());

    const fetchImportProgress = useCallback(async (profileName: string) => {
        try {
            const response = await apiFetch(`/api/import/progress/${encodeURIComponent(profileName)}`);
            setProgressErrors(previous => { const next = { ...previous }; delete next[profileName]; return next; });
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    setImportProgress((prev) => ({
                        ...prev,
                        [profileName]: data.data,
                    }));

                    if (!data.data.isRunning) {
                        setActiveImports(prev => {
                            if (!prev.has(profileName)) return prev;
                            const next = new Set(prev);
                            next.delete(profileName);
                            return next;
                        });
                    } else {
                        setActiveImports((prev) => new Set([...prev, profileName]));
                    }
                }
            }
        } catch (error) {
            setProgressErrors(previous => ({ ...previous, [profileName]: `${profileName}: ${error instanceof Error ? error.message : 'Progress unavailable'}` }));
        }
    }, []);

    const checkActiveImports = useCallback(async () => {
        try {
            console.log("🔍 Checking for active imports...");
            const response = await apiFetch("/api/import/progress");
            setProgressErrors(previous => { const next = { ...previous }; delete next.discovery; return next; });
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    const activeProgressMap: Record<string, ImportProgress> = {};
                    const activeImportSet = new Set<string>();

                    data.data.forEach((progress: ImportProgress) => {
                        activeProgressMap[progress.profileName] = progress;
                        if (progress.isRunning) {
                            console.log(`📥 Found active import for profile: ${progress.profileName}`);
                            activeProgressMap[progress.profileName] = progress;
                            activeImportSet.add(progress.profileName);
                        }
                    });

                    const currentActiveCount = activeImports.size;
                    const newActiveCount = activeImportSet.size;
                    
                    if (currentActiveCount !== newActiveCount || 
                        !Array.from(activeImportSet).every(name => activeImports.has(name))) {
                        setActiveImports(activeImportSet);
                    }
                    setImportProgress(previous => ({ ...previous, ...activeProgressMap }));
                }
            }
        } catch (error) {
            setProgressErrors(previous => ({ ...previous, discovery: error instanceof Error ? error.message : 'Import status unavailable' }));
        }
    }, [activeImports]);

    const fetchProfiles = useCallback(async (forceRefresh = false) => {
        if (forceRefresh || profiles.length === 0) {
            setIsLoadingProfiles(true);
        }
        
        setError(null);
        try {
            const [profilesRes, availableRes] = await Promise.all([
                apiFetch("/api/import/profiles"),
                apiFetch("/api/import/available"),
            ]);

            if (!profilesRes.ok || !availableRes.ok) throw new Error(language === "pl" ? "Nie udało się pobrać profili lub folderów. Odśwież listę, aby spróbować ponownie." : "Could not load profiles or folders. Refresh the list to retry.");
            let profilesChanged = false;
            let availableProfilesChanged = false;

            if (profilesRes.ok) {
                const profilesData = await profilesRes.json();
                if (!Array.isArray(profilesData.data)) throw new Error(language === 'pl' ? 'Nieprawidłowa odpowiedź listy profili. Odśwież listę.' : 'Invalid profile list response. Refresh the list.');
                const newProfiles: Profile[] = profilesData.data || [];
                
                const profilesEqual = profiles.length === newProfiles.length && 
                    profiles.every((existingProfile, index) => {
                        const newProfile = newProfiles[index];
                        return existingProfile && newProfile &&
                            existingProfile._id === newProfile._id &&
                            existingProfile.name === newProfile.name &&
                            existingProfile.lastImport === newProfile.lastImport &&
                            JSON.stringify(existingProfile.statistics) === JSON.stringify(newProfile.statistics);
                    });
                
                if (!profilesEqual) {
                    console.log('📊 Profiles data changed, updating state');
                    setProfiles(newProfiles);
                    profilesChanged = true;
                    onProfilesChanged?.();


                }
            }

            if (availableRes.ok) {
                const availableData = await availableRes.json();
                if (!Array.isArray(availableData.data)) throw new Error(language === 'pl' ? 'Nieprawidłowa odpowiedź listy folderów. Odśwież listę.' : 'Invalid folder list response. Refresh the list.');
                const newAvailableProfiles = availableData.data || [];
                
                if (JSON.stringify(newAvailableProfiles) !== JSON.stringify(availableProfiles)) {
                    setAvailableProfiles(newAvailableProfiles);
                    availableProfilesChanged = true;
                }
            }

            if (activeImports.size > 0 || profilesChanged || availableProfilesChanged || forceRefresh) {
                await checkActiveImports();
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : (language === "pl" ? "Nie udało się pobrać profili." : "Could not load profiles."));
        } finally {
            if (forceRefresh || profiles.length === 0) {
                setIsLoadingProfiles(false);
            }
        }
    }, [profiles, availableProfiles, activeImports.size, checkActiveImports, onProfilesChanged, language]);

    const handleImportProfile = async (profileName: string) => {
        setImportingProfile(profileName);
        setError(null);
        try {
            const response = await apiFetch(`/api/import/profile/${encodeURIComponent(profileName)}`, { method: "POST" });
            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.message || data.error || (language === 'pl' ? 'Nie udało się rozpocząć importu.' : 'Could not start import.'));
            if (data.data?.importStarted) {
                setActiveImports(prev => new Set([...prev, profileName]));
                void fetchImportProgress(profileName);
            }
            setTimeout(() => { void fetchProfiles(true); }, 2000);
            return true;
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : (language === 'pl' ? 'Błąd importu. Spróbuj ponownie.' : 'Import failed. Try again.'));
            return false;
        } finally { setImportingProfile(null); }
    };

    const handleClearProfile = async (profileId: string): Promise<boolean> => {
        if (!confirm(t("confirmDeleteProfileData"))) return false;
        setError(null);
        try {
            const response = await apiFetch(`/api/import/clear?profileId=${encodeURIComponent(profileId)}`, { method: "DELETE" });
            const data = await response.json();
            if (!response.ok || data.success !== true) throw new Error(data.message || data.error || (language === 'pl' ? 'Nie udało się usunąć profilu.' : 'Could not delete profile.'));
            if (selectedProfileId === profileId) onProfileSelect?.(null);
            await fetchProfiles(true);
            return true;
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : (language === 'pl' ? 'Nie udało się usunąć profilu. Spróbuj ponownie.' : 'Could not delete profile. Try again.'));
            return false;
        }
    };

    useEffect(() => {
        const finished = Object.values(importProgress).filter(progress => !progress.isRunning && !refreshedResults.current.has(`${progress.profileName}:${progress.startTime}`));
        if (finished.length === 0) return;
        finished.forEach(progress => refreshedResults.current.add(`${progress.profileName}:${progress.startTime}`));
        void fetchProfiles(true);
    }, [importProgress, fetchProfiles]);

    // Effects for polling
    useEffect(() => {
        if (activeImports.size > 0) {
            const interval = setInterval(() => {
                activeImports.forEach((profileName) => {
                    fetchImportProgress(profileName);
                });
            }, 2000);
            return () => clearInterval(interval);
        }
    }, [activeImports, fetchImportProgress]);

    useEffect(() => {
        if (activeImports.size > 0) {
            const interval = setInterval(() => {
                fetchProfiles();
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [activeImports.size, fetchProfiles]);

    useEffect(() => {
        if (activeImports.size === 0) {
            const interval = setInterval(() => {
                checkActiveImports();
            }, 15000);
            return () => clearInterval(interval);
        }
    }, [activeImports.size, checkActiveImports]);

    useEffect(() => {
        fetchProfiles(true);
    }, []); // Initial load

    return {
        error,
        progressError: Object.values(progressErrors).join(' '),
        retryProgress: async () => {
            await checkActiveImports();
            await Promise.all([...activeImports].map(fetchImportProgress));
        },
        profiles,
        availableProfiles,
        isLoadingProfiles,
        importingProfile,
        activeImports,
        importProgress,
        fetchProfiles,
        handleImportProfile,
        handleClearProfile
    };
};
