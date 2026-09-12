import { approvalStore } from '@/src/features/approval/store/approvalStore'
import type { Approval, ApprovalStatus } from '@/src/features/approval/types/approvalTypes'
import { contentProductionStore } from './contentProductionStore'
import type { ContentProductionJob, ContentProductionResult } from './contentProductionTypes'

export function findContentResultApproval(result: ContentProductionResult, approvals = approvalStore.getApprovals()) {
  return approvals.find((approval) => approval.id === result.approvalId)
    ?? approvals.find((approval) => approval.sourceResultId === result.resultId)
}

export function ensureContentResultApproval(job: ContentProductionJob, result: ContentProductionResult) {
  const existing = findContentResultApproval(result)
  if (existing) {
    if (!result.approvalId) contentProductionStore.linkResultApproval(job.jobId, result.resultId, existing.id)
    return existing
  }

  const sourceAttempt = job.attempts.find((attempt) => attempt.attemptId === result.sourceAttemptId)
  const approval = approvalStore.addApproval({
    title: `Review Reddit Stories video · Version ${result.version}`,
    description: 'A finished Reddit Stories draft is ready for your decision. Approval accepts this exact rendered version and does not publish it.',
    submittedBy: 'AI Operator OS',
    operator: 'System',
    department: 'Content Production',
    relatedIssue: '',
    recommendationId: '',
    priority: 'Medium',
    effort: 'Low',
    risk: 'Low',
    status: 'Pending',
    requiresCEOApproval: true,
    submittedAt: new Date().toISOString(),
    supportingEvidence: [result.outputFileName],
    recommendedNextAction: 'Preview the finished draft and Approve, Revise, or Reject it.',
    sourceExecutionRecordId: result.executionRecordId,
    sourceExecutionId: sourceAttempt?.executionId,
    sourceResultId: result.resultId,
    sourceReviewStatus: 'Ready for Review',
  })
  contentProductionStore.linkResultApproval(job.jobId, result.resultId, approval.id)
  return approval
}

function decide(approval: Approval, status: ApprovalStatus, note: string) {
  if (approval.status !== 'Pending') throw new Error('This video version already has a CEO decision.')
  approvalStore.updateStatus(approval.id, status, note.trim(), 'CEO')
}

export function approveContentResult(approval: Approval) {
  decide(approval, 'Approved', 'Approved for use. No publishing or external action was triggered.')
}

export function requestContentResultRevision(approval: Approval, instructions: string) {
  const writtenInstructions = instructions.trim()
  if (!writtenInstructions) throw new Error('Written revision instructions are required.')
  decide(approval, 'Changes Requested', writtenInstructions)
  return writtenInstructions
}

export function rejectContentResult(approval: Approval, reason = '') {
  decide(approval, 'Rejected', reason.trim() || 'Rejected by CEO. No external action was triggered.')
}
