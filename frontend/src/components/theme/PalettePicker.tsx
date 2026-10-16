import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Check, Palette } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { ACCENT_PRESETS, DEFAULT_ACCENT, normalizeHex, PALETTE_STORAGE_KEY, paletteCss } from './palette'

function savedAccent() {
    try { return normalizeHex(localStorage.getItem(PALETTE_STORAGE_KEY) || '') || DEFAULT_ACCENT }
    catch { return DEFAULT_ACCENT }
}

export function PalettePicker() {
    const { language } = useLanguage()
    const pl = language === 'pl'
    const [accent, setAccent] = useState(savedAccent)
    const [draft, setDraft] = useState(accent)
    const [error, setError] = useState(false)
    const details = useRef<HTMLDetailsElement>(null)
    useLayoutEffect(() => {
        const style = document.createElement('style')
        style.dataset.appPalette = 'true'
        style.textContent = paletteCss(accent)
        document.head.appendChild(style)
        return () => style.remove()
    }, [accent])
    useEffect(() => {
        const sync = (event: StorageEvent) => {
            if (event.key === PALETTE_STORAGE_KEY) { const next = savedAccent(); setAccent(next); setDraft(next) }
        }
        const outside = (event: PointerEvent) => {
            if (details.current?.open && event.target instanceof Node && !details.current.contains(event.target)) details.current.open = false
        }
        const escape = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && details.current?.open) {
                details.current.open = false
                details.current.querySelector('summary')?.focus()
            }
        }
        window.addEventListener('storage', sync)
        document.addEventListener('pointerdown', outside)
        document.addEventListener('keydown', escape)
        return () => { window.removeEventListener('storage', sync); document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
    }, [])
    const apply = (value: string) => {
        setAccent(value); setDraft(value); setError(false)
        try { localStorage.setItem(PALETTE_STORAGE_KEY, value) } catch { /* The current preview remains available without storage. */ }
    }
    return <details ref={details} className="relative">
        <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-md px-2 text-sm hover:bg-accent [&::-webkit-details-marker]:hidden" title={pl ? 'Kolory interfejsu' : 'Interface colors'} aria-label={pl ? 'Kolory interfejsu' : 'Interface colors'}>
            <Palette className="h-4 w-4" aria-hidden="true" /><span className="hidden xl:inline">{pl ? 'Kolory' : 'Colors'}</span><span aria-hidden="true" className="h-3 w-3 rounded-full border border-foreground/20" style={{ backgroundColor: accent }} />
        </summary>
        <div role="group" aria-label={pl ? 'Paleta kolorów' : 'Color palette'} className="absolute right-0 z-50 mt-3 w-80 max-w-[calc(100vw-2rem)] space-y-4 rounded-xl border bg-popover p-4 text-popover-foreground shadow-xl">
            <div><h2 className="font-semibold">{pl ? 'Kolory interfejsu' : 'Interface colors'}</h2><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{pl ? 'Wybierz akcent. Tła, obramowania i wykresy dopasują się automatycznie do jasnego i ciemnego motywu.' : 'Choose an accent. Surfaces, borders and charts automatically harmonize in light and dark themes.'}</p></div>
            <div className="grid grid-cols-2 gap-2">
                {ACCENT_PRESETS.map(preset => <button key={preset.value} type="button" aria-pressed={accent === preset.value} onClick={() => apply(preset.value)} className={`flex min-h-10 items-center gap-2 rounded-md border px-3 text-sm hover:bg-accent ${accent === preset.value ? 'border-primary bg-accent' : 'border-border'}`}>
                    <span className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: preset.value }} aria-hidden="true" />{pl ? preset.pl : preset.en}{accent === preset.value && <Check className="ml-auto h-4 w-4 text-primary" />}
                </button>)}
            </div>
            <form className="space-y-2 border-t pt-3" onSubmit={event => { event.preventDefault(); const next = normalizeHex(draft); if (next) apply(next); else setError(true) }}>
                <label className="block text-sm" htmlFor="custom-accent">{pl ? 'Własny kolor HEX' : 'Custom HEX color'}</label>
                <div className="flex gap-2"><input id="custom-accent" value={draft} onChange={event => { setDraft(event.target.value); setError(false) }} maxLength={7} spellCheck={false} autoComplete="off" aria-invalid={error} aria-describedby={error ? 'accent-error' : 'accent-help'} className="min-h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm" /><button type="submit" className="min-h-10 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground">{pl ? 'Ustaw' : 'Apply'}</button></div>
                {error ? <p id="accent-error" role="alert" className="text-xs text-destructive">{pl ? 'Wpisz 6 cyfr HEX, np. #45B8A6.' : 'Enter 6 HEX digits, e.g. #45B8A6.'}</p> : <p id="accent-help" className="text-xs text-muted-foreground">{pl ? 'Odcień automatycznie dopasowuje kontrast.' : 'The shade automatically adjusts for contrast.'}</p>}
            </form>
        </div>
    </details>
}
