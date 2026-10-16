import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { DateRangeProvider, useDateRange, validDate } from './DateRangeContext'
import { DateRangeBar } from '../components/DateRangeBar'
import type { ComponentProps } from 'react'

vi.mock('../components/ui/Select', () => ({
    Select: ({ onValueChange, ...props }: { onValueChange?: (value: string) => void } & Omit<ComponentProps<'select'>, 'onChange'>) =>
        <select {...props} onChange={event => onValueChange?.(event.target.value)} />,
}))

vi.mock('../lib/api', () => ({
    queryClient: { cancelQueries: vi.fn(), resetQueries: vi.fn() },
    setRequestRange: vi.fn(),
    useApiQuery: () => ({ data: { data: { first: '2021-04-01T00:00:00Z', last: '2023-09-15T00:00:00Z', years: [2023, 2022, 2021] } }, isPending: false }),
}))
vi.mock('./LanguageContext', () => ({ useLanguage: () => ({ language: 'pl' }) }))
vi.mock('./ProfileContext', () => ({ useProfile: () => ({ selectedProfile: '1' }) }))

function Probe() {
    const { range } = useDateRange()
    const location = useLocation()
    const navigate = useNavigate()
    return <><output data-testid="range">{JSON.stringify(range)}</output><output data-testid="url">{location.search}</output><button onClick={() => navigate(-1)}>Back</button><DateRangeBar /></>
}
function setup(url = '/music?tab=tracks&musicSearch=test') {
    render(<MemoryRouter initialEntries={[url]}><DateRangeProvider><Probe /></DateRangeProvider></MemoryRouter>)
}

describe('Shared date range', () => {
    it('uses library years rather than current calendar dates, preserving music filters and browser history', () => {
        setup()
        fireEvent.change(screen.getByLabelText('Wybierz okres'), { target: { value: '2022' } })
        expect(screen.getByTestId('range')).toHaveTextContent('"dateFrom":"2022-01-01"')
        expect(screen.getByTestId('url')).toHaveTextContent('musicSearch=test')
        expect(screen.getByTestId('url')).toHaveTextContent('dateTo=2022-12-31')
        fireEvent.click(screen.getByText('Back'))
        expect(screen.getByTestId('range')).toHaveTextContent('"dateFrom":""')
        expect(screen.getByLabelText('Wybierz okres')).toHaveValue('all')
    })
    it('restores a deep-linked custom range and only commits edited dates on Apply', () => {
        setup('/music?dateFrom=2022-02-01&dateTo=2022-03-01')
        fireEvent.change(screen.getByLabelText('Wybierz okres'), { target: { value: 'custom' } })
        fireEvent.change(screen.getByLabelText('Data od'), { target: { value: '2022-02-10' } })
        expect(screen.getByTestId('range')).toHaveTextContent('"dateFrom":"2022-02-01"')
        fireEvent.click(screen.getByText('Zastosuj'))
        expect(screen.getByTestId('range')).toHaveTextContent('"dateFrom":"2022-02-10"')
    })
    it('rejects invalid calendar dates and reversed URL ranges', () => {
        expect(validDate('0000-01-01')).toBe('')
        expect(validDate('2025-02-29')).toBe('')
        expect(validDate('2024-02-29')).toBe('2024-02-29')
        setup('/?dateFrom=2025-05-01&dateTo=2024-01-01')
        expect(screen.getByTestId('range')).toHaveTextContent('{"dateFrom":"","dateTo":""}')
    })
    it('anchors the latest 30 days to the imported archive, not today', () => {
        setup()
        fireEvent.change(screen.getByLabelText('Wybierz okres'), { target: { value: 'recent' } })
        expect(screen.getByTestId('range')).toHaveTextContent('{"dateFrom":"2023-08-17","dateTo":"2023-09-15"}')
    })
})
