import type { Approval } from '@/src/features/approval/types/approvalTypes'
import type { ContentProductionJob, ContentProductionStage } from './contentProductionTypes'

export type ContentProductionPrimaryAction = 'None' | 'Retry' | 'Review' | 'Generate Revision' | 'Create Another'

export type ContentProductionJobPresentation = {
  heading: string
  statusLabel: string
  statusMessage: string
  tone: 'neutral' | 'good' | 'warning' | 'danger' | 'info'
  primaryAction: ContentProductionPrimaryAction
}

const stageMessages: Record<ContentProductionStage, string> = {
  Idle: 'Waiting to begin.',
  Writing: 'Writing the story and preparing the hook and call to action…',
  Narrating: 'Creating narration and synchronized word timing…',
  Rendering: 'Matching the footage and rendering the finished vertical video…',
  Complete: 'The finished draft is ready for your review.',
}

export function contentProductionStageMessage(stage: ContentProductionStage) {
  return stageMessages[stage]
}

export function presentContentProductionJob(job: ContentProductionJob, approval?: Approval): ContentProductionJobPresentation {
  if (job.runState === 'Running') {
    return {
      heading: 'Creating your video',
      statusLabel: job.currentStage,
      statusMessage: contentProductionStageMessage(job.currentStage),
      tone: 'info',
      primaryAction: 'None',
    }
  }

  if (job.runState === 'Failed') {
    const latestError = [...job.attempts].reverse().find((attempt) => attempt.error)?.error
    return {
      heading: 'Video generation needs attention',
      statusLabel: 'Failed',
      statusMessage: latestError?.message ?? 'The video could not be completed. You can retry it manually.',
      tone: 'danger',
      primaryAction: 'Retry',
    }
  }

  if (job.runState === 'Ready for Review') {
    if (approval?.status === 'Approved') {
      return {
        heading: 'Video approved',
        statusLabel: 'Approved',
        statusMessage: 'This exact version is approved. Nothing was published or sent.',
        tone: 'good',
        primaryAction: 'Create Another',
      }
    }
    if (approval?.status === 'Rejected') {
      return {
        heading: 'Video rejected',
        statusLabel: 'Rejected',
        statusMessage: 'The result and decision remain in history. Nothing was published or sent.',
        tone: 'danger',
        primaryAction: 'Create Another',
      }
    }
    if (approval?.status === 'Changes Requested') {
      return {
        heading: 'Revision requested',
        statusLabel: 'Needs Revision',
        statusMessage: 'Your instructions are saved. Start the revision when you are ready.',
        tone: 'warning',
        primaryAction: 'Generate Revision',
      }
    }
    return {
      heading: 'Your video is ready',
      statusLabel: 'Ready for Review',
      statusMessage: 'Preview the finished draft, then approve it, request a revision, or reject it.',
      tone: 'good',
      primaryAction: 'Review',
    }
  }

  return {
    heading: 'Video setup',
    statusLabel: 'Draft',
    statusMessage: 'Add the source, requirements, and prerecorded footage to begin.',
    tone: 'neutral',
    primaryAction: 'None',
  }
}
