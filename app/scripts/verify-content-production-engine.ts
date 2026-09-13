import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { access, mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  CONTENT_PRODUCTION_STORAGE_KEY,
  createContentProductionStore,
  normalizeContentProductionJobs,
} from '../src/core/contentProduction/contentProductionStore'
import { parseRedditStoriesScript, redditStoriesFormat } from '../src/core/contentProduction/redditStoriesFormat'
import { executionStore } from '../src/core/execution'

const require = createRequire(import.meta.url)
const media = require('../electron/content-production.cjs') as {
  assertInside(root: string, candidate: string): string
  buildFfmpegArguments(input: Record<string, unknown>): string[]
  createAssSubtitles(hookText: string, ctaText: string, cues: Array<{ text: string; startMs: number; endMs: number }>, duration: number): string
  groupWordTimings(words: Array<{ text: string; startMs: number }>, duration: number): Array<{ text: string; startMs: number; endMs: number }>
  listSystemVoices(environment: Record<string, unknown>): Promise<Array<{ id: string }>>
  renderContentProduction(request: Record<string, unknown>, environment: Record<string, unknown>): Promise<Record<string, unknown>>
  runProcess(executable: string, args: string[], options?: Record<string, unknown>): Promise<{ stderr: string }>
  safeOutputPath(root: string, name: string): string
}

class MemoryStorage {
  values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
}

function deterministicStoreVerification() {
  const storage = new MemoryStorage()
  let sequence = 0
  const store = createContentProductionStore({
    storage,
    now: () => `2026-09-12T00:00:${String(sequence++).padStart(2, '0')}.000Z`,
    id: (prefix) => `${prefix}-${++sequence}`,
  })
  const input = {
    topicOrSourceStory: 'A safe deterministic story.',
    requirements: 'Keep it concise.',
    footage: { displayName: 'fixture.mp4', sourcePath: 'C:\\fixture.mp4', extension: '.mp4', selectedAt: '2026-09-12T00:00:00.000Z' },
  }
  const originalInput = structuredClone(input)
  const job = store.createJob(input)
  input.requirements = 'Caller mutation must not change the persisted job snapshot.'
  assert.equal(store.getJob(job.jobId)?.input.requirements, originalInput.requirements)
  input.requirements = originalInput.requirements
  const first = store.beginAttempt(job.jobId)
  assert(first)
  store.updateAttempt(job.jobId, first.attemptId, {
    executionRecordId: 'execution-1', executionId: 'EXE-0001', executionResultId: 'EXR-1',
    script: { hookText: 'Hook', narrationText: 'Narration', ctaText: 'CTA' },
  })
  const mediaRecord = {
    outputFileName: 'one.mp4', relativeOutputPath: 'one.mp4', durationSeconds: 2,
    width: 1080, height: 1920, frameRate: 30, videoCodec: 'h264' as const, audioCodec: 'aac' as const,
    narrationVoice: 'Test Voice', captionCount: 1,
  }
  const resultOne = store.completeAttempt(job.jobId, first.attemptId, mediaRecord)
  assert.equal(resultOne?.version, 1)
  const second = store.beginAttempt(job.jobId, 'Make the ending clearer.')
  assert(second)
  store.updateAttempt(job.jobId, second.attemptId, {
    executionRecordId: 'execution-2', executionId: 'EXE-0002', executionResultId: 'EXR-2',
    script: { hookText: 'Hook 2', narrationText: 'Narration 2', ctaText: 'CTA 2' },
  })
  const resultTwo = store.completeAttempt(job.jobId, second.attemptId, { ...mediaRecord, outputFileName: 'two.mp4', relativeOutputPath: 'two.mp4' })
  assert.equal(resultTwo?.version, 2)
  const storedJob = store.getJob(job.jobId)
  assert.equal(storedJob?.attempts.length, 2)
  assert.equal(storedJob?.results.length, 2)
  assert.equal(storedJob?.results[0].outputFileName, 'one.mp4')
  assert.deepEqual(input, originalInput)
  assert(storage.getItem(CONTENT_PRODUCTION_STORAGE_KEY))

  const failed = store.beginAttempt(job.jobId)
  assert(failed)
  store.failAttempt(job.jobId, failed.attemptId, { stage: 'Writing', code: 'Test Failure', message: 'Manual retry required.' })
  assert.equal(store.getJob(job.jobId)?.attempts.length, 3)
  assert.equal(store.getJob(job.jobId)?.runState, 'Failed')

  const interrupted = normalizeContentProductionJobs([{
    ...store.getJob(job.jobId), runState: 'Running', activeAttemptId: 'running-attempt',
    attempts: [{ attemptId: 'running-attempt', attemptNumber: 1, status: 'Running', stage: 'Rendering', startedAt: '2026-09-12T00:00:00.000Z' }],
  }], '2026-09-12T01:00:00.000Z')[0]
  assert.equal(interrupted.runState, 'Failed')
  assert.equal(interrupted.activeAttemptId, undefined)
  assert.equal(interrupted.attempts[0].error?.code, 'Application Interrupted')

  const unavailableStorage = {
    getItem: () => null,
    setItem: () => { throw new Error('Storage unavailable') },
  }
  const resilient = createContentProductionStore({ storage: unavailableStorage, id: (prefix) => `${prefix}-memory` })
  resilient.createJob(originalInput)
  assert.equal(resilient.getSnapshot().length, 1)
}

