import type { HttpClient } from '../client'
import type { ListEvaluationsParams, ListEvaluationsResponse } from '../types'

export function buildEvaluationsQuery(params?: ListEvaluationsParams): string {
  const query = new URLSearchParams()
  if (params?.limit !== undefined) query.set('limit', String(params.limit))
  if (params?.offset !== undefined) query.set('offset', String(params.offset))
  if (params?.from) {
    query.set('from', params.from instanceof Date ? params.from.toISOString() : params.from)
  }
  if (params?.to) {
    query.set('to', params.to instanceof Date ? params.to.toISOString() : params.to)
  }
  const scorecardId = params?.scorecard_id ?? params?.scorecardId
  if (scorecardId) query.set('scorecard_id', scorecardId)
  if (params?.status) query.set('status', params.status)
  if (params?.label) query.set('label', params.label)
  if (params?.category) query.set('category', params.category)
  if (params?.verdict) query.set('verdict', params.verdict)

  return query.toString()
}

export class EvaluationsResource {
  private client: HttpClient

  constructor(client: HttpClient) {
    this.client = client
  }

  /**
   * List and filter QA scorecard evaluations across calls
   */
  async list(params?: ListEvaluationsParams): Promise<ListEvaluationsResponse> {
    const queryString = buildEvaluationsQuery(params)
    const path = queryString ? `/v1/evaluations?${queryString}` : '/v1/evaluations'

    return this.client.get<ListEvaluationsResponse>(path)
  }
}
