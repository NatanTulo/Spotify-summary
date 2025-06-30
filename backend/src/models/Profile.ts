import mongoose, { Schema, Document } from 'mongoose'

export interface IProfile extends Document {
    _id: string
    name: string
    username?: string
    lastImport?: Date
    statistics: {
        totalPlays: number
        totalMinutes: number
        uniqueTracks: number
        uniqueArtists: number
        uniqueAlbums: number
    }
    createdAt: Date
    updatedAt: Date
}

const profileSchema = new Schema<IProfile>({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    username: {
        type: String,
        trim: true
    },
    lastImport: {
        type: Date
    },
    statistics: {
        totalPlays: { type: Number, default: 0 },
        totalMinutes: { type: Number, default: 0 },
        uniqueTracks: { type: Number, default: 0 },
        uniqueArtists: { type: Number, default: 0 },
        uniqueAlbums: { type: Number, default: 0 }
    }
}, {
    timestamps: true,
    collection: 'profiles'
})

export const Profile = mongoose.model<IProfile>('Profile', profileSchema)
