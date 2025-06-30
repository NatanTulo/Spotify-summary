#!/usr/bin/env node

import SpotifyDataImporter from './importData.js'
import path from 'path'

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
        const importer = new SpotifyDataImporter(dataDir)
        await importer.import()
    } catch (error) {
        console.error('💥 Import failed:', error)
        process.exit(1)
    }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main()
}
