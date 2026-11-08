import { HttpClient } from './client'
import { TranscriptionsResource } from './resources/transcriptions'
import { WebhooksResource, createWebhookVerifier } from './resources/webhooks'
import { UsageResource } from './resources/usage'
import { MeetingsResource } from './resources/meetings'
import { SubAccountsResource } from './resources/subAccounts'
import { PacksResource } from './resources/packs'
import { RolesResource } from './resources/roles'
import { ScorecardsResource } from './resources/scorecards'
import { SettingsResource } from './resources/settings'
import { EvaluationsResource } from './resources/evaluations'
import { ReportsResource } from './resources/reports'
import type { VeroTranscribeConfig } from './types'

export class VeroTranscribe {
  /**
   * Transcriptions API
   * Create, upload, retrieve, list, analyze, evaluate, and delete transcriptions
   */
  readonly transcriptions: TranscriptionsResource

  /**
   * Webhooks API
   * Manage webhook endpoints for receiving transcription, analysis, evaluation, and alert events
   */
  readonly webhooks: WebhooksResource

  /**
   * Usage API
   * Get current billing period usage statistics and daily history
   */
  readonly usage: UsageResource

  /**
   * Meetings API
   * Send recording bots, list, and retrieve meeting recordings
   */
  readonly meetings: MeetingsResource

  /**
   * Sub-accounts API
   * Manage sub-accounts, API keys, balances, meet users, and sub-account scorecards (reseller only)
   */
  readonly subAccounts: SubAccountsResource

  /**
   * Industry Packs API
   * Discover built-in industry packs (`insurance`, `hr`), call types, and default scorecard templates
   */
  readonly packs: PacksResource

  /**
   * HR Roles API
   * Manage job roles and interview competencies for the HR industry pack
   */
  readonly roles: RolesResource

  /**
   * Scorecards API
   * Create, edit, import (`.xlsx`/`.csv`), version, and publish AI QA call-audit scorecards
   */
  readonly scorecards: ScorecardsResource

  /**
   * Settings API
   * Read and update account-level call-audit defaults
   */
  readonly settings: SettingsResource

  /**
   * Evaluations API
   * List and filter AI QA scorecard evaluations across calls
   */
  readonly evaluations: EvaluationsResource

  /**
   * Reports API
   * Generate aggregated QA audit reports, executive narrative summaries, and JSON/Excel compliance reports
   */
  readonly reports: ReportsResource

  /**
   * Create a new VeroTranscribe client
   *
   * @param config - Configuration options
   * @param config.apiKey - Your VeroTranscribe API key (required)
   * @param config.baseUrl - Custom API base URL (optional, defaults to https://api.verotranscribe.com)
   * @param config.timeout - Request timeout in milliseconds (optional, defaults to 30000)
   *
   * @example
   * ```typescript
   * const client = new VeroTranscribe({
   *   apiKey: process.env.VERO_API_KEY,
   * });
   *
   * const result = await client.transcriptions.transcribe({
   *   audioUrl: 'https://example.com/call.mp3',
   *   language: 'en',
   *   aiAnalysis: 'basic',
   * });
   * ```
   */
  constructor(config: VeroTranscribeConfig) {
    const client = new HttpClient(config)

    this.transcriptions = new TranscriptionsResource(client)
    this.webhooks = new WebhooksResource(client)
    this.usage = new UsageResource(client)
    this.meetings = new MeetingsResource(client)
    this.subAccounts = new SubAccountsResource(client)
    this.packs = new PacksResource(client)
    this.roles = new RolesResource(client)
    this.scorecards = new ScorecardsResource(client)
    this.settings = new SettingsResource(client)
    this.evaluations = new EvaluationsResource(client)
    this.reports = new ReportsResource(client)
  }
}

// Export all types
export type * from './types'

export { VeroAPIError } from './types'
export { createWebhookVerifier }
export {
  TranscriptionsResource,
  WebhooksResource,
  UsageResource,
  MeetingsResource,
  SubAccountsResource,
  PacksResource,
  RolesResource,
  ScorecardsResource,
  SettingsResource,
  EvaluationsResource,
  ReportsResource,
}
export { SubAccountMeetUsersResource, SubAccountScorecardsResource } from './resources/subAccounts'

// Default export
export default VeroTranscribe
