#!/usr/bin/env node

import SpotifyDataImporter from './importData.js'
import path from 'path'
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'
import { sequelize } from '../config/database.js'

/**
 * Script runner for Spotify data import
 * 
 * Usage:
 * npm run import
 * or
 * node dist/scripts/runImport.js
 * or with custom data directory:
 * node dist/scripts/runImport.js /path/to/data
 */

async function main() {
    const args = process.argv.slice(2)
    const dataDir = args[0] || path.join(process.cwd(), '..', 'data')

    console.log('🎵 Spotify Analytics Data Importer')
    console.log('===================================')
    console.log(`📁 Data directory: ${path.resolve(dataDir)}`)
    console.log('')

    try {
        // Create missing tables without altering or dropping existing ones.
        await sequelize.authenticate()
        await sequelize.sync()

        const profileNames = fs.readdirSync(dataDir, { withFileTypes: true })
            .filter(entry => entry.isDirectory())
            .map(entry => entry.name)
            .filter(name => fs.readdirSync(path.join(dataDir, name)).some(file =>
                /^Streaming_History_(Audio|Video)_.*\.json$/.test(file)))
            .sort()

        if (profileNames.length === 0) {
            throw new Error('No profile folders with Spotify streaming history found')
        }

        for (const profileName of profileNames) {
            const importer = new SpotifyDataImporter(dataDir, profileName)
            await importer.import()
        }
    } catch (error) {
        console.error('💥 Import failed:', error)
        process.exitCode = 1
    } finally {
        await sequelize.close()
    }
}

// Run if this file is executed directly
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
    void main()
}
