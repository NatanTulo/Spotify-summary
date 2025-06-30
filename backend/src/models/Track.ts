import mongoose, { Schema, Document } from 'mongoose'

export interface ITrack extends Document {
    _id: string
    name: string
    albumId: mongoose.Types.ObjectId
    uri?: string
    duration?: number
    createdAt: Date
    updatedAt: Date
}

const trackSchema = new Schema<ITrack>({
    name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    albumId: {
        type: Schema.Types.ObjectId,
        ref: 'Album',
        required: true,
        index: true
    },
    uri: {
        type: String,
        sparse: true,
        index: true
    },
    duration: {
        type: Number,
        min: 0
    }
}, {
    timestamps: true,
    collection: 'tracks'
})

// Compound index for album + track name uniqueness
trackSchema.index({ name: 1, albumId: 1 }, { unique: true })

// Index for search
trackSchema.index({ name: 'text' })

export const Track = mongoose.model<ITrack>('Track', trackSchema)
