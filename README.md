# @veroai/transcribe

Official Node.js / TypeScript SDK for the [VeroTranscribe](https://verotranscribe.com) API (`/v1`).

Supports speech-to-text transcription with speaker diarization, dual-channel telephony, AI call coaching, Industry Packs (`insurance`, `hr`), AI QA Scorecards & Call Auditing, Compliance Reports (`.json` / `.xlsx`), Meeting Bots, Webhooks, Usage tracking, and Multi-tenant Reseller Sub-Accounts.

## Installation

```bash
npm install @veroai/transcribe
```

Requires Node.js 18+ (uses native `fetch` and `FormData`).

## Quick Start

```typescript
import { VeroTranscribe } from '@veroai/transcribe';

const client = new VeroTranscribe({
  apiKey: process.env.VERO_API_KEY!,
});

// Transcribe an audio URL and wait for completion
const result = await client.transcriptions.transcribe({
  audioUrl: 'https://example.com/call.mp3',
  language: 'en',
  aiAnalysis: 'basic',
});

console.log(result.transcript?.text);
console.log(result.analysis);
```

## Configuration

```typescript
const client = new VeroTranscribe({
  apiKey: 'vt_sk_...',                        // Required: Your VeroTranscribe API key
  baseUrl: 'https://api.verotranscribe.com',  // Optional: Custom API base URL
  timeout: 30000,                             // Optional: Request timeout in ms (default: 30000)
});
```

---

## Transcriptions (`client.transcriptions`)

### Methods

| Method | Description |
|--------|-------------|
| `create(params?, options?)` | Create a transcription job (`audioUrl` starts processing immediately) |
| `get(id)` | Retrieve a transcription by ID |
| `list(params?)` | List transcriptions with pagination and filters |
| `delete(id)` | Delete a transcription |
| `upload(id, audio, params?)` | Upload audio (`audio` + optional `audio2`) for a pending transcription |
| `waitForCompletion(id, options?)` | Poll until transcription reaches `'completed'` or `'failed'` |
| `transcribe(params, options?)` | Create from `audioUrl` and wait for completion |
| `transcribeUrl(audioUrl, params?, options?)` | Convenience alias taking `audioUrl` as the first argument |
| `transcribeFile(audio, params?, options?)` | Create, upload local `File`/`Blob`, and wait for completion |
| `bulkUpload(files, params?)` | Upload up to 20 audio files in a single batch |
| `bulkTranscribe(files, params?, options?)` | Upload a batch and wait for all files to finish |
| `waitForBatch(items, options?)` | Poll multiple transcription IDs in parallel |
| `getAnalysis(id)` | Get unified AI analysis, QA scorecard evaluation + verdicts, and alerts |
| `getEvaluation(id)` | Get the latest QA scorecard evaluation and item verdicts |
| `rerunEvaluation(id, params?)` | Queue a fresh QA scorecard evaluation on an existing transcript |

### Create & Transcribe from URL

```typescript
const result = await client.transcriptions.transcribe({
  audioUrl: 'https://example.com/sales-call.mp3',
  language: 'en',              // 'en' | 'he' | 'es' | 'auto'
  diarize: true,
  numSpeakers: 2,              // Exact speaker count hint (1–20)
  aiAnalysis: 'coach',         // 'none' | 'basic' | 'coach' | 'industry'
  transcriptFormat: 'both',    // 'raw' | 'diarized' | 'both'
  saveTranscript: true,
  externalId: 'crm-call-9812',
  webhookUrl: 'https://your-server.com/webhook',
  metadata: { agentId: 'ag_42', team: 'outbound' },
});

console.log(result.diarizedText);
console.log(result.rawText);
if (result.analysis && 'summary' in result.analysis) {
  console.log(result.analysis.summary);
  console.log(result.analysis.performance);
}
```

### Upload Local Files & Dual-Channel Telephony

For stereo PBX recordings (`splitChannels: true`) or separate per-speaker recordings (`audio2` / `audioUrl2`):

```typescript
import { readFile } from 'node:fs/promises';

const agentChannel = new Blob([await readFile('./agent.wav')], { type: 'audio/wav' });
const callerChannel = new Blob([await readFile('./caller.wav')], { type: 'audio/wav' });

const result = await client.transcriptions.transcribeFile(
  agentChannel,
  {
    audio2: callerChannel,
    language: 'he',
    aiAnalysis: 'coach',
  },
  {
    pollInterval: 2000,
    maxWaitTime: 300000,
    onProgress: (t) => console.log(`Status: ${t.status}`),
  }
);
```

### Bulk Upload & Batch Transcription

```typescript
const batch = await client.transcriptions.bulkTranscribe(
  [
    { file: blob1, name: 'call-01.mp3' },
    { file: blob2, name: 'call-02.mp3' },
  ],
  {
    language: 'en',
    aiAnalysis: 'basic',
    fileMetadata: {
      'call-01.mp3': { externalId: 'ext-1', metadata: { agent: 'Alice' } },
      'call-02.mp3': { externalId: 'ext-2', metadata: { agent: 'Bob' } },
    },
  },
  {
    concurrency: 5,
    onBatchProgress: (done, total) => console.log(`${done}/${total} finished`),
  }
);

console.log(`Completed: ${batch.completed.length}, Failed: ${batch.failed.length}`);
```

### List Transcriptions

```typescript
const { data, pagination } = await client.transcriptions.list({
  limit: 20,
  offset: 0,
  status: 'completed',
  pack: 'insurance',
  callType: 'telesales',
  from: new Date('2026-01-01'),
});

console.log(data.length, pagination.hasMore);
```

---

## Industry Packs & HR Roles (`client.packs`, `client.roles`)

VeroTranscribe includes domain-specific AI analysis, compliance guardrails, alert triggers, and scorecard templates for **Insurance** (`'telesales' | 'renewal' | 'service' | 'claims'`) and **HR** (`'phone_screen' | 'structured_interview' | 'reference_check' | 'exit_interview'`).

```typescript
// Discover packs and default scorecards
const { data: packs } = await client.packs.list();
const insurancePack = await client.packs.get('insurance');
const template = await client.packs.getDefaultScorecard('insurance', {
  callType: 'telesales',
});

// Create an HR role with interview competencies
const role = await client.roles.create({
  title: 'Senior Backend Engineer',
  department: 'Engineering',
  competencies: [
    { name: 'System Design', mustHave: true, description: 'Distributed systems & scaling' },
    { name: 'PostgreSQL', mustHave: true },
  ],
});

// Run an HR structured interview transcription against the role
const interview = await client.transcriptions.transcribe({
  audioUrl: 'https://example.com/interview.mp3',
  language: 'en',
  aiAnalysis: 'industry',
  pack: 'hr',
  callType: 'structured_interview',
  roleId: role.id,
});
```

---

## Call Audit, AI QA Scorecards & Reports

### Scorecards (`client.scorecards`)

| Method | Description |
|--------|-------------|
| `list(params?)` | List scorecards (`includeArchived`, `pack`, `callType`) |
| `create(params?)` | Create a custom scorecard or seed from an industry `pack` |
| `get(id)` | Get scorecard metadata, draft `items`, and published `versions` |
| `update(id, params)` | Update metadata, archive/un-archive, or tune items inline |
| `replaceItems(id, { items })` | Replace all draft checklist items |
| `publish(id)` | Freeze current draft items into a new immutable published version |
| `duplicate(id)` | Clone a scorecard into a new draft |
| `delete(id)` | Archive (soft-delete) a scorecard |
| `import(file, params?)` | Import an `.xlsx` or `.csv` QA checklist (`dryRun`, `mapping`, `scorecardId`) |

```typescript
// Seed and publish an insurance telesales scorecard
const scorecard = await client.scorecards.create({
  name: 'Insurance Telesales QA',
  pack: 'insurance',
  callType: 'telesales',
  publishImmediately: true,
});

// Or import an existing Excel/CSV QA sheet (dry-run first)
const preview = await client.scorecards.import(xlsxBlob, {
  filename: 'qa-checklist.xlsx',
  dryRun: true,
});
console.log(`Parsed ${preview.report.itemsImported} items`);

// Enable automatic QA auditing across all calls on the account
await client.settings.updateAudit({
  defaultScorecardId: scorecard.id,
  auditAllCalls: true,
});

// Or override / opt out on an individual call
await client.transcriptions.create({
  audioUrl: 'https://example.com/call.mp3',
  audit: { scorecard_id: scorecard.id, enabled: true },
});
```

### Evaluations & Reports (`client.evaluations`, `client.reports`)

```typescript
// Inspect unified analysis + evaluation verdicts + alerts for a call
const fullAnalysis = await client.transcriptions.getAnalysis('tr_123');

// Filter evaluations across calls
const { data: evaluations } = await client.evaluations.list({
  scorecardId: scorecard.id,
  verdict: 'non_compliant',
  limit: 50,
});

// SQL-aggregated audit report with period-over-period comparison
const auditReport = await client.reports.audit({
  scorecardId: scorecard.id,
  from: '2026-02-01T00:00:00Z',
  to: '2026-02-28T23:59:59Z',
  compareFrom: '2026-01-01T00:00:00Z',
  compareTo: '2026-01-31T23:59:59Z',
});

// Executive narrative summary
const { narrative } = await client.reports.auditNarrative({
  scorecardId: scorecard.id,
  language: 'en',
});

// Compliance breakdown (JSON or .xlsx workbook download)
const compliance = await client.reports.compliance({
  pack: 'insurance',
  groupBy: 'agent', // 'agent' | 'team' | 'agency' | 'role' | 'month'
});
const workbookBuffer = await client.reports.complianceXlsx({
  pack: 'insurance',
  groupBy: 'agent',
});
```

---

## Meetings (`client.meetings`)

Send recording bots to Zoom, Google Meet, or Microsoft Teams calls:

```typescript
const bot = await client.meetings.sendBot({
  meeting_url: 'https://meet.google.com/abc-defg-hij',
  bot_name: 'Vero Notetaker',
  recording_mode: 'speaker_view', // 'speaker_view' | 'gallery_view' | 'audio_only'
});

const { data: meetings } = await client.meetings.list({ limit: 20 });
const meeting = await client.meetings.get(bot.bot_id);
```

---

## Webhooks (`client.webhooks`)

### Methods

| Method | Description |
|--------|-------------|
| `create(params)` | Create a webhook endpoint (returns `secret` once) |
| `get(id)` | Get a webhook by ID |
| `list()` | List all configured webhooks |
| `update(id, params)` | Update URL, events, `isActive`, or reseller `scope` |
| `delete(id)` | Delete a webhook |
| `deliveries(id)` | List recent delivery attempts (last 10) |

### Create a Webhook

```typescript
const webhook = await client.webhooks.create({
  url: 'https://your-server.com/webhooks/vero',
  events: [
    'transcription.completed',
    'transcription.failed',
    'analysis.completed',
    'evaluation.completed',
    'alert.triggered',
  ],
  scope: 'self', // 'self' (default) | 'all' (reseller + all sub-accounts) | 'selected'
});

// Save `webhook.secret` securely — it is only returned once at creation!
console.log(webhook.secret); // 'whsec_...'
```

### Verify Webhook Signatures

Webhook signatures are HMAC-SHA256 digests computed over `${timestamp}.${rawBody}`:

```typescript
import { createWebhookVerifier } from '@veroai/transcribe';

const verifier = createWebhookVerifier(process.env.WEBHOOK_SECRET!);

app.post('/webhooks/vero', express.text({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-webhook-signature'] as string;
  const timestamp = req.headers['x-webhook-timestamp'] as string;

  const isValid = await verifier.verify(req.body, signature, timestamp);
  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }

  const payload = JSON.parse(req.body);
  console.log(payload.event, payload.data.id);
  res.status(200).json({ received: true });
});
```

### Webhook Events

| Event | Description |
|-------|-------------|
| `transcription.created` | Transcription job created |
| `transcription.processing` | Audio queued / processing started |
| `transcription.completed` | Transcription finished successfully |
| `transcription.failed` | Transcription failed |
| `analysis.completed` | AI analysis (`basic`, `coach`, or `industry`) finished |
| `evaluation.completed` | AI QA scorecard evaluation finished |
| `alert.triggered` | Industry pack compliance/risk alert triggered |

---

## Usage (`client.usage`)

```typescript
const usage = await client.usage.get();

console.log(usage.period);       // { start, end }
console.log(usage.totalMinutes); // Total billed minutes in period
console.log(usage.totalCost);    // Total cost in account currency
console.log(usage.packages);     // Breakdown by 'starter' | 'standard' | 'insights' | 'pro' | 'insurance' | 'hr'
console.log(usage.rates);        // Per-minute rates per package

const history = await client.usage.history({ days: 30 });
```

---

## Sub-Accounts & Reseller API (`client.subAccounts`)

Reseller accounts can provision isolated customer tenants, manage sub-account API keys, allocate prepaid balances, manage `meet_user` seats, and configure per-tenant QA scorecards:

```typescript
// 1. Create a sub-account and issue an API key
const subAccount = await client.subAccounts.create({ name: 'Acme Insurance' });
const apiKey = await client.subAccounts.createApiKey(subAccount.id, {
  name: 'Production Key',
});
console.log(apiKey.key); // 'vt_sk_...' (shown once)

// 2. Allocate prepaid funds from reseller balance (optional; defaults to 'pooled' mode)
await client.subAccounts.transferBalance(subAccount.id, {
  amount: 250,
  description: 'Q1 credit allocation',
  idempotencyKey: 'acme-2026-q1-topup',
});
const balanceInfo = await client.subAccounts.getBalance(subAccount.id);

// 3. Monitor usage & transcriptions
const subUsage = await client.subAccounts.getUsage(subAccount.id);
const subCalls = await client.subAccounts.listTranscriptions(subAccount.id, { limit: 20 });

// 4. Manage Meet Users under the sub-account
const meetUsers = client.subAccounts.meetUsers(subAccount.id);
await meetUsers.create({ name: 'Dana Levi', email: 'dana@acme.example' });

// 5. Manage QA Scorecards & Audit Reports for the sub-account
const subScorecards = client.subAccounts.scorecards(subAccount.id);
const sc = await subScorecards.create({ pack: 'insurance', callType: 'service' });
await client.subAccounts.updateAuditSettings(subAccount.id, {
  defaultScorecardId: sc.id,
  auditAllCalls: true,
});
const subAudit = await client.subAccounts.getAuditReport(subAccount.id, {
  scorecardId: sc.id,
});
```

---

## Error Handling

All non-2xx API responses, timeouts, and network errors throw a `VeroAPIError`:

```typescript
import { VeroAPIError } from '@veroai/transcribe';

try {
  await client.transcriptions.create({ audioUrl: 'not-a-url' });
} catch (error) {
  if (error instanceof VeroAPIError) {
    console.error(error.status);  // 400
    console.error(error.code);    // 'validation_error' | 'insufficient_balance' | 'timeout' | ...
    console.error(error.message); // Human-readable message
    console.error(error.details); // Optional Zod validation issues or structured error context
  }
}
```

## TypeScript Support

All request parameters, response payloads, analysis schemas, and resource classes are exported:

```typescript
import type {
  Transcription,
  CreateTranscriptionParams,
  CoachAnalysis,
  InsuranceCallAnalysis,
  HrCallAnalysis,
  Scorecard,
  ScorecardDetail,
  TranscriptionEvaluation,
  AuditReportResponse,
  ComplianceReportResponse,
  Webhook,
  WebhookEvent,
  WebhookScope,
  WebhookPayload,
  Usage,
  SubAccount,
} from '@veroai/transcribe';
```

## License

MIT
