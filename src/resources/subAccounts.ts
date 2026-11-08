import type { HttpClient } from '../client'
import { buildScorecardImportFormData } from './scorecards'
import { buildEvaluationsQuery } from './evaluations'
import { buildAuditReportQuery } from './reports'
import type {
  SubAccount,
  CreateSubAccountParams,
  UpdateSubAccountParams,
  ListSubAccountsParams,
  ListSubAccountsResponse,
  CreateSubAccountApiKeyParams,
  CreatedSubAccountApiKey,
  ListSubAccountApiKeysResponse,
  SubAccountUsageResponse,
  ListSubAccountTranscriptionsParams,
  ListSubAccountTranscriptionsResponse,
  TransferBalanceParams,
  TransferBalanceResponse,
  ListSubAccountBalanceParams,
  SubAccountBalanceResponse,
  MeetUser,
  CreateMeetUserParams,
  UpdateMeetUserParams,
  ListMeetUsersParams,
  ListMeetUsersResponse,
  ListMeetingsResponse,
  ListMeetingsParams,
  Scorecard,
  ScorecardDetail,
  ListScorecardsParams,
  ListScorecardsResponse,
  CreateScorecardParams,
  UpdateScorecardParams,
  ReplaceScorecardItemsParams,
  ReplaceScorecardItemsResponse,
  PublishScorecardResponse,
  ImportScorecardParams,
  ImportScorecardResponse,
  AuditSettings,
  UpdateAuditSettingsParams,
  ListEvaluationsParams,
  ListEvaluationsResponse,
  AuditReportParams,
  AuditReportResponse,
  TranscriptionEvaluation,
  RerunEvaluationParams,
  RerunEvaluationResponse,
} from '../types'

export class SubAccountMeetUsersResource {
  private client: HttpClient
  private subAccountId: string

  constructor(client: HttpClient, subAccountId: string) {
    this.client = client
    this.subAccountId = encodeURIComponent(subAccountId)
  }

  /**
   * List `meet_user` accounts under a sub-account
   */
  async list(params?: ListMeetUsersParams): Promise<ListMeetUsersResponse> {
    const query = new URLSearchParams()
    if (params?.limit !== undefined) query.set('limit', String(params.limit))
    if (params?.offset !== undefined) query.set('offset', String(params.offset))

    const queryString = query.toString()
    const path = queryString
      ? `/v1/sub-accounts/${this.subAccountId}/meet-users?${queryString}`
      : `/v1/sub-accounts/${this.subAccountId}/meet-users`

    return this.client.get<ListMeetUsersResponse>(path)
  }

  /**
   * Create/invite a `meet_user` under a sub-account
   */
  async create(params: CreateMeetUserParams): Promise<MeetUser> {
    return this.client.post<MeetUser>(
      `/v1/sub-accounts/${this.subAccountId}/meet-users`,
      params
    )
  }

  /**
   * Get a single `meet_user`
   */
  async get(meetUserId: string): Promise<MeetUser> {
    return this.client.get<MeetUser>(
      `/v1/sub-accounts/${this.subAccountId}/meet-users/${encodeURIComponent(meetUserId)}`
    )
  }

  /**
   * Update a `meet_user`
   */
  async update(meetUserId: string, params: UpdateMeetUserParams): Promise<MeetUser> {
    return this.client.patch<MeetUser>(
      `/v1/sub-accounts/${this.subAccountId}/meet-users/${encodeURIComponent(meetUserId)}`,
      params
    )
  }

  /**
   * Delete a `meet_user`
   */
  async delete(meetUserId: string): Promise<{ success: boolean }> {
    return this.client.delete<{ success: boolean }>(
      `/v1/sub-accounts/${this.subAccountId}/meet-users/${encodeURIComponent(meetUserId)}`
    )
  }
}

export class SubAccountScorecardsResource {
  private client: HttpClient
  private subAccountId: string

  constructor(client: HttpClient, subAccountId: string) {
    this.client = client
    this.subAccountId = encodeURIComponent(subAccountId)
  }

