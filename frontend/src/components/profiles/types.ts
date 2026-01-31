export interface ProfileStats {
    totalPlays: number;
    totalMinutes: number;
    uniqueTracks: number;
    uniqueArtists: number;
    uniqueAlbums: number;
    totalPodcastPlays?: number;
    uniqueShows?: number;
    uniqueEpisodes?: number;
}

export interface Profile {
    _id: string;
    name: string;
    username?: string;
    lastImport?: string;
    statistics: ProfileStats;
    createdAt: string;
}

export interface ImportProgress {
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
        currentStats?: ProfileStats;
    };
}

export interface AvailableProfile {
    name: string;
    files: any[];
    audioFiles?: number;
    podcastFiles?: number;
    fileCount: number;
}
