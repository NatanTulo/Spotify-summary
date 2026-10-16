import { describe, expect, it } from 'vitest'
import { countLabel } from './countLabel'
describe('Polish count forms', () => {
    it.each([[1, '1 odtworzenie'], [2, '2 odtworzenia'], [5, '5 odtworzeń'], [12, '12 odtworzeń'], [22, '22 odtworzenia'], [101, '101 odtworzeń']])('formats %i plays', (count, expected) => {
        expect(countLabel(Number(count), 'plays', 'pl')).toBe(expected)
    })
    it('uses English singular and plural', () => {
        expect(countLabel(1, 'tracks', 'en')).toBe('1 track')
        expect(countLabel(2, 'tracks', 'en')).toBe('2 tracks')
    })
})
