// ============================================================================
// Configuration
// ============================================================================

export interface VeroTranscribeConfig {
  /** Your VeroTranscribe API key (`vt_sk_...`) */
  apiKey: string
  /** Custom API base URL (defaults to `https://api.verotranscribe.com`) */
  baseUrl?: string
  /** Request timeout in milliseconds (defaults to `30000`) */
  timeout?: number
}

// ============================================================================
// Transcriptions & Analysis
// ============================================================================

export type TranscriptionStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type AIType = 'none' | 'basic' | 'coach' | 'industry'
export type Language = 'en' | 'he' | 'es' | 'auto'
export type TranscriptFormat = 'raw' | 'diarized' | 'both'
export type TranscriptionProvider = 'replicate' | 'elevenlabs' | 'runpod'

export type IndustryPackSlug = 'insurance' | 'hr'
export type InsuranceCallType = 'telesales' | 'renewal' | 'service' | 'claims'
export type HrCallType =
  | 'phone_screen'
  | 'structured_interview'
  | 'reference_check'
  | 'exit_interview'
export type IndustryCallType = InsuranceCallType | HrCallType

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

export interface BasicAnalysis {
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
}

export interface CoachCoachingItem {
  item: string
  timestamp?: string
  severity: 'low' | 'medium' | 'high'
  category?: string
}