function parserAndCaptionVerification() {
  const expected = { hookText: 'Wait for it.', narrationText: 'A short story happened.', ctaText: 'What would you do?' }
  assert.deepEqual(parseRedditStoriesScript(JSON.stringify(expected)), expected)
  assert.deepEqual(parseRedditStoriesScript(`\`\`\`json\n${JSON.stringify(expected)}\n\`\`\``), expected)
  for (const invalid of [
    '', '{bad json}', JSON.stringify({ hookText: 'Hook', narrationText: 'Story' }),
    JSON.stringify({ ...expected, extra: 'not allowed' }), `Explanation\n${JSON.stringify(expected)}`,
    JSON.stringify({ ...expected, narrationText: 'What was he missing? What was he missing?' }),
  ]) assert.throws(() => parseRedditStoriesScript(invalid))
  assert.equal(redditStoriesFormat.validateInput({
    topicOrSourceStory: '', requirements: '', footage: { displayName: '', sourcePath: '', extension: '', selectedAt: '' },
  }).length > 0, true)

  const cues = media.groupWordTimings([
    { text: 'One', startMs: 0 }, { text: 'short', startMs: 300 }, { text: 'sentence.', startMs: 650 },
    { text: 'Next', startMs: 1100 }, { text: 'caption', startMs: 1450 },
  ], 2200)
  assert.deepEqual(cues.map((cue) => cue.text), ['One short sentence.', 'Next caption'])
  assert(cues.every((cue) => cue.endMs > cue.startMs))
  const denseCues = media.groupWordTimings([
    { text: 'One', startMs: 0 }, { text: 'two', startMs: 250 }, { text: 'three', startMs: 500 },
    { text: 'four', startMs: 750 }, { text: 'five', startMs: 1000 }, { text: 'six', startMs: 1250 },
  ], 1600)
  assert(denseCues.every((cue) => cue.text.split(' ').length <= 3))
  const subtitles = media.createAssSubtitles(
    'A long opening hook must wrap inside the vertical frame instead of clipping at either edge.',
    'What would you do?',
    cues,
    2200,
  )
  assert.match(subtitles, /WrapStyle: 0/)
  assert.match(subtitles, /Style: Hook,[^\n]+,8,90,90,170,1/)
}

