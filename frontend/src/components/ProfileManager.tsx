import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Progress } from "./ui/progress";
import { Calendar, User, Play, Clock, Music, Users } from "lucide-react";
import { Button } from './ui/button'
import { useLanguage } from "../context/LanguageContext";

interface Profile {
  _id: string;
  name: string;
  username?: string;
  lastImport?: string;
  statistics: {
    totalPlays: number;
    totalMinutes: number;
    uniqueTracks: number;
    uniqueArtists: number;
    uniqueAlbums: number;
    totalPodcastPlays?: number;
    uniqueShows?: number;
    uniqueEpisodes?: number;
  };
  createdAt: string;
}

interface ImportProgress {
  profileName: string;
  isRunning: boolean;
  currentFile: string;
  currentFileIndex: number;
  totalFiles: number;
  currentRecord: number;
  totalRecordsInFile: number;
  completedFiles: number;
  totalRecordsProcessed: number;
  estimatedTotalRecords: number;
  startTime: string;
  lastUpdate: string;
  status: "preparing" | "importing" | "completed" | "error" | "cancelled";
  error?: string;
  percentage: number;
  stats: {
    filesProcessed: number;
    totalRecords: number;
    artistsCreated: number;
    albumsCreated: number;
    tracksCreated: number;
    playsCreated: number;
    showsCreated?: number;
    episodesCreated?: number;
    podcastPlaysCreated?: number;
    skippedRecords: number;
    currentStats?: {
      totalPlays: number;
      totalMinutes: number;
      uniqueTracks: number;
      uniqueArtists: number;
      uniqueAlbums: number;
      totalPodcastPlays?: number;
      uniqueShows?: number;
      uniqueEpisodes?: number;
    };
  };
}

interface ProfileManagerProps {
  selectedProfile: string | null;
  onProfileSelect: (profileId: string | null) => void;
  onImportProfile: (profileName: string) => void;
  onClearProfile: (profileId: string) => void;
  onProfilesChanged?: () => void; // Callback gdy lista profili się zmieni
  isLoading?: boolean;
}