export interface CoachAnalysis extends BasicAnalysis {
  callPhases?: Array<{
    phase: 'opening' | 'needs_discovery' | 'presentation' | 'objection_handling' | 'closing' | string
    startTime: string
    endTime: string
    whatWentWell?: string[]
    needsWork?: string[]
  }>
  compliance?: {
    companyNameMentioned: boolean
    agentNameGiven: boolean
    recordingNotice: boolean
    disclaimersProvided: boolean
    notes?: string
  }
  performance?: {
    clarity: number
    empathy: number
    compliance: number
    professionalism: number
  }
  coaching?:
    | CoachCoachingItem[]
    | {
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
  behavioral?: {
    talkListenRatio: number
    questionsAsked: { open: number; closed: number }
    interruptions: number
    speakingPace: number
    empathyStatements: number
    objectionHandling?: { raised: number; resolved: number }
  }
  issuesAndOpportunities?: Array<{
    type: 'issue' | 'opportunity'
    description: string
    potentialValue?: string
  }>
}

export type CompetencyEvidenceRating =
  | 'strong_evidence'
  | 'some_evidence'
  | 'no_evidence'
  | 'contradicting_evidence'

export interface InsuranceCallAnalysis {
  pack: 'insurance'
  callType: InsuranceCallType
  summary: string
  products_discussed: string[]
  policy_numbers_mentioned: string[]
  needs_captured: string[]
  objections_raised: string[]
  cancellation_or_complaint_intent: {
    detected: boolean
    intent_type: 'cancellation' | 'complaint' | 'both' | 'none'
    quote: string | null
    timestamp: string | null
  }
  promises_made_by_agent: Array<{
    promise: string
    quote: string
    timestamp: string
  }>
  follow_up_required: {
    required: boolean
    action: string | null
    owner: string | null
    due: string | null
  }
  sentiment_start_end: {
    start: number
    end: number
    summary: string
  }
}

export interface HrCompetencyWriteUp {
  competency_id: string
  name: string
  must_have: boolean
  asked_by_interviewer: boolean
  what_candidate_said: string | null
  quote: string | null
  timestamp: string | null
  rating: CompetencyEvidenceRating
}

export interface HrCallAnalysis {
  pack: 'hr'
  callType: HrCallType
  roleId: string | null
  roleTitle: string | null
  advisory_notice: string
  summary: string
  competencies: HrCompetencyWriteUp[]
  candidate_questions: Array<{
    question: string
    quote: string
    timestamp: string
    answered_by_interviewer: boolean
  }>
  stated_salary_expectations: {
    stated: string | null
    quote: string | null
    timestamp: string | null
  }
  stated_availability: {
    stated: string | null
    quote: string | null
    timestamp: string | null
  }
  advisory_overall_rating: {
    enabled: boolean
    rating: 1 | 2 | 3 | 4 | 5 | null
    rationale: string | null
    advisory_only: true
    must_be_confirmed_by_human: true
  }
}

export type IndustryAnalysis = InsuranceCallAnalysis | HrCallAnalysis

/**
 * Standard analysis shape for `basic` / `coach` calls, with index signature
 * to accommodate industry-pack structured fields when `aiType === 'industry'`.
 */
export interface Analysis extends CoachAnalysis {
  [key: string]: unknown
}

export interface CallAuditOption {
  /** Published scorecard ID to attach to this transcription (overrides tenant default) */
  scorecard_id?: string
  /** Set `false` to opt this call out when `auditAllCalls` is enabled on the account */
  enabled?: boolean
}

export interface Transcription {
  id: string
  externalId?: string | null
  status: TranscriptionStatus
  durationSeconds?: number | null
  language: Language | string
  diarize?: boolean
  aiType?: AIType | null
  pack?: IndustryPackSlug | null
  callType?: IndustryCallType | string | null
  roleId?: string | null
  auditScorecardId?: string | null
  saveTranscript?: boolean
  transcriptFormat?: TranscriptFormat | null
  transcript?: Transcript | null
  /** Present when `transcriptFormat` is `'raw'` or `'both'` and transcription is completed */
  rawText?: string
  /** Present when `transcriptFormat` is `'diarized'` or `'both'` and transcription is completed */
  diarizedText?: string
  analysis?: Analysis | IndustryAnalysis | null
  metadata?: Record<string, unknown> | null
  createdAt: string
  completedAt?: string | null
  errorMessage?: string | null
}

export interface CreateTranscriptionParams {
  language?: Language
  diarize?: boolean
  /** Exact speaker count hint for diarization (1–20). Use `2` for mono phone calls. */
  numSpeakers?: number
  /** Stereo PBX recording with one party per channel (`SPEAKER_00` left, `SPEAKER_01` right). */
  splitChannels?: boolean
  aiAnalysis?: AIType
  /** Industry pack (`'insurance'` | `'hr'`). Automatically enables industry analysis if `aiAnalysis` is omitted. */
  pack?: IndustryPackSlug
  /** Call type within the chosen industry pack. Requires `pack`. */
  callType?: IndustryCallType
  /** Published scorecard ID to evaluate against this call. */
  scorecardId?: string | null
  /** HR pack job role ID for competency-based interview analysis (`pack: 'hr'` only). */
  roleId?: string | null
  saveTranscript?: boolean
  /** Output text rendering format (`'raw'` | `'diarized'` | `'both'`, default `'diarized'`). */
  transcriptFormat?: TranscriptFormat
  externalId?: string
  webhookUrl?: string
  metadata?: Record<string, unknown>
  /** URL to fetch audio from. When provided, transcription starts immediately without needing `upload()`. */
  audioUrl?: string
  /** Second speaker's audio URL for dual-channel recordings (requires `audioUrl`, RunPod provider). */
  audioUrl2?: string
  /** Per-call QA scorecard audit override or opt-out. */
  audit?: CallAuditOption
}

export interface CreateTranscriptionOptions {
  /** Override transcription engine provider query parameter */
  provider?: TranscriptionProvider
}

export interface UploadAudioParams {
  /** Optional second audio file for dual-channel calls (speaker 2's channel) */
  audio2?: File | Blob
  /** Split stereo channels (`SPEAKER_00` left, `SPEAKER_01` right) */
  splitChannels?: boolean
  /** Exact speaker count hint for diarization (1–20) */
  numSpeakers?: number
  /** Override transcription engine provider */
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
  pack?: IndustryPackSlug
  callType?: IndustryCallType
  from?: Date | string
  to?: Date | string
}

export interface TranscriptionListItem {
  id: string
  externalId?: string | null
  status: TranscriptionStatus
  durationSeconds?: number | null
  language: string
  aiType?: AIType | null
  pack?: IndustryPackSlug | null
  callType?: IndustryCallType | string | null
  roleId?: string | null
  auditScorecardId?: string | null
  createdAt: string
  completedAt?: string | null
}

export interface ListTranscriptionsResponse {
  data: TranscriptionListItem[]
  pagination: {
    limit: number
    offset: number
    hasMore: boolean
  }
}

export interface WaitForCompletionOptions {
  pollInterval?: number
  maxWaitTime?: number
  onProgress?: (transcription: Transcription) => void
}

export interface CallAlert {
  id: string
  ruleCode: string
  severity: 'high' | 'medium' | string
  title: string
  details?: Record<string, unknown> | null
  createdAt: string
}

export interface TranscriptionAnalysisResponse {
  transcriptionId: string
  externalId?: string | null
  status: TranscriptionStatus
  pack?: IndustryPackSlug | null
  callType?: IndustryCallType | string | null
  roleId?: string | null
  aiType?: AIType | null
  analysis?: Analysis | IndustryAnalysis | null
  evaluation:
    | (Omit<Evaluation, 'transcriptionId'> & {
        verdicts: EvaluationVerdict[]
      })
    | null
  alerts: CallAlert[]
}

// ============================================================================
// Bulk Upload
// ============================================================================

export interface BulkUploadParams {
  language?: Language
  diarize?: boolean
  numSpeakers?: number
  splitChannels?: boolean
  aiAnalysis?: AIType
  pack?: IndustryPackSlug
  callType?: IndustryCallType
  scorecardId?: string
  roleId?: string
  saveTranscript?: boolean
  transcriptFormat?: TranscriptFormat
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
  onBatchProgress?: (
    completed: number,
    total: number,
    results: Map<string, Transcription | Error>
  ) => void
  /** How many transcriptions to poll in parallel (default: 5) */
  concurrency?: number
}

export interface BulkTranscribeResult {
  batchId: string
  completed: Transcription[]
  failed: Array<{ filename: string; transcriptionId?: string; error: Error }>
}

// ============================================================================
// Webhooks
// ============================================================================

export type WebhookEvent =
  | 'transcription.created'
  | 'transcription.processing'
  | 'transcription.completed'
  | 'transcription.failed'
  | 'analysis.completed'
  | 'evaluation.completed'
  | 'alert.triggered'

/**
 * Whose events an endpoint receives. The owning account is always included;
 * scope only ever adds sub-accounts on top.
 *   'self'     the owning account's own events only (default)
 *   'all'      the owning account + every sub-account, including ones created later
 *   'selected' the owning account + the sub-accounts named in `accountIds`
 */
export type WebhookScope = 'self' | 'all' | 'selected'

export interface Webhook {
  id: string
  url: string
  events: WebhookEvent[]
  secret?: string
  isActive: boolean
  scope: WebhookScope
  /** Target sub-accounts for `scope='selected'`; empty for the other scopes. */
  accountIds: string[]
  createdAt: string
}

export interface CreateWebhookParams {
  url: string
  events: WebhookEvent[]
  scope?: WebhookScope
  /** Required with `scope='selected'`; rejected otherwise. Must be your own sub-accounts. */
  accountIds?: string[]
}

export interface UpdateWebhookParams {
  url?: string
  events?: WebhookEvent[]
  isActive?: boolean
  scope?: WebhookScope
  accountIds?: string[]
}

export interface WebhookDelivery {
  id: string
  eventType: WebhookEvent
  statusCode: number | null
  success: boolean
  attempts: number
  /** Which account the event was for — set once scope shipped, null before. */
  sourceAccountId: string | null
  sourceAccountName: string | null
  createdAt: string
}

export interface WebhookPayload {
  event: WebhookEvent
  timestamp: string
  data: {
    id: string
    status: string
    accountId: string
    accountName: string | null
    externalId?: string | null
    durationSeconds?: number | null
    [key: string]: unknown
  }
}

export interface ListWebhooksResponse {
  data: Webhook[]
}

export interface ListWebhookDeliveriesResponse {
  data: WebhookDelivery[]
}

// ============================================================================
// Usage & Billing Packages
// ============================================================================

export interface UsagePeriod {
  start: string
  end: string
}

export type PackageSlug = 'starter' | 'standard' | 'insights' | 'pro' | 'insurance' | 'hr'

export interface PackageBreakdown {
  minutes: number
  cost: number
  count: number
}

export type PackageRates = Record<PackageSlug, number>

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

// ============================================================================
// Industry Packs
// ============================================================================

export type ScorecardCategoryType = 'regulatory' | 'business'
export type ScorecardAnswerType = 'yes_no' | 'yes_partial_no' | 'scale_1_5'

export interface BilingualText {
  he: string
  en: string
}

export interface PackCallTypeDefinition {
  slug: IndustryCallType
  name: BilingualText
  description: BilingualText
}

export interface PackScorecardItemTemplate {
  key: string
  question: BilingualText
  criteria: BilingualText
  category: ScorecardCategoryType
  answerType: ScorecardAnswerType
  weight: number
  critical: boolean
  appliesTo: IndustryCallType[]
  applicability?: BilingualText
}

export interface PackAlertRule {
  code: string
  name: BilingualText
  description: BilingualText
  severity: 'high' | 'medium'
}

export interface PackGuardrail {
  code: string
  description: BilingualText
}

export interface IndustryPackSummary {
  slug: IndustryPackSlug
  name: BilingualText
  nameHe: string
  nameEn: string
  description: BilingualText
  descriptionHe: string
  descriptionEn: string
  callTypes: PackCallTypeDefinition[]
  defaultItemCount: number
  alertRules: PackAlertRule[]
  guardrails: PackGuardrail[]
}

export interface IndustryPackDefinition {
  slug: IndustryPackSlug
  name: BilingualText
  description: BilingualText
  callTypes: PackCallTypeDefinition[]
  defaultScorecardItems: PackScorecardItemTemplate[]
  vocabulary: string[]
  alertRules: PackAlertRule[]
  guardrails: PackGuardrail[]
}

export interface PackDefaultScorecardItem {
  code: string
  sortOrder: number
  category: ScorecardCategoryType
  subTopic: string
  title: string
  questionHe: string
  questionEn: string
  criteria: string
  criteriaEn: string
  label: string
  answerType: ScorecardAnswerType
  weight: number
  critical: boolean
  appliesTo: IndustryCallType[]
  enabled: boolean
  applicability: string | null
  mode: 'ai' | 'manual'
}

export interface PackDefaultScorecard {
  pack: IndustryPackSlug
  nameHe: string
  nameEn: string
  callType: IndustryCallType | string | null
  language: string
  items: PackDefaultScorecardItem[]
}

export interface ListPacksResponse {
  data: IndustryPackSummary[]
}

// ============================================================================
// HR Roles
// ============================================================================

export type RoleStatus = 'active' | 'archived'

export interface RoleCompetency {
  id: string
  name: string
  description?: string | null
  mustHave: boolean
  questionPrompt?: string | null
}

export interface RoleCompetencyInput {
  id?: string
  name: string
  description?: string | null
  mustHave?: boolean
  questionPrompt?: string | null
}

export interface Role {
  id: string
  accountId: string
  title: string
  department: string | null
  status: RoleStatus
  competencies: RoleCompetency[]
  createdAt: string
  updatedAt: string
}

export interface CreateRoleParams {
  title: string
  department?: string | null
  status?: RoleStatus
  /** 1 to 12 role competencies evaluated during HR interviews */
  competencies: RoleCompetencyInput[]
}

export interface UpdateRoleParams {
  title?: string
  department?: string | null
  status?: RoleStatus
  competencies?: RoleCompetencyInput[]
}

export interface ListRolesParams {
  limit?: number
  offset?: number
  status?: RoleStatus
}

export interface ListRolesResponse {
  data: Role[]
  pagination: {
    limit: number
    offset: number
  }
}

// ============================================================================
// Call Audit — AI QA Scorecards, Evaluations & Reports
// ============================================================================

export type ScorecardStatus = 'draft' | 'published' | 'archived'
export type ScorecardItemMode = 'ai' | 'manual'

export interface Scorecard {
  id: string
  name: string
  description: string | null
  language: string
  pack: IndustryPackSlug | string | null
  callType: IndustryCallType | string | null
  status: ScorecardStatus
  currentVersion: number
  createdAt: string
  updatedAt: string
  items?: ScorecardItem[]
}

export interface ScorecardItem {
  id: string
  sortOrder: number
  category: string
  subTopic: string | null
  title: string
  questionHe?: string | null
  questionEn?: string | null
  criteria: string
  label: string | null
  answerType: ScorecardAnswerType
  weight: number
  critical: boolean
  appliesTo?: string[] | null
  enabled: boolean
  applicability: string | null
  mode: ScorecardItemMode
}

export interface ScorecardVersionSummary {
  version: number
  publishedAt: string
}

export interface ScorecardDetail extends Scorecard {
  items: ScorecardItem[]
  versions: ScorecardVersionSummary[]
}

export interface ListScorecardsParams {
  limit?: number
  offset?: number
  includeArchived?: boolean
  pack?: IndustryPackSlug | string
  callType?: IndustryCallType | string
}

export interface ListScorecardsResponse {
  data: Scorecard[]
  pagination: {
    limit: number
    offset: number
    total: number
    hasMore: boolean
  }
}

export interface CreateScorecardParams {
  name?: string
  description?: string
  /** Language of evaluation output (default `'he'`) */
  language?: string
  /** Seed items from an industry pack template (`'insurance'` | `'hr'`) */
  pack?: IndustryPackSlug
  callType?: IndustryCallType
  /** When `pack` is set, publishes v1 immediately unless set to `false` */
  publishImmediately?: boolean
}

export interface ScorecardItemInput {
  category: string
  subTopic?: string | null
  title: string
  questionHe?: string | null
  questionEn?: string | null
  criteria: string
  label?: string | null
  answerType?: ScorecardAnswerType
  weight?: number
  critical?: boolean
  appliesTo?: string[] | null
  enabled?: boolean
  applicability?: string | null
  mode?: ScorecardItemMode
}

export interface ScorecardItemTunePatch {
  id: string
  title?: string
  questionHe?: string | null
  questionEn?: string | null
  criteria?: string
  category?: string
  label?: string | null
  answerType?: ScorecardAnswerType
  weight?: number
  critical?: boolean
  appliesTo?: string[] | null
  enabled?: boolean
}

export interface UpdateScorecardParams {
  name?: string
  description?: string | null
  language?: string
  pack?: IndustryPackSlug | null
  callType?: IndustryCallType | null
  /** `'archived'` to archive, `'active'` to un-archive */
  status?: 'archived' | 'active'
  /** Optional inline item tuning patches */
  items?: ScorecardItemTunePatch[]
  publishAfterTune?: boolean
}

export interface ReplaceScorecardItemsParams {
  items: ScorecardItemInput[]
}

export interface ReplaceScorecardItemsResponse {
  items: ScorecardItem[]
}

export interface PublishScorecardResponse extends Scorecard {
  publishedVersion: number
  itemCount: number
}

export interface DeleteScorecardResponse {
  success: boolean
  id: string
  status: 'archived'
}

export interface ScorecardColumnMapping {
  category?: string
  subTopic?: string
  title?: string
  criteria?: string
  label?: string
  weight?: string
  critical?: string
  answerType?: string
}

export interface ScorecardParseReport {
  sheet: string
  rowsTotal: number
  itemsImported: number
  columns: Record<string, string | null>
  skipped: Array<{ row: number; reason: string }>
  warnings: Array<{ row: number; message: string }>
}

export interface ImportScorecardParams {
  /** Optional filename when passing a raw `Blob` (e.g. `'checklist.xlsx'`) */
  filename?: string
  /** Explicit header-to-field mapping */
  mapping?: ScorecardColumnMapping
  /** Parse and validate only without saving (`dry_run`) */
  dryRun?: boolean
  /** Existing scorecard ID to import into (replaces its draft items) */
  scorecardId?: string
  /** Name for a newly created scorecard (when `scorecardId` is omitted) */
  name?: string
  pack?: IndustryPackSlug
  callType?: IndustryCallType
}

export interface ImportScorecardResponse {
  dryRun: boolean
  scorecard?: Scorecard
  report: ScorecardParseReport
  items: Array<ScorecardItem | ScorecardItemInput>
}

// ============================================================================
// Audit Settings
// ============================================================================

export interface AuditSettings {
  defaultScorecardId: string | null
  auditAllCalls: boolean
}

export interface UpdateAuditSettingsParams {
  defaultScorecardId?: string | null
  auditAllCalls?: boolean
}

// ============================================================================
// Evaluations
// ============================================================================

export type EvaluationStatus = 'pending' | 'running' | 'completed' | 'failed'
export type VerdictValue =
  | 'compliant'
  | 'non_compliant'
  | 'partial'
  | 'not_applicable'
  | 'not_found'
export type VerdictConfidence = 'high' | 'medium' | 'low'

export interface EvaluationScoreBucket {
  score: number | null
  weight: number
  count: number
}

export interface EvaluationScores {
  overall: number | null
  regulatoryScore?: number | null
  businessScore?: number | null
  criticalFailed?: boolean
  criticalFailures?: Array<{
    itemId: string
    title: string
    verdict: string
    explanation: string
  }>
  applicableWeight?: number
  totalItems?: number
  evaluatedItems?: number
  byLabel: Record<string, number | EvaluationScoreBucket>
  byCategory: Record<string, number | EvaluationScoreBucket>
  counts?: {
    compliant: number
    nonCompliant: number
    partial: number
    notApplicable: number
    manual?: number
    unevaluated?: number
  }
}

export interface EvaluationVerdict {
  itemId: string
  itemSnapshot: Record<string, unknown>
  verdict: VerdictValue
  scaleScore?: number | null
  evidence?: string | null
  timestampStart?: string | number | null
  timestampEnd?: string | number | null
  explanation?: string | null
  confidence?: VerdictConfidence | null
}

export interface Evaluation {
  id: string
  transcriptionId: string
  scorecardId: string
  scorecardVersion: number
  status: EvaluationStatus
  model?: string | null
  scores?: EvaluationScores | null
  error?: string | null
  createdAt: string
  completedAt?: string | null
}

export interface TranscriptionEvaluation extends Evaluation {
  verdicts: EvaluationVerdict[]
}

export interface RerunEvaluationParams {
  /** Scorecard ID override (accepts `scorecardId` or `scorecard_id`) */
  scorecardId?: string
  scorecard_id?: string
  /** Specific published version override (accepts `scorecardVersion` or `scorecard_version`) */
  scorecardVersion?: number
  scorecard_version?: number
}

export interface RerunEvaluationResponse {
  jobId: string
  transcriptionId: string
  scorecardId: string | null
  scorecardVersion: number
  status: 'queued'
}

export interface ListEvaluationsParams {
  limit?: number
  offset?: number
  from?: Date | string
  to?: Date | string
  scorecardId?: string
  scorecard_id?: string
  status?: EvaluationStatus
  label?: string
  category?: string
  verdict?: VerdictValue
}

export interface ListEvaluationsResponse {
  data: Evaluation[]
  pagination: {
    limit: number
    offset: number
    total: number
    hasMore: boolean
  }
}

// ============================================================================
// Reports (Audit, Executive Narrative & Compliance)
// ============================================================================

export interface AuditReportParams {
  scorecardId?: string
  scorecard_id?: string
  from?: Date | string
  to?: Date | string
  compareFrom?: Date | string
  compare_from?: Date | string
  compareTo?: Date | string
  compare_to?: Date | string
}

export interface AuditReportSummary {
  evaluations: number
  overall: number | null
  byLabel: Record<string, number | null>
  byCategory: Record<string, number | null>
  counts: {
    compliant: number
    partial: number
    nonCompliant: number
    notApplicable: number
    notFound: number
  }
  worstItems: Array<{
    itemId: string
    title: string | null
    category: string | null
    label: string | null
    score: number | null
    occurrences: number
    nonCompliant: number
    notFound: number
  }>
}

export interface AuditReportResponse {
  period: {
    from: string | null
    to: string | null
  }
  report: AuditReportSummary
  comparison: {
    period: { from: string; to: string }
    report: AuditReportSummary
  } | null
  delta: {
    overall: number | null
    byLabel: Record<string, number | null>
    byCategory: Record<string, number | null>
  } | null
}

export interface AuditNarrativeParams extends AuditReportParams {
  /** Output language for the executive summary (default `'he'`) */
  language?: string
}

export interface AuditNarrativeResponse {
  narrative: string
  model: string
  promptTokens: number
  completionTokens: number
  period: {
    from: string | null
    to: string | null
  }
}

export type ComplianceGroupBy = 'agent' | 'team' | 'agency' | 'role' | 'month'

export interface ComplianceReportParams {
  from?: Date | string
  to?: Date | string
  pack?: IndustryPackSlug
  callType?: IndustryCallType
  scorecardId?: string
  roleId?: string
  groupBy?: ComplianceGroupBy
}

export interface ComplianceReportResponse {
  period: {
    from: string | null
    to: string | null
  }
  filters: {
    groupBy: ComplianceGroupBy
    pack: IndustryPackSlug | null
    callType: IndustryCallType | null
    scorecardId: string | null
    roleId: string | null
  }
  summary: {
    totalEvaluations: number
    totalCalls: number
    overallScore: number | null
    regulatoryScore: number | null
    businessScore: number | null
    criticalFailedCalls: number
  }
  groups: Array<{
    groupKey: string
    callsEvaluated: number
    overallScore: number | null
    regulatoryScore: number | null
    businessScore: number | null
    criticalFailedCalls: number
  }>
  items: Array<{
    itemId: string
    title: string
    category: string
    label: string | null
    critical: boolean
    compliancePct: number | null
    compliantCount: number
    partialCount: number
    nonCompliantCount: number
    notFoundCount: number
    notApplicableCount: number
  }>
  alerts: Array<{
    ruleCode: string
    severity: string
    count: number
  }>
  hrMetrics: {
    interviewsAnalyzed: number
    allMustHavesAskedPct: number | null
    protectedTopicFlagsCount: number
    byCompetency: Array<{
      name: string
      askedPct: number
      strongEvidenceCount: number
      someEvidenceCount: number
      noEvidenceCount: number
      contradictingEvidenceCount: number
    }>
  } | null
}

// ============================================================================
// Meetings
// ============================================================================

export type MeetingStatus =
  | 'joining'
  | 'in_call'
  | 'recording'
  | 'transcribing'
  | 'analyzed'
  | 'error'
export type MeetingPlatform = 'zoom' | 'teams' | 'google_meet' | 'unknown'

export interface MeetingParticipant {
  name: string
  email?: string
}

export interface Meeting {
  id: string
  bot_id: string | null
  meeting_url: string
  platform: MeetingPlatform
  status: MeetingStatus
  title?: string | null
  scheduled_by?: string | null
  customer_id?: string | null
  account_id?: string
  scheduled_at?: string | null
  ics_uid?: string | null
  source?: string
  participants?: Array<MeetingParticipant | string>
  duration_seconds?: number | null
  recording_url?: string | null
  raw_transcription_url?: string | null
  video_r2_key?: string | null
  video_stream_uid?: string | null
  vero_transcription_id?: string | null
  transcript?: Record<string, unknown> | null
  summary?: string | null
  action_items?: unknown[] | null
  chapters?: Array<{ title: string; startSeconds: number }> | null
  analysis?: Record<string, unknown> | null
  coaching_notes?: Record<string, unknown> | null
  speaker_timeline?: unknown
  transcription_status?: string | null
  analysis_status?: string | null
  error_code?: string | null
  error_message?: string | null
  meeting_started_at?: string | null
  meeting_ended_at?: string | null
  created_at: string
  updated_at: string
}

export interface SendBotParams {
  meeting_url: string
  customer_id?: string
  title?: string
  scheduled_by?: string
  bot_name?: string
  recording_mode?: 'speaker_view' | 'gallery_view' | 'audio_only'
}

export interface SendBotResponse {
  success: boolean
  bot_id: string
  platform: MeetingPlatform
}

export interface ListMeetingsParams {
  customerId?: string
  customer_id?: string
  limit?: number
  offset?: number
}

export interface ListMeetingsResponse {
  data: Meeting[]
  pagination: {
    limit: number
    offset: number
    hasMore: boolean
  }
}

export interface MeetingTranscriptionCallbackParams {
  bot_id: string
  transcript?: Record<string, unknown>
  summary?: string
  action_items?: unknown[]
  analysis?: Record<string, unknown>
  coaching_notes?: Record<string, unknown>
  error?: string
}

// ============================================================================
// Sub-Accounts & Reseller API
// ============================================================================

export type BillingMode = 'pooled' | 'allocated'

export interface SubAccount {
  id: string
  name: string
  accountType?: string
  parentAccountId?: string
  balance?: number
  billingMode?: BillingMode
  currency?: string
  createdAt: string
}

export interface CreateSubAccountParams {
  name: string
}

export interface UpdateSubAccountParams {
  name: string
}

export interface ListSubAccountsParams {
  limit?: number
  offset?: number
}

export interface ListSubAccountsResponse {
  data: SubAccount[]
  pagination: {
    limit: number
    offset: number
    total: number
    hasMore: boolean
  }
}

export interface SubAccountApiKey {
  id: string
  name: string
  keyPrefix: string
  lastUsedAt?: string | null
  createdAt: string
}

export interface CreatedSubAccountApiKey extends SubAccountApiKey {
  /** Full secret key (`vt_sk_...`). Returned only once on creation. */
  key: string
}

export interface CreateSubAccountApiKeyParams {
  name: string
}

export interface ListSubAccountApiKeysResponse {
  data: SubAccountApiKey[]
}

export interface SubAccountUsageResponse {
  period: UsagePeriod
  usage: Record<string, number>
}

export interface SubAccountTranscriptionItem {
  id: string
  externalId?: string | null
  status: TranscriptionStatus
  durationSeconds?: number | null
  aiType?: AIType | null
  createdAt: string
  completedAt?: string | null
}

export interface ListSubAccountTranscriptionsParams {
  limit?: number
  offset?: number
}

export interface ListSubAccountTranscriptionsResponse {
  data: SubAccountTranscriptionItem[]
  pagination: {
    limit: number
    offset: number
    hasMore: boolean
  }
}

export interface TransferBalanceParams {
  /** Positive amount (up to 6 decimal places, max 999,999) in account currency */
  amount: number
  description?: string
  /** Optional idempotency key (8–255 chars) to prevent duplicate transfers */
  idempotencyKey?: string
}

export interface TransferBalanceResponse {
  transferGroupId: string
  amount: number
  currency: string
  /** Reseller's remaining balance after transfer */
  balance: number
  /** Sub-account's updated balance after transfer */
  subAccountBalance: number
  /** `true` if this call matched an earlier transfer with the same `idempotencyKey` */
  duplicate: boolean
}

export type BalanceTransactionType =
  | 'deposit'
  | 'debit'
  | 'refund'
  | 'adjustment'
  | 'transfer_in'
  | 'transfer_out'

export interface BalanceTransaction {
  id: string
  type: BalanceTransactionType | string
  amount: string
  balanceAfter: string
  description: string | null
  transferGroupId: string | null
  createdAt: string
}

export interface ListSubAccountBalanceParams {
  limit?: number
  offset?: number
}

export interface SubAccountBalanceResponse {
  balance: number
  billingMode: BillingMode
  currency: string
  transactions: BalanceTransaction[]
  pagination: {
    limit: number
    offset: number
    hasMore: boolean
  }
}

// Meet user types
export type MeetUserInviteStatus = 'pending' | 'active'

export interface MeetUser {
  id: string
  name: string
  email: string
  meetEmail?: string | null
  accountType?: string
  inviteStatus: MeetUserInviteStatus
  parentAccountId?: string
  oauthProvider?: string | null
  createdAt: string
  updatedAt?: string
}

export interface CreateMeetUserParams {
  name: string
  email: string
}

export interface UpdateMeetUserParams {
  name?: string
}

export interface ListMeetUsersParams {
  limit?: number
  offset?: number
}

export interface ListMeetUsersResponse {
  data: MeetUser[]
  pagination: {
    limit: number
    offset: number
    total: number
    hasMore: boolean
  }
}

// ============================================================================
// Errors
// ============================================================================

export interface APIErrorResponse {
  error?: {
    code?: string
    message?: string
    details?: unknown
    balance?: number
    currency?: string
  }
}

export class VeroAPIError extends Error {
  code: string
  status: number
  details?: unknown

  constructor(message: string, code: string, status: number, details?: unknown) {
    super(message)
    this.name = 'VeroAPIError'
    this.code = code
    this.status = status
    if (details !== undefined) {
      this.details = details
    }
  }
}
