import { executionStore } from '../execution'
import { contentFormatModules } from './redditStoriesFormat'
import { contentProductionStore } from './contentProductionStore'
import type {
  ContentMediaBuildResult,
  ContentProductionBridge,
  ContentProductionError,
  ContentProductionJob,
} from './contentProductionTypes'

function requestId(jobId: string, attemptId: string) {
  return `CPR-${jobId}-${attemptId}`
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Content production failed unexpectedly.'
}

function bridgeFromWindow(): ContentProductionBridge | undefined {
  return typeof window === 'undefined' ? undefined : window.operatorOS?.contentProduction
}

function failure(
  stage: ContentProductionError['stage'],
  code: string,
  message: string,
) {
  return { stage, code, message }
}

export function retryInstructionsFor(job: ContentProductionJob) {
  return [...job.attempts].reverse().find((attempt) => attempt.status === 'Failed')?.revisionInstructions
}

async function buildAttempt(jobId: string, revisionInstructions?: string) {
  const job = contentProductionStore.getJob(jobId)
  if (!job) throw new Error('Content production job was not found.')
  if (job.runState === 'Running') throw new Error('This content production job is already running.')

  const format = contentFormatModules[job.formatId]
  const validationIssues = format.validateInput(job.input)
  if (validationIssues.length > 0) throw new Error(validationIssues.join(' '))

  const bridge = bridgeFromWindow()
  if (!bridge) throw new Error('Desktop content-production services are unavailable.')

  const attempt = contentProductionStore.beginAttempt(jobId, revisionInstructions)
  if (!attempt) throw new Error('A new content production attempt could not be created.')

  try {
    const instructions = format.buildProviderInstructions(job.input, revisionInstructions)
    const execution = executionStore.createContentScriptExecution({
      requestId: requestId(jobId, attempt.attemptId),
      jobId,
      attemptId: attempt.attemptId,
      formatId: job.formatId,
      instructions,
      outputRequirements: 'Return one JSON object containing hookText, narrationSentences, and ctaText. narrationSentences must be an array of non-empty strings.',
    })
    contentProductionStore.updateAttempt(jobId, attempt.attemptId, {
      executionRecordId: execution.id,
      executionId: execution.executionId,
    })

    const executionResult = await executionStore.executeProviderRequest(execution.id)
    if (!executionResult) {
      contentProductionStore.failAttempt(jobId, attempt.attemptId, failure(
        'Writing',
        'Provider Execution Failed',
        'Execution Core did not return a script execution result.',
      ))
      return { success: false as const, jobId, attemptId: attempt.attemptId }
    }
    if (!executionResult.success) {
      contentProductionStore.failAttempt(jobId, attempt.attemptId, failure(
        'Writing',
        'Provider Execution Failed',
        executionResult.errorMessage,
      ))
      return { success: false as const, jobId, attemptId: attempt.attemptId }
    }
    if (!executionResult.execution.result?.resultId) {
      contentProductionStore.failAttempt(jobId, attempt.attemptId, failure(
        'Writing',
        'Execution Result Missing',
        'Execution Core completed without a persisted result reference.',
      ))
      return { success: false as const, jobId, attemptId: attempt.attemptId }
    }

    let script
    try {
      script = format.parseProviderResult(executionResult.responseText)
    } catch (error) {
      contentProductionStore.updateAttempt(jobId, attempt.attemptId, {
        executionResultId: executionResult.execution.result.resultId,
      })
      contentProductionStore.failAttempt(jobId, attempt.attemptId, failure(
        'Writing',
        'Invalid Structured Script',
        errorMessage(error),
      ))
      return { success: false as const, jobId, attemptId: attempt.attemptId }
    }

    contentProductionStore.updateAttempt(jobId, attempt.attemptId, {
      stage: 'Narrating',
      executionResultId: executionResult.execution.result.resultId,
      script,
    })

    const stopProgress = bridge.onProgress((progress) => {
      if (progress.jobId !== jobId || progress.attemptId !== attempt.attemptId) return
      contentProductionStore.updateAttempt(jobId, attempt.attemptId, { stage: progress.stage })
    })
    let mediaResult: ContentMediaBuildResult
    try {
      mediaResult = await bridge.buildMedia({
        jobId,
        attemptId: attempt.attemptId,
        formatId: job.formatId,
        footagePath: job.input.footage.sourcePath,
        script,
        voiceId: job.input.voiceId,
        targetDurationSeconds: job.input.targetDurationSeconds,
        style: job.input.style,
      })
    } finally {
      stopProgress()
    }

    if (!mediaResult.success) {
      contentProductionStore.failAttempt(jobId, attempt.attemptId, failure(
        mediaResult.stage,
        mediaResult.code,
        mediaResult.errorMessage,
      ))
      return { success: false as const, jobId, attemptId: attempt.attemptId }
    }

    contentProductionStore.updateAttempt(jobId, attempt.attemptId, {
      stage: 'Rendering',
      media: mediaResult.media,
    })
    const result = contentProductionStore.completeAttempt(jobId, attempt.attemptId, mediaResult.media)
    if (!result) {
      contentProductionStore.failAttempt(jobId, attempt.attemptId, failure(
        'Rendering',
        'Result Persistence Failed',
        'Rendered media completed but the append-only result record could not be created.',
      ))
      return { success: false as const, jobId, attemptId: attempt.attemptId }
    }

    return { success: true as const, jobId, attemptId: attempt.attemptId, result }
  } catch (error) {
    const currentAttempt = contentProductionStore.getJob(jobId)?.attempts.find((item) => item.attemptId === attempt.attemptId)
    const stage = currentAttempt?.stage === 'Narrating' || currentAttempt?.stage === 'Rendering'
      ? currentAttempt.stage
      : 'Writing'
    contentProductionStore.failAttempt(jobId, attempt.attemptId, failure(
      stage,
      'Content Production Failed',
      errorMessage(error),
    ))
    return { success: false as const, jobId, attemptId: attempt.attemptId }
  }
}

export const contentProductionCoordinator = {
  start(jobId: string) {
    const job = contentProductionStore.getJob(jobId)
    if (!job || job.runState !== 'Draft') throw new Error('Only a draft job can be started for the first time.')
    return buildAttempt(jobId)
  },
  retry(jobId: string) {
    const job = contentProductionStore.getJob(jobId)
    if (!job || job.runState !== 'Failed') throw new Error('Only a failed job can be retried.')
    return buildAttempt(jobId, retryInstructionsFor(job))
  },
  revise(jobId: string, revisionInstructions: string) {
    if (!revisionInstructions.trim()) throw new Error('Written revision instructions are required.')
    const job = contentProductionStore.getJob(jobId)
    if (!job || job.runState !== 'Ready for Review') throw new Error('A completed result is required before revision.')
    return buildAttempt(jobId, revisionInstructions.trim())
  },
}
