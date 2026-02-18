import { HttpClient } from './client'
import { TranscriptionsResource } from './resources/transcriptions'
import { WebhooksResource, createWebhookVerifier } from './resources/webhooks'
import { UsageResource } from './resources/usage'
import { MeetingsResource } from './resources/meetings'
import { SubAccountsResource } from './resources/subAccounts'
import type { VeroTranscribeConfig } from './types'

export class VeroTranscribe {
  /**
   * Transcriptions API
   * Create, retrieve, list, and delete transcriptions
   */
  readonly transcriptions: TranscriptionsResource

  /**
   * Webhooks API
   * Manage webhook endpoints for receiving transcription events
   */
  readonly webhooks: WebhooksResource

  /**
   * Usage API
   * Get usage statistics and billing information
   */
  readonly usage: UsageResource

  /**
   * Meetings API
   * Send bots, list, and retrieve meeting recordings
   */
  readonly meetings: MeetingsResource

  /**
   * Sub-accounts API
   * Manage sub-accounts and meet users (reseller only)
   */
  readonly subAccounts: SubAccountsResource

  /**
   * Create a new VeroTranscribe client
   *
   * @param config - Configuration options
   * @param config.apiKey - Your VeroTranscribe API key (required)
   * @param config.baseUrl - Custom API base URL (optional, defaults to https://verotranscribe-api.siply.workers.dev)
   * @param config.timeout - Request timeout in milliseconds (optional, defaults to 30000)
   *
   * @example
   * ```typescript
   * const client = new VeroTranscribe({
   *   apiKey: process.env.VERO_API_KEY,
   * });
   *
   * const transcription = await client.transcriptions.create({
   *   language: 'en',
   *   aiAnalysis: 'basic',
   * });
   *
   * await client.transcriptions.upload(transcription.id, audioFile);
   * ```
   */
  constructor(config: VeroTranscribeConfig) {
    const client = new HttpClient(config)

    this.transcriptions = new TranscriptionsResource(client)
    this.webhooks = new WebhooksResource(client)
    this.usage = new UsageResource(client)
    this.meetings = new MeetingsResource(client)
    this.subAccounts = new SubAccountsResource(client)
  }
}

// Export types
export type {
  VeroTranscribeConfig,
  Transcription,
  TranscriptionStatus,
  TranscriptionSegment,
  TranscriptionListItem,
  TranscriptionProvider,
  Transcript,
  WordTimestamp,
  Analysis,
  AIType,
  Language,
  CreateTranscriptionParams,
  UploadAudioParams,
  UploadAudioResponse,
  ListTranscriptionsParams,
  ListTranscriptionsResponse,
  Webhook,
  WebhookEvent,
  WebhookDelivery,
  CreateWebhookParams,
  UpdateWebhookParams,
  ListWebhooksResponse,
  ListWebhookDeliveriesResponse,
  Usage,
  UsagePeriod,
  PackageSlug,
  PackageBreakdown,
  PackageRates,
  UsageHistoryRecord,
  UsageHistoryResponse,
  UsageHistoryParams,
  Meeting,
  MeetingStatus,
  MeetingPlatform,
  SendBotParams,
  SendBotResponse,
  ListMeetingsParams,
  ListMeetingsResponse,
  SubAccount,
  CreateSubAccountParams,
  ListSubAccountsParams,
  ListSubAccountsResponse,
  MeetUser,
  MeetUserInviteStatus,
  CreateMeetUserParams,
  UpdateMeetUserParams,
  ListMeetUsersParams,
  ListMeetUsersResponse,
} from './types'

export { VeroAPIError } from './types'
export { createWebhookVerifier }

// Default export
export default VeroTranscribe
