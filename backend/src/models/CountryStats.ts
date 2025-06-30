import mongoose from 'mongoose'

const countryStatsSchema = new mongoose.Schema({
    profileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile',
        required: true,
        index: true
    },
    country: {
        type: String,
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
    percentage: {
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
    }
}, {
    timestamps: true
})

// Compound index dla wydajnych zapytań
countryStatsSchema.index({ profileId: 1, country: 1 }, { unique: true })
countryStatsSchema.index({ profileId: 1, totalPlays: -1 })

export const CountryStats = mongoose.model('CountryStats', countryStatsSchema)
