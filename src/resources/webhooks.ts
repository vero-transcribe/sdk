import type { HttpClient } from '../client'
import type {
  Webhook,
  CreateWebhookParams,
  UpdateWebhookParams,
  ListWebhooksResponse,
  ListWebhookDeliveriesResponse,
} from '../types'

export class WebhooksResource {
  private client: HttpClient

  constructor(client: HttpClient) {
    this.client = client
  }

  /**
   * Create a new webhook endpoint
   */
  async create(params: CreateWebhookParams): Promise<Webhook> {
    return this.client.post<Webhook>('/v1/webhooks', params)
  }

  /**
   * Get a webhook by ID
   */
  async get(id: string): Promise<Webhook> {
    return this.client.get<Webhook>(`/v1/webhooks/${id}`)
  }

  /**
   * List all webhooks
   */
  async list(): Promise<ListWebhooksResponse> {
    return this.client.get<ListWebhooksResponse>('/v1/webhooks')
  }

  /**
   * Update a webhook
   */
  async update(id: string, params: UpdateWebhookParams): Promise<Webhook> {
    return this.client.patch<Webhook>(`/v1/webhooks/${id}`, params)
  }

  /**
   * Delete a webhook
   */
  async delete(id: string): Promise<{ success: boolean }> {
    return this.client.delete<{ success: boolean }>(`/v1/webhooks/${id}`)
  }

  /**
   * Get delivery history for a webhook (last 10)
   */
  async deliveries(id: string): Promise<ListWebhookDeliveriesResponse> {
    return this.client.get<ListWebhookDeliveriesResponse>(`/v1/webhooks/${id}/deliveries`)
  }
}

/**
 * Helper function to verify webhook signatures in Node.js environments.
 * The signature is computed over `${timestamp}.${body}` using HMAC-SHA256.
 *
 * @param secret - The webhook secret (shown once at creation)
 *
 * @example
 * ```typescript
 * const verifier = createWebhookVerifier('whsec_...')
 * const isValid = await verifier.verify(rawBody, signatureHeader, timestampHeader)
 * ```
 */
export function createWebhookVerifier(secret: string) {
  return {
    verify: async (body: string, signature: string, timestamp: string): Promise<boolean> => {
      const crypto = await import('crypto')
      const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')
      return `sha256=${expected}` === signature
    },
  }
}