  /**
   * List scorecards owned by the sub-account
   */
  async list(
    params?: Pick<ListScorecardsParams, 'limit' | 'offset' | 'includeArchived'>
  ): Promise<ListScorecardsResponse> {
    const query = new URLSearchParams()
    if (params?.limit !== undefined) query.set('limit', String(params.limit))
    if (params?.offset !== undefined) query.set('offset', String(params.offset))
    if (params?.includeArchived !== undefined) {
      query.set('include_archived', String(params.includeArchived))
    }

    const queryString = query.toString()
    const basePath = `/v1/sub-accounts/${this.subAccountId}/scorecards`
    const path = queryString ? `${basePath}?${queryString}` : basePath

    return this.client.get<ListScorecardsResponse>(path)
  }

  /**
   * Create a scorecard for the sub-account
   */
  async create(params: CreateScorecardParams = {}): Promise<Scorecard> {
    return this.client.post<Scorecard>(
      `/v1/sub-accounts/${this.subAccountId}/scorecards`,
      params
    )
  }

  /**
   * Import an `.xlsx` / `.csv` spreadsheet into a sub-account scorecard
   */
  async import(
    file: File | Blob,
    params?: ImportScorecardParams
  ): Promise<ImportScorecardResponse> {
    const formData = buildScorecardImportFormData(file, params)
    return this.client.postFormData<ImportScorecardResponse>(
      `/v1/sub-accounts/${this.subAccountId}/scorecards/import`,
      formData
    )
  }

  /**
   * Get a sub-account scorecard with draft items and version history
   */
  async get(scorecardId: string): Promise<ScorecardDetail> {
    return this.client.get<ScorecardDetail>(
      `/v1/sub-accounts/${this.subAccountId}/scorecards/${encodeURIComponent(scorecardId)}`
    )
  }

  /**
   * Update a sub-account scorecard
   */
  async update(scorecardId: string, params: UpdateScorecardParams): Promise<Scorecard> {
    return this.client.patch<Scorecard>(
      `/v1/sub-accounts/${this.subAccountId}/scorecards/${encodeURIComponent(scorecardId)}`,
      params
    )
  }

  /**
   * Replace draft items on a sub-account scorecard
   */
  async replaceItems(
    scorecardId: string,
    params: ReplaceScorecardItemsParams
  ): Promise<ReplaceScorecardItemsResponse> {
    return this.client.put<ReplaceScorecardItemsResponse>(
      `/v1/sub-accounts/${this.subAccountId}/scorecards/${encodeURIComponent(scorecardId)}/items`,
      params
    )
  }

  /**
   * Publish a sub-account scorecard's current draft items as an immutable version
   */
  async publish(scorecardId: string): Promise<PublishScorecardResponse> {
    return this.client.post<PublishScorecardResponse>(
      `/v1/sub-accounts/${this.subAccountId}/scorecards/${encodeURIComponent(scorecardId)}/publish`
    )
  }
}

export class SubAccountsResource {
  private client: HttpClient

  constructor(client: HttpClient) {
    this.client = client
  }

  /**
   * List sub-accounts
   */
  async list(params?: ListSubAccountsParams): Promise<ListSubAccountsResponse> {
    const query = new URLSearchParams()
    if (params?.limit !== undefined) query.set('limit', String(params.limit))
    if (params?.offset !== undefined) query.set('offset', String(params.offset))

    const queryString = query.toString()
    const path = queryString ? `/v1/sub-accounts?${queryString}` : '/v1/sub-accounts'

    return this.client.get<ListSubAccountsResponse>(path)
  }

  /**
   * Create a sub-account
   */
  async create(params: CreateSubAccountParams): Promise<SubAccount> {
    return this.client.post<SubAccount>('/v1/sub-accounts', params)
  }

  /**
   * Get a sub-account
   */
  async get(subAccountId: string): Promise<SubAccount> {
    return this.client.get<SubAccount>(`/v1/sub-accounts/${encodeURIComponent(subAccountId)}`)
  }

  /**
   * Update a sub-account
   */
  async update(subAccountId: string, params: UpdateSubAccountParams): Promise<SubAccount> {
    return this.client.patch<SubAccount>(
      `/v1/sub-accounts/${encodeURIComponent(subAccountId)}`,
      params
    )
  }

