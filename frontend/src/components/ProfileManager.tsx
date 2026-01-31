import React from "react";
import { useProfileManagement } from "./profiles/hooks/useProfileManagement";
import { ProfileSelector } from "./profiles/ProfileSelector";
import { AvailableProfilesList } from "./profiles/AvailableProfilesList";
import { ImportedProfilesList } from "./profiles/ImportedProfilesList";
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
  const {
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
  const onClear = (id: string) => {
    handleClearProfile(id);
    onClearProfile(id);
  };

  return (
    <div className="space-y-6">
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
