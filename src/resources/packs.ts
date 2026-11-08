import type { HttpClient } from '../client'
import type {
  IndustryPackSlug,
  IndustryCallType,
  IndustryPackDefinition,
  PackDefaultScorecard,
  ListPacksResponse,
} from '../types'

export class PacksResource {
  private client: HttpClient

  constructor(client: HttpClient) {
    this.client = client
  }

  /**
   * List available industry packs (`insurance`, `hr`) and their call types, alert rules, and guardrails
   */
  async list(): Promise<ListPacksResponse> {
    return this.client.get<ListPacksResponse>('/v1/packs')
  }

  /**
   * Get full industry pack definition by slug
   */
  async get(pack: IndustryPackSlug): Promise<IndustryPackDefinition> {
    return this.client.get<IndustryPackDefinition>(`/v1/packs/${encodeURIComponent(pack)}`)
  }

  /**
   * Get the default scorecard template items for an industry pack (optionally filtered by `callType`)
   */
  async getDefaultScorecard(
    pack: IndustryPackSlug,
    params?: { callType?: IndustryCallType }
  ): Promise<PackDefaultScorecard> {
    const query = new URLSearchParams()
    if (params?.callType) query.set('callType', params.callType)
    const queryString = query.toString()
    const basePath = `/v1/packs/${encodeURIComponent(pack)}/scorecards/default`
    const path = queryString ? `${basePath}?${queryString}` : basePath

    return this.client.get<PackDefaultScorecard>(path)
  }
}
