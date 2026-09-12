import { useSyncExternalStore } from 'react'
import type {
  ContentProductionAttempt,
  ContentProductionError,
  ContentProductionInput,
  ContentProductionJob,
  ContentProductionMediaMetadata,
  ContentProductionResult,
  ContentProductionStage,
} from './contentProductionTypes'

export const CONTENT_PRODUCTION_STORAGE_KEY = 'ai-operator-os-content-production-jobs-v1'

type StorageAdapter = Pick<Storage, 'getItem' | 'setItem'>

type StoreOptions = {
  storage?: StorageAdapter
  now?: () => string
  id?: (prefix: string) => string
}

function defaultNow() {
  return new Date().toISOString()
}

function defaultId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function optionalString(value: unknown) {
  const normalized = stringValue(value).trim()
  return normalized || undefined
}

function positiveNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback
}

function normalizeInput(value: unknown, timestamp: string): ContentProductionInput {
  const raw = isRecord(value) ? value : {}
  const footage = isRecord(raw.footage) ? raw.footage : {}
  return {
    topicOrSourceStory: stringValue(raw.topicOrSourceStory),
    requirements: stringValue(raw.requirements),
    footage: {
      displayName: stringValue(footage.displayName),
      sourcePath: stringValue(footage.sourcePath),
      extension: stringValue(footage.extension),
      selectedAt: stringValue(footage.selectedAt, timestamp),
    },
    targetDurationSeconds: typeof raw.targetDurationSeconds === 'number' ? raw.targetDurationSeconds : undefined,
    voiceId: optionalString(raw.voiceId),
    style: optionalString(raw.style),
  }
}

function normalizeAttempt(value: unknown, index: number, timestamp: string): ContentProductionAttempt | undefined {
  if (!isRecord(value)) return undefined
  const status = value.status === 'Completed' || value.status === 'Failed' ? value.status : 'Running'
  const validStages: ContentProductionStage[] = ['Idle', 'Writing', 'Narrating', 'Rendering', 'Complete']
  const stage = validStages.includes(value.stage as ContentProductionStage) ? value.stage as ContentProductionStage : 'Writing'
  const error = isRecord(value.error) ? {
    stage: ['Writing', 'Narrating', 'Rendering'].includes(stringValue(value.error.stage))
      ? stringValue(value.error.stage) as ContentProductionError['stage']
      : 'Writing' as const,
    code: stringValue(value.error.code, 'Unknown Failure'),
    message: stringValue(value.error.message, 'Content production failed.'),
    occurredAt: stringValue(value.error.occurredAt, timestamp),
  } : undefined

  return {
    attemptId: stringValue(value.attemptId, `attempt-${index + 1}`),
    attemptNumber: positiveNumber(value.attemptNumber, index + 1),
    status,
    stage,
    revisionInstructions: optionalString(value.revisionInstructions),
    executionRecordId: optionalString(value.executionRecordId),
    executionId: optionalString(value.executionId),
    executionResultId: optionalString(value.executionResultId),
    script: isRecord(value.script) ? {
      hookText: stringValue(value.script.hookText),
      narrationText: stringValue(value.script.narrationText),
      ctaText: stringValue(value.script.ctaText),
    } : undefined,
    media: isRecord(value.media) ? {
      outputFileName: stringValue(value.media.outputFileName),
      relativeOutputPath: stringValue(value.media.relativeOutputPath),
      durationSeconds: positiveNumber(value.media.durationSeconds, 0),
      width: positiveNumber(value.media.width, 1080),
      height: positiveNumber(value.media.height, 1920),
      frameRate: positiveNumber(value.media.frameRate, 30),
      videoCodec: 'h264',
      audioCodec: 'aac',
      narrationVoice: stringValue(value.media.narrationVoice, 'Windows default voice'),
      captionCount: positiveNumber(value.media.captionCount, 0),
    } : undefined,
    error,
    startedAt: stringValue(value.startedAt, timestamp),
    completedAt: optionalString(value.completedAt),
  }
}

