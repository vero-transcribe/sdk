import type { HttpClient } from '../client'
import type { AuditSettings, UpdateAuditSettingsParams } from '../types'

export class SettingsResource {
  private client: HttpClient

  constructor(client: HttpClient) {
    this.client = client
  }

  /**
   * Get account-level call audit settings (`defaultScorecardId`, `auditAllCalls`)
   */
  async getAudit(): Promise<AuditSettings> {
    return this.client.get<AuditSettings>('/v1/settings/audit')
  }

  /**
   * Update account-level call audit settings
   */
  async updateAudit(params: UpdateAuditSettingsParams): Promise<AuditSettings> {
    return this.client.patch<AuditSettings>('/v1/settings/audit', params)
  }
}
