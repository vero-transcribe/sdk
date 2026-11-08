import type { HttpClient } from '../client'
import type {
  Role,
  CreateRoleParams,
  UpdateRoleParams,
  ListRolesParams,
  ListRolesResponse,
} from '../types'

export class RolesResource {
  private client: HttpClient

  constructor(client: HttpClient) {
    this.client = client
  }

  /**
   * List HR job roles and competencies
   */
  async list(params?: ListRolesParams): Promise<ListRolesResponse> {
    const query = new URLSearchParams()
    if (params?.limit !== undefined) query.set('limit', String(params.limit))
    if (params?.offset !== undefined) query.set('offset', String(params.offset))
    if (params?.status) query.set('status', params.status)

    const queryString = query.toString()
    const path = queryString ? `/v1/roles?${queryString}` : '/v1/roles'

    return this.client.get<ListRolesResponse>(path)
  }

  /**
   * Get a single HR job role by ID
   */
  async get(id: string): Promise<Role> {
    return this.client.get<Role>(`/v1/roles/${encodeURIComponent(id)}`)
  }

  /**
   * Create an HR job role with competencies (used with `pack: 'hr'`)
   */
  async create(params: CreateRoleParams): Promise<Role> {
    return this.client.post<Role>('/v1/roles', params)
  }

  /**
   * Update an HR job role
   */
  async update(id: string, params: UpdateRoleParams): Promise<Role> {
    return this.client.patch<Role>(`/v1/roles/${encodeURIComponent(id)}`, params)
  }

  /**
   * Delete an HR job role
   */
  async delete(id: string): Promise<{ success: boolean }> {
    return this.client.delete<{ success: boolean }>(`/v1/roles/${encodeURIComponent(id)}`)
  }
}
