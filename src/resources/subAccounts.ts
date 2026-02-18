import type { HttpClient } from '../client'
import type {
  SubAccount,
  CreateSubAccountParams,
  ListSubAccountsParams,
  ListSubAccountsResponse,
  MeetUser,
  CreateMeetUserParams,
  UpdateMeetUserParams,
  ListMeetUsersParams,
  ListMeetUsersResponse,
  ListMeetingsResponse,
  ListMeetingsParams,
} from '../types'

export class SubAccountMeetUsersResource {
  private client: HttpClient
  private subAccountId: string

  constructor(client: HttpClient, subAccountId: string) {
    this.client = client
    this.subAccountId = subAccountId
  }

  /**
   * List meet_users under a sub-account
   */
  async list(params?: ListMeetUsersParams): Promise<ListMeetUsersResponse> {
    const query = new URLSearchParams()
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.offset) query.set('offset', String(params.offset))

    const queryString = query.toString()
    const path = queryString
      ? `/v1/sub-accounts/${this.subAccountId}/meet-users?${queryString}`
      : `/v1/sub-accounts/${this.subAccountId}/meet-users`

    return this.client.get<ListMeetUsersResponse>(path)
  }

  /**
   * Create/invite a meet_user
   */
  async create(params: CreateMeetUserParams): Promise<MeetUser> {
    return this.client.post<MeetUser>(`/v1/sub-accounts/${this.subAccountId}/meet-users`, params)
  }

  /**
   * Get a single meet_user
   */
  async get(meetUserId: string): Promise<MeetUser> {
    return this.client.get<MeetUser>(`/v1/sub-accounts/${this.subAccountId}/meet-users/${meetUserId}`)
  }

  /**
   * Update a meet_user
   */
  async update(meetUserId: string, params: UpdateMeetUserParams): Promise<MeetUser> {
    return this.client.patch<MeetUser>(`/v1/sub-accounts/${this.subAccountId}/meet-users/${meetUserId}`, params)
  }

  /**
   * Delete a meet_user
   */
  async delete(meetUserId: string): Promise<{ success: boolean }> {
    return this.client.delete<{ success: boolean }>(`/v1/sub-accounts/${this.subAccountId}/meet-users/${meetUserId}`)
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
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.offset) query.set('offset', String(params.offset))

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
    return this.client.get<SubAccount>(`/v1/sub-accounts/${subAccountId}`)
  }

  /**
   * Update a sub-account
   */
  async update(subAccountId: string, params: { name: string }): Promise<SubAccount> {
    return this.client.patch<SubAccount>(`/v1/sub-accounts/${subAccountId}`, params)
  }

  /**
   * Delete a sub-account
   */
  async delete(subAccountId: string): Promise<{ success: boolean }> {
    return this.client.delete<{ success: boolean }>(`/v1/sub-accounts/${subAccountId}`)
  }

  /**
   * Get a meet users resource for a sub-account
   */
  meetUsers(subAccountId: string): SubAccountMeetUsersResource {
    return new SubAccountMeetUsersResource(this.client, subAccountId)
  }

  /**
   * List meetings for all meet_users under a sub-account
   */
  async listMeetings(subAccountId: string, params?: ListMeetingsParams): Promise<ListMeetingsResponse> {
    const query = new URLSearchParams()
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.offset) query.set('offset', String(params.offset))

    const queryString = query.toString()
    const path = queryString
      ? `/v1/sub-accounts/${subAccountId}/meetings?${queryString}`
      : `/v1/sub-accounts/${subAccountId}/meetings`

    return this.client.get<ListMeetingsResponse>(path)
  }
}
