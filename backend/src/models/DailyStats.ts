import mongoose from 'mongoose'

const dailyStatsSchema = new mongoose.Schema({
    profileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile',
        required: true,
        index: true
    },
    date: {
        type: String, // Format: YYYY-MM-DD
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
    topArtist: {
        name: String,
        plays: Number
    },
    topTrack: {
        name: String,
        artist: String,
        plays: Number
    }
}, {
    timestamps: true
})

// Compound index dla wydajnych zapytań
dailyStatsSchema.index({ profileId: 1, date: 1 }, { unique: true })
dailyStatsSchema.index({ date: 1, profileId: 1 })

export const DailyStats = mongoose.model('DailyStats', dailyStatsSchema)
