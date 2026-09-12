import assert from 'node:assert/strict'
import { executionStore } from '../src/core/execution'
import { ollamaAdapter } from '../src/core/providers/adapters/ollama'
import { providerStore } from '../src/core/providers/providerStore'
import { parseRedditStoriesScript } from '../src/core/contentProduction/redditStoriesFormat'

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
  instructions: [
    'Create a very short fictional story suitable for a local provider verification.',
    'Return JSON only with exactly these non-empty string fields:',
    '{"hookText":"...","narrationText":"...","ctaText":"..."}',
  ].join('\n'),
  outputRequirements: 'Return one JSON object and no explanatory text.',
})
const result = await executionStore.executeProviderRequest(execution.id)
assert(result?.success, result && !result.success ? result.errorMessage : 'Execution Core returned no result.')
const script = parseRedditStoriesScript(result.responseText)
assert(script.hookText && script.narrationText && script.ctaText)
assert.equal(result.execution.requestLifecycle?.status, 'Completed')
assert.equal(result.execution.result?.success, true)
assert.equal(result.execution.executionRequest?.correlationMetadata.contentProductionJobId, 'provider-verification')
console.log(`Content script provider verification: PASS (${result.provider} / ${result.model}, ${result.latencyMs} ms)`)
