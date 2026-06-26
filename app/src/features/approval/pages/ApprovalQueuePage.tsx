import { useMemo, useState } from 'react'
import { PageIntro } from '@/components/PageIntro'
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
  const ctoRecommendations = useCTORecommendationStore()
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

  const recordDecision = (approval: Approval, status: ApprovalStatus, note: string) => {
    approvalStore.updateStatus(approval.id, status, note)
    if (!approval.recommendationId) return
    if (status === 'Approved') ctoRecommendations.updateStatus(approval.recommendationId, 'Approved', note || 'CEO approved the linked approval request. Execution is not automated yet.')
    if (status === 'Rejected') ctoRecommendations.updateStatus(approval.recommendationId, 'Rejected', note || 'CEO rejected the linked approval request.')
    if (status === 'Changes Requested') ctoRecommendations.updateStatus(approval.recommendationId, 'Needs Approval', note || 'CEO requested changes to the linked recommendation.')
    if (status === 'Deferred') ctoRecommendations.updateStatus(approval.recommendationId, 'Needs Approval', note || 'CEO deferred the linked approval request.')
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
            onClose={() => setSelectedApproval(null)}
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
                onViewDetails={() => setSelectedApproval(approval)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
