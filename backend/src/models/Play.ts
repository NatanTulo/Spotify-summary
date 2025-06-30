import mongoose, { Schema, Document } from 'mongoose'

export interface IPlay extends Document {
    _id: string
    trackId: mongoose.Types.ObjectId
    profileId?: mongoose.Types.ObjectId
    timestamp: Date
    msPlayed: number
    username?: string
    platform?: string
    country?: string
    ipAddress?: string
    userAgent?: string
    reasonStart?: string
    reasonEnd?: string
    shuffle?: boolean
    skipped?: boolean
    offline?: boolean
    offlineTimestamp?: Date
    incognitoMode?: boolean
    createdAt: Date
    updatedAt: Date
}

const playSchema = new Schema<IPlay>({
    trackId: {
        type: Schema.Types.ObjectId,
        ref: 'Track',
        required: true,
        index: true
    },
    profileId: {
        type: Schema.Types.ObjectId,
        ref: 'Profile',
        index: true
    },
    timestamp: {
        type: Date,
        required: true,
        index: true
    },
    msPlayed: {
        type: Number,
        required: true,
        min: 0,
        index: true
    },
    username: {
        type: String,
        trim: true
    },
    platform: {
        type: String,
        trim: true,
        index: true
    },
    country: {
        type: String,
        trim: true,
        index: true,
        uppercase: true,
        maxlength: 2
    },
    ipAddress: {
        type: String,
        trim: true
    },
    userAgent: {
        type: String,
        trim: true
    },
    reasonStart: {
        type: String,
        trim: true
    },
    reasonEnd: {
        type: String,
        trim: true
    },
    shuffle: {
        type: Boolean,
        index: true
    },
    skipped: {
        type: Boolean,
        index: true
    },
    offline: {
        type: Boolean,
        index: true
    },
    offlineTimestamp: {
        type: Date
    },
    incognitoMode: {
        type: Boolean,
        index: true
    }
}, {
    timestamps: true,
    collection: 'plays'
})

// Compound indexes for common queries
playSchema.index({ trackId: 1, timestamp: -1 })
playSchema.index({ timestamp: -1, country: 1 })
playSchema.index({ timestamp: -1, platform: 1 })
playSchema.index({ profileId: 1, timestamp: -1 })
playSchema.index({ profileId: 1, trackId: 1 })

export const Play = mongoose.model<IPlay>('Play', playSchema)
