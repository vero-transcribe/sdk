import type { HttpClient } from '../client'
import type {
  Transcription,
  CreateTranscriptionParams,
  CreateTranscriptionOptions,
  ListTranscriptionsParams,
  ListTranscriptionsResponse,
  UploadAudioParams,
  UploadAudioResponse,
  WaitForCompletionOptions,
  TranscriptionAnalysisResponse,
  TranscriptionEvaluation,
  RerunEvaluationParams,
  RerunEvaluationResponse,
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
   * If `audioUrl` is provided, transcription starts immediately.
   * Otherwise, use `upload()` to provide the audio file.
   */
  async create(
    params: CreateTranscriptionParams = {},
    options?: CreateTranscriptionOptions
  ): Promise<Transcription> {
    const query = new URLSearchParams()
    if (options?.provider) query.set('provider', options.provider)
    const queryString = query.toString()
    const path = queryString ? `/v1/transcriptions?${queryString}` : '/v1/transcriptions'

    return this.client.post<Transcription>(path, params)
  }

  /**
   * Get a transcription by ID
   */
  async get(id: string): Promise<Transcription> {
    return this.client.get<Transcription>(`/v1/transcriptions/${encodeURIComponent(id)}`)
  }

  /**
   * Get unified AI analysis, scorecard evaluation + item verdicts, and alerts for a transcription
   */
  async getAnalysis(id: string): Promise<TranscriptionAnalysisResponse> {
    return this.client.get<TranscriptionAnalysisResponse>(
      `/v1/transcriptions/${encodeURIComponent(id)}/analysis`
    )
  }

  /**
   * Get the latest QA scorecard evaluation (scores + item verdicts) for a transcription
   */
  async getEvaluation(id: string): Promise<TranscriptionEvaluation> {
    return this.client.get<TranscriptionEvaluation>(
      `/v1/transcriptions/${encodeURIComponent(id)}/evaluation`
    )
  }

  /**
   * Re-run QA scorecard evaluation on a completed transcription
   */
  async rerunEvaluation(
    id: string,
    params?: RerunEvaluationParams
  ): Promise<RerunEvaluationResponse> {
    const body: Record<string, unknown> = {}
    const scorecardId = params?.scorecard_id ?? params?.scorecardId
    const scorecardVersion = params?.scorecard_version ?? params?.scorecardVersion
    if (scorecardId !== undefined) body.scorecard_id = scorecardId
    if (scorecardVersion !== undefined) body.scorecard_version = scorecardVersion

    return this.client.post<RerunEvaluationResponse>(
      `/v1/transcriptions/${encodeURIComponent(id)}/evaluation/rerun`,
      Object.keys(body).length > 0 ? body : undefined
    )
  }

  /**
   * List transcriptions with optional filters
   */
  async list(params?: ListTranscriptionsParams): Promise<ListTranscriptionsResponse> {
    const query = new URLSearchParams()
    if (params?.limit !== undefined) query.set('limit', String(params.limit))
    if (params?.offset !== undefined) query.set('offset', String(params.offset))
    if (params?.status) query.set('status', params.status)
    if (params?.aiAnalysis) query.set('aiAnalysis', params.aiAnalysis)
    if (params?.pack) query.set('pack', params.pack)
    if (params?.callType) query.set('callType', params.callType)
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
    return this.client.delete<{ success: boolean }>(
      `/v1/transcriptions/${encodeURIComponent(id)}`
    )
  }

  /**
   * Upload an audio file (and optional second channel `audio2`) for a pending transcription.
   * Enqueues the transcription for processing.
   */
  async upload(
    id: string,
    audio: File | Blob,
    params?: UploadAudioParams
  ): Promise<UploadAudioResponse> {
    const formData = new FormData()
    formData.append('audio', audio)
    if (params?.audio2) {
      formData.append('audio2', params.audio2)
    }

    const query = new URLSearchParams()
    if (params?.splitChannels !== undefined) {
      query.set('splitChannels', String(params.splitChannels))
    }
    if (params?.numSpeakers !== undefined) {
      query.set('numSpeakers', String(params.numSpeakers))
    }
    if (params?.provider) {
      query.set('provider', params.provider)
    }

    const queryString = query.toString()
    const basePath = `/v1/transcriptions/${encodeURIComponent(id)}/upload`
    const path = queryString ? `${basePath}?${queryString}` : basePath

    return this.client.postFormData<UploadAudioResponse>(path, formData)
  }

  /**
   * Create a transcription, upload local audio, and wait for completion.
   * Convenience method combining `create()`, `upload()`, and `waitForCompletion()`.
   */
  async transcribeFile(
    audio: File | Blob,
    params?: CreateTranscriptionParams & UploadAudioParams,
    options?: WaitForCompletionOptions
  ): Promise<Transcription> {
    const { audio2, provider, ...createParams } = params || {}
    const transcription = await this.create(createParams, provider ? { provider } : undefined)
    await this.upload(transcription.id, audio, {
      audio2,
      splitChannels: createParams.splitChannels,
      numSpeakers: createParams.numSpeakers,
      provider,
    })
    return this.waitForCompletion(transcription.id, options)
  }

  /**
   * Wait for a transcription to complete.
   * Polls the API at regular intervals until the transcription is completed or failed.
   */
  async waitForCompletion(
    id: string,
    options?: WaitForCompletionOptions
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
   * When `audioUrl` is provided, transcription starts immediately.
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
    options?: WaitForCompletionOptions & CreateTranscriptionOptions
  ): Promise<Transcription> {
    const transcription = await this.create(
      params,
      options?.provider ? { provider: options.provider } : undefined
    )
    return this.waitForCompletion(transcription.id, options)
  }

  /**
   * Convenience alias for `transcribe()` taking `audioUrl` as the first argument.
   */
  async transcribeUrl(
    audioUrl: string,
    params?: Omit<CreateTranscriptionParams, 'audioUrl'>,
    options?: WaitForCompletionOptions & CreateTranscriptionOptions
  ): Promise<Transcription> {
    return this.transcribe({ ...params, audioUrl }, options)
  }

  /**
   * Upload multiple audio files for transcription in a single batch (max 20 files).
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
   * Handles partial failures gracefully — returns both completed and failed transcriptions.
   */
  async bulkTranscribe(
    files: File[] | Blob[] | Array<{ file: File | Blob; name?: string }>,
    params?: BulkUploadParams,
    options?: BulkTranscribeOptions
  ): Promise<BulkTranscribeResult> {
    // First, upload all files
    const uploadResult = await this.bulkUpload(files, params)

    // Get IDs of successfully queued transcriptions
    const queuedItems = uploadResult.results.filter(
      (r) => r.status === 'queued' && r.transcriptionId
    )

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
