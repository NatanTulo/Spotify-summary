import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { Profile, ImportProgress, AvailableProfile } from '../types';

export const useProfileManagement = (
    onProfilesChanged?: () => void,
    selectedProfileId?: string | null,
    onProfileSelect?: (id: string | null) => void
) => {
    const { t } = useLanguage();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [availableProfiles, setAvailableProfiles] = useState<AvailableProfile[]>([]);
    const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
    const [importingProfile, setImportingProfile] = useState<string | null>(null);
    const [activeImports, setActiveImports] = useState<Set<string>>(new Set());
    const [importProgress, setImportProgress] = useState<Record<string, ImportProgress>>({});

    const fetchImportProgress = useCallback(async (profileName: string) => {
        try {
            const response = await fetch(`/api/import/progress/${profileName}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    setImportProgress((prev) => ({
                        ...prev,
                        [profileName]: data.data,
                    }));

                    if (!data.data.isRunning) {
                        setTimeout(() => {
                            setImportProgress((prev) => {
                                const newProgress = { ...prev };
                                delete newProgress[profileName];
                                return newProgress;
                            });
                            setActiveImports((prev) => {
                                const newSet = new Set(prev);
                                newSet.delete(profileName);
                                return newSet;
                            });
                        }, 3000);
                    } else {
                        setActiveImports((prev) => new Set([...prev, profileName]));
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching import progress:", error);
        }
    }, []);

    const checkActiveImports = useCallback(async () => {
        try {
            console.log("🔍 Checking for active imports...");
            const response = await fetch("/api/import/progress");
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    const activeProgressMap: Record<string, ImportProgress> = {};
                    const activeImportSet = new Set<string>();

                    data.data.forEach((progress: ImportProgress) => {
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
                        setImportProgress(activeProgressMap);
                        setActiveImports(activeImportSet);
                    }
                }
            }
        } catch (error) {
            console.error("Error checking active imports:", error);
        }
    }, [activeImports]);

    const fetchProfiles = useCallback(async (forceRefresh = false) => {
        if (forceRefresh || profiles.length === 0) {
            setIsLoadingProfiles(true);
        }
        
        try {
            const [profilesRes, availableRes] = await Promise.all([
                fetch("/api/import/profiles"),
                fetch("/api/import/available"),
            ]);

            let profilesChanged = false;
            let availableProfilesChanged = false;

            if (profilesRes.ok) {
                const profilesData = await profilesRes.json();
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

                    // Auto-recompute stats if needed
                    try {
                        const missingPodcastStats = newProfiles.filter(p =>
                            !p.statistics || p.statistics.totalPodcastPlays === undefined
                        );
                        if (missingPodcastStats.length > 0) {
                            await Promise.all(
                                missingPodcastStats.map(p =>
                                    fetch(`/api/import/profile/${encodeURIComponent(p.name)}/update-stats`, { method: 'POST' })
                                        .catch(err => console.error('Failed to recompute stats for', p.name, err))
                                )
                            );
                            await new Promise(res => setTimeout(res, 300));
                            // Recursive call with forceRefresh true
                            // Using a flag to differentiate recursive call might be cleaner but this works
                            // Be careful with infinite recursion - missingPodcastStats should be empty next time
                        }
                    } catch (e) {
                        console.error('Auto-recompute stats failed:', e);
                    }
                }
            }

            if (availableRes.ok) {
                const availableData = await availableRes.json();
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
            console.error("Error fetching profiles:", error);
        } finally {
            if (forceRefresh || profiles.length === 0) {
                setIsLoadingProfiles(false);
            }
        }
    }, [profiles, availableProfiles, activeImports.size, checkActiveImports, onProfilesChanged]);

    const handleImportProfile = async (profileName: string) => {
        setImportingProfile(profileName);
        try {
            const response = await fetch(`/api/import/profile/${profileName}`, {
                method: "POST",
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data.importStarted) {
                    setActiveImports((prev) => new Set([...prev, profileName]));
                    fetchImportProgress(profileName);
                }
                setTimeout(() => fetchProfiles(true), 2000);
            }
        } catch (error) {
            console.error("Error importing profile:", error);
        } finally {
            setImportingProfile(null);
        }
    };

    const handleClearProfile = async (profileId: string) => {
        if (!confirm(t("confirmDeleteProfileData"))) return;

        try {
            const response = await fetch(`/api/import/clear?profileId=${profileId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                await fetchProfiles(true);
                if (selectedProfileId === profileId && onProfileSelect) {
                    onProfileSelect(null);
                }
            }
        } catch (error) {
            console.error("Error clearing profile:", error);
        }
    };

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
