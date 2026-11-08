import type { HttpClient } from '../client'
import type {
  AuditReportParams,
  AuditReportResponse,
  AuditNarrativeParams,
  AuditNarrativeResponse,
  ComplianceReportParams,
  ComplianceReportResponse,
} from '../types'

function toIsoString(val: Date | string): string {
  return val instanceof Date ? val.toISOString() : val
}

export function buildAuditReportQuery(params?: AuditReportParams): string {
  const query = new URLSearchParams()
  const scorecardId = params?.scorecard_id ?? params?.scorecardId
  if (scorecardId) query.set('scorecard_id', scorecardId)
  if (params?.from) query.set('from', toIsoString(params.from))
  if (params?.to) query.set('to', toIsoString(params.to))
  const compareFrom = params?.compare_from ?? params?.compareFrom
  const compareTo = params?.compare_to ?? params?.compareTo
  if (compareFrom) query.set('compare_from', toIsoString(compareFrom))
  if (compareTo) query.set('compare_to', toIsoString(compareTo))

  return query.toString()
}

function buildComplianceQuery(params?: ComplianceReportParams, format?: 'json' | 'xlsx'): string {
  const query = new URLSearchParams()
  if (params?.from) query.set('from', toIsoString(params.from))
  if (params?.to) query.set('to', toIsoString(params.to))
  if (params?.pack) query.set('pack', params.pack)
  if (params?.callType) query.set('callType', params.callType)
  if (params?.scorecardId) query.set('scorecardId', params.scorecardId)
  if (params?.roleId) query.set('roleId', params.roleId)
  if (params?.groupBy) query.set('groupBy', params.groupBy)
  if (format) query.set('format', format)

  return query.toString()
}

export class ReportsResource {
  private client: HttpClient

  constructor(client: HttpClient) {
    this.client = client
  }

  /**
   * Get aggregated QA audit report (overall %, per-label %, per-category %, worst items, and optional period comparison)
   */
  async audit(params?: AuditReportParams): Promise<AuditReportResponse> {
    const queryString = buildAuditReportQuery(params)
    const path = queryString ? `/v1/reports/audit?${queryString}` : '/v1/reports/audit'

    return this.client.get<AuditReportResponse>(path)
  }

  /**
   * Generate an executive narrative summary of the SQL-computed audit report
   */
  async auditNarrative(params?: AuditNarrativeParams): Promise<AuditNarrativeResponse> {
    const body: Record<string, unknown> = {}
    const scorecardId = params?.scorecard_id ?? params?.scorecardId
    if (scorecardId) body.scorecard_id = scorecardId
    if (params?.from) body.from = toIsoString(params.from)
    if (params?.to) body.to = toIsoString(params.to)
    const compareFrom = params?.compare_from ?? params?.compareFrom
    const compareTo = params?.compare_to ?? params?.compareTo
    if (compareFrom) body.compare_from = toIsoString(compareFrom)
    if (compareTo) body.compare_to = toIsoString(compareTo)
    if (params?.language) body.language = params.language

    return this.client.post<AuditNarrativeResponse>('/v1/reports/audit/narrative', body)
  }

  /**
   * Get compliance & QA breakdown report (by agent, team, agency, role, or month) as JSON
   */
  async compliance(params?: ComplianceReportParams): Promise<ComplianceReportResponse> {
    const queryString = buildComplianceQuery(params, 'json')
    return this.client.get<ComplianceReportResponse>(`/v1/reports/compliance?${queryString}`)
  }

  /**
   * Download compliance & QA breakdown report as an Excel (`.xlsx`) workbook (`ArrayBuffer`)
   */
  async complianceXlsx(params?: ComplianceReportParams): Promise<ArrayBuffer> {
    const queryString = buildComplianceQuery(params, 'xlsx')
    return this.client.getArrayBuffer(`/v1/reports/compliance?${queryString}`, {
      Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
  }
}
