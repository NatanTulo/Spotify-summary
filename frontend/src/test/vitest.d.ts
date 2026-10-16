import 'vitest'
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'

// jest-dom's bundled declarations still use the pre-Vitest-5 Assertion API.
declare module 'vitest' {
    interface Matchers<R, T> extends TestingLibraryMatchers<T, R> {}
}