function normalizeResult(value: unknown, index: number, timestamp: string): ContentProductionResult | undefined {
  if (!isRecord(value)) return undefined
  return {
    resultId: stringValue(value.resultId, `result-${index + 1}`),
    version: positiveNumber(value.version, index + 1),
    sourceAttemptId: stringValue(value.sourceAttemptId),
    outputFileName: stringValue(value.outputFileName),
    relativeOutputPath: stringValue(value.relativeOutputPath),
    durationSeconds: positiveNumber(value.durationSeconds, 0),
    width: positiveNumber(value.width, 1080),
    height: positiveNumber(value.height, 1920),
    frameRate: positiveNumber(value.frameRate, 30),
    executionRecordId: stringValue(value.executionRecordId),
    executionResultId: stringValue(value.executionResultId),
    approvalId: optionalString(value.approvalId),
    createdAt: stringValue(value.createdAt, timestamp),
  }
}

export function normalizeContentProductionJobs(value: unknown, timestamp = defaultNow()): ContentProductionJob[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((item, index) => {
    if (!isRecord(item)) return []
    const attempts = Array.isArray(item.attempts)
      ? item.attempts.map((attempt, attemptIndex) => normalizeAttempt(attempt, attemptIndex, timestamp)).filter((attempt): attempt is ContentProductionAttempt => Boolean(attempt))
      : []
    const results = Array.isArray(item.results)
      ? item.results.map((result, resultIndex) => normalizeResult(result, resultIndex, timestamp)).filter((result): result is ContentProductionResult => Boolean(result))
      : []
    const interrupted = attempts.some((attempt) => attempt.status === 'Running') || item.runState === 'Running'
    const normalizedAttempts: ContentProductionAttempt[] = attempts.map((attempt) => attempt.status === 'Running' ? {
      ...attempt,
      status: 'Failed' as const,
      completedAt: timestamp,
      error: {
        stage: (attempt.stage === 'Narrating' || attempt.stage === 'Rendering' ? attempt.stage : 'Writing') as ContentProductionError['stage'],
        code: 'Application Interrupted',
        message: 'Application exited before this attempt completed. Start a manual retry to continue.',
        occurredAt: timestamp,
      },
    } : attempt)

    return [{
      jobId: stringValue(item.jobId, `content-job-${index + 1}`),
      formatId: 'reddit-stories' as const,
      input: normalizeInput(item.input, timestamp),
      runState: interrupted ? 'Failed' as const : item.runState === 'Ready for Review' || item.runState === 'Failed' ? item.runState : 'Draft',
      currentStage: interrupted ? 'Idle' as const : ['Idle', 'Writing', 'Narrating', 'Rendering', 'Complete'].includes(stringValue(item.currentStage))
        ? stringValue(item.currentStage) as ContentProductionStage
        : 'Idle',
      attempts: normalizedAttempts,
      results,
      activeAttemptId: interrupted ? undefined : optionalString(item.activeAttemptId),
      currentResultId: optionalString(item.currentResultId),
      createdAt: stringValue(item.createdAt, timestamp),
      updatedAt: interrupted ? timestamp : stringValue(item.updatedAt, timestamp),
    }]
  })
}

