import type { HttpClient } from '../client'
import type {
  Meeting,
  SendBotParams,
  SendBotResponse,
  ListMeetingsParams,
  ListMeetingsResponse,
  MeetingTranscriptionCallbackParams,
} from '../types'

export class MeetingsResource {
  private client: HttpClient

  constructor(client: HttpClient) {
    this.client = client
  }

  /**
   * Send a recording bot to a Zoom, Google Meet, or Microsoft Teams meeting
   */
  async sendBot(params: SendBotParams): Promise<SendBotResponse> {
    return this.client.post<SendBotResponse>('/v1/meetings/send-bot', params)
  }

  /**
   * List meetings
   */
  async list(params?: ListMeetingsParams): Promise<ListMeetingsResponse> {
    const query = new URLSearchParams()
    if (params?.limit !== undefined) query.set('limit', String(params.limit))
    if (params?.offset !== undefined) query.set('offset', String(params.offset))
    const customerId = params?.customer_id ?? params?.customerId
    if (customerId) query.set('customer_id', customerId)

    const queryString = query.toString()
    const path = queryString ? `/v1/meetings?${queryString}` : '/v1/meetings'

    return this.client.get<ListMeetingsResponse>(path)
  }

  /**
   * Get full meeting details by bot ID
   */
  async get(botId: string): Promise<Meeting> {
    return this.client.get<Meeting>(`/v1/meetings/${encodeURIComponent(botId)}`)
  }

  /**
   * Update meeting transcription & analysis results (pipeline callback)
   */
  async transcriptionCallback(
    params: MeetingTranscriptionCallbackParams
  ): Promise<{ success: boolean }> {
    return this.client.post<{ success: boolean }>('/v1/meetings/transcription-callback', params)
  }
}
