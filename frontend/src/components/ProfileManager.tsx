import React from "react";
import { useProfileManagement } from "./profiles/hooks/useProfileManagement";
import { ProfileSelector } from "./profiles/ProfileSelector";
import { AvailableProfilesList } from "./profiles/AvailableProfilesList";
import { ImportedProfilesList } from "./profiles/ImportedProfilesList";
import { useLanguage } from "../context/LanguageContext";
import { Button } from "./ui/button";
import { EmptyState } from "./profiles/EmptyState";

interface ProfileManagerProps {
  selectedProfile: string | null;
  onProfileSelect: (profileId: string | null) => void;
  onImportProfile: (profileName: string) => void;
  onClearProfile: (profileId: string) => void;
  onProfilesChanged?: () => void;
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
  const { language, t } = useLanguage();
  const {
    error,
    progressError,
    retryProgress,
    profiles,
    availableProfiles,
    isLoadingProfiles,
    importingProfile,
    activeImports,
    importProgress,
    fetchProfiles,
    handleImportProfile,
    handleClearProfile
  } = useProfileManagement(onProfilesChanged, selectedProfile, onProfileSelect);

  // Wrap onImportProfile to also call parent callback
  const onImport = (name: string) => {
    handleImportProfile(name);
    onImportProfile(name);
  };

  // Wrap onClearProfile to also call parent callback
  const onClear = async (id: string) => {
    if (await handleClearProfile(id)) onClearProfile(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground" aria-live="polite">
        <span>{isLoadingProfiles ? (language === 'pl' ? 'Sprawdzanie folderów…' : 'Checking folders…') : (language === 'pl' ? `Profile: ${profiles.length}. Wykryte foldery: ${availableProfiles.length}.` : `Profiles: ${profiles.length}. Detected folders: ${availableProfiles.length}.`)}</span>
        <Button variant="outline" size="sm" disabled={isLoadingProfiles} onClick={() => fetchProfiles(true)}>{t('refresh')}</Button>
      </div>
      {error && <div role="alert" className="rounded-lg border border-destructive p-4 text-sm text-destructive">{error}</div>}
      {progressError && <div role="alert" className="space-y-2 rounded-lg border border-destructive p-4 text-sm">
        <p>{language === 'pl' ? 'Nie można sprawdzić postępu importu. Ostatni widoczny status może być nieaktualny.' : 'Import progress could not be checked. The last visible status may be out of date.'}</p>
        <p className="text-muted-foreground">{progressError}</p>
        <Button variant="outline" size="sm" onClick={() => { void retryProgress() }}>{language === 'pl' ? 'Sprawdź ponownie' : 'Retry status'}</Button>
      </div>}
      <ProfileSelector
        profiles={profiles}
        selectedProfileId={selectedProfile}
        onProfileSelect={onProfileSelect}
        isLoading={isLoading}
      />

      <AvailableProfilesList
        availableProfiles={availableProfiles}
        importProgress={importProgress}
        activeImports={activeImports}
        importingProfile={importingProfile}
        onImportProfile={onImport}
      />

      <ImportedProfilesList
        profiles={profiles}
        selectedProfileId={selectedProfile}
        onClearProfile={onClear}
      />

      <EmptyState
        profilesLength={profiles.length}
        availableProfilesLength={availableProfiles.length}
        isLoading={isLoadingProfiles}
        onRefresh={() => fetchProfiles(true)}
      />
    </div>
  );
};
