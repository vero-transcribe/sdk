import type { HttpClient } from '../client'
import type {
  Meeting,
  SendBotParams,
  SendBotResponse,
  ListMeetingsParams,
  ListMeetingsResponse,
} from '../types'

export class MeetingsResource {
  private client: HttpClient

  constructor(client: HttpClient) {
    this.client = client
  }

  /**
   * Send a MeetingBaas bot to a meeting
   */
  async sendBot(params: SendBotParams): Promise<SendBotResponse> {
    return this.client.post<SendBotResponse>('/v1/meetings/send-bot', params)
  }

  /**
   * List meetings
   */
  async list(params?: ListMeetingsParams): Promise<ListMeetingsResponse> {
    const query = new URLSearchParams()
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.offset) query.set('offset', String(params.offset))
    if (params?.customerId) query.set('customer_id', params.customerId)

    const queryString = query.toString()
    const path = queryString ? `/v1/meetings?${queryString}` : '/v1/meetings'

    return this.client.get<ListMeetingsResponse>(path)
  }

  /**
   * Get a meeting by bot ID
   */
  async get(botId: string): Promise<Meeting> {
    return this.client.get<Meeting>(`/v1/meetings/${botId}`)
  }
}
