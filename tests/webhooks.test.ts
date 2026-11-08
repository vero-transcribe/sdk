import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { VeroTranscribe, VeroAPIError } from '../src'
import { createTestClient, shouldSkipE2E, SKIP_E2E_MESSAGE, delay } from './setup'

// Delay between webhook operations to avoid rate limiting
const RATE_LIMIT_DELAY = 3000

describe('WebhooksResource', () => {
  let client: VeroTranscribe
  const createdWebhookIds: string[] = []

  beforeAll(() => {
    if (shouldSkipE2E()) return
    client = createTestClient()
  })

  afterAll(async () => {
    if (shouldSkipE2E()) return
    // Cleanup: delete all webhooks created during tests
    for (const id of createdWebhookIds) {
      try {
        await client.webhooks.delete(id)
        await delay(RATE_LIMIT_DELAY)
      } catch {
        // Ignore cleanup errors
      }
    }
  })

  describe('create()', () => {
    it.skipIf(shouldSkipE2E())(SKIP_E2E_MESSAGE, async () => {
      const webhook = await client.webhooks.create({
        url: 'https://example.com/webhook',
        events: ['transcription.completed'],
      })

      createdWebhookIds.push(webhook.id)

      expect(webhook).toBeDefined()
      expect(webhook.id).toBeDefined()
      expect(webhook.url).toBe('https://example.com/webhook')
      expect(webhook.events).toContain('transcription.completed')
      expect(webhook.isActive).toBe(true)
      expect(webhook.secret).toBeDefined() // Secret is returned on creation

      await delay(RATE_LIMIT_DELAY)
    })

    it.skipIf(shouldSkipE2E())('creates webhook with multiple events', async () => {
      const webhook = await client.webhooks.create({
        url: 'https://example.com/webhook-multi',
        events: ['transcription.completed', 'transcription.failed', 'analysis.completed'],
      })

      createdWebhookIds.push(webhook.id)

      expect(webhook).toBeDefined()
      expect(webhook.events).toHaveLength(3)
      expect(webhook.events).toContain('transcription.completed')
      expect(webhook.events).toContain('transcription.failed')
      expect(webhook.events).toContain('analysis.completed')

      await delay(RATE_LIMIT_DELAY)
    })
  })

  describe('get()', () => {
    it.skipIf(shouldSkipE2E())('retrieves a webhook by ID', async () => {
      // Create a webhook first
      const created = await client.webhooks.create({
        url: 'https://example.com/webhook-get',
        events: ['transcription.completed'],
      })
      createdWebhookIds.push(created.id)
      await delay(RATE_LIMIT_DELAY)

      // Retrieve it
      const retrieved = await client.webhooks.get(created.id)

      expect(retrieved).toBeDefined()
      expect(retrieved.id).toBe(created.id)
      expect(retrieved.url).toBe('https://example.com/webhook-get')
      // Note: secret is not returned on get, only on create
    })

    it.skipIf(shouldSkipE2E())('throws error for non-existent webhook', async () => {
      await expect(client.webhooks.get('non-existent-id')).rejects.toThrow(VeroAPIError)
      await delay(RATE_LIMIT_DELAY)
    })
  })

  describe('list()', () => {
    it.skipIf(shouldSkipE2E())('lists all webhooks', async () => {
      // Ensure at least one webhook exists
      const webhook = await client.webhooks.create({
        url: 'https://example.com/webhook-list',
        events: ['transcription.completed'],
      })
      createdWebhookIds.push(webhook.id)
      await delay(RATE_LIMIT_DELAY)

      const result = await client.webhooks.list()

      expect(result).toBeDefined()
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.data.length).toBeGreaterThan(0)

      // Find the webhook we just created
      const found = result.data.find((w) => w.id === webhook.id)
      expect(found).toBeDefined()

      await delay(RATE_LIMIT_DELAY)
    })
  })

  describe('update()', () => {
    it.skipIf(shouldSkipE2E())('updates webhook URL', async () => {
      const created = await client.webhooks.create({
        url: 'https://example.com/webhook-update',
        events: ['transcription.completed'],
      })
      createdWebhookIds.push(created.id)
      await delay(RATE_LIMIT_DELAY)

      const updated = await client.webhooks.update(created.id, {
        url: 'https://example.com/webhook-updated',
      })

      expect(updated).toBeDefined()
      expect(updated.id).toBe(created.id)
      expect(updated.url).toBe('https://example.com/webhook-updated')

      await delay(RATE_LIMIT_DELAY)
    })

    it.skipIf(shouldSkipE2E())('updates webhook events', async () => {
      const created = await client.webhooks.create({
        url: 'https://example.com/webhook-events',
        events: ['transcription.completed'],
      })
      createdWebhookIds.push(created.id)
      await delay(RATE_LIMIT_DELAY)

      const updated = await client.webhooks.update(created.id, {
        events: ['transcription.completed', 'transcription.failed'],
      })

      expect(updated).toBeDefined()
      expect(updated.events).toHaveLength(2)
      expect(updated.events).toContain('transcription.failed')

      await delay(RATE_LIMIT_DELAY)
    })

    it.skipIf(shouldSkipE2E())('deactivates webhook', async () => {
      const created = await client.webhooks.create({
        url: 'https://example.com/webhook-deactivate',
        events: ['transcription.completed'],
      })
      createdWebhookIds.push(created.id)
      await delay(RATE_LIMIT_DELAY)

      expect(created.isActive).toBe(true)

      const updated = await client.webhooks.update(created.id, {
        isActive: false,
      })

      expect(updated).toBeDefined()
      expect(updated.isActive).toBe(false)

      await delay(RATE_LIMIT_DELAY)
    })

    it.skipIf(shouldSkipE2E())('reactivates webhook', async () => {
      const created = await client.webhooks.create({
        url: 'https://example.com/webhook-reactivate',
        events: ['transcription.completed'],
      })
      createdWebhookIds.push(created.id)
      await delay(RATE_LIMIT_DELAY)

      // Deactivate first
      await client.webhooks.update(created.id, { isActive: false })
      await delay(RATE_LIMIT_DELAY)

      // Then reactivate
      const reactivated = await client.webhooks.update(created.id, {
        isActive: true,
      })

      expect(reactivated).toBeDefined()
      expect(reactivated.isActive).toBe(true)

      await delay(RATE_LIMIT_DELAY)
    })
  })

  describe('delete()', () => {
    it.skipIf(shouldSkipE2E())('deletes a webhook', async () => {
      const created = await client.webhooks.create({
        url: 'https://example.com/webhook-delete',
        events: ['transcription.completed'],
      })
      await delay(RATE_LIMIT_DELAY)

      const result = await client.webhooks.delete(created.id)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)

      await delay(RATE_LIMIT_DELAY)

      // Verify it's deleted
      await expect(client.webhooks.get(created.id)).rejects.toThrow(VeroAPIError)
    })
  })

  describe('deliveries()', () => {
    it.skipIf(shouldSkipE2E())('retrieves webhook delivery history', async () => {
      const created = await client.webhooks.create({
        url: 'https://example.com/webhook-deliveries',
        events: ['transcription.completed'],
      })
      createdWebhookIds.push(created.id)
      await delay(RATE_LIMIT_DELAY)

      const result = await client.webhooks.deliveries(created.id)

      expect(result).toBeDefined()
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
      // A new webhook likely has no deliveries
    })
  })
})
