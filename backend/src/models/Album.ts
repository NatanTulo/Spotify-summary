import mongoose, { Schema, Document } from 'mongoose'

export interface IAlbum extends Document {
    _id: string
    name: string
    artistId: mongoose.Types.ObjectId
    createdAt: Date
    updatedAt: Date
}

const albumSchema = new Schema<IAlbum>({
    name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    artistId: {
        type: Schema.Types.ObjectId,
        ref: 'Artist',
        required: true,
        index: true
    }
}, {
    timestamps: true,
    collection: 'albums'
})

// Compound index for artist + album name uniqueness
albumSchema.index({ name: 1, artistId: 1 }, { unique: true })

// Index for search
albumSchema.index({ name: 'text' })

export const Album = mongoose.model<IAlbum>('Album', albumSchema)
