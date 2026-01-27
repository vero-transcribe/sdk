# @veroai/transcribe

Official Node.js/TypeScript SDK for the VeroTranscribe API.

## Installation

```bash
npm install @veroai/transcribe
```

## Quick Start

```typescript
import { VeroTranscribe } from '@veroai/transcribe';

const client = new VeroTranscribe({
  apiKey: process.env.VERO_API_KEY,
});

// Transcribe an audio file
const result = await client.transcriptions.transcribe({
  audioUrl: 'https://example.com/audio.mp3',
  language: 'en',
  aiType: 'basic',
});

console.log(result.transcript.text);
console.log(result.analysis);
```

## Configuration

```typescript
const client = new VeroTranscribe({
  apiKey: 'vt_sk_...',           // Required: Your API key
  baseUrl: 'https://custom.url', // Optional: Custom API base URL
  timeout: 30000,                // Optional: Request timeout in ms (default: 30000)
});
```

## Transcriptions

### Methods

| Method | Description |
|--------|-------------|
| `transcriptions.create(params)` | Create a new transcription job |
| `transcriptions.get(id)` | Get a transcription by ID |
| `transcriptions.list(params?)` | List all transcriptions |
| `transcriptions.delete(id)` | Delete a transcription |
| `transcriptions.waitForCompletion(id, options?)` | Poll until transcription completes |
| `transcriptions.transcribe(params, options?)` | Create and wait for completion |

### Create a Transcription

```typescript
const transcription = await client.transcriptions.create({
  audioUrl: 'https://example.com/audio.mp3',
  language: 'en',        // 'en' | 'he' | 'es' | 'auto'
  aiType: 'basic',       // 'none' | 'basic' | 'coach'
  saveTranscript: false,
  webhookUrl: 'https://your-server.com/webhook',
  metadata: { callId: '123' },
});
```

### Get a Transcription

```typescript
const transcription = await client.transcriptions.get('transcription-id');
console.log(transcription.status);    // 'pending' | 'processing' | 'completed' | 'failed'
console.log(transcription.transcript); // { text, segments }
console.log(transcription.analysis);   // { summary, keyPoints, sentiment }
```

### List Transcriptions

```typescript
const { data, total } = await client.transcriptions.list({
  limit: 20,
  offset: 0,
  status: 'completed',
});
```

### Wait for Completion

```typescript
const result = await client.transcriptions.waitForCompletion('transcription-id', {
  pollInterval: 2000,     // Poll every 2s (default)
  maxWaitTime: 300000,    // Timeout after 5min (default)
  onProgress: (t) => console.log(`Status: ${t.status}`),
});
```

### Transcribe (Create + Wait)

```typescript
const result = await client.transcriptions.transcribe({
  audioUrl: 'https://example.com/audio.mp3',
  language: 'en',
  aiType: 'coach',
});

// Returns the completed transcription with transcript and analysis
console.log(result.transcript.text);
console.log(result.analysis.summary);
console.log(result.analysis.actionItems);
```

## Webhooks

### Methods

| Method | Description |
|--------|-------------|
| `webhooks.create(params)` | Create a webhook endpoint |
| `webhooks.get(id)` | Get a webhook by ID |
| `webhooks.list()` | List all webhooks |
| `webhooks.delete(id)` | Delete a webhook |

### Create a Webhook

```typescript
const webhook = await client.webhooks.create({
  url: 'https://your-server.com/webhook',
  events: ['transcription.completed', 'transcription.failed'],
});

// Save the secret - only shown once
console.log(webhook.secret); // 'whsec_...'
```

### Verify Webhook Signatures

```typescript
import { createWebhookVerifier } from '@veroai/transcribe';

const verifier = createWebhookVerifier(process.env.WEBHOOK_SECRET);

app.post('/webhook', async (req, res) => {
  const isValid = await verifier.verify(
    req.body,
    req.headers['x-webhook-signature']
  );

  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }

  const event = JSON.parse(req.body);
  // Handle event...
});
```

### Webhook Events

| Event | Description |
|-------|-------------|
| `transcription.created` | Transcription job created |
| `transcription.completed` | Transcription finished successfully |
| `transcription.failed` | Transcription failed |
| `analysis.completed` | AI analysis completed |

## Usage

### Methods

| Method | Description |
|--------|-------------|
| `usage.get()` | Get current billing period usage |

```typescript
const usage = await client.usage.get();

console.log(usage.transcriptionMinutes);
console.log(usage.estimatedCost.total);
```

## Error Handling

```typescript
import { VeroAPIError } from '@veroai/transcribe';

try {
  await client.transcriptions.create({ audioUrl: 'invalid' });
} catch (error) {
  if (error instanceof VeroAPIError) {
    console.error(error.code);    // 'invalid_request'
    console.error(error.message); // 'The audio URL is not accessible'
    console.error(error.status);  // 400
  }
}
```

## Types

All types are exported for TypeScript users:

```typescript
import type {
  Transcription,
  TranscriptionStatus,
  Transcript,
  Analysis,
  AIType,
  Language,
  CreateTranscriptionParams,
  Webhook,
  WebhookEvent,
  Usage,
} from '@veroai/transcribe';
```

## License

MIT
