import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

class MemoryStorage implements Storage {
  private values = new Map<string, string>()
  get length() { return this.values.size }
  clear() { this.values.clear() }
  getItem(key: string) { return this.values.get(key) ?? null }
  key(index: number) { return [...this.values.keys()][index] ?? null }
  removeItem(key: string) { this.values.delete(key) }
  setItem(key: string, value: string) { this.values.set(key, value) }
}

const localStorage = new MemoryStorage()
Object.defineProperty(globalThis, 'window', {
  value: {
    localStorage,
    addEventListener() {},
    removeEventListener() {},
  },
  configurable: true,
})

const {
  CONTENT_PRODUCTION_STORAGE_KEY,
  createContentProductionStore,
  contentProductionStore,
  ensureContentResultApproval,
  findContentResultApproval,
  presentContentProductionJob,
  requestContentResultRevision,
  retryInstructionsFor,
  approveContentResult,
  rejectContentResult,
  normalizeContentProductionJobs,
} = await import('../src/core/contentProduction')
const { approvalStore } = await import('../src/features/approval/store/approvalStore')

function completedJob() {
  const job = contentProductionStore.createJob({
    topicOrSourceStory: 'A deterministic source story for the UI test.',
    requirements: 'Keep the story concise and clear.',
    footage: {
      displayName: 'fixture.mp4',
      sourcePath: 'C:\\fixtures\\fixture.mp4',
      extension: '.mp4',
      selectedAt: '2026-09-12T12:00:00.000Z',
    },
    targetDurationSeconds: 45,
    style: 'Conversational',
  })
  const attempt = contentProductionStore.beginAttempt(job.jobId)
  assert.ok(attempt)
  contentProductionStore.updateAttempt(job.jobId, attempt.attemptId, {
    executionRecordId: 'execution-record-ui-test',
    executionId: 'execution-ui-test',
    executionResultId: 'execution-result-ui-test',
    script: {
      hookText: 'A deterministic hook.',
      narrationText: 'A deterministic narration.',
      ctaText: 'A deterministic call to action.',
    },
  })
  const result = contentProductionStore.completeAttempt(job.jobId, attempt.attemptId, {
    outputFileName: 'content-job-ui-test-v1.mp4',
    relativeOutputPath: 'content-job-ui-test-v1.mp4',
    durationSeconds: 45,
    width: 1080,
    height: 1920,
    frameRate: 30,
    videoCodec: 'h264',
    audioCodec: 'aac',
    narrationVoice: 'System default',
    captionCount: 8,
  })
  assert.ok(result)
  return { job: contentProductionStore.getJob(job.jobId)!, result }
}

const first = completedJob()
const executionCountBeforeReview = (JSON.parse(localStorage.getItem('ai-operator-os-execution-core-v1') ?? '[]') as unknown[]).length
const firstApproval = ensureContentResultApproval(first.job, first.result)
const duplicateEnsure = ensureContentResultApproval(first.job, first.result)
assert.equal(firstApproval.id, duplicateEnsure.id)
assert.equal(approvalStore.getApprovals().filter((approval) => approval.sourceResultId === first.result.resultId).length, 1)
assert.equal(contentProductionStore.getJob(first.job.jobId)?.results[0].approvalId, firstApproval.id)
assert.equal((JSON.parse(localStorage.getItem('ai-operator-os-execution-core-v1') ?? '[]') as unknown[]).length, executionCountBeforeReview)

assert.equal(presentContentProductionJob(contentProductionStore.getJob(first.job.jobId)!, firstApproval).primaryAction, 'Review')
assert.throws(() => requestContentResultRevision(firstApproval, '   '), /Written revision instructions are required/)
const instructions = requestContentResultRevision(firstApproval, 'Shorten the opening and make the ending clearer.')
assert.equal(instructions, 'Shorten the opening and make the ending clearer.')
assert.equal(contentProductionStore.getJob(first.job.jobId)?.attempts.length, 1, 'Saving review feedback must not start execution.')
const revisedApproval = findContentResultApproval(first.result)
assert.equal(revisedApproval?.status, 'Changes Requested')
assert.equal(presentContentProductionJob(contentProductionStore.getJob(first.job.jobId)!, revisedApproval).primaryAction, 'Generate Revision')

const second = completedJob()
const secondApproval = ensureContentResultApproval(second.job, second.result)
approveContentResult(secondApproval)
assert.equal(findContentResultApproval(second.result)?.status, 'Approved')
assert.equal(presentContentProductionJob(contentProductionStore.getJob(second.job.jobId)!, findContentResultApproval(second.result)).primaryAction, 'Create Another')

const third = completedJob()
const thirdApproval = ensureContentResultApproval(third.job, third.result)
rejectContentResult(thirdApproval)
assert.equal(findContentResultApproval(third.result)?.status, 'Rejected')

const persistedJobs = localStorage.getItem(CONTENT_PRODUCTION_STORAGE_KEY)
assert.ok(persistedJobs)
const reloadedJobs = normalizeContentProductionJobs(JSON.parse(persistedJobs), '2026-09-12T13:00:00.000Z')
assert.equal(reloadedJobs.length, 3)
assert.equal(reloadedJobs[0].results.length, 1)
assert.equal(reloadedJobs[0].results[0].approvalId, thirdApproval.id)
assert.equal(reloadedJobs[1].results[0].approvalId, secondApproval.id)
assert.equal(reloadedJobs[2].results[0].approvalId, firstApproval.id)
assert.equal(approvalStore.getApprovals().length, 3)
const restartedStore = createContentProductionStore({ storage: localStorage })
assert.equal(restartedStore.getSnapshot().length, 3)
assert.equal(restartedStore.getJob(first.job.jobId)?.results[0].approvalId, firstApproval.id)
const persistedApprovals = JSON.parse(localStorage.getItem('ai-operator-os-approval-queue-v1') ?? '[]') as Array<{ status?: string; sourceResultId?: string }>
assert.equal(persistedApprovals.find((item) => item.sourceResultId === first.result.resultId)?.status, 'Changes Requested')
assert.equal(persistedApprovals.find((item) => item.sourceResultId === second.result.resultId)?.status, 'Approved')
assert.equal(persistedApprovals.find((item) => item.sourceResultId === third.result.resultId)?.status, 'Rejected')

const failedRevisionJob = {
  ...first.job,
  runState: 'Failed' as const,
  attempts: [{
    ...first.job.attempts[0],
    status: 'Failed' as const,
    revisionInstructions: instructions,
  }],
}
assert.equal(retryInstructionsFor(failedRevisionJob), instructions, 'A manual retry must preserve failed revision instructions.')

const pageSource = readFileSync(new URL('../src/features/contentProduction/pages/ContentProductionPage.tsx', import.meta.url), 'utf8')
for (const forbiddenVisibleLabel of ['Open Execution Dashboard', 'Create Work Item', 'Create Package', 'Publish Video', 'Upload Video']) {
  assert.equal(pageSource.includes(forbiddenVisibleLabel), false, `Task 3 page must not expose ${forbiddenVisibleLabel}`)
}
assert.ok(pageSource.includes('Generate Video'))
assert.ok(pageSource.includes('Approve'))
assert.ok(pageSource.includes('Revise'))
assert.ok(pageSource.includes('Reject'))
assert.ok(pageSource.includes('Nothing was published'))

console.log('Content production deterministic UI/state and persistence verification: PASS')
