import { Request, Response } from 'express'
import ImportService from '../../services/importService.js'

export const getAvailable = async (_req: Request, res: Response) => {
    try {
        const profiles = ImportService.getAvailableProfiles()
        res.json({
            success: true,
            data: profiles
        })
    } catch (error) {
        console.error('Error reading available profiles:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to read available profiles',
            message: error instanceof Error ? error.message : 'Unknown error'
        })
    }
}

export const getStatus = async (_req: Request, res: Response) => {
    try {
        const status = ImportService.getImportStatus()
        res.json({
            success: true,
            data: status
        })
    } catch (error) {
        console.error('Error checking import status:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to check import status',
            message: error instanceof Error ? error.message : 'Unknown error'
        })
    }
}

export const getAllProgress = async (_req: Request, res: Response) => {
    try {
        const allProgress = ImportService.getAllProgress()
        res.json({
            success: true,
            data: allProgress
        })
    } catch (error) {
        console.error('Error fetching all import progress:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to fetch import progress',
            message: error instanceof Error ? error.message : 'Unknown error'
        })
    }
}

export const getProgress = async (req: Request, res: Response) => {
    try {
        const { profileName } = req.params
        const progress = ImportService.getProgress(profileName as string)
        res.json({
            success: true,
            data: progress
        })
    } catch (error) {
        console.error('Error fetching import progress:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to fetch import progress',
            message: error instanceof Error ? error.message : 'Unknown error'
        })
    }
}

export const startImport = async (req: Request, res: Response) => {
    try {
        const { profileName } = req.params
        const result = await ImportService.startImport(profileName as string)
        
        if (result.alreadyRunning) {
            return res.json({
                success: true,
                data: {
                    message: result.message,
                    progress: result.progress
                }
            })
        }

        res.json({
            success: true,
            data: result
        })
    } catch (error) {
        console.error('Error importing profile:', error)
        const status = error instanceof Error && (error.message === 'Profile not found' || error.message === 'No valid streaming history files found') ? 404 : 500
        res.status(status).json({
            success: false,
            error: 'Failed to import profile',
            message: error instanceof Error ? error.message : 'Unknown error'
        })
    }
}
