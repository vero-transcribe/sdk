import type { HttpClient } from '../client'
import type {
  Transcription,
  CreateTranscriptionParams,
  ListTranscriptionsParams,
  ListTranscriptionsResponse,
  UploadAudioParams,
  UploadAudioResponse,
  BulkUploadParams,
  BulkUploadResponse,
  BulkTranscribeOptions,
  BulkTranscribeResult,
} from '../types'

const DEFAULT_POLL_INTERVAL = 2000
const DEFAULT_MAX_WAIT_TIME = 300000 // 5 minutes

export class TranscriptionsResource {
  private client: HttpClient

  constructor(client: HttpClient) {
    this.client = client
  }

  /**
   * Create a new transcription.
   * If audioUrl is provided, transcription starts immediately.
   * Otherwise, use upload() to provide the audio file.
   */
  async create(params: CreateTranscriptionParams): Promise<Transcription> {
    return this.client.post<Transcription>('/v1/transcriptions', params)
  }

  /**
   * Get a transcription by ID
   */
  async get(id: string): Promise<Transcription> {
    return this.client.get<Transcription>(`/v1/transcriptions/${id}`)
  }

  /**
   * List all transcriptions
   */
  async list(params?: ListTranscriptionsParams): Promise<ListTranscriptionsResponse> {
    const query = new URLSearchParams()
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.offset) query.set('offset', String(params.offset))
    if (params?.status) query.set('status', params.status)
    if (params?.aiAnalysis) query.set('aiAnalysis', params.aiAnalysis)
    if (params?.from) {
      const fromDate = params.from instanceof Date ? params.from.toISOString() : params.from
      query.set('from', fromDate)
    }
    if (params?.to) {
      const toDate = params.to instanceof Date ? params.to.toISOString() : params.to
      query.set('to', toDate)
    }

    const queryString = query.toString()
    const path = queryString ? `/v1/transcriptions?${queryString}` : '/v1/transcriptions'

