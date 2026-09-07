import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageIntro } from '@/components/PageIntro'
import { ExecutionQueueRecord, useExecutionQueueStore } from '@/src/core/executionQueue'
import { useCTORecommendationStore } from '@/src/core/operators'
import { ApprovalCard } from '../components/ApprovalCard'
import { ApprovalDetailPanel } from '../components/ApprovalDetailPanel'
import { ApprovalEmptyState } from '../components/ApprovalEmptyState'
import { ApprovalFilters } from '../components/ApprovalFilters'
import { ApprovalSummaryCards } from '../components/ApprovalSummaryCards'
import { useApprovalStore } from '../store/approvalStore'
import { Approval, ApprovalFilters as ApprovalFilterState, ApprovalStatus } from '../types/approvalTypes'
import { filterApprovals } from '../utils/approvalFilters'

export function ApprovalQueuePage() {
  const approvalStore = useApprovalStore()
  const executionQueue = useExecutionQueueStore()
  const ctoRecommendations = useCTORecommendationStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedApprovalId = searchParams.get('approvalId')
  const [filters, setFilters] = useState<ApprovalFilterState>({
    search: '',
    status: 'All',
    operator: 'All',
    priority: 'All',
    risk: 'All',
    sort: 'newest',
  })
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null)

  const visibleApprovals = useMemo(
    () => filterApprovals(approvalStore.approvals, filters),
    [approvalStore.approvals, filters],
  )

  const queueItemsRequiringApproval = useMemo(
    () => executionQueue.queueItems.filter((queueItem) => queueItem.requiresApproval),
    [executionQueue.queueItems],
  )

  useEffect(() => {
    queueItemsRequiringApproval.forEach((queueItem) => {
      const existingApproval = approvalStore.approvals.find((approval) => approval.sourceQueueItemId === queueItem.id)
      if (existingApproval) return
      approvalStore.addApproval(buildApprovalFromQueueItem(queueItem))
    })
  }, [approvalStore, queueItemsRequiringApproval])

  useEffect(() => {
    if (!selectedApprovalId) return
    const approval = approvalStore.approvals.find((item) => item.id === selectedApprovalId)
    if (approval) setSelectedApproval(approval)
  }, [approvalStore.approvals, selectedApprovalId])

  const recordDecision = (approval: Approval, status: ApprovalStatus, note: string) => {
    approvalStore.updateStatus(approval.id, status, note)
    if (!approval.recommendationId) return
    if (status === 'Approved') ctoRecommendations.updateStatus(approval.recommendationId, 'Approved', note || 'Approved by CEO. Execution is not automated yet.')
    if (status === 'Rejected') ctoRecommendations.updateStatus(approval.recommendationId, 'Rejected', note || 'Rejected by CEO.')
    if (status === 'Changes Requested') ctoRecommendations.updateStatus(approval.recommendationId, 'Changes Requested', note || 'Changes requested by CEO.')
    if (status === 'Deferred') ctoRecommendations.updateStatus(approval.recommendationId, 'Deferred', note || 'Deferred by CEO.')
    if (status === 'Archived') ctoRecommendations.updateStatus(approval.recommendationId, 'Archived', note || 'Archived.')
  }

  return (
    <>
      <PageIntro
        eyebrow="Executive control"
        title="Approval Queue"
        description="Review consequential operator recommendations before execution."
      />

      <ApprovalSummaryCards
        pending={approvalStore.pending}
        approved={approvalStore.approved}
        rejected={approvalStore.rejected}
        deferred={approvalStore.deferred}
        approvedToday={approvalStore.approvedToday}
        rejectedToday={approvalStore.rejectedToday}
      />

      <div className="mt-5 space-y-4">
        <ApprovalFilters filters={filters} onChange={setFilters} />
        {selectedApproval && (
          <ApprovalDetailPanel
            approval={approvalStore.approvals.find((approval) => approval.id === selectedApproval.id) ?? selectedApproval}
            onClose={() => {
              setSelectedApproval(null)
              if (selectedApprovalId) setSearchParams({})
            }}
          />
        )}
        {visibleApprovals.length === 0 ? (
          <ApprovalEmptyState />
        ) : (
          <div className="grid gap-4">
            {visibleApprovals.map((approval) => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                onDecision={(status: ApprovalStatus, note: string) => recordDecision(approval, status, note)}
                onViewDetails={() => {
                  setSelectedApproval(approval)
                  setSearchParams({ approvalId: approval.id })
                }}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function buildApprovalFromQueueItem(queueItem: ExecutionQueueRecord): Omit<Approval, 'id' | 'created' | 'updated' | 'decisionHistory'> {
  return {
    title: `Approve execution queue item ${queueItem.queueId}`,
    description: [
      `Execution Queue item ${queueItem.queueId} requires CEO approval before future execution.`,
      '',
      `Source Work Item: ${queueItem.sourceWorkItemId} · ${queueItem.workItemTitle}`,
      `Business: ${queueItem.businessCode} · ${queueItem.businessName}`,
      `Project: ${queueItem.projectCode} · ${queueItem.projectName}`,
      `Department: ${queueItem.departmentCode} · ${queueItem.departmentName}`,
      `Manager: ${queueItem.managerName}`,
      `Operator: ${queueItem.operatorName}`,
      `Execution Type: ${queueItem.executionType}`,
      queueItem.notes ? `Queue Notes: ${queueItem.notes}` : '',
    ].filter(Boolean).join('\n'),
    submittedBy: 'Execution Queue',
    operator: 'System',
    department: queueItem.departmentName,
    relatedIssue: queueItem.sourceWorkItemId,
    recommendationId: '',
    priority: queueItem.priority,
    effort: 'Medium',
    risk: queueItem.executionType === 'Future Automation' || queueItem.executionType === 'Future AI' ? 'High' : 'Medium',
    status: 'Pending',
    requiresCEOApproval: true,
    submittedAt: new Date().toISOString(),
    businessValue: `Prepare ${queueItem.workItemTitle} for controlled future execution with CEO visibility.`,
    supportingEvidence: [
      `Queue Item: ${queueItem.queueId}`,
      `Source Work Item: ${queueItem.sourceWorkItemId}`,
      `Project: ${queueItem.projectCode}`,
      `Business: ${queueItem.businessCode}`,
      `Requires Approval: ${queueItem.requiresApproval ? 'Yes' : 'No'}`,
    ],
    recommendedNextAction: 'CEO should approve, reject, request changes, or defer this queue item before any future execution layer can act on it.',
    sourceQueueItemId: queueItem.id,
    sourceQueueCode: queueItem.queueId,
    sourceWorkItemId: queueItem.sourceWorkItemRecordId,
    sourceProjectId: queueItem.projectId,
    sourceBusinessId: queueItem.businessId,
  }
}
