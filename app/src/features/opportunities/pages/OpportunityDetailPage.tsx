import { ArrowLeft, Check, ChevronLeft, ChevronRight, FileText, X } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { OpportunityStage, opportunityStages, useOpportunityStore } from '@/src/core/opportunities'
import { OpportunityLifecycle } from '../components/OpportunityLifecycle'
import { OpportunitySection } from '../components/OpportunitySection'

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

const decisionClass = {
  Active: 'border-lime/20 bg-lime/[0.08] text-lime',
  Approved: 'border-blue-300/20 bg-blue-400/[0.08] text-blue-200',
  'Changes Requested': 'border-amber-300/20 bg-amber-300/[0.08] text-amber-200',
  Rejected: 'border-red-300/20 bg-red-400/[0.08] text-red-200',
  Archived: 'border-white/10 bg-white/[0.04] text-muted',
}

export function OpportunityDetailPage() {
  const { opportunityId } = useParams()
  const opportunityStore = useOpportunityStore()
  const opportunity = opportunityStore.opportunities.find((item) => item.id === opportunityId)

  if (!opportunity) {
    return <Navigate to="/opportunities" replace />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/opportunities" className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-white">
            <ArrowLeft size={15} /> Back to Opportunity Pipeline
          </Link>
          <p className="eyebrow mb-2">Opportunity Detail</p>
          <h2 className="m-0 font-display text-3xl font-semibold tracking-tight text-white">{opportunity.name}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#8f9b95]">{opportunity.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => opportunityStore.moveBackStage(opportunity.id)} className="btn-secondary inline-flex items-center gap-2">
            <ChevronLeft size={15} /> Move Back
          </button>
          <button onClick={() => opportunityStore.advanceStage(opportunity.id)} className="btn-secondary inline-flex items-center gap-2">
            Advance <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <OpportunityLifecycle stage={opportunity.stage} />

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <OpportunitySection title="Overview" eyebrow="Business record">
            <div className="grid gap-3 md:grid-cols-2">
              <Info label="Business Type" value={opportunity.businessCategory} />
              <Info label="Priority" value={opportunity.priority} />
              <Info label="Current Stage" value={opportunity.stage} />
              <div className="rounded-xl border border-line bg-ink/35 p-4">
                <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">CEO Decision</p>
                <span className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${decisionClass[opportunity.decisionStatus]}`}>
                  {opportunity.decisionStatus}
                </span>
              </div>
              <Info label="Date Created" value={formatDate(opportunity.createdAt)} />
              <Info label="Last Updated" value={formatDate(opportunity.updatedAt)} />
            </div>
            {opportunity.notes ? (
              <div className="mt-4 rounded-xl border border-line bg-ink/35 p-4">
                <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Notes</p>
                <p className="m-0 mt-2 whitespace-pre-wrap text-sm leading-6 text-[#dce7df]">{opportunity.notes}</p>
              </div>
            ) : null}
            <div className="mt-4">
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Manual Stage Control</span>
                <select
                  value={opportunity.stage}
                  onChange={(event) => opportunityStore.setStage(opportunity.id, event.target.value as OpportunityStage)}
                  className="field max-w-sm"
                >
                  {opportunityStages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
                </select>
              </label>
            </div>
          </OpportunitySection>

          <OpportunitySection title="Timeline" eyebrow="Lifecycle progress">
            <div className="space-y-3">
              {opportunityStages.map((stage, index) => {
                const isCurrent = stage === opportunity.stage
                const isComplete = opportunityStages.indexOf(opportunity.stage) > index
                return (
                  <div key={stage} className={`flex items-center gap-3 rounded-xl border p-3 ${isCurrent ? 'border-lime/40 bg-lime/[0.07]' : 'border-line bg-ink/30'}`}>
                    <div className={`grid h-7 w-7 place-items-center rounded-full ${isComplete ? 'bg-mint text-ink' : isCurrent ? 'bg-lime text-ink' : 'bg-white/[0.06] text-muted'}`}>
                      {isComplete ? <Check size={14} /> : <span className="text-xs font-semibold">{index + 1}</span>}
                    </div>
                    <div>
                      <p className="m-0 text-sm font-semibold text-white">{stage}</p>
                      <p className="m-0 text-xs text-muted">{isCurrent ? 'Current stage' : isComplete ? 'Completed stage' : 'Upcoming stage'}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </OpportunitySection>

          <OpportunitySection title="Research" eyebrow="Phase 1 validation">
            <Placeholder text="Research has not been generated yet. Future AI research will validate profit potential, automation readiness, startup cost, CEO time required, risk, scalability, and stage fit." />
          </OpportunitySection>

          <OpportunitySection title="Blueprint" eyebrow="Phase 2 planning">
            <Placeholder text="Blueprint data will be added after CEO approval. This section is reserved for launch plans, operating workflows, budget, KPIs, and department assignments." />
          </OpportunitySection>
        </div>

        <div className="space-y-6">
          <OpportunitySection title="CEO Actions" eyebrow="Human control">
            <div className="grid gap-3">
              <button onClick={() => opportunityStore.setDecision(opportunity.id, 'Approved')} className="btn-primary">Approve</button>
              <button onClick={() => opportunityStore.setDecision(opportunity.id, 'Changes Requested')} className="btn-secondary">Request Changes</button>
              <button onClick={() => opportunityStore.setDecision(opportunity.id, 'Rejected')} className="btn-secondary inline-flex items-center justify-center gap-2"><X size={14} /> Reject</button>
              <button onClick={() => opportunityStore.setDecision(opportunity.id, 'Archived')} className="btn-secondary">Archive</button>
            </div>
            <p className="m-0 mt-4 text-xs leading-5 text-muted">
              These actions only update the opportunity record. No automation, spending, or execution is triggered.
            </p>
          </OpportunitySection>

          <OpportunitySection title="Activity" eyebrow="Local history">
            <div className="space-y-3">
              {opportunity.activity.map((activity) => (
                <div key={activity.id} className="rounded-xl border border-line bg-ink/35 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="m-0 text-sm font-semibold text-white">{activity.type}</p>
                    <span className="text-[11px] text-muted">{formatDate(activity.createdAt)}</span>
                  </div>
                  <p className="m-0 mt-1 text-xs leading-5 text-muted">{activity.message}</p>
                </div>
              ))}
            </div>
          </OpportunitySection>

          <OpportunitySection title="Recommendations" eyebrow="Future advisory layer">
            <div className="space-y-3">
              <Recommendation title="Keep validation lean" text="Do not begin Phase 2 blueprint work until CEO review confirms the opportunity fits the current stage, time budget, and capital plan." />
              <Recommendation title="Protect CEO time" text="Flag any opportunity that requires frequent calls, manual fulfillment, or high-touch sales before it reaches Ready to Build." />
            </div>
          </OpportunitySection>
        </div>
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-ink/35 p-4">
      <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="m-0 mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  )
}

function Placeholder({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-white/[0.02] p-4">
      <div className="mb-3 grid h-9 w-9 place-items-center rounded-xl bg-lime/10 text-lime">
        <FileText size={16} />
      </div>
      <p className="m-0 text-sm leading-6 text-[#aeb8b3]">{text}</p>
    </div>
  )
}

function Recommendation({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-line bg-ink/35 p-3">
      <p className="m-0 text-sm font-semibold text-white">{title}</p>
      <p className="m-0 mt-1 text-xs leading-5 text-muted">{text}</p>
    </div>
  )
}