  /**
   * Delete a sub-account (soft-delete; fails with 409 if an allocated balance > 0 remains)
   */
  async delete(subAccountId: string): Promise<{ success: boolean }> {
    return this.client.delete<{ success: boolean }>(
      `/v1/sub-accounts/${encodeURIComponent(subAccountId)}`
    )
  }

  // --------------------------------------------------------------------------
  // Sub-account API Keys
  // --------------------------------------------------------------------------

  /**
   * List active API keys for a sub-account
   */
  async listApiKeys(subAccountId: string): Promise<ListSubAccountApiKeysResponse> {
    return this.client.get<ListSubAccountApiKeysResponse>(
      `/v1/sub-accounts/${encodeURIComponent(subAccountId)}/api-keys`
    )
  }

  /**
   * Create an API key for a sub-account (`key` is only returned once on creation)
   */
  async createApiKey(
    subAccountId: string,
    params: CreateSubAccountApiKeyParams
  ): Promise<CreatedSubAccountApiKey> {
    return this.client.post<CreatedSubAccountApiKey>(
      `/v1/sub-accounts/${encodeURIComponent(subAccountId)}/api-keys`,
      params
    )
  }

  /**
   * Revoke a sub-account API key
   */
  async revokeApiKey(subAccountId: string, keyId: string): Promise<{ success: boolean }> {
    return this.client.delete<{ success: boolean }>(
      `/v1/sub-accounts/${encodeURIComponent(subAccountId)}/api-keys/${encodeURIComponent(keyId)}`
    )
  }

  // --------------------------------------------------------------------------
  // Sub-account Usage, Transcriptions & Balance
  // --------------------------------------------------------------------------

  /**
   * Get current-month usage statistics for a sub-account
   */
  async getUsage(subAccountId: string): Promise<SubAccountUsageResponse> {
    return this.client.get<SubAccountUsageResponse>(
      `/v1/sub-accounts/${encodeURIComponent(subAccountId)}/usage`
    )
  }

  /**
   * List transcriptions belonging to a sub-account
   */
  async listTranscriptions(
    subAccountId: string,
    params?: ListSubAccountTranscriptionsParams
  ): Promise<ListSubAccountTranscriptionsResponse> {
    const query = new URLSearchParams()
    if (params?.limit !== undefined) query.set('limit', String(params.limit))
    if (params?.offset !== undefined) query.set('offset', String(params.offset))

    const queryString = query.toString()
    const basePath = `/v1/sub-accounts/${encodeURIComponent(subAccountId)}/transcriptions`
    const path = queryString ? `${basePath}?${queryString}` : basePath

    return this.client.get<ListSubAccountTranscriptionsResponse>(path)
  }

  /**
   * Allocate funds from the reseller's prepaid balance to a sub-account (one-way transfer).
   * Flips the sub-account to `billingMode: 'allocated'` on first funding.
   */
  async transferBalance(
    subAccountId: string,
    params: TransferBalanceParams
  ): Promise<TransferBalanceResponse> {
    return this.client.post<TransferBalanceResponse>(
      `/v1/sub-accounts/${encodeURIComponent(subAccountId)}/balance`,
      params
    )
  }

  /**
   * Get a sub-account's current balance, billing mode, and transaction ledger
   */
  async getBalance(
    subAccountId: string,
    params?: ListSubAccountBalanceParams
  ): Promise<SubAccountBalanceResponse> {
    const query = new URLSearchParams()
    if (params?.limit !== undefined) query.set('limit', String(params.limit))
    if (params?.offset !== undefined) query.set('offset', String(params.offset))

    const queryString = query.toString()
    const basePath = `/v1/sub-accounts/${encodeURIComponent(subAccountId)}/balance`
    const path = queryString ? `${basePath}?${queryString}` : basePath

    return this.client.get<SubAccountBalanceResponse>(path)
  }

  // --------------------------------------------------------------------------
  // Sub-account Meet Users & Meetings
  // --------------------------------------------------------------------------