function executionCoreBoundaryVerification() {
  const execution = executionStore.createContentScriptExecution({
    requestId: 'CPR-verify-job-verify-attempt',
    jobId: 'verify-job',
    attemptId: 'verify-attempt',
    formatId: 'reddit-stories',
    instructions: 'Generate the structured content script.',
    outputRequirements: 'Return JSON only.',
  })
  assert.equal(execution.sourceType, 'Execution Request')
  assert.equal(execution.executionRequest?.requestedCapability, 'Text Generation')
  assert.equal(execution.executionRequest?.correlationMetadata.contentProductionJobId, 'verify-job')
  assert.equal(execution.executionRequest?.correlationMetadata.contentProductionAttemptId, 'verify-attempt')
  assert.equal(execution.workOrder, undefined)
  assert.equal(execution.notes.includes('No Project, Blueprint, or Work Item record was created.'), true)
  assert.equal(executionStore.createContentScriptExecution({
    requestId: 'CPR-verify-job-verify-attempt',
    jobId: 'verify-job',
    attemptId: 'verify-attempt',
    formatId: 'reddit-stories',
    instructions: 'Duplicate request.',
    outputRequirements: 'Return JSON only.',
  }).id, execution.id)
}

async function realMediaVerification() {
  const root = await mkdtemp(path.join(tmpdir(), 'ao-content-engine-'))
  const source = path.join(root, 'fixture.mp4')
  const outputRoot = path.join(root, 'output')
  const tempRoot = path.join(root, 'temp')
  const ffmpegPath = process.env.AO_FFMPEG_PATH || require('ffmpeg-static')
  const ttsScriptPath = process.env.AO_TTS_SCRIPT_PATH || path.resolve('electron/system-speech-tts.ps1')
  try {
    const voices = await media.listSystemVoices({ ttsScriptPath })
    assert(voices.length > 0)
    assert(voices.every((voice) => typeof voice.id === 'string' && voice.id.length > 0))
    await media.runProcess(ffmpegPath, [
      '-y', '-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=0x24445c:s=640x360:d=1.5',
      '-r', '30', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', source,
    ], { timeoutMs: 120_000 })
    const result = await media.renderContentProduction({
      jobId: 'verify-job', attemptId: 'verify-attempt', formatId: 'reddit-stories', footagePath: source,
      script: {
        hookText: 'This happened fast.',
        narrationText: 'A short local narration verifies synchronized captions and vertical video rendering.',
        ctaText: 'What would you do?',
      },
    }, {
      outputRoot, tempRoot, ffmpegPath, ttsScriptPath,
    })
    const outputPath = path.join(outputRoot, String(result.outputFileName))
    assert((await stat(outputPath)).size > 0)
    const inspection = await media.runProcess(ffmpegPath, ['-hide_banner', '-i', outputPath, '-f', 'null', '-'], { timeoutMs: 120_000 })
    assert.match(inspection.stderr, /1080x1920/)
    assert.match(inspection.stderr, /Video: h264/)
    assert.match(inspection.stderr, /Audio: aac/)
    assert.equal(result.width, 1080)
    assert.equal(result.height, 1920)
    assert.equal(result.videoCodec, 'h264')
    assert.equal(result.audioCodec, 'aac')
    assert(Number(result.captionCount) > 0)
    assert.throws(() => media.safeOutputPath(outputRoot, '../escape.mp4'))
    assert.throws(() => media.assertInside(outputRoot, path.join(root, 'outside.mp4')))
    assert((await readFile(source)).length > 0)

    await assert.rejects(() => media.renderContentProduction({
      jobId: 'failed-job', attemptId: 'failed-attempt', formatId: 'reddit-stories', footagePath: source,
      script: { hookText: 'Hook', narrationText: 'This render must fail safely.', ctaText: 'CTA' },
    }, { outputRoot, tempRoot, ffmpegPath: path.join(root, 'missing-ffmpeg.exe'), ttsScriptPath }))
    await assert.rejects(() => access(path.join(outputRoot, 'failed-job-failed-attempt.mp4')))
    await assert.rejects(() => access(path.join(tempRoot, 'failed-job', 'failed-attempt')))
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

deterministicStoreVerification()
parserAndCaptionVerification()
executionCoreBoundaryVerification()
await realMediaVerification()
console.log('Content production deterministic and real local media verification: PASS')
