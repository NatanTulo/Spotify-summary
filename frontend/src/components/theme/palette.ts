export const PALETTE_STORAGE_KEY = 'spotify-analytics-palette'
export const DEFAULT_ACCENT = '#45B8A6'
export const ACCENT_PRESETS = [
    { value: DEFAULT_ACCENT, pl: 'Morski', en: 'Teal' },
    { value: '#5F9EEA', pl: 'Niebieski', en: 'Blue' },
    { value: '#DAA64A', pl: 'Bursztynowy', en: 'Amber' },
    { value: '#9E8BE8', pl: 'Fioletowy', en: 'Violet' },
    { value: '#D58291', pl: 'Różany', en: 'Rose' },
] as const

export function normalizeHex(value: string): string | null {
    const match = value.trim().match(/^#?([\da-f]{6})$/i)
    return match ? `#${match[1].toUpperCase()}` : null
}
function hexToHsl(hex: string): [number, number, number] {
    const [r, g, b] = [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16) / 255)
    const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min
    const lightness = (max + min) / 2
    if (delta === 0) return [0, 0, lightness * 100]
    const hue = max === r ? ((g - b) / delta + (g < b ? 6 : 0)) : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4
    return [hue * 60, delta / (1 - Math.abs(2 * lightness - 1)) * 100, lightness * 100]
}

function luminance(hsl: string): number {
    const [h, s, l] = hsl.split(' ').map(Number.parseFloat)
    const saturation = s / 100, lightness = l / 100
    const a = saturation * Math.min(lightness, 1 - lightness)
    const rgb = [0, 8, 4].map(offset => {
        const k = (offset + h / 30) % 12
        const value = lightness - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
        return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4
    })
    return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722
}
export function paletteContrast(first: string, second: string): number {
    const a = luminance(first), b = luminance(second)
    return (Math.max(a, b) + .05) / (Math.min(a, b) + .05)
}

/** A restrained hue tint for surfaces; accent luminance adapts for readable controls. */
export function buildPalette(accent: string, dark: boolean): Record<string, string> {
    const [hue, saturation] = hexToHsl(normalizeHex(accent) || DEFAULT_ACCENT)
    const hsl = (h: number, s: number, l: number) => `${((h % 360) + 360) % 360} ${s.toFixed(1)}% ${l}%`
    const neutral = (lightness: number) => hsl(hue, Math.min(saturation * .12, 8), lightness)
    const vivid = Math.min(saturation, 72)
    const readable = (h: number, s: number, lightness: number, against: string, minimum: number) => {
        let result = hsl(h, s, lightness)
        while (paletteContrast(result, against) < minimum && lightness > 1 && lightness < 99) {
            lightness += dark ? 1 : -1
            result = hsl(h, s, lightness)
        }
        return result
    }
    const primaryText = neutral(dark ? 10 : 100)
    const primary = readable(hue, vivid, dark ? 69 : 29, primaryText, 4.8)
    const text = neutral(dark ? 96 : 15)
    return {
        background: neutral(dark ? 11 : 97), foreground: text,
        card: neutral(dark ? 15 : 100), 'card-foreground': text,
        popover: neutral(dark ? 17 : 100), 'popover-foreground': text,
        primary, 'primary-foreground': primaryText,
        secondary: neutral(dark ? 21 : 93), 'secondary-foreground': text,
        muted: neutral(dark ? 20 : 94), 'muted-foreground': readable(hue, Math.min(saturation * .12, 8), dark ? 74 : 41, neutral(dark ? 20 : 94), 4.8),
        accent: hsl(hue, Math.min(saturation * .4, 25), dark ? 24 : 92),
        'accent-foreground': readable(hue, vivid, dark ? 86 : 24, hsl(hue, Math.min(saturation * .4, 25), dark ? 24 : 92), 4.8),
        border: neutral(dark ? 29 : 86), input: neutral(dark ? 39 : 75), ring: primary,
        'chart-1': readable(hue, vivid, dark ? 69 : 34, neutral(dark ? 15 : 100), 3),
        'chart-2': readable(hue + 40, Math.min(saturation + 8, 65), dark ? 72 : 43, neutral(dark ? 15 : 100), 3),
        'chart-3': readable(hue - 50, Math.min(saturation, 55), dark ? 64 : 35, neutral(dark ? 15 : 100), 3),
        'chart-4': readable(hue - 140, Math.min(saturation + 10, 65), dark ? 73 : 42, neutral(dark ? 15 : 100), 3),
        'chart-5': readable(hue + 80, Math.min(saturation, 60), dark ? 77 : 47, neutral(dark ? 15 : 100), 3),
    }
}
export function paletteCss(accent: string): string {
    const rule = (selector: string, dark: boolean) => `${selector}{${Object.entries(buildPalette(accent, dark)).map(([key, value]) => `--${key}:${value};`).join('')}}`
    return rule(':root', false) + rule(':root.dark', true)
}
