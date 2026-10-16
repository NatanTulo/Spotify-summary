import * as matchers from '@testing-library/jest-dom/matchers'
import { afterEach, expect } from 'vitest'
import { cleanup } from '@testing-library/react'

expect.extend(matchers)

// Runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup()
})
