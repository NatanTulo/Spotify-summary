import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useProfileManagement } from './useProfileManagement'
import { apiFetch } from '../../../lib/api'

vi.mock('../../../lib/api', () => ({ apiFetch: vi.fn() }))
vi.mock('../../../context/LanguageContext', () => ({ useLanguage: () => ({ language: 'en', t: (key: string) => key }) }))
const mockedFetch = vi.mocked(apiFetch)
const response = (data: unknown, ok = true) => ({ ok, json: async () => data }) as Response
beforeEach(() => mockedFetch.mockImplementation(async () => response({ success: true, data: [] })))
afterEach(() => vi.restoreAllMocks())

describe('profile deletion', () => {
    it('keeps the active profile and sends no deletion when confirmation is cancelled', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(false)
        const select = vi.fn()
        const { result } = renderHook(() => useProfileManagement(undefined, 'active', select))
        await waitFor(() => expect(result.current.isLoadingProfiles).toBe(false))
        await act(async () => { expect(await result.current.handleClearProfile('active')).toBe(false) })
        expect(select).not.toHaveBeenCalled()
        expect(mockedFetch.mock.calls.some(([url]) => String(url).includes('/clear'))).toBe(false)
    })
    it('keeps the active profile and exposes the server error on failure', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true)
        mockedFetch.mockImplementation(async url => String(url).includes('/clear') ? response({ success: false, message: 'Deletion failed' }, false) : response({ success: true, data: [] }))
        const select = vi.fn()
        const { result } = renderHook(() => useProfileManagement(undefined, 'active', select))
        await waitFor(() => expect(result.current.isLoadingProfiles).toBe(false))
        await act(async () => { expect(await result.current.handleClearProfile('active')).toBe(false) })
        expect(select).not.toHaveBeenCalled()
        expect(result.current.error).toBe('Deletion failed')
    })
    it('clears the active profile only after successful deletion', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true)
        const select = vi.fn()
        const { result } = renderHook(() => useProfileManagement(undefined, 'active', select))
        await waitFor(() => expect(result.current.isLoadingProfiles).toBe(false))
        await act(async () => { expect(await result.current.handleClearProfile('active')).toBe(true) })
        expect(select).toHaveBeenCalledExactlyOnceWith(null)
    })
    it('rejects a malformed successful deletion response', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true)
        mockedFetch.mockImplementation(async url => String(url).includes('/clear') ? response({}) : response({ success: true, data: [] }))
        const select = vi.fn()
        const { result } = renderHook(() => useProfileManagement(undefined, 'active', select))
        await waitFor(() => expect(result.current.isLoadingProfiles).toBe(false))
        await act(async () => { expect(await result.current.handleClearProfile('active')).toBe(false) })
        expect(select).not.toHaveBeenCalled()
        expect(result.current.error).toBe('Could not delete profile.')
    })
    it('exposes discovery failures and clears them after a successful retry', async () => {
        mockedFetch.mockImplementation(async url => {
            if (String(url).endsWith('/progress')) throw new Error('Network unavailable')
            return response({ success: true, data: [] })
        })
        const { result } = renderHook(() => useProfileManagement())
        await waitFor(() => expect(result.current.progressError).toBe('Network unavailable'))
        mockedFetch.mockImplementation(async () => response({ success: true, data: [] }))
        await act(async () => { await result.current.retryProgress() })
        expect(result.current.progressError).toBe('')
    })
})
