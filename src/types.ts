// Configuration
export interface VeroTranscribeConfig {
  apiKey: string
  baseUrl?: string
  timeout?: number
}

// Transcription types
export type TranscriptionStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type AIType = 'none' | 'basic' | 'coach'
export type Language = 'en' | 'he' | 'es' | 'auto'

export interface WordTimestamp {
  word: string
  start: number
  end: number
}

export interface TranscriptionSegment {
  speaker: string
  text: string
  start: number
  end: number
}

export interface Transcript {
  text: string
  segments: TranscriptionSegment[]
  words?: WordTimestamp[]
  language: string
  duration: number
}

export interface Analysis {
  summary: string
  outcome: {
    status: string
    reason: string
    followUpPotential: string
  }
  sentiment: {
    initial: number
    final: number
    average: number
  }
  keyPhrases: string[]
  agentActions?: Array<{
    action: string
    timestamp: string
  }>
  participants?: {
    agent?: string
    customer?: string
  }
  emotions?: {
    customer: Array<{ emotion: string; intensity: string }>
    agent: Array<{ emotion: string; intensity: string }>
  }
  coaching?: {
    suggestions: Array<{
      item: string
      timestamp?: string
      severity: 'low' | 'medium' | 'high'
    }>
    performance: {
      clarity: number
      empathy: number
      compliance: number
      professionalism: number
    }
    behavioral?: {
      talkListenRatio: number
      questionsAsked: { open: number; closed: number }
      interruptions: number
      speakingPace: number
      empathyStatements: number
    }
  }
}

export interface Transcription {
  id: string
  externalId?: string
  status: TranscriptionStatus
  durationSeconds?: number
  language: Language
  diarize?: boolean
  aiType?: AIType
  saveTranscript?: boolean
  transcript?: Transcript
  analysis?: Analysis
  metadata?: Record<string, unknown>
  createdAt: string
  completedAt?: string
  errorMessage?: string
}

export interface CreateTranscriptionParams {
  language?: Language
  diarize?: boolean
  aiAnalysis?: AIType
  saveTranscript?: boolean
  externalId?: string
  webhookUrl?: string
  metadata?: Record<string, unknown>
  /** URL to fetch audio from. When provided, transcription starts immediately without needing upload(). */
  audioUrl?: string
}

export type TranscriptionProvider = 'replicate' | 'elevenlabs' | 'runpod'

export interface UploadAudioParams {
  provider?: TranscriptionProvider
}

export interface UploadAudioResponse {
  id: string
  status: TranscriptionStatus
}

export interface ListTranscriptionsParams {
  limit?: number
  offset?: number
  status?: TranscriptionStatus
  aiAnalysis?: AIType
  from?: Date | string
  to?: Date | string
}

export interface TranscriptionListItem {
  id: string
  externalId?: string
  status: TranscriptionStatus
  durationSeconds?: number
  language: string
  aiType?: AIType
  createdAt: string
  completedAt?: string
}

export interface ListTranscriptionsResponse {
  data: TranscriptionListItem[]
  pagination: {
    limit: number
    offset: number
    hasMore: boolean
  }
}

// Webhook types
export type WebhookEvent =
  | 'transcription.created'
  | 'transcription.processing'
  | 'transcription.completed'
  | 'transcription.failed'
  | 'analysis.completed'

export interface Webhook {
  id: string
  url: string
  events: WebhookEvent[]
  secret?: string
  isActive: boolean
  createdAt: string
}

export interface CreateWebhookParams {
  url: string
  events: WebhookEvent[]
}

export interface UpdateWebhookParams {
  url?: string
  events?: WebhookEvent[]
  isActive?: boolean
}

export interface WebhookDelivery {
  id: string
  eventType: WebhookEvent
  statusCode: number | null
  success: boolean
  attempts: number
  createdAt: string
}

export interface ListWebhooksResponse {
  data: Webhook[]
}

export interface ListWebhookDeliveriesResponse {
  data: WebhookDelivery[]
}

// Usage types
export interface UsagePeriod {
  start: string
  end: string
}

export type PackageSlug = 'starter' | 'standard' | 'insights' | 'pro'

export interface PackageBreakdown {
  minutes: number
  cost: number
  count: number
}

export interface PackageRates {
  starter: number
  standard: number
  insights: number
  pro: number
}

export interface Usage {
  period: UsagePeriod
  totalMinutes: number
  totalCost: number
  packages: Record<PackageSlug, PackageBreakdown>
  rates: PackageRates
}

export interface UsageHistoryRecord {
  date: string
  recordType: string
  total: number
}

export interface UsageHistoryResponse {
  data: UsageHistoryRecord[]
}

export interface UsageHistoryParams {
  days?: number
}

// Bulk upload types
export interface BulkUploadParams {
  language?: Language
  diarize?: boolean
  aiAnalysis?: AIType
  saveTranscript?: boolean
  provider?: TranscriptionProvider
  /** Optional per-file metadata, keyed by filename */
  fileMetadata?: Record<
    string,
    {
      externalId?: string
      metadata?: Record<string, unknown>
    }
  >
}

export interface BulkUploadResultItem {
  filename: string
  transcriptionId?: string
  status: 'queued' | 'failed'
  error?: { code: string; message: string }
}

export interface BulkUploadResponse {
  batchId: string
  totalFiles: number
  results: BulkUploadResultItem[]
  summary: { queued: number; failed: number }
}

export interface BulkTranscribeOptions {
  pollInterval?: number
  maxWaitTime?: number
  /** Called when an individual file's transcription updates */
  onFileProgress?: (filename: string, transcription: Transcription) => void
  /** Called when any transcription in the batch completes or fails */
  onBatchProgress?: (completed: number, total: number, results: Map<string, Transcription | Error>) => void
  /** How many transcriptions to poll in parallel (default: 5) */
  concurrency?: number
}

export interface BulkTranscribeResult {
  batchId: string
  completed: Transcription[]
  failed: Array<{ filename: string; transcriptionId?: string; error: Error }>
}

// Error types
export interface APIErrorResponse {
  error: {
    code: string
    message: string
  }
}

export class VeroAPIError extends Error {
  code: string
  status: number

  constructor(message: string, code: string, status: number) {
    super(message)
    this.name = 'VeroAPIError'
    this.code = code
    this.status = status
  }
}
