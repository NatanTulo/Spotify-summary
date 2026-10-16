import { describe, expect, it } from 'vitest'
import { ACCENT_PRESETS, buildPalette, normalizeHex, paletteContrast, paletteCss } from './palette'

const hueHex = (hue: number) => {
    const rgb = [0, 8, 4].map(offset => { const k = (offset + hue / 30) % 12; return .5 - .5 * Math.max(-1, Math.min(k - 3, 9 - k, 1)) })
    return '#' + rgb.map(channel => Math.round(channel * 255).toString(16).padStart(2, '0')).join('')
}
describe('harmonized palette', () => {
    it('normalizes saved/custom hex and rejects invalid values', () => {
        expect(normalizeHex(' 12aBcD ')).toBe('#12ABCD')
        expect(normalizeHex('#ffffff')).toBe('#FFFFFF')
        for (const invalid of ['', '#123', '#12345z', 'red']) expect(normalizeHex(invalid)).toBeNull()
    })
    it('maintains text and chart contrast for every hue, presets and grayscale in both themes', () => {
        const colors = [...ACCENT_PRESETS.map(preset => preset.value), '#000000', '#FFFFFF', ...Array.from({ length: 360 }, (_, hue) => hueHex(hue))]
        for (const color of colors) for (const dark of [false, true]) {
            const tokens = buildPalette(color, dark)
            expect(paletteContrast(tokens.primary, tokens['primary-foreground']), `${color} primary dark=${dark}`).toBeGreaterThanOrEqual(4.5)
            expect(paletteContrast(tokens.foreground, tokens.background)).toBeGreaterThanOrEqual(4.5)
            expect(paletteContrast(tokens['muted-foreground'], tokens.muted)).toBeGreaterThanOrEqual(4.5)
            expect(paletteContrast(tokens['accent-foreground'], tokens.accent)).toBeGreaterThanOrEqual(4.5)
            for (let index = 1; index <= 5; index++) expect(paletteContrast(tokens[`chart-${index}`], tokens.card)).toBeGreaterThanOrEqual(3)
        }
    })
    it('updates surfaces, borders and supporting chart hues along with the accent', () => {
        const teal = buildPalette('#45B8A6', true), blue = buildPalette('#5F9EEA', true)
        for (const token of ['background', 'card', 'border', 'primary', 'accent', 'chart-2']) expect(teal[token]).not.toBe(blue[token])
        expect(paletteCss('#45B8A6')).toContain(':root.dark{')
        expect(paletteCss('#45B8A6')).toContain('--chart-5:')
    })
})
