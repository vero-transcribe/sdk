import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { VeroTranscribe, createWebhookVerifier } from '../src'

interface CapturedRequest {
  url: string
  method: string
  headers: Record<string, string>
  body: unknown
}

describe('SDK Resources & HttpClient', () => {
  const originalFetch = globalThis.fetch
  let captured: CapturedRequest[] = []
  let queuedResponses: Array<() => Promise<Response> | Response> = []

  function queueJson(data: unknown, status = 200) {
    queuedResponses.push(() =>
      new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
      })
    )
  }

  function queueBinary(bytes: Uint8Array, status = 200) {
    const buffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength
    ) as ArrayBuffer
    queuedResponses.push(() =>
      new Response(buffer, {
        status,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      })
    )
  }

  beforeEach(() => {
    captured = []
    queuedResponses = []

    globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString()
      const method = init?.method || 'GET'
      const headers = (init?.headers as Record<string, string>) || {}
      let parsedBody: unknown = init?.body

      if (typeof init?.body === 'string') {
        try {
          parsedBody = JSON.parse(init.body)
        } catch {
          parsedBody = init.body
        }
      }

      captured.push({ url, method, headers, body: parsedBody })

      const next = queuedResponses.shift()
      if (next) {
        return await next()
      }

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }) as typeof fetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  describe('HttpClient error & URL handling', () => {
    it('strips trailing slashes from custom baseUrl and sends Bearer token', async () => {
      const client = new VeroTranscribe({
        apiKey: 'vt_live_123',
        baseUrl: 'https://api.example.com///',
      })
      queueJson({ data: [] })

      await client.packs.list()

      expect(captured[0].url).toBe('https://api.example.com/v1/packs')
      expect(captured[0].headers.Authorization).toBe('Bearer vt_live_123')
    })

    it('parses structured API errors with validation details', async () => {
      const client = new VeroTranscribe({ apiKey: 'vt_live_123' })
      const validationDetails = [{ path: ['audioUrl'], message: 'Unrecognized key: provider' }]
      queueJson(
        {
          error: {
            code: 'validation_error',
            message: 'Invalid request body',
            details: validationDetails,
          },
        },
        400
      )

      await expect(client.transcriptions.create()).rejects.toMatchObject({
        name: 'VeroAPIError',
        code: 'validation_error',
        message: 'Invalid request body',
        status: 400,
        details: validationDetails,
      })
    })

    it('handles non-JSON error responses gracefully', async () => {
      const client = new VeroTranscribe({ apiKey: 'vt_live_123' })
      queuedResponses.push(
        () => new Response('Bad Gateway', { status: 502, headers: { 'Content-Type': 'text/plain' } })
      )

      await expect(client.usage.get()).rejects.toMatchObject({
        name: 'VeroAPIError',
        code: 'unknown_error',
        status: 502,
      })
    })

    it('maps AbortError to VeroAPIError timeout (408)', async () => {
      const client = new VeroTranscribe({ apiKey: 'vt_live_123' })
      queuedResponses.push(() => {
        const abortErr = new Error('The operation was aborted')
        abortErr.name = 'AbortError'
        throw abortErr
      })

      await expect(client.usage.get()).rejects.toMatchObject({
        name: 'VeroAPIError',
        code: 'timeout',
        status: 408,
      })
    })

    it('maps generic network errors to VeroAPIError network_error (0)', async () => {
      const client = new VeroTranscribe({ apiKey: 'vt_live_123' })
      queuedResponses.push(() => {
        throw new TypeError('fetch failed')
      })

      await expect(client.usage.get()).rejects.toMatchObject({
        name: 'VeroAPIError',
        code: 'network_error',
        message: 'fetch failed',
        status: 0,
      })
    })
  })

  describe('transcriptions resource', () => {
    it('creates transcription with industry pack, telephony, and provider query option', async () => {
      const client = new VeroTranscribe({ apiKey: 'vt_test' })
      queueJson({ id: 'tr_1', status: 'processing' })

      await client.transcriptions.create(
        {
          audioUrl: 'https://cdn.example.com/ch1.wav',
          audioUrl2: 'https://cdn.example.com/ch2.wav',
          splitChannels: true,
          numSpeakers: 2,
          transcriptFormat: 'both',
          aiAnalysis: 'industry',
          pack: 'insurance',
          callType: 'claims',
          audit: { enabled: true, scorecard_id: 'sc_1' },
        },
        { provider: 'runpod' }
      )

      expect(captured[0].method).toBe('POST')
      expect(captured[0].url).toBe('https://api.verotranscribe.com/v1/transcriptions?provider=runpod')
      expect(captured[0].body).toEqual({
        audioUrl: 'https://cdn.example.com/ch1.wav',
        audioUrl2: 'https://cdn.example.com/ch2.wav',
        splitChannels: true,
        numSpeakers: 2,
        transcriptFormat: 'both',
        aiAnalysis: 'industry',
        pack: 'insurance',
        callType: 'claims',
        audit: { enabled: true, scorecard_id: 'sc_1' },
      })
    })

    it('strips audio2 and provider from create body in transcribeFile() and passes them to upload()', async () => {
      const client = new VeroTranscribe({ apiKey: 'vt_test' })
      queueJson({ id: 'tr_dual', status: 'pending' })
      queueJson({ id: 'tr_dual', status: 'processing' })
      queueJson({ id: 'tr_dual', status: 'completed', rawText: 'hello', diarizedText: 'Agent: hello' })

      const ch1 = new Blob(['ch1'], { type: 'audio/wav' })
      const ch2 = new Blob(['ch2'], { type: 'audio/wav' })

      const result = await client.transcriptions.transcribeFile(
        ch1,
        {
          audio2: ch2,
          provider: 'runpod',
          language: 'en',
          splitChannels: true,
          numSpeakers: 2,
          transcriptFormat: 'both',
        },
        { pollInterval: 5 }
      )

      expect(result.status).toBe('completed')
      expect(captured).toHaveLength(3)

      // 1. POST /v1/transcriptions?provider=runpod (strict JSON body without audio2 or provider)
      expect(captured[0].url).toBe('https://api.verotranscribe.com/v1/transcriptions?provider=runpod')
      expect(captured[0].body).toEqual({
        language: 'en',
        splitChannels: true,
        numSpeakers: 2,
        transcriptFormat: 'both',
      })

      // 2. POST /v1/transcriptions/tr_dual/upload?splitChannels=true&numSpeakers=2&provider=runpod
      expect(captured[1].url).toBe(
        'https://api.verotranscribe.com/v1/transcriptions/tr_dual/upload?splitChannels=true&numSpeakers=2&provider=runpod'
      )
      const form = captured[1].body as FormData
      expect(form).toBeInstanceOf(FormData)
      expect(form.get('audio')).toBeInstanceOf(Blob)
      expect(form.get('audio2')).toBeInstanceOf(Blob)

      // 3. GET /v1/transcriptions/tr_dual
      expect(captured[2].url).toBe('https://api.verotranscribe.com/v1/transcriptions/tr_dual')
    })

    it('supports list filters including offset=0, pack, callType, and Date serialization', async () => {
      const client = new VeroTranscribe({ apiKey: 'vt_test' })
      queueJson({ data: [], pagination: { limit: 10, offset: 0, hasMore: false } })

      const from = new Date('2026-01-01T00:00:00.000Z')
      await client.transcriptions.list({
        limit: 10,
        offset: 0,
        status: 'completed',
        aiAnalysis: 'industry',
        pack: 'hr',
        callType: 'phone_screen',
        from,
        to: '2026-01-31T23:59:59.000Z',
      })

      expect(captured[0].url).toBe(
        'https://api.verotranscribe.com/v1/transcriptions?limit=10&offset=0&status=completed&aiAnalysis=industry&pack=hr&callType=phone_screen&from=2026-01-01T00%3A00%3A00.000Z&to=2026-01-31T23%3A59%3A59.000Z'
      )
    })

    it('calls getAnalysis, getEvaluation, rerunEvaluation, delete, and transcribeUrl', async () => {
      const client = new VeroTranscribe({ apiKey: 'vt_test' })
      queueJson({ transcriptionId: 'tr_1', analysis: null, evaluation: null, alerts: [] })
      queueJson({ id: 'ev_1', verdicts: [] })
      queueJson({ jobId: 'job_2', transcriptionId: 'tr_1', status: 'queued' })
      queueJson({ success: true })
      queueJson({ id: 'tr_url', status: 'processing' })
      queueJson({ id: 'tr_url', status: 'completed' })

      await client.transcriptions.getAnalysis('tr_1')
      await client.transcriptions.getEvaluation('tr_1')
      await client.transcriptions.rerunEvaluation('tr_1', {
        scorecardId: 'sc_99',
        scorecardVersion: 3,
      })
      await client.transcriptions.delete('tr_1')
      await client.transcriptions.transcribeUrl('https://cdn.example.com/a.mp3', { language: 'en' })

      expect(captured[0].url).toBe('https://api.verotranscribe.com/v1/transcriptions/tr_1/analysis')
      expect(captured[1].url).toBe('https://api.verotranscribe.com/v1/transcriptions/tr_1/evaluation')
      expect(captured[2].url).toBe(
        'https://api.verotranscribe.com/v1/transcriptions/tr_1/evaluation/rerun'
      )
      expect(captured[2].body).toEqual({ scorecard_id: 'sc_99', scorecard_version: 3 })
      expect(captured[3].method).toBe('DELETE')
      expect(captured[4].body).toEqual({
        audioUrl: 'https://cdn.example.com/a.mp3',
        language: 'en',
      })
    })

    it('uploads batch files and waits via bulkTranscribe()', async () => {
      const client = new VeroTranscribe({ apiKey: 'vt_test' })
      queueJson({
        batchId: 'batch_1',
        totalFiles: 2,
        summary: { queued: 1, failed: 1 },
        results: [
          { filename: 'good.mp3', status: 'queued', transcriptionId: 'tr_good' },
          { filename: 'bad.txt', status: 'failed', error: { code: 'invalid_file', message: 'Bad type' } },
        ],
      })
      queueJson({ id: 'tr_good', status: 'completed' })

      const res = await client.transcriptions.bulkTranscribe(
        [{ file: new Blob(['abc']), name: 'good.mp3' }],
        { language: 'en', pack: 'insurance' },
        { pollInterval: 5 }
      )

      expect(res.batchId).toBe('batch_1')
      expect(res.completed).toHaveLength(1)
      expect(res.failed).toHaveLength(1)
      expect(res.failed[0].filename).toBe('bad.txt')

      const form = captured[0].body as FormData
      expect(JSON.parse(form.get('options') as string)).toEqual({
        language: 'en',
        pack: 'insurance',
      })
    })
  })

  describe('webhooks & usage resources', () => {
    it('supports webhook CRUD, scope/accountIds, deliveries, and missing-header verifier guard', async () => {
      const client = new VeroTranscribe({ apiKey: 'vt_test' })

      await client.webhooks.create({
        url: 'https://hooks.example.com/vero',
        events: ['transcription.completed', 'evaluation.completed', 'alert.triggered'],
        scope: 'selected',
        accountIds: ['acc_1', 'acc_2'],
      })
      await client.webhooks.list()
      await client.webhooks.get('wh_1')
      await client.webhooks.update('wh_1', { isActive: false })
      await client.webhooks.deliveries('wh_1')
      await client.webhooks.delete('wh_1')

      expect(captured[0].body).toEqual({
        url: 'https://hooks.example.com/vero',
        events: ['transcription.completed', 'evaluation.completed', 'alert.triggered'],
        scope: 'selected',
        accountIds: ['acc_1', 'acc_2'],
      })
      expect(captured[3].method).toBe('PATCH')
      expect(captured[4].url).toBe('https://api.verotranscribe.com/v1/webhooks/wh_1/deliveries')
      expect(captured[5].method).toBe('DELETE')

      const verifier = createWebhookVerifier('whsec_123')
      expect(await verifier.verify('{}', '', '1700000000')).toBe(false)
      expect(await verifier.verify('{}', 'sha256=abc', '')).toBe(false)
    })

    it('calls usage.get() and usage.history()', async () => {
      const client = new VeroTranscribe({ apiKey: 'vt_test' })

      await client.usage.get()
      await client.usage.history()
      await client.usage.history({ days: 7 })

      expect(captured[0].url).toBe('https://api.verotranscribe.com/v1/usage')
      expect(captured[1].url).toBe('https://api.verotranscribe.com/v1/usage/history')
      expect(captured[2].url).toBe('https://api.verotranscribe.com/v1/usage/history?days=7')
    })
  })

  describe('meetings resource', () => {
    it('calls sendBot, list (with customerId and offset=0), get, and transcriptionCallback', async () => {
      const client = new VeroTranscribe({ apiKey: 'vt_test' })

      await client.meetings.sendBot({
        meeting_url: 'https://meet.google.com/abc-defg-hij',
        customer_id: 'cust_1',
        bot_name: 'Vero Bot',
      })
      await client.meetings.list({ limit: 25, offset: 0, customerId: 'cust_1' })
      await client.meetings.get('bot_1')
      await client.meetings.transcriptionCallback({
        bot_id: 'bot_1',
        transcript: { text: 'Hello team' },
        summary: 'Quick team sync',
      })

      expect(captured[0].url).toBe('https://api.verotranscribe.com/v1/meetings/send-bot')
      expect(captured[1].url).toBe(
        'https://api.verotranscribe.com/v1/meetings?limit=25&offset=0&customer_id=cust_1'
      )
      expect(captured[2].url).toBe('https://api.verotranscribe.com/v1/meetings/bot_1')
      expect(captured[3].url).toBe(
        'https://api.verotranscribe.com/v1/meetings/transcription-callback'
      )
    })
  })

  describe('packs, roles, scorecards, settings, evaluations, and reports resources', () => {
    it('calls packs and roles endpoints', async () => {
      const client = new VeroTranscribe({ apiKey: 'vt_test' })

      await client.packs.list()
      await client.packs.get('insurance')
      await client.packs.getDefaultScorecard('insurance', { callType: 'claims' })

      await client.roles.list({ limit: 20, offset: 0, status: 'active' })
      await client.roles.create({
        title: 'Senior Backend Engineer',
        competencies: [{ name: 'Distributed Systems', mustHave: true }],
      })
      await client.roles.get('role_1')
      await client.roles.update('role_1', { status: 'archived' })
      await client.roles.delete('role_1')

      expect(captured[0].url).toBe('https://api.verotranscribe.com/v1/packs')
      expect(captured[1].url).toBe('https://api.verotranscribe.com/v1/packs/insurance')
      expect(captured[2].url).toBe(
        'https://api.verotranscribe.com/v1/packs/insurance/scorecards/default?callType=claims'
      )
      expect(captured[3].url).toBe(
        'https://api.verotranscribe.com/v1/roles?limit=20&offset=0&status=active'
      )
      expect(captured[4].method).toBe('POST')
      expect(captured[5].url).toBe('https://api.verotranscribe.com/v1/roles/role_1')
      expect(captured[6].method).toBe('PATCH')
      expect(captured[7].method).toBe('DELETE')
    })

    it('calls scorecards CRUD, replaceItems (PUT), publish, duplicate, and spreadsheet import', async () => {
      const client = new VeroTranscribe({ apiKey: 'vt_test' })

      await client.scorecards.list({
        limit: 50,
        offset: 0,
        includeArchived: true,
        pack: 'insurance',
        callType: 'telesales',
      })
      await client.scorecards.create({ pack: 'insurance', callType: 'telesales' })
      await client.scorecards.get('sc_1')
      await client.scorecards.update('sc_1', { name: 'Updated QA' })
      await client.scorecards.replaceItems('sc_1', {
        items: [
          {
            category: 'regulatory',
            title: 'Identity Verification',
            criteria: 'Agent verifies caller identity before disclosing policy details',
            critical: true,
            weight: 5,
          },
        ],
      })
      await client.scorecards.publish('sc_1')
      await client.scorecards.duplicate('sc_1')
      await client.scorecards.delete('sc_1')
      await client.scorecards.import(new Blob(['col1,col2,col3']), {
        filename: 'qa.csv',
        dryRun: true,
        scorecardId: 'sc_1',
        mapping: { title: 'col1', criteria: 'col2', weight: 'col3' },
      })

      expect(captured[0].url).toBe(
        'https://api.verotranscribe.com/v1/scorecards?limit=50&offset=0&include_archived=true&pack=insurance&callType=telesales'
      )
      expect(captured[1].method).toBe('POST')
      expect(captured[2].url).toBe('https://api.verotranscribe.com/v1/scorecards/sc_1')
      expect(captured[3].method).toBe('PATCH')
      expect(captured[4].method).toBe('PUT')
      expect(captured[4].url).toBe('https://api.verotranscribe.com/v1/scorecards/sc_1/items')
      expect(captured[5].url).toBe('https://api.verotranscribe.com/v1/scorecards/sc_1/publish')
      expect(captured[6].url).toBe('https://api.verotranscribe.com/v1/scorecards/sc_1/duplicate')
      expect(captured[7].method).toBe('DELETE')

      expect(captured[8].url).toBe('https://api.verotranscribe.com/v1/scorecards/import')
      const importForm = captured[8].body as FormData
      expect(importForm.get('dry_run')).toBe('true')
      expect(importForm.get('scorecard_id')).toBe('sc_1')
      expect(JSON.parse(importForm.get('mapping') as string)).toEqual({
        title: 'col1',
        criteria: 'col2',
        weight: 'col3',
      })
    })

    it('calls settings, evaluations, and reports (audit, narrative, compliance JSON & XLSX)', async () => {
      const client = new VeroTranscribe({ apiKey: 'vt_test' })
      queueJson({ defaultScorecardId: 'sc_1', auditAllCalls: true })
      queueJson({ defaultScorecardId: 'sc_2', auditAllCalls: false })
      queueJson({ data: [], pagination: { limit: 20, offset: 0, total: 0, hasMore: false } })
      queueJson({ period: { from: null, to: null }, report: { evaluations: 10 }, comparison: null, delta: null })
      queueJson({ narrative: 'Executive summary', model: 'claude', promptTokens: 100, completionTokens: 50, period: { from: null, to: null } })
      queueJson({ summary: { totalCalls: 5 }, groups: [] })
      queueBinary(new Uint8Array([0x50, 0x4b, 0x03, 0x04]))

      await client.settings.getAudit()
      await client.settings.updateAudit({ defaultScorecardId: 'sc_2', auditAllCalls: false })
      await client.evaluations.list({
        scorecardId: 'sc_2',
        verdict: 'non_compliant',
        label: 'agent:alice',
      })
      await client.reports.audit({
        scorecardId: 'sc_2',
        from: '2026-01-01T00:00:00Z',
        compareFrom: '2025-12-01T00:00:00Z',
      })
      await client.reports.auditNarrative({
        scorecardId: 'sc_2',
        language: 'en',
      })
      await client.reports.compliance({ pack: 'insurance', groupBy: 'agent' })
      const xlsx = await client.reports.complianceXlsx({ pack: 'insurance', groupBy: 'team' })

      expect(captured[0].url).toBe('https://api.verotranscribe.com/v1/settings/audit')
      expect(captured[1].method).toBe('PATCH')
      expect(captured[2].url).toBe(
        'https://api.verotranscribe.com/v1/evaluations?scorecard_id=sc_2&label=agent%3Aalice&verdict=non_compliant'
      )
      expect(captured[3].url).toBe(
        'https://api.verotranscribe.com/v1/reports/audit?scorecard_id=sc_2&from=2026-01-01T00%3A00%3A00Z&compare_from=2025-12-01T00%3A00%3A00Z'
      )
      expect(captured[4].url).toBe('https://api.verotranscribe.com/v1/reports/audit/narrative')
      expect(captured[4].body).toEqual({ scorecard_id: 'sc_2', language: 'en' })
      expect(captured[5].url).toBe(
        'https://api.verotranscribe.com/v1/reports/compliance?pack=insurance&groupBy=agent&format=json'
      )
      expect(captured[6].url).toBe(
        'https://api.verotranscribe.com/v1/reports/compliance?pack=insurance&groupBy=team&format=xlsx'
      )
      expect(xlsx.byteLength).toBe(4)
    })
  })

  describe('subAccounts resource', () => {
    it('supports sub-account CRUD, API keys, usage, transcriptions, balance transfer, meetUsers, and scorecards/audit', async () => {
      const client = new VeroTranscribe({ apiKey: 'vt_reseller' })

      await client.subAccounts.list({ limit: 10, offset: 0 })
      await client.subAccounts.create({ name: 'Acme Corp' })
      await client.subAccounts.get('sub_1')
      await client.subAccounts.update('sub_1', { name: 'Acme Corp Global' })
      await client.subAccounts.listApiKeys('sub_1')
      await client.subAccounts.createApiKey('sub_1', { name: 'Production' })
      await client.subAccounts.revokeApiKey('sub_1', 'key_1')
      await client.subAccounts.getUsage('sub_1')
      await client.subAccounts.listTranscriptions('sub_1', { limit: 20, offset: 0 })
      await client.subAccounts.transferBalance('sub_1', {
        amount: 50,
        description: 'Initial credit',
        idempotencyKey: 'idem_12345678',
      })
      await client.subAccounts.getBalance('sub_1', { limit: 10, offset: 0 })

      const meetUsers = client.subAccounts.meetUsers('sub_1')
      await meetUsers.list({ limit: 5, offset: 0 })
      await meetUsers.create({ email: 'rep@acme.com', name: 'Sales Rep' })
      await meetUsers.get('mu_1')
      await meetUsers.update('mu_1', { name: 'Lead Sales Rep' })
      await meetUsers.delete('mu_1')
      await client.subAccounts.listMeetings('sub_1', { limit: 5 })

      const subScorecards = client.subAccounts.scorecards('sub_1')
      await subScorecards.list({ includeArchived: false })
      await subScorecards.create({ name: 'Sub QA' })
      await subScorecards.get('sc_sub')
      await subScorecards.update('sc_sub', { description: 'Updated' })
      await subScorecards.replaceItems('sc_sub', {
        items: [
          {
            category: 'business',
            title: 'Greeting',
            criteria: 'Greeted caller warmly',
          },
        ],
      })
      await subScorecards.publish('sc_sub')
      await subScorecards.import(new Blob(['q']), { dryRun: true })

      await client.subAccounts.updateAuditSettings('sub_1', {
        defaultScorecardId: 'sc_sub',
        auditAllCalls: true,
      })
      await client.subAccounts.listEvaluations('sub_1', { scorecardId: 'sc_sub' })
      await client.subAccounts.getAuditReport('sub_1', { scorecardId: 'sc_sub' })
      await client.subAccounts.getTranscriptionEvaluation('sub_1', 'tr_sub')
      await client.subAccounts.rerunTranscriptionEvaluation('sub_1', 'tr_sub', {
        scorecardId: 'sc_sub',
      })
      await client.subAccounts.delete('sub_1')

      expect(captured[0].url).toBe('https://api.verotranscribe.com/v1/sub-accounts?limit=10&offset=0')
      expect(captured[4].url).toBe('https://api.verotranscribe.com/v1/sub-accounts/sub_1/api-keys')
      expect(captured[6].url).toBe(
        'https://api.verotranscribe.com/v1/sub-accounts/sub_1/api-keys/key_1'
      )
      expect(captured[7].url).toBe('https://api.verotranscribe.com/v1/sub-accounts/sub_1/usage')
      expect(captured[8].url).toBe(
        'https://api.verotranscribe.com/v1/sub-accounts/sub_1/transcriptions?limit=20&offset=0'
      )
      expect(captured[9].url).toBe('https://api.verotranscribe.com/v1/sub-accounts/sub_1/balance')
      expect(captured[9].method).toBe('POST')
      expect(captured[10].url).toBe(
        'https://api.verotranscribe.com/v1/sub-accounts/sub_1/balance?limit=10&offset=0'
      )
      expect(captured[11].url).toBe(
        'https://api.verotranscribe.com/v1/sub-accounts/sub_1/meet-users?limit=5&offset=0'
      )
      expect(captured[16].url).toBe(
        'https://api.verotranscribe.com/v1/sub-accounts/sub_1/meetings?limit=5'
      )
      expect(captured[21].method).toBe('PUT')
      expect(captured[21].url).toBe(
        'https://api.verotranscribe.com/v1/sub-accounts/sub_1/scorecards/sc_sub/items'
      )
      expect(captured[23].url).toBe(
        'https://api.verotranscribe.com/v1/sub-accounts/sub_1/scorecards/import'
      )
      expect(captured[24].url).toBe(
        'https://api.verotranscribe.com/v1/sub-accounts/sub_1/settings/audit'
      )
      expect(captured[25].url).toBe(
        'https://api.verotranscribe.com/v1/sub-accounts/sub_1/evaluations?scorecard_id=sc_sub'
      )
      expect(captured[26].url).toBe(
        'https://api.verotranscribe.com/v1/sub-accounts/sub_1/reports/audit?scorecard_id=sc_sub'
      )
      expect(captured[27].url).toBe(
        'https://api.verotranscribe.com/v1/sub-accounts/sub_1/transcriptions/tr_sub/evaluation'
      )
      expect(captured[28].url).toBe(
        'https://api.verotranscribe.com/v1/sub-accounts/sub_1/transcriptions/tr_sub/evaluation/rerun'
      )
      expect(captured[29].method).toBe('DELETE')
    })
  })
})
