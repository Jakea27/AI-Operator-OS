export type ContentProductionFormatId = 'reddit-stories'

export type ContentProductionRunState = 'Draft' | 'Running' | 'Ready for Review' | 'Failed'

export type ContentProductionStage = 'Idle' | 'Writing' | 'Narrating' | 'Rendering' | 'Complete'

export type ContentProductionAttemptStatus = 'Running' | 'Completed' | 'Failed'

export type ContentProductionFootageReference = {
  displayName: string
  sourcePath: string
  extension: string
  selectedAt: string
}

export type ContentProductionInput = {
  topicOrSourceStory: string
  requirements: string
  footage: ContentProductionFootageReference
  targetDurationSeconds?: number
  voiceId?: string
  style?: string
}

export type ContentScript = {
  hookText: string
  narrationText: string
  ctaText: string
}

export type ContentProductionError = {
  stage: Exclude<ContentProductionStage, 'Idle' | 'Complete'>
  code: string
  message: string
  occurredAt: string
}

export type ContentProductionMediaMetadata = {
  outputFileName: string
  relativeOutputPath: string
  durationSeconds: number
  width: number
  height: number
  frameRate: number
  videoCodec: 'h264'
  audioCodec: 'aac'
  narrationVoice: string
  captionCount: number
}

export type ContentProductionAttempt = {
  attemptId: string
  attemptNumber: number
  status: ContentProductionAttemptStatus
  stage: ContentProductionStage
  revisionInstructions?: string
  executionRecordId?: string
  executionId?: string
  executionResultId?: string
  script?: ContentScript
  media?: ContentProductionMediaMetadata
  error?: ContentProductionError
  startedAt: string
  completedAt?: string
}

export type ContentProductionResult = {
  resultId: string
  version: number
  sourceAttemptId: string
  outputFileName: string
  relativeOutputPath: string
  durationSeconds: number
  width: number
  height: number
  frameRate: number
  executionRecordId: string
  executionResultId: string
  approvalId?: string
  createdAt: string
}

export type ContentProductionJob = {
  jobId: string
  formatId: ContentProductionFormatId
  input: ContentProductionInput
  runState: ContentProductionRunState
  currentStage: ContentProductionStage
  attempts: ContentProductionAttempt[]
  results: ContentProductionResult[]
  activeAttemptId?: string
  currentResultId?: string
  createdAt: string
  updatedAt: string
}

export type ContentFormatModule = {
  id: ContentProductionFormatId
  label: string
  defaults: {
    targetDurationSeconds: number
    width: 1080
    height: 1920
    frameRate: 30
  }
  validateInput(input: ContentProductionInput): string[]
  buildProviderInstructions(input: ContentProductionInput, revisionInstructions?: string): string
  parseProviderResult(responseText: string): ContentScript
}

export type ContentMediaProgress = {
  jobId: string
  attemptId: string
  stage: 'Narrating' | 'Rendering'
  progress: number
  message: string
}

export type ContentMediaBuildRequest = {
  jobId: string
  attemptId: string
  formatId: ContentProductionFormatId
  footagePath: string
  script: ContentScript
  voiceId?: string
  targetDurationSeconds?: number
  style?: string
}

export type ContentMediaBuildResult = {
  success: true
  media: ContentProductionMediaMetadata
} | {
  success: false
  stage: 'Narrating' | 'Rendering'
  code: string
  errorMessage: string
}

export type ContentFootageSelectionResult = {
  canceled: boolean
  footage?: ContentProductionFootageReference
}

export type ContentNarrationVoice = {
  id: string
  name: string
  culture: string
  gender: string
}

export type ContentProductionBridge = {
  selectFootage(): Promise<ContentFootageSelectionResult>
  listNarrationVoices(): Promise<ContentNarrationVoice[]>
  buildMedia(request: ContentMediaBuildRequest): Promise<ContentMediaBuildResult>
  cancelMedia(jobId: string, attemptId: string): Promise<{ canceled: boolean }>
  previewUrl(outputFileName: string): string
  revealOutput(outputFileName: string): Promise<{ revealed: boolean }>
  onProgress(listener: (progress: ContentMediaProgress) => void): () => void
}