  /**
   * Get a `meet_users` sub-resource scoped to a sub-account
   */
  meetUsers(subAccountId: string): SubAccountMeetUsersResource {
    return new SubAccountMeetUsersResource(this.client, subAccountId)
  }

  /**
   * List meetings for all `meet_users` under a sub-account
   */
  async listMeetings(
    subAccountId: string,
    params?: ListMeetingsParams
  ): Promise<ListMeetingsResponse> {
    const query = new URLSearchParams()
    if (params?.limit !== undefined) query.set('limit', String(params.limit))
    if (params?.offset !== undefined) query.set('offset', String(params.offset))

    const queryString = query.toString()
    const path = queryString
      ? `/v1/sub-accounts/${encodeURIComponent(subAccountId)}/meetings?${queryString}`
      : `/v1/sub-accounts/${encodeURIComponent(subAccountId)}/meetings`

    return this.client.get<ListMeetingsResponse>(path)
  }

  // --------------------------------------------------------------------------
  // Sub-account Scorecards & Call Audit
  // --------------------------------------------------------------------------

  /**
   * Get a scorecards sub-resource scoped to a sub-account
   */
  scorecards(subAccountId: string): SubAccountScorecardsResource {
    return new SubAccountScorecardsResource(this.client, subAccountId)
  }

  /**
   * Update call audit settings (`defaultScorecardId`, `auditAllCalls`) for a sub-account
   */
  async updateAuditSettings(
    subAccountId: string,
    params: UpdateAuditSettingsParams
  ): Promise<AuditSettings> {
    return this.client.patch<AuditSettings>(
      `/v1/sub-accounts/${encodeURIComponent(subAccountId)}/settings/audit`,
      params
    )
  }

  /**
   * List QA scorecard evaluations for a sub-account
   */
  async listEvaluations(
    subAccountId: string,
    params?: ListEvaluationsParams
  ): Promise<ListEvaluationsResponse> {
    const queryString = buildEvaluationsQuery(params)
    const basePath = `/v1/sub-accounts/${encodeURIComponent(subAccountId)}/evaluations`
    const path = queryString ? `${basePath}?${queryString}` : basePath

    return this.client.get<ListEvaluationsResponse>(path)
  }

  /**
   * Get aggregated QA audit report for a sub-account
   */
  async getAuditReport(
    subAccountId: string,
    params?: AuditReportParams
  ): Promise<AuditReportResponse> {
    const queryString = buildAuditReportQuery(params)
    const basePath = `/v1/sub-accounts/${encodeURIComponent(subAccountId)}/reports/audit`
    const path = queryString ? `${basePath}?${queryString}` : basePath

    return this.client.get<AuditReportResponse>(path)
  }

  /**
   * Get the latest QA scorecard evaluation for a sub-account transcription
   */
  async getTranscriptionEvaluation(
    subAccountId: string,
    transcriptionId: string
  ): Promise<TranscriptionEvaluation> {
    return this.client.get<TranscriptionEvaluation>(
      `/v1/sub-accounts/${encodeURIComponent(subAccountId)}/transcriptions/${encodeURIComponent(transcriptionId)}/evaluation`
    )
  }

  /**
   * Re-run QA scorecard evaluation on a sub-account transcription
   */
  async rerunTranscriptionEvaluation(
    subAccountId: string,
    transcriptionId: string,
    params?: RerunEvaluationParams
  ): Promise<RerunEvaluationResponse> {
    const body: Record<string, unknown> = {}
    const scorecardId = params?.scorecard_id ?? params?.scorecardId
    const scorecardVersion = params?.scorecard_version ?? params?.scorecardVersion
    if (scorecardId !== undefined) body.scorecard_id = scorecardId
    if (scorecardVersion !== undefined) body.scorecard_version = scorecardVersion

    return this.client.post<RerunEvaluationResponse>(
      `/v1/sub-accounts/${encodeURIComponent(subAccountId)}/transcriptions/${encodeURIComponent(transcriptionId)}/evaluation/rerun`,
      Object.keys(body).length > 0 ? body : undefined
    )
  }
}
