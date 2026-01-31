import { Request, Response } from 'express'
import ProfileService from '../../services/profileService.js'

export const getProfiles = async (_req: Request, res: Response) => {
    try {
        const profiles = await ProfileService.getAllProfiles()
        res.json({
            success: true,
            data: profiles
        })
    } catch (error) {
        console.error('Error fetching profiles:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to fetch profiles',
            message: error instanceof Error ? error.message : 'Unknown error'
        })
    }
}

export const updateStats = async (req: Request, res: Response) => {
    try {
        const { profileName } = req.params
        const result = await ProfileService.updateProfileStats(profileName)
        res.json({
            success: true,
            data: result
        })
    } catch (error) {
        console.error('Error updating profile statistics:', error)
        const status = error instanceof Error && error.message === 'Profile not found' ? 404 : 500
        res.status(status).json({
            success: false,
            error: 'Failed to update profile statistics',
            message: error instanceof Error ? error.message : 'Unknown error'
        })
    }
}

export const deleteProfile = async (req: Request, res: Response) => {
    try {
        const { profileId } = req.query
        
        if (!profileId) {
            return res.status(400).json({
                success: false,
                error: 'Profile ID is required'
            })
        }

        await ProfileService.deleteProfile(profileId as string)

        res.json({
            success: true,
            message: 'Profile and all associated data deleted successfully'
        })
    } catch (error) {
        console.error('Error clearing profile:', error)
        const status = error instanceof Error && error.message === 'Profile not found' ? 404 : 500
        res.status(status).json({
            success: false,
            error: 'Failed to clear profile',
            message: error instanceof Error ? error.message : 'Unknown error'
        })
    }
}

export const clearAll = async (_req: Request, res: Response) => {
    try {
        await ProfileService.clearAllProfiles()
        res.json({
            success: true,
            message: 'All data cleared successfully'
        })
    } catch (error) {
        console.error('Error clearing all data:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to clear all data',
            message: error instanceof Error ? error.message : 'Unknown error'
        })
    }
}

export const getDebugData = async (req: Request, res: Response) => {
    try {
        const { profileId } = req.params
        const data = await ProfileService.getDebugData(profileId)
        res.json({
            success: true,
            data
        })
    } catch (error) {
        console.error('Debug data error:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to get debug data',
            message: error instanceof Error ? error.message : 'Unknown error'
        })
    }
}
