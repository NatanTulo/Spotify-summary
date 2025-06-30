import mongoose from 'mongoose'

const artistStatsSchema = new mongoose.Schema({
    profileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile',
        required: true,
        index: true
    },
    artistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artist',
        required: true,
        index: true
    },
    artistName: {
        type: String,
        required: true
    },
    totalPlays: {
        type: Number,
        default: 0
    },
    totalMinutes: {
        type: Number,
        default: 0
    },
    uniqueTracks: {
        type: Number,
        default: 0
    },
    uniqueAlbums: {
        type: Number,
        default: 0
    },
    firstPlayDate: {
        type: Date
    },
    lastPlayDate: {
        type: Date
    },
    topTrack: {
        name: String,
        plays: Number,
        minutes: Number
    }
}, {
    timestamps: true
})

// Compound index dla wydajnych zapytań
artistStatsSchema.index({ profileId: 1, artistId: 1 }, { unique: true })
artistStatsSchema.index({ profileId: 1, totalPlays: -1 })
artistStatsSchema.index({ profileId: 1, totalMinutes: -1 })

export const ArtistStats = mongoose.model('ArtistStats', artistStatsSchema)