    return this.client.get<ListTranscriptionsResponse>(path)
  }

  /**
   * Delete a transcription
   */
  async delete(id: string): Promise<{ success: boolean }> {
    return this.client.delete<{ success: boolean }>(`/v1/transcriptions/${id}`)
  }

  /**
   * Upload an audio file for an existing transcription
   * This enqueues the transcription for processing
   */
  async upload(
    id: string,
    audio: File | Blob,
    params?: UploadAudioParams
  ): Promise<UploadAudioResponse> {
    const formData = new FormData()
    formData.append('audio', audio)

    const query = params?.provider ? `?provider=${params.provider}` : ''
    return this.client.postFormData<UploadAudioResponse>(
      `/v1/transcriptions/${id}/upload${query}`,
      formData
    )
  }

  /**
   * Create a transcription, upload audio, and wait for completion
   * Convenience method that combines create(), upload(), and waitForCompletion()
   */
  async transcribeFile(
    audio: File | Blob,
    params?: CreateTranscriptionParams & UploadAudioParams,
    options?: {
      pollInterval?: number
      maxWaitTime?: number
      onProgress?: (transcription: Transcription) => void
    }
  ): Promise<Transcription> {
    const { provider, ...createParams } = params || {}
    const transcription = await this.create(createParams)
    await this.upload(transcription.id, audio, { provider })
    return this.waitForCompletion(transcription.id, options)
  }

  /**
   * Wait for a transcription to complete
   * Polls the API at regular intervals until the transcription is completed or failed
   */
  async waitForCompletion(
    id: string,
    options?: {
      pollInterval?: number
      maxWaitTime?: number
      onProgress?: (transcription: Transcription) => void
    }
  ): Promise<Transcription> {
    const pollInterval = options?.pollInterval || DEFAULT_POLL_INTERVAL
    const maxWaitTime = options?.maxWaitTime || DEFAULT_MAX_WAIT_TIME
    const startTime = Date.now()

    while (true) {
      const transcription = await this.get(id)

      if (options?.onProgress) {
        options.onProgress(transcription)
      }

      if (transcription.status === 'completed') {
        return transcription
      }

      if (transcription.status === 'failed') {
        throw new Error(transcription.errorMessage || 'Transcription failed')
      }

      if (Date.now() - startTime > maxWaitTime) {
        throw new Error('Timeout waiting for transcription to complete')
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval))
    }
  }

  /**
   * Create a transcription from a URL and wait for it to complete.
   * When audioUrl is provided, transcription starts immediately.
   *
   * @example
   * ```ts
   * const result = await vero.transcriptions.transcribe({
   *   audioUrl: 'https://example.com/audio.mp3',
   *   language: 'en',
   * })
   * ```
   */
  async transcribe(
    params: CreateTranscriptionParams & { audioUrl: string },
    options?: {
      pollInterval?: number
      maxWaitTime?: number
      onProgress?: (transcription: Transcription) => void
    }
  ): Promise<Transcription> {
    const transcription = await this.create(params)
    return this.waitForCompletion(transcription.id, options)
  }

  /**
   * Upload multiple audio files for transcription in a single batch.
   * Returns immediately after files are queued for processing.
   *
   * @example
   * ```ts
   * const result = await vero.transcriptions.bulkUpload(
   *   [file1, file2, file3],
   *   { language: 'en', aiAnalysis: 'basic' }
   * )
   * console.log(`Queued ${result.summary.queued} files`)
   * ```
   */
  async bulkUpload(
    files: File[] | Blob[] | Array<{ file: File | Blob; name?: string }>,
    params?: BulkUploadParams
  ): Promise<BulkUploadResponse> {
    const formData = new FormData()

    // Add options as JSON
    if (params) {
      formData.append('options', JSON.stringify(params))
    }

    // Add all files
    for (const item of files) {
      if (item instanceof File || item instanceof Blob) {
        formData.append('audio[]', item)
      } else {
        // Handle { file, name } format
        const blob = item.file
        const name = item.name || (blob instanceof File ? blob.name : 'audio.mp3')
        formData.append('audio[]', blob, name)
      }
    }

    return this.client.postFormData<BulkUploadResponse>('/v1/transcriptions/bulk', formData)
  }

  /**
   * Upload multiple files and wait for all to complete.
   * Handles partial failures gracefully - returns both completed and failed transcriptions.
   *
   * @example
   * ```ts
   * const result = await vero.transcriptions.bulkTranscribe(
   *   [file1, file2, file3],
   *   { language: 'en' },
   *   {
   *     onBatchProgress: (completed, total) => {
   *       console.log(`Progress: ${completed}/${total}`)
   *     }
   *   }
   * )
   * console.log(`Completed: ${result.completed.length}, Failed: ${result.failed.length}`)
   * ```
   */
  async bulkTranscribe(
    files: File[] | Blob[] | Array<{ file: File | Blob; name?: string }>,
    params?: BulkUploadParams,
    options?: BulkTranscribeOptions
  ): Promise<BulkTranscribeResult> {
    // First, upload all files
    const uploadResult = await this.bulkUpload(files, params)

    // Get IDs of successfully queued transcriptions
    const queuedItems = uploadResult.results.filter((r) => r.status === 'queued' && r.transcriptionId)

    // Wait for all to complete
    const results = await this.waitForBatch(
      queuedItems.map((item) => ({
        id: item.transcriptionId!,
        filename: item.filename,
      })),
      options
    )

    // Separate completed and failed
    const completed: Transcription[] = []
    const failed: BulkTranscribeResult['failed'] = []

    // Add upload failures first
    for (const item of uploadResult.results) {
      if (item.status === 'failed') {
        failed.push({
          filename: item.filename,
          error: new Error(item.error?.message || 'Upload failed'),
        })
      }
    }

    // Add processing results
    for (const [id, result] of results) {
      const item = queuedItems.find((q) => q.transcriptionId === id)
      if (result instanceof Error) {
        failed.push({
          filename: item?.filename || 'unknown',
          transcriptionId: id,
          error: result,
        })
      } else {
        completed.push(result)
      }
    }

    return {
      batchId: uploadResult.batchId,
      completed,
      failed,
    }
  }

  /**
   * Wait for multiple transcriptions to complete.
   * Polls in parallel with configurable concurrency.
   */
  async waitForBatch(
    items: Array<{ id: string; filename?: string }>,
    options?: BulkTranscribeOptions
  ): Promise<Map<string, Transcription | Error>> {
    const pollInterval = options?.pollInterval || DEFAULT_POLL_INTERVAL
    const maxWaitTime = options?.maxWaitTime || DEFAULT_MAX_WAIT_TIME
    const concurrency = options?.concurrency || 5

    const results = new Map<string, Transcription | Error>()
    const pending = new Set(items.map((item) => item.id))
    const idToFilename = new Map(items.map((item) => [item.id, item.filename || 'unknown']))
    const startTime = Date.now()

    while (pending.size > 0) {
      if (Date.now() - startTime > maxWaitTime) {
        // Mark remaining as timed out
        for (const id of pending) {
          results.set(id, new Error('Timeout waiting for transcription to complete'))
        }
        break
      }

      // Poll up to `concurrency` items at a time
      const batch = Array.from(pending).slice(0, concurrency)
      const promises = batch.map(async (id) => {
        try {
          const transcription = await this.get(id)

          if (options?.onFileProgress) {
            options.onFileProgress(idToFilename.get(id) || 'unknown', transcription)
          }

          if (transcription.status === 'completed') {
            results.set(id, transcription)
            pending.delete(id)
          } else if (transcription.status === 'failed') {
            results.set(id, new Error(transcription.errorMessage || 'Transcription failed'))
            pending.delete(id)
          }
        } catch (error) {
          results.set(id, error instanceof Error ? error : new Error('Unknown error'))
          pending.delete(id)
        }
      })

      await Promise.all(promises)

      // Report batch progress
      if (options?.onBatchProgress) {
        options.onBatchProgress(results.size, items.length, results)
      }

      // Wait before next poll if there are still pending items
      if (pending.size > 0) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval))
      }
    }

    return results
  }
}
