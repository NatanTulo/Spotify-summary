import { useProfile } from '../hooks/useProfile';

interface ProfileSelectorProps {
  className?: string;
  labelClassName?: string;
  selectClassName?: string;
}

export function ProfileSelector({ 
  className = '', 
  labelClassName = '',
  selectClassName = ''
}: ProfileSelectorProps) {
  const { profiles, selectedProfileId, setSelectedProfileId, isLoading } = useProfile();

  if (isLoading) {
    return (
      <div className={className}>
        <span className="animate-pulse">Loading profiles...</span>
      </div>
    );
  }

  return (
    <div className={className}>
      <label className={labelClassName}>
        Profile
      </label>
      <select
        value={selectedProfileId}
        onChange={(e) => setSelectedProfileId(
          e.target.value === 'all' ? 'all' : Number(e.target.value)
        )}
        className={selectClassName}
      >
        <option value="all">All Profiles</option>
        {profiles.map((profile) => (
          <option key={profile.id} value={profile.id}>
            {profile.name}
          </option>
        ))}
      </select>
    </div>
  );
}
