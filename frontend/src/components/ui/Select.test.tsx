import { useState } from 'react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Select } from './Select'
beforeAll(() => { Element.prototype.scrollIntoView = vi.fn() })

function Example() {
    const [value, setValue] = useState('')
    return <label>Library<Select value={value} onValueChange={setValue}><option value="">All profiles</option><><option value="a" disabled>Archived</option><option value="b">Blue library</option></></Select></label>
}
describe('themed Select', () => {
    it('preserves label association, empty values, fragments and keyboard selection', async () => {
        render(<Example />)
        const combo = screen.getByRole('combobox', { name: /Library/ })
        expect(combo).toHaveTextContent('All profiles')
        fireEvent.keyDown(combo, { key: 'ArrowDown' })
        const listbox = await screen.findByRole('listbox')
        expect(listbox).toHaveTextContent('Blue library')
        expect(screen.getByRole('option', { name: 'Archived' })).toHaveAttribute('aria-disabled', 'true')
        fireEvent.keyDown(document.activeElement!, { key: 'End' })
        await waitFor(() => expect(screen.getByRole('option', { name: 'Blue library' })).toHaveFocus())
        fireEvent.keyDown(document.activeElement!, { key: 'Enter' })
        await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument())
        expect(combo).toHaveTextContent('Blue library')
        expect(combo).toHaveFocus()
        fireEvent.keyDown(combo, { key: 'ArrowDown' })
        await screen.findByRole('listbox')
        fireEvent.keyDown(document.activeElement!, { key: 'Home' })
        await waitFor(() => expect(screen.getByRole('option', { name: 'All profiles' })).toHaveFocus())
        fireEvent.keyDown(document.activeElement!, { key: 'Enter' })
        await waitFor(() => expect(combo).toHaveTextContent('All profiles'))
    })
})
