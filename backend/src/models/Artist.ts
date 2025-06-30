import mongoose, { Schema, Document } from 'mongoose'

export interface IArtist extends Document {
    _id: string
    name: string
    createdAt: Date
    updatedAt: Date
}

const artistSchema = new Schema<IArtist>({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    }
}, {
    timestamps: true,
    collection: 'artists'
})

// Index for search
artistSchema.index({ name: 'text' })

export const Artist = mongoose.model<IArtist>('Artist', artistSchema)
