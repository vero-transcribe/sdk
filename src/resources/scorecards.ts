import type { HttpClient } from '../client'
import type {
  Scorecard,
  ScorecardDetail,
  ListScorecardsParams,
  ListScorecardsResponse,
  CreateScorecardParams,
  UpdateScorecardParams,
  ReplaceScorecardItemsParams,
  ReplaceScorecardItemsResponse,
  PublishScorecardResponse,
  DeleteScorecardResponse,
  ImportScorecardParams,
  ImportScorecardResponse,
} from '../types'

export function buildScorecardImportFormData(
  file: File | Blob,
  params?: ImportScorecardParams
): FormData {
  const formData = new FormData()
  if (params?.filename) {
    formData.append('file', file, params.filename)
  } else if (file instanceof File) {
    formData.append('file', file)
  } else {
    formData.append('file', file, 'scorecard.xlsx')
  }

  if (params?.mapping) {
    formData.append('mapping', JSON.stringify(params.mapping))
  }
  if (params?.dryRun !== undefined) {
    formData.append('dry_run', params.dryRun ? 'true' : 'false')
  }
  if (params?.scorecardId) {
    formData.append('scorecard_id', params.scorecardId)
  }
  if (params?.name) {
    formData.append('name', params.name)
  }
  if (params?.pack) {
    formData.append('pack', params.pack)
  }
  if (params?.callType) {
    formData.append('callType', params.callType)
  }

  return formData
}

export class ScorecardsResource {
  private client: HttpClient

  constructor(client: HttpClient) {
    this.client = client
  }

  /**
   * List QA scorecards owned by the calling account
   */
  async list(params?: ListScorecardsParams): Promise<ListScorecardsResponse> {
    const query = new URLSearchParams()
    if (params?.limit !== undefined) query.set('limit', String(params.limit))
    if (params?.offset !== undefined) query.set('offset', String(params.offset))
    if (params?.includeArchived !== undefined) {
      query.set('include_archived', String(params.includeArchived))
    }
    if (params?.pack) query.set('pack', params.pack)
    if (params?.callType) query.set('callType', params.callType)

    const queryString = query.toString()
    const path = queryString ? `/v1/scorecards?${queryString}` : '/v1/scorecards'

    return this.client.get<ListScorecardsResponse>(path)
  }

  /**
   * Create a scorecard (custom draft or seeded from an industry `pack`)
   */
  async create(params: CreateScorecardParams = {}): Promise<Scorecard> {
    return this.client.post<Scorecard>('/v1/scorecards', params)
  }

  /**
   * Get a scorecard with its draft items and published version history
   */
  async get(id: string): Promise<ScorecardDetail> {
    return this.client.get<ScorecardDetail>(`/v1/scorecards/${encodeURIComponent(id)}`)
  }

  /**
   * Update scorecard metadata, archive/un-archive status, or tune individual items inline
   */
  async update(id: string, params: UpdateScorecardParams): Promise<Scorecard> {
    return this.client.patch<Scorecard>(`/v1/scorecards/${encodeURIComponent(id)}`, params)
  }

  /**
   * Archive (soft-delete) a scorecard
   */
  async delete(id: string): Promise<DeleteScorecardResponse> {
    return this.client.delete<DeleteScorecardResponse>(
      `/v1/scorecards/${encodeURIComponent(id)}`
    )
  }

  /**
   * Replace the full draft item list of a scorecard
   */
  async replaceItems(
    id: string,
    params: ReplaceScorecardItemsParams
  ): Promise<ReplaceScorecardItemsResponse> {
    return this.client.put<ReplaceScorecardItemsResponse>(
      `/v1/scorecards/${encodeURIComponent(id)}/items`,
      params
    )
  }

  /**
   * Freeze current draft items into a new immutable published version
   */
  async publish(id: string): Promise<PublishScorecardResponse> {
    return this.client.post<PublishScorecardResponse>(
      `/v1/scorecards/${encodeURIComponent(id)}/publish`
    )
  }

  /**
   * Duplicate a scorecard's draft items into a new draft scorecard
   */
  async duplicate(id: string): Promise<Scorecard> {
    return this.client.post<Scorecard>(
      `/v1/scorecards/${encodeURIComponent(id)}/duplicate`
    )
  }

  /**
   * Import an Excel (`.xlsx`) or `.csv` checklist into draft scorecard items
   */
  async import(
    file: File | Blob,
    params?: ImportScorecardParams
  ): Promise<ImportScorecardResponse> {
    const formData = buildScorecardImportFormData(file, params)
    return this.client.postFormData<ImportScorecardResponse>('/v1/scorecards/import', formData)
  }
}
