import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { executionStore } from '../src/core/execution'
import { ollamaAdapter } from '../src/core/providers/adapters/ollama'
import { providerStore } from '../src/core/providers/providerStore'
import {
  parseRedditStoriesScript,
  redditStoriesFormat,
} from '../src/core/contentProduction/redditStoriesFormat'

const require = createRequire(import.meta.url)
const media = require('../electron/content-production.cjs') as {
  synthesizeNarration(input: { text: string; rate?: number; attemptDirectory: string; processKey: string }): Promise<{ wavPath: string }>
  readWaveDurationMs(wavPath: string): Promise<number>
  narrationRateForDuration(narrationDurationMs: number, targetDurationSeconds: number): number
}

const ensured = ollamaAdapter.ensureProvider({ endpoint: ollamaAdapter.defaultEndpoint, timeoutMs: 30_000 })
providerStore.enableProvider(ensured.provider.id)
const health = await ollamaAdapter.checkHealth({ endpoint: ensured.endpoint, timeoutMs: 30_000 })
assert.equal(health.status, 'Healthy', `Local Ollama health check failed: ${health.message ?? health.errorCode}`)
ollamaAdapter.recordHealth(ensured.provider.id, health)

const { plan } = await ollamaAdapter.createRegistrationPlan(ensured.provider.id, { endpoint: ensured.endpoint, timeoutMs: 30_000 })
ollamaAdapter.applyRegistrationPlan(ensured.provider.id, plan)
const models = providerStore.getModels().filter((model) => model.providerRecordId === ensured.provider.id && model.modelName === 'qwen2.5:7b')
assert(models.length > 0, 'qwen2.5:7b was not discovered from local Ollama.')
for (const model of models) providerStore.updateModel(model.id, { enabled: true, availability: 'Available', health: 'Healthy' })

const execution = executionStore.createContentScriptExecution({
  requestId: 'CPR-provider-verification',
  jobId: 'provider-verification',
  attemptId: 'attempt-1',
  formatId: 'reddit-stories',
  instructions: redditStoriesFormat.buildProviderInstructions({
    topicOrSourceStory: 'A lighthouse keeper discovers that the light is answering a signal from beneath the ocean.',
    requirements: 'Create an original suspense story for a general audience. No gore or profanity.',
    footage: {
      displayName: 'provider-verification.mp4',
      sourcePath: 'C:\\provider-verification.mp4',
      extension: '.mp4',
      selectedAt: '2026-09-13T00:00:00.000Z',
    },
    targetDurationSeconds: 90,
    style: 'Suspenseful',
  }),
  outputRequirements: 'Return one JSON object and no explanatory text.',
})
const result = await executionStore.executeProviderRequest(execution.id)
assert(result?.success, result && !result.success ? result.errorMessage : 'Execution Core returned no result.')
const script = parseRedditStoriesScript(result.responseText)
const temporaryDirectory = await mkdtemp(join(tmpdir(), 'ao-content-provider-duration-'))
let narrationDurationMs = 0
try {
  const narration = await media.synthesizeNarration({
    text: script.narrationText,
    attemptDirectory: temporaryDirectory,
    processKey: 'provider-duration-verification',
  })
  narrationDurationMs = await media.readWaveDurationMs(narration.wavPath)
  console.log(`Measured provider narration: ${script.narrationText.trim().split(/\s+/).length} words / ${Math.round(narrationDurationMs / 1000)} seconds`)
  const adjustedRate = media.narrationRateForDuration(narrationDurationMs, 90)
  if (adjustedRate !== 0) {
    const adjusted = await media.synthesizeNarration({
      text: script.narrationText,
      rate: adjustedRate,
      attemptDirectory: temporaryDirectory,
      processKey: 'provider-duration-adjusted-verification',
    })
    narrationDurationMs = await media.readWaveDurationMs(adjusted.wavPath)
    console.log(`Measured provider narration at rate ${adjustedRate}: ${Math.round(narrationDurationMs / 1000)} seconds`)
  }
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true })
}
assert(narrationDurationMs >= 80_000 && narrationDurationMs <= 100_000, `90-second narration rendered at ${Math.round(narrationDurationMs / 1000)} seconds.`)
assert(script.hookText && script.narrationText && script.ctaText)
assert.equal(result.execution.requestLifecycle?.status, 'Completed')
assert.equal(result.execution.result?.success, true)
assert.equal(result.execution.executionRequest?.correlationMetadata.contentProductionJobId, 'provider-verification')
console.log(`Content script provider verification: PASS (${result.provider} / ${result.model}, ${result.latencyMs} ms, ${Math.round(narrationDurationMs / 1000)} seconds)`)
