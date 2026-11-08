import { describe, it, expect, beforeAll } from 'vitest'
import { VeroTranscribe } from '../src'
import { createTestClient, shouldSkipE2E, SKIP_E2E_MESSAGE, delay } from './setup'

// Delay between API operations to avoid rate limiting
const RATE_LIMIT_DELAY = 3000

describe('UsageResource', () => {
  let client: VeroTranscribe

  beforeAll(() => {
    if (shouldSkipE2E()) return
    client = createTestClient()
  })

  describe('get()', () => {
    it.skipIf(shouldSkipE2E())(SKIP_E2E_MESSAGE, async () => {
      const usage = await client.usage.get()

      expect(usage).toBeDefined()
      expect(usage.period).toBeDefined()
      expect(usage.period.start).toBeDefined()
      expect(usage.period.end).toBeDefined()
      expect(typeof usage.totalMinutes).toBe('number')
      expect(typeof usage.totalCost).toBe('number')
      expect(usage.packages).toBeDefined()
      expect(usage.rates).toBeDefined()

      await delay(RATE_LIMIT_DELAY)
    })

    it.skipIf(shouldSkipE2E())('returns package breakdown', async () => {
      const usage = await client.usage.get()

      // Verify all package slugs are present
      expect(usage.packages).toHaveProperty('starter')
      expect(usage.packages).toHaveProperty('standard')
      expect(usage.packages).toHaveProperty('insights')
      expect(usage.packages).toHaveProperty('pro')

      // Each package should have minutes, cost, and count
      for (const pkg of Object.values(usage.packages)) {
        expect(typeof pkg.minutes).toBe('number')
        expect(typeof pkg.cost).toBe('number')
        expect(typeof pkg.count).toBe('number')
      }

      await delay(RATE_LIMIT_DELAY)
    })

    it.skipIf(shouldSkipE2E())('returns pricing rates', async () => {
      const usage = await client.usage.get()

      // Verify all rate keys are present
      expect(usage.rates).toHaveProperty('starter')
      expect(usage.rates).toHaveProperty('standard')
      expect(usage.rates).toHaveProperty('insights')
      expect(usage.rates).toHaveProperty('pro')

      // All rates should be numbers
      for (const rate of Object.values(usage.rates)) {
        expect(typeof rate).toBe('number')
        expect(rate).toBeGreaterThanOrEqual(0)
      }

      await delay(RATE_LIMIT_DELAY)
    })
  })

  describe('history()', () => {
    it.skipIf(shouldSkipE2E())('returns usage history', async () => {
      const history = await client.usage.history()

      expect(history).toBeDefined()
      expect(history.data).toBeDefined()
      expect(Array.isArray(history.data)).toBe(true)

      await delay(RATE_LIMIT_DELAY)
    })

    it.skipIf(shouldSkipE2E())('returns usage history with custom days', async () => {
      const history = await client.usage.history({ days: 7 })

      expect(history).toBeDefined()
      expect(history.data).toBeDefined()
      expect(Array.isArray(history.data)).toBe(true)

      await delay(RATE_LIMIT_DELAY)
    })

    it.skipIf(shouldSkipE2E())('returns usage history with 30 days default', async () => {
      const history = await client.usage.history()

      expect(history).toBeDefined()
      expect(history.data).toBeDefined()

      // If there are records, verify their structure
      for (const record of history.data) {
        expect(record.date).toBeDefined()
        expect(record.recordType).toBeDefined()
        expect(typeof record.total).toBe('number')
      }
    })
  })
})
