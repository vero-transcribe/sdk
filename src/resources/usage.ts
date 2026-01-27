import type { HttpClient } from '../client'
import type { Usage, UsageHistoryResponse, UsageHistoryParams } from '../types'

export class UsageResource {
  private client: HttpClient

  constructor(client: HttpClient) {
    this.client = client
  }

  /**
   * Get usage statistics for the current billing period
   */
  async get(): Promise<Usage> {
    return this.client.get<Usage>('/v1/usage')
  }

  /**
   * Get usage history (daily breakdown)
   * @param params.days - Number of days to look back (default: 30)
   */
  async history(params?: UsageHistoryParams): Promise<UsageHistoryResponse> {
    const query = params?.days ? `?days=${params.days}` : ''
    return this.client.get<UsageHistoryResponse>(`/v1/usage/history${query}`)
  }
}
