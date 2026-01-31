import { useState, useEffect } from 'react'

interface FilterMetadata {
    countries: string[]
    platforms: string[]
}

export function useFilterMetadata(profileId: string | null) {
    const [metadata, setMetadata] = useState<FilterMetadata>({
        countries: [],
        platforms: []
    })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const fetchMetadata = async () => {
            setLoading(true)
            try {
                const params = new URLSearchParams()
                if (profileId && profileId !== 'all') {
                    params.append('profileId', profileId)
                }

                const response = await fetch(`/api/stats/metadata?${params}`)
                if (response.ok) {
                    const result = await response.json()
                    if (result.success) {
                        setMetadata(result.data)
                    }
                }
            } catch (error) {
                console.error('Failed to fetch filter metadata:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchMetadata()
    }, [profileId])

    return { metadata, loading }
}
