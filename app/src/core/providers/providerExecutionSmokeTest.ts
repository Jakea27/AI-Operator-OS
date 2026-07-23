import { ollamaAdapter } from './adapters/ollama'
import { providerManager } from './providerManager'
import { providerStore } from './providerStore'

export type LocalOllamaPromptSmokeTestResult = {
  success: boolean
  providerSelected: boolean
  promptExecuted: boolean
  responseReceived: boolean
  response: string
  providerName?: string
  modelName?: string
  healthStatus?: string
  failures: string[]
  warnings: string[]
  latencyMs?: number
}

export async function runLocalOllamaPromptSmokeTest(): Promise<LocalOllamaPromptSmokeTestResult> {
  const ensured = ollamaAdapter.ensureProvider({
    endpoint: ollamaAdapter.defaultEndpoint,
    timeoutMs: 30000,
  })

  providerStore.enableProvider(ensured.provider.id)

  const health = await ollamaAdapter.checkHealth({
    endpoint: ensured.endpoint,
    timeoutMs: 30000,
  })
  ollamaAdapter.recordHealth(ensured.provider.id, health)

  if (health.status !== 'Healthy') {
    return {
      success: false,
      providerSelected: false,
      promptExecuted: false,
      responseReceived: false,
      response: '',
      providerName: ensured.provider.name,
      healthStatus: health.status,
      failures: [health.errorCode ?? 'Provider Unavailable'],
      warnings: [],
      latencyMs: health.latencyMs,
    }
  }

  const { plan } = await ollamaAdapter.createRegistrationPlan(ensured.provider.id, {
    endpoint: ensured.endpoint,
    timeoutMs: 30000,
  })
  const applied = ollamaAdapter.applyRegistrationPlan(ensured.provider.id, plan)
  const model = [...applied.added, ...applied.updated, ...providerStore.getModels()]
    .find((item) => item.modelName === 'qwen2.5:7b' || item.modelName.startsWith('qwen2.5'))

  if (!model) {
    return {
      success: false,
      providerSelected: false,
      promptExecuted: false,
      responseReceived: false,
      response: '',
      providerName: ensured.provider.name,
      healthStatus: health.status,
      failures: ['Model Not Found'],
      warnings: ['qwen2.5:7b was not available in discovered Ollama models.'],
      latencyMs: health.latencyMs,
    }
  }

  providerStore.updateModel(model.id, {
    enabled: true,
    availability: 'Available',
    health: 'Healthy',
  })

  const result = await providerManager.executePrompt({
    capabilityRequest: {
      requestId: 'SMOKE-TASK-6-LOCAL-OLLAMA',
      requestedCapability: 'Text Generation',
      requestingEntity: {
        entityType: 'System',
        entityId: 'SPRINT-013-TASK-6-SMOKE',
        displayName: 'Sprint 013 Task 6 Smoke Test',
      },
      localOnly: true,
      cloudAllowed: false,
      fallbackAllowed: false,
      requestedAt: new Date().toISOString(),
    },
    prompt: 'Respond only with the word SUCCESS.',
    temperature: 0,
    maxTokens: 8,
    metadata: {
      smokeTest: true,
      sprint: '013',
      task: '6',
    },
  })

  return {
    success: result.success && result.response.trim().length > 0,
    providerSelected: Boolean(result.provider),
    promptExecuted: result.success,
    responseReceived: result.response.trim().length > 0,
    response: result.response,
    providerName: result.provider?.name,
    modelName: result.model?.name,
    healthStatus: health.status,
    failures: result.failures,
    warnings: result.warnings,
    latencyMs: result.latencyMs,
  }
}
