import { useApiQuery } from '../lib/api'
interface FilterMetadata { countries: string[]; platforms: string[] }
export function useFilterMetadata(profileId: string | null) {
    const query = useApiQuery<FilterMetadata>(`/api/stats/metadata?profileId=${profileId || 'all'}`)
    return { metadata: query.data?.data || { countries: [], platforms: [] }, loading: query.isPending, error: query.error }
}
