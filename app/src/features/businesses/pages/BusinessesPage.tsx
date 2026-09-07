import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageIntro } from '@/components/PageIntro'
import { SummaryCard } from '@/components/SummaryCard'
import { BusinessAttentionItem, BusinessRecord, buildBusinessAttentionSummary, useBusinessStore } from '@/src/core/businesses'
import { useExecutionStore } from '@/src/core/execution'
import { useExecutionQueueStore } from '@/src/core/executionQueue'
import { useProjectStore } from '@/src/core/projects'
import { useWorkItemStore } from '@/src/core/workItems'
import { useApprovalStore } from '@/src/features/approval/store/approvalStore'
import { BusinessCard } from '../components/BusinessCard'
import { BusinessForm } from '../components/BusinessForm'

export function BusinessesPage() {
  const businessStore = useBusinessStore()
  const projectStore = useProjectStore()
  const workItemStore = useWorkItemStore()
  const executionQueueStore = useExecutionQueueStore()
  const executionStore = useExecutionStore()
  const approvalStore = useApprovalStore()
  const [showForm, setShowForm] = useState(false)

  const stats = useMemo(() => {
    const businesses = businessStore.businesses
    return {
      total: businesses.length,
      building: countStatus(businesses, 'Building'),
      launching: countStatus(businesses, 'Launching'),
      operating: countStatus(businesses, 'Operating'),
      optimizing: countStatus(businesses, 'Optimizing'),
      pausedArchived: businesses.filter((business) => ['Paused', 'Archived'].includes(business.status)).length,
    }
  }, [businessStore.businesses])

  const attention = useMemo(() => buildBusinessAttentionSummary({
    businesses: businessStore.businesses,
    projects: projectStore.projects,
    workItems: workItemStore.workItems,
    executionQueueItems: executionQueueStore.queueItems,
    executions: executionStore.executions,
    approvals: approvalStore.approvals,
  }), [
    approvalStore.approvals,
    businessStore.businesses,
    executionQueueStore.queueItems,
    executionStore.executions,
    projectStore.projects,
    workItemStore.workItems,
  ])

  const attentionByBusiness = useMemo(() => new Map(
    attention.businessSummaries.map((summary) => [summary.businessRecordId, summary]),
  ), [attention.businessSummaries])

  return (
    <>
      <PageIntro
        eyebrow="Module 002"
        title="Business Manager"
        description="Manage approved businesses as structured operating records. Track status, health, placeholder performance metrics, and the lifecycle from build through scale."
        action={
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> New Business
          </button>
        }
      />

      {showForm ? (
        <BusinessForm
          onCancel={() => setShowForm(false)}
          onCreate={(input) => {
            businessStore.createBusiness(input)
            setShowForm(false)
          }}
        />
      ) : null}

      <div className="mb-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <SummaryCard label="Total Businesses" value={stats.total} helper="Local business records" />
        <SummaryCard label="Attention Items" value={attention.attentionItemCount} helper="Current derived signals" />
        <SummaryCard label="Source Records" value={attention.contributingSourceRecordCount} helper="Unique contributing records" />
        <SummaryCard label="Building" value={stats.building} helper="In build stage" />
        <SummaryCard label="Launching" value={stats.launching} helper="Preparing to launch" />
        <SummaryCard label="Operating" value={stats.operating} helper="Currently operating" />
        <SummaryCard label="Optimizing" value={stats.optimizing} helper="Improvement stage" />
        <SummaryCard label="Paused / Archived" value={stats.pausedArchived} helper="Inactive records" />
      </div>

      <BusinessAttentionReviewSection attention={attention} />

      {businessStore.businesses.length > 0 ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {businessStore.businesses.map((business) => (
            <BusinessCard key={business.id} business={business} attentionSummary={attentionByBusiness.get(business.id)} />
          ))}
        </div>
      ) : (
        <section className="panel p-8 text-center">
          <p className="eyebrow mb-2">No businesses yet</p>
          <h3 className="m-0 font-display text-2xl font-semibold text-white">Create the first operating business record.</h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted">
            Businesses are the active operating layer after opportunities have been validated and approved. Start with a
            simple record, then expand metrics, departments, tasks, and financials over time.
          </p>
          <button onClick={() => setShowForm(true)} className="btn-primary mt-5 inline-flex items-center gap-2">
            <Plus size={15} /> New Business
          </button>
        </section>
      )}
    </>
  )
}

function BusinessAttentionReviewSection({ attention }: { attention: ReturnType<typeof buildBusinessAttentionSummary> }) {
  const hasReviewItems = attention.reviewGroups.unidentifiedOwnership.length > 0 ||
    attention.reviewGroups.conflictingOwnership.length > 0 ||
    attention.reviewGroups.unspecifiedPriority.length > 0

  if (!hasReviewItems) return null

  return (
    <section className="panel mb-6 border-amber-300/20 bg-amber-300/[0.04] p-5">
      <p className="eyebrow mb-2">Portfolio attention review</p>
      <h3 className="m-0 font-display text-xl font-semibold text-white">Items requiring ownership or priority review</h3>
      <p className="mt-2 text-sm leading-6 text-muted">
        These items stay outside individual business totals until their source records resolve cleanly.
      </p>
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <AttentionReviewGroup title="Unidentified Ownership" items={attention.reviewGroups.unidentifiedOwnership} />
        <AttentionReviewGroup title="Conflicting Ownership" items={attention.reviewGroups.conflictingOwnership} />
        <AttentionReviewGroup title="Unspecified Priority" items={attention.reviewGroups.unspecifiedPriority} />
      </div>
    </section>
  )
}

function AttentionReviewGroup({ title, items }: { title: string; items: BusinessAttentionItem[] }) {
  return (
    <div className="rounded-xl border border-line bg-ink/35 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="m-0 text-sm font-semibold text-white">{title}</p>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-muted">{items.length}</span>
      </div>
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => <AttentionReviewItem key={`${title}-${item.attentionId}`} item={item} />)}
        </div>
      ) : (
        <p className="m-0 text-xs leading-5 text-muted">No current items.</p>
      )}
    </div>
  )
}

function AttentionReviewItem({ item }: { item: BusinessAttentionItem }) {
  return (
    <div className="rounded-lg border border-line bg-white/[0.025] p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-muted">{item.signalType}</span>
        <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-muted">{item.priority}</span>
      </div>
      <p className="m-0 mt-2 text-sm font-semibold text-white">{item.title}</p>
      <p className="m-0 mt-1 text-xs leading-5 text-muted">{item.ownershipWarning ?? item.stateConsistencyWarning ?? item.reason}</p>
      <Link to={item.navigationTarget.route} className="mt-3 inline-flex text-xs font-semibold text-lime hover:text-white">
        {item.navigationTarget.label}
      </Link>
    </div>
  )
}

function countStatus(businesses: BusinessRecord[], status: BusinessRecord['status']) {
  return businesses.filter((business) => business.status === status).length
}
