import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { PalettePicker } from './PalettePicker'
import { DEFAULT_ACCENT, PALETTE_STORAGE_KEY, paletteCss } from './palette'
vi.mock('../../context/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }))
beforeEach(() => localStorage.clear())
const styles = () => document.querySelector('style[data-app-palette]')?.textContent

describe('palette preferences', () => {
    it('defaults to teal and persists a selected palette across remounts', () => {
        const { unmount } = render(<PalettePicker />)
        expect(styles()).toBe(paletteCss(DEFAULT_ACCENT))
        fireEvent.click(screen.getByLabelText('Interface colors'))
        fireEvent.click(screen.getByRole('button', { name: 'Blue' }))
        expect(localStorage.getItem(PALETTE_STORAGE_KEY)).toBe('#5F9EEA')
        expect(styles()).toBe(paletteCss('#5F9EEA'))
        unmount()
        render(<PalettePicker />)
        expect(styles()).toBe(paletteCss('#5F9EEA'))
    })
    it('validates custom hex and applies tokens for both light and dark', () => {
        render(<PalettePicker />)
        fireEvent.click(screen.getByLabelText('Interface colors'))
        const input = screen.getByLabelText('Custom HEX color')
        fireEvent.change(input, { target: { value: '#oops' } })
        fireEvent.click(screen.getByRole('button', { name: 'Apply' }))
        expect(screen.getByRole('alert')).toHaveTextContent('6 HEX digits')
        expect(localStorage.getItem(PALETTE_STORAGE_KEY)).toBeNull()
        fireEvent.change(input, { target: { value: '#abc123' } })
        fireEvent.click(screen.getByRole('button', { name: 'Apply' }))
        expect(styles()).toBe(paletteCss('#ABC123'))
        expect(localStorage.getItem(PALETTE_STORAGE_KEY)).toBe('#ABC123')
        fireEvent.keyDown(document, { key: 'Escape' })
        expect(screen.getByLabelText('Interface colors')).toHaveFocus()
    })
})
