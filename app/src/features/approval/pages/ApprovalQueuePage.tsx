import { useMemo, useState } from 'react'
import { PageIntro } from '@/components/PageIntro'
import { ApprovalCard } from '../components/ApprovalCard'
import { ApprovalEmptyState } from '../components/ApprovalEmptyState'
import { ApprovalFilters } from '../components/ApprovalFilters'
import { ApprovalSummaryCards } from '../components/ApprovalSummaryCards'
import { useApprovalStore } from '../store/approvalStore'
import { ApprovalFilters as ApprovalFilterState } from '../types/approvalTypes'
import { filterApprovals } from '../utils/approvalFilters'

export function ApprovalQueuePage() {
  const approvalStore = useApprovalStore()
  const [filters, setFilters] = useState<ApprovalFilterState>({
    search: '',
    status: 'All',
    operator: 'All',
    priority: 'All',
    sort: 'newest',
  })

  const visibleApprovals = useMemo(
    () => filterApprovals(approvalStore.approvals, filters),
    [approvalStore.approvals, filters],
  )

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
      />

      <div className="mt-5 space-y-4">
        <ApprovalFilters filters={filters} onChange={setFilters} />
        {visibleApprovals.length === 0 ? (
          <ApprovalEmptyState />
        ) : (
          <div className="grid gap-4">
            {visibleApprovals.map((approval) => <ApprovalCard key={approval.id} approval={approval} />)}
          </div>
        )}
      </div>
    </>
  )
}
