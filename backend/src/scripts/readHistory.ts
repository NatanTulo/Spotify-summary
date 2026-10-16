import fs from 'node:fs'
import { JSONParser } from '@streamparser/json-node'
import { z } from 'zod'
import type { SpotifyPlayData } from './importers/types.js'

const recordSchema = z.object({
    ts: z.string().refine(v => Number.isFinite(Date.parse(v))),
    ms_played: z.number().int().nonnegative().max(2_147_483_647),
}).passthrough()

export function validateRecord(value: unknown): asserts value is SpotifyPlayData {
    if (!recordSchema.safeParse(value).success) throw new Error('Invalid Spotify history record (timestamp or duration)')
}

export class ImportCancelledError extends Error {
    constructor() { super('Import cancelled; previous history preserved') }
}

export async function* readHistory(file: string): AsyncGenerator<unknown> {
    const handle = await fs.promises.open(file, 'r')
    try {
        const buffer = Buffer.alloc(4096)
        const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0)
        if (!buffer.toString('utf8', 0, bytesRead).trimStart().startsWith('[')) throw new Error('History must be a JSON array')
    } finally { await handle.close() }
    const source = fs.createReadStream(file)
    const parser = new JSONParser({ paths: ['$.*'], keepStack: false })
    source.on('error', error => parser.destroy(error))
    source.pipe(parser)
    try {
        for await (const item of parser) yield item.value
    } finally { source.destroy(); parser.destroy() }
}
