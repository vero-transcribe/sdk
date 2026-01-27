import type { VeroTranscribeConfig, APIErrorResponse } from './types'
import { VeroAPIError } from './types'

const DEFAULT_BASE_URL = 'https://api.verotranscribe.com'
const DEFAULT_TIMEOUT = 30000

export class HttpClient {
  private apiKey: string
  private baseUrl: string
  private timeout: number

  constructor(config: VeroTranscribeConfig) {
    if (!config.apiKey) {
      throw new Error('API key is required')
    }

    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl || DEFAULT_BASE_URL
    this.timeout = config.timeout || DEFAULT_TIMEOUT
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        let errorData: APIErrorResponse
        try {
          errorData = await response.json()
        } catch {
          throw new VeroAPIError('An unknown error occurred', 'unknown_error', response.status)
        }
        throw new VeroAPIError(errorData.error.message, errorData.error.code, response.status)
      }

      return response.json()
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof VeroAPIError) {
        throw error
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new VeroAPIError('Request timed out', 'timeout', 408)
        }
        throw new VeroAPIError(error.message, 'network_error', 0)
      }

      throw new VeroAPIError('An unknown error occurred', 'unknown_error', 0)
    }
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path)
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body)
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body)
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path)
  }

  async postFormData<T>(path: string, formData: FormData): Promise<T> {
    const url = `${this.baseUrl}${path}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        let errorData: APIErrorResponse
        try {
          errorData = await response.json()
        } catch {
          throw new VeroAPIError('An unknown error occurred', 'unknown_error', response.status)
        }
        throw new VeroAPIError(errorData.error.message, errorData.error.code, response.status)
      }

      return response.json()
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof VeroAPIError) {
        throw error
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new VeroAPIError('Request timed out', 'timeout', 408)
        }
        throw new VeroAPIError(error.message, 'network_error', 0)
      }

      throw new VeroAPIError('An unknown error occurred', 'unknown_error', 0)
    }
  }
}
