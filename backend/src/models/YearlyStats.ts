import mongoose from 'mongoose'

const yearlyStatsSchema = new mongoose.Schema({
    profileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile',
        required: true,
        index: true
    },
    year: {
        type: Number,
        required: true,
        index: true
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
    uniqueArtists: {
        type: Number,
        default: 0
    },
    uniqueAlbums: {
        type: Number,
        default: 0
    },
    topArtist: {
        name: String,
        plays: Number,
        minutes: Number
    },
    topTrack: {
        name: String,
        artist: String,
        plays: Number,
        minutes: Number
    },
    monthlyBreakdown: [{
        month: Number,
        plays: Number,
        minutes: Number
    }]
}, {
    timestamps: true
})

// Compound index dla wydajnych zapytań
yearlyStatsSchema.index({ profileId: 1, year: 1 }, { unique: true })
yearlyStatsSchema.index({ year: 1, profileId: 1 })

export const YearlyStats = mongoose.model('YearlyStats', yearlyStatsSchema)