export function createContentProductionStore(options: StoreOptions = {}) {
  const storage = options.storage
  const clock = options.now ?? defaultNow
  const createId = options.id ?? defaultId
  const listeners = new Set<() => void>()

  function read() {
    if (!storage) return []
    try {
      const stored = storage.getItem(CONTENT_PRODUCTION_STORAGE_KEY)
      const parsed = stored ? JSON.parse(stored) : []
      const normalized = normalizeContentProductionJobs(parsed, clock())
      try {
        storage.setItem(CONTENT_PRODUCTION_STORAGE_KEY, JSON.stringify(normalized))
      } catch {
        // Keep normalized state in memory if browser persistence is temporarily unavailable.
      }
      return normalized
    } catch {
      return []
    }
  }

  let state = read()

  function persist(next: ContentProductionJob[]) {
    state = next
    try {
      storage?.setItem(CONTENT_PRODUCTION_STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Preserve in-memory state and notify subscribers if persistence is temporarily unavailable.
    }
    listeners.forEach((listener) => listener())
  }

  function update(jobId: string, updater: (job: ContentProductionJob) => ContentProductionJob) {
    let updated: ContentProductionJob | undefined
    const next = state.map((job) => {
      if (job.jobId !== jobId) return job
      updated = updater(job)
      return updated
    })
    if (updated) persist(next)
    return updated
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getSnapshot() {
      return state
    },
    getJob(jobId: string) {
      return state.find((job) => job.jobId === jobId)
    },
    createJob(input: ContentProductionInput) {
      const timestamp = clock()
      const job: ContentProductionJob = {
        jobId: createId('content-job'),
        formatId: 'reddit-stories',
        input: normalizeInput(input, timestamp),
        runState: 'Draft',
        currentStage: 'Idle',
        attempts: [],
        results: [],
        createdAt: timestamp,
        updatedAt: timestamp,
      }
      persist([job, ...state])
      return job
    },
    updateInput(jobId: string, input: ContentProductionInput) {
      return update(jobId, (job) => job.runState === 'Running' ? job : {
        ...job,
        input: normalizeInput(input, clock()),
        updatedAt: clock(),
      })
    },
    beginAttempt(jobId: string, revisionInstructions?: string) {
      let attempt: ContentProductionAttempt | undefined
      const job = update(jobId, (current) => {
        if (current.runState === 'Running') return current
        const timestamp = clock()
        attempt = {
          attemptId: createId('content-attempt'),
          attemptNumber: current.attempts.length + 1,
          status: 'Running',
          stage: 'Writing',
          revisionInstructions: optionalString(revisionInstructions),
          startedAt: timestamp,
        }
        return {
          ...current,
          runState: 'Running',
          currentStage: 'Writing',
          activeAttemptId: attempt.attemptId,
          attempts: [...current.attempts, attempt],
          updatedAt: timestamp,
        }
      })
      return job?.runState === 'Running' ? attempt : undefined
    },
    updateAttempt(
      jobId: string,
      attemptId: string,
      updateFields: Partial<Pick<ContentProductionAttempt, 'stage' | 'executionRecordId' | 'executionId' | 'executionResultId' | 'script' | 'media'>>,
    ) {
      return update(jobId, (job) => {
        if (job.activeAttemptId !== attemptId) return job
        const attempts = job.attempts.map((attempt) => attempt.attemptId === attemptId ? { ...attempt, ...updateFields } : attempt)
        return {
          ...job,
          currentStage: updateFields.stage ?? job.currentStage,
          attempts,
          updatedAt: clock(),
        }
      })
    },
    failAttempt(jobId: string, attemptId: string, error: Omit<ContentProductionError, 'occurredAt'>) {
      return update(jobId, (job) => {
        if (job.activeAttemptId !== attemptId) return job
        const timestamp = clock()
        return {
          ...job,
          runState: 'Failed',
          currentStage: 'Idle',
          activeAttemptId: undefined,
          attempts: job.attempts.map((attempt) => attempt.attemptId === attemptId ? {
            ...attempt,
            status: 'Failed',
            error: { ...error, occurredAt: timestamp },
            completedAt: timestamp,
          } : attempt),
          updatedAt: timestamp,
        }
      })
    },
    completeAttempt(jobId: string, attemptId: string, media: ContentProductionMediaMetadata) {
      let result: ContentProductionResult | undefined
      update(jobId, (current) => {
        if (current.activeAttemptId !== attemptId) return current
        const attempt = current.attempts.find((item) => item.attemptId === attemptId)
        if (!attempt?.executionRecordId || !attempt.executionResultId || !attempt.script) return current
        const timestamp = clock()
        result = {
          resultId: createId('content-result'),
          version: current.results.reduce((highest, item) => Math.max(highest, item.version), 0) + 1,
          sourceAttemptId: attemptId,
          outputFileName: media.outputFileName,
          relativeOutputPath: media.relativeOutputPath,
          durationSeconds: media.durationSeconds,
          width: media.width,
          height: media.height,
          frameRate: media.frameRate,
          executionRecordId: attempt.executionRecordId,
          executionResultId: attempt.executionResultId,
          createdAt: timestamp,
        }
        return {
          ...current,
          runState: 'Ready for Review',
          currentStage: 'Complete',
          activeAttemptId: undefined,
          currentResultId: result.resultId,
          attempts: current.attempts.map((item) => item.attemptId === attemptId ? {
            ...item,
            status: 'Completed',
            stage: 'Complete',
            media,
            completedAt: timestamp,
          } : item),
          results: [...current.results, result],
          updatedAt: timestamp,
        }
      })
      return result
    },
  }
}

const browserStorage = typeof window === 'undefined' ? undefined : window.localStorage
export const contentProductionStore = createContentProductionStore({ storage: browserStorage })

export function useContentProductionStore() {
  const jobs = useSyncExternalStore(
    contentProductionStore.subscribe,
    contentProductionStore.getSnapshot,
    contentProductionStore.getSnapshot,
  )
  return {
    jobs,
    createJob: contentProductionStore.createJob,
    updateInput: contentProductionStore.updateInput,
  }
}