export const ProfileManager: React.FC<ProfileManagerProps> = ({
  selectedProfile,
  onProfileSelect,
  onImportProfile,
  onClearProfile,
  onProfilesChanged,
  isLoading = false,
}) => {
  const { t, formatDate: localizedFormatDate } = useLanguage();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [availableProfiles, setAvailableProfiles] = useState<
    Array<{ 
      name: string; 
      files: any[]; 
      audioFiles?: number; 
      podcastFiles?: number; 
      fileCount: number;
    }>
  >([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [importingProfile, setImportingProfile] = useState<string | null>(null);
  const [activeImports, setActiveImports] = useState<Set<string>>(new Set());
  const [importProgress, setImportProgress] = useState<
    Record<string, ImportProgress>
  >({});

  // Check for all active imports
  const checkActiveImports = async () => {
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
              console.log(
                `📥 Found active import for profile: ${progress.profileName}`
              );
              activeProgressMap[progress.profileName] = progress;
              activeImportSet.add(progress.profileName);
            }
          });

          if (activeImportSet.size > 0) {
            console.log(
              `🎯 Setting ${activeImportSet.size} active imports:`,
              Array.from(activeImportSet)
            );
          } else {
            console.log("✅ No active imports found");
          }

          // Only update state if there's an actual change to prevent unnecessary re-renders
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
  };

  // Fetch import progress for specific profile
  const fetchImportProgress = async (profileName: string) => {
    try {
      const response = await fetch(`/api/import/progress/${profileName}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setImportProgress((prev) => ({
            ...prev,
            [profileName]: data.data,
          }));

          // If import is completed or stopped, clean up
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
            }, 3000); // Clean up after 3 seconds
          } else {
            // Add to active imports if running
            setActiveImports((prev) => new Set([...prev, profileName]));
          }
        }
      }
    } catch (error) {
      console.error("Error fetching import progress:", error);
    }
  };

  // Monitor active import progress for all active imports
  useEffect(() => {
    if (activeImports.size > 0) {
      const interval = setInterval(() => {
        activeImports.forEach((profileName) => {
          fetchImportProgress(profileName);
        });
      }, 2000); // Update every 2 seconds during import

      return () => clearInterval(interval);
    }
  }, [activeImports]);

  // Auto-refresh profiles periodically - only when there are active imports
  useEffect(() => {
    if (activeImports.size > 0) {
      const interval = setInterval(() => {
        fetchProfiles(); // fetchProfiles already calls checkActiveImports internally
      }, 3000); // Refresh every 3 seconds only when imports are active

      return () => clearInterval(interval);
    }
  }, [activeImports.size]);

  // Separate interval for checking new imports when no active imports exist
  useEffect(() => {
    if (activeImports.size === 0) {
      const interval = setInterval(() => {
        checkActiveImports();
      }, 15000); // Check for new imports every 15 seconds when no active imports

      return () => clearInterval(interval);
    }
  }, [activeImports.size]);

  const fetchProfiles = async (forceRefresh = false) => {
    // Only show loading on initial load or forced refresh
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
        const newProfiles = profilesData.data || [];
        
        // More stable comparison that handles undefined/null values and object property order
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
          // Powiadom parent component o zmianie profili
          onProfilesChanged?.();
        } else {
          console.log('📊 Profiles data unchanged, skipping update');
        }
      }

      if (availableRes.ok) {
        const availableData = await availableRes.json();
        const newAvailableProfiles = availableData.data || [];
        
        // Only update available profiles if they actually changed
        if (JSON.stringify(newAvailableProfiles) !== JSON.stringify(availableProfiles)) {
          setAvailableProfiles(newAvailableProfiles);
          availableProfilesChanged = true;
        }
      }

      // Only check for active imports if there are currently active imports, 
      // or if profiles/available profiles changed (might indicate new data)
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
  };

  useEffect(() => {
    console.log(
      "🔄 ProfileManager component mounted, fetching profiles and checking imports..."
    );
    fetchProfiles(true); // Force refresh on initial load
    // checkActiveImports is called within fetchProfiles, no need to call it separately
  }, []);

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
          // Start monitoring progress immediately
          fetchImportProgress(profileName);
        }
        onImportProfile(profileName);
        // Refresh profiles after a delay to allow import to start
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
        onClearProfile(profileId);
        await fetchProfiles(true);
        if (selectedProfile === profileId) {
          onProfileSelect(null);
        }
      }
    } catch (error) {
      console.error("Error clearing profile:", error);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Profile Selection */}
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
              className={`segmented-btn ${selectedProfile === null ? 'segmented-btn-active' : ''}`}
              variant={selectedProfile === null ? 'default' : 'outline'}
              onClick={() => onProfileSelect(null)}
              disabled={isLoading}
            >
              {t("allProfiles")}
            </Button>
            {profiles.map((profile) => (
              <Button
                key={profile._id}
                className={`segmented-btn flex items-center gap-2 ${selectedProfile === profile._id ? 'segmented-btn-active' : ''}`}
                variant={selectedProfile === profile._id ? 'default' : 'outline'}
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

      {/* Available Data Sources */}
      {availableProfiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("availableDataImport")}</CardTitle>
            <CardDescription>{t("availableDataImportDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {availableProfiles.map((profile) => {
                const progress = importProgress[profile.name];
                const isImporting =
                  activeImports.has(profile.name) ||
                  importingProfile === profile.name;

                return (
                  <div
                    key={profile.name}
                    className="border rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{profile.name}</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleImportProfile(profile.name)}
                        disabled={isImporting}
                      >
                        {isImporting ? t("importingStatus") : t("importAction")}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {(profile.audioFiles ?? 0) > 0 && (
                        <span className="mr-3">
                          {profile.audioFiles} {t("audioFiles")}
                        </span>
                      )}
                      {(profile.podcastFiles ?? 0) > 0 && (
                        <span className="mr-3">
                          {profile.podcastFiles} {t("podcastFiles")}
                        </span>
                      )}
                      {!(profile.audioFiles ?? 0) && !(profile.podcastFiles ?? 0) && (
                        <span>
                          {profile.files.length} {t("jsonFiles")}
                        </span>
                      )}
                    </p>

                    {/* Progress Bar */}
                    {progress && progress.isRunning && (
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {progress.status === "preparing"
                              ? t("preparingStatus")
                              : progress.status === "importing"
                              ? `${t("fileProgress")} ${
                                  progress.currentFileIndex + 1
                                }/${progress.totalFiles}`
                              : progress.status === "completed"
                              ? t("completedStatus")
                              : progress.status === "error"
                              ? t("errorStatus")
                              : t("importStatusGeneral")}
                          </span>
                          <span className="font-medium">
                            {Math.round(progress.percentage)}%
                          </span>
                        </div>
                        <Progress value={progress.percentage} className="h-2" />
                        {progress.currentFile && (
                          <p className="text-xs text-muted-foreground truncate">
                            {progress.currentFile}
                          </p>
                        )}
                        {progress.totalRecordsProcessed > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {progress.totalRecordsProcessed.toLocaleString()} /{" "}
                            {progress.estimatedTotalRecords.toLocaleString()}{" "}
                            {t("recordsStats")}
                          </p>
                        )}

                        {/* Real-time Statistics */}
                        {progress.stats.currentStats && (
                          <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 text-xs space-y-1">
                            <div className="font-medium text-gray-700 dark:text-gray-300">
                              {t("currentStats")}
                            </div>
                            <div className={`grid gap-1 text-gray-600 dark:text-gray-400 ${(progress.stats.currentStats.totalPodcastPlays ?? 0) > 0 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                              <div>
                                {t("playsIcon")}{" "}
                                {progress.stats.currentStats.totalPlays.toLocaleString()}{" "}
                                {t("playsStats")}
                              </div>
                              <div>
                                {t("songsIcon")}{" "}
                                {progress.stats.currentStats.uniqueTracks.toLocaleString()}{" "}
                                {t("songsStats")}
                              </div>
                              <div>
                                {t("artistsIcon")}{" "}
                                {progress.stats.currentStats.uniqueArtists.toLocaleString()}{" "}
                                {t("artistsStats")}
                              </div>
                              <div>
                                {t("albumsIcon")}{" "}
                                {progress.stats.currentStats.uniqueAlbums.toLocaleString()}{" "}
                                {t("albumsStats")}
                              </div>
                              {((progress.stats.currentStats.totalPodcastPlays ?? 0) > 0) && (
                                <>
                                  <div>
                                    {t("podcastplaysIcon")}{" "}
                                    {(progress.stats.currentStats.totalPodcastPlays ?? 0).toLocaleString()}{" "}
                                    {t("podcastplaysStats")}
                                  </div>
                                  <div>
                                    {t("showsIcon")}{" "}
                                    {(progress.stats.currentStats.uniqueShows ?? 0).toLocaleString()}{" "}
                                    {t("showsStats")}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Imported Profiles */}
      {profiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("importedProfiles")}</CardTitle>
            <CardDescription>{t("profilesReadyDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {profiles.map((profile) => (
                <div
                  key={profile._id}
                  className={`border rounded-lg p-4 space-y-3 transition-colors ${
                    selectedProfile === profile._id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                      : "hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {profile.name}
                    </h4>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleClearProfile(profile._id)}
                    >
                      {t("removeAction")}
                    </Button>
                  </div>

                  {profile.lastImport && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {localizedFormatDate(profile.lastImport, true)}
                    </div>
                  )}

                  <div className={`grid gap-2 text-sm ${(profile.statistics?.totalPodcastPlays ?? 0) > 0 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' : 'grid-cols-2'}`}>
                    <div className="flex items-center gap-1">
                      <Play className="h-3 w-3" />
                      {(
                        profile.statistics?.totalPlays || 0
                      ).toLocaleString()}{" "}
                      {t("playsStats")}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(profile.statistics?.totalMinutes || 0)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Music className="h-3 w-3" />
                      {(
                        profile.statistics?.uniqueTracks || 0
                      ).toLocaleString()}{" "}
                      {t("songsStats")}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {(
                        profile.statistics?.uniqueArtists || 0
                      ).toLocaleString()}{" "}
                      {t("artistsStats")}
                    </div>
                    {((profile.statistics?.totalPodcastPlays ?? 0) > 0) && (
                      <>
                        <div className="flex items-center gap-1">
                          <span className="h-3 w-3 text-center">🎧</span>
                          {(
                            profile.statistics?.totalPodcastPlays || 0
                          ).toLocaleString()}{" "}
                          {t("podcastplaysStats")}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="h-3 w-3 text-center">🎬</span>
                          {(
                            profile.statistics?.uniqueShows || 0
                          ).toLocaleString()}{" "}
                          {t("showsStats")}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="h-3 w-3 text-center">📻</span>
                          {(
                            profile.statistics?.uniqueEpisodes || 0
                          ).toLocaleString()}{" "}
                          {t("episodesStats")}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {profiles.length === 0 &&
        availableProfiles.length === 0 &&
        !isLoadingProfiles && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">{t("noDataState")}</h3>
              <p className="text-muted-foreground text-center mb-4">
                {t("noDataMessage")}
              </p>
              <button
                onClick={() => fetchProfiles(true)}
                disabled={isLoadingProfiles}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("refresh")}
              </button>
            </CardContent>
          </Card>
        )}
    </div>
  );
};
