import { ArrowLeft, BriefcaseBusiness, Check, ChevronLeft, ChevronRight, FileText, X } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useBusinessStore } from '@/src/core/businesses'
import { getStageIndex, OpportunityRecord, OpportunityStage, opportunityStages, useOpportunityStore } from '@/src/core/opportunities'
import { OpportunityLifecycle } from '../components/OpportunityLifecycle'
import { OpportunityScoreCard } from '../components/OpportunityScoreCard'
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
  Converted: 'border-mint/20 bg-mint/[0.08] text-mint',
  'Changes Requested': 'border-amber-300/20 bg-amber-300/[0.08] text-amber-200',
  Rejected: 'border-red-300/20 bg-red-400/[0.08] text-red-200',
  Archived: 'border-white/10 bg-white/[0.04] text-muted',
}

function buildTimeline(opportunity: OpportunityRecord) {
  const currentIndex = getStageIndex(opportunity.stage)
  const stageEvents = opportunityStages.slice(0, currentIndex + 1).map((stage, index) => ({
    id: `${opportunity.id}-${stage}`,
    title: index === 0 ? 'Opportunity Created' : `Moved to ${stage}`,
    message:
      stage === 'Phase 1 Research'
        ? 'Opportunity entered broad, low-cost validation.'
        : stage === 'CEO Review'
          ? 'Opportunity is ready for CEO review before deeper blueprint work.'
          : stage === 'Phase 2 Blueprint'
            ? 'Opportunity moved into blueprint preparation after CEO approval.'
            : stage === 'Ready to Build'
              ? 'Opportunity is ready to become an executable build plan.'
              : stage === 'Idea'
                ? 'Opportunity entered the pipeline as a structured business record.'
                : `Opportunity reached ${stage}.`,
    createdAt: opportunity.activity.find((activity) => activity.message.includes(stage))?.createdAt ?? opportunity.createdAt,
    status: stage === opportunity.stage ? 'Current' : 'Completed',
  }))

  const decisionEvents = opportunity.decisionStatus === 'Approved'
    ? [{
      id: `${opportunity.id}-ceo-approved`,
      title: 'CEO Approved',
      message: 'CEO approved this opportunity for the next appropriate step.',
      createdAt: opportunity.updatedAt,
      status: 'Decision',
    }]
    : opportunity.decisionStatus === 'Changes Requested'
      ? [{
        id: `${opportunity.id}-changes-requested`,
        title: 'CEO Requested Changes',
        message: 'CEO requested changes before this opportunity can continue.',
        createdAt: opportunity.updatedAt,
        status: 'Decision',
      }]
      : opportunity.decisionStatus === 'Rejected'
        ? [{
          id: `${opportunity.id}-rejected`,
          title: 'CEO Rejected',
          message: 'CEO rejected this opportunity.',
          createdAt: opportunity.updatedAt,
          status: 'Decision',
        }]
        : []

  return [...decisionEvents, ...stageEvents].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function OpportunityDetailPage() {
  const { opportunityId } = useParams()
  const opportunityStore = useOpportunityStore()
  const businessStore = useBusinessStore()
  const opportunity = opportunityStore.opportunities.find((item) => item.id === opportunityId)

  if (!opportunity) {
    return <Navigate to="/opportunities" replace />
  }

  const linkedBusiness = opportunity.convertedBusinessId
    ? businessStore.businesses.find((business) => business.id === opportunity.convertedBusinessId)
    : undefined

  function convertToBusiness() {
    if (!opportunity || opportunity.convertedBusinessId) return

    const business = businessStore.createBusiness({
      name: opportunity.name,
      description: opportunity.description,
      portfolioType: opportunity.businessCategory,
      businessModel: 'Pending blueprint',
      status: 'Building',
      notes: opportunity.notes,
      priority: opportunity.priority,
      sourceOpportunityId: opportunity.id,
      sourceOpportunityCode: opportunity.opportunityId,
      sourceOpportunityName: opportunity.name,
    })

    opportunityStore.markConverted(opportunity.id, business.id, business.businessId)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/opportunities" className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-white">
            <ArrowLeft size={15} /> Back to Opportunity Pipeline
          </Link>
          <p className="eyebrow mb-2">Opportunity Detail · {opportunity.opportunityId}</p>
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

      <section className="panel border-lime/20 bg-gradient-to-br from-lime/[0.07] to-white/[0.025] p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow mb-1">Executive Summary</p>
            <h3 className="m-0 font-display text-xl font-semibold text-white">Opportunity command view</h3>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${decisionClass[opportunity.decisionStatus]}`}>
            {opportunity.decisionStatus}
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
          <Info label="Current Stage" value={opportunity.stage} />
          <Info label="Priority" value={opportunity.priority} />
          <Info label="Created" value={formatDate(opportunity.createdAt)} />
          <Info label="Updated" value={formatDate(opportunity.updatedAt)} />
          <Info label="Business Category" value={opportunity.businessCategory} />
          <Info label="Overall Opportunity Status" value={opportunity.decisionStatus} />
          <Info label="Opportunity ID" value={opportunity.opportunityId} />
        </div>
      </section>

      <OpportunityLifecycle stage={opportunity.stage} />

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <OpportunitySection title="Overview" eyebrow="Business record">
            <div className="grid gap-3 md:grid-cols-2">
              <Info label="Opportunity ID" value={opportunity.opportunityId} />
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
            <div className="mt-4 rounded-xl border border-line bg-ink/35 p-4">
              <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Business Status</p>
              {opportunity.convertedBusinessId ? (
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <span className="text-sm font-semibold text-white">Converted to {opportunity.convertedBusinessCode ?? linkedBusiness?.businessId ?? 'Business'}</span>
                  <Link to={`/businesses/${opportunity.convertedBusinessId}`} className="btn-secondary inline-flex items-center gap-2">
                    Open Business <BriefcaseBusiness size={14} />
                  </Link>
                </div>
              ) : (
                <p className="m-0 mt-2 text-sm text-muted">Not converted to a business yet.</p>
              )}
            </div>
            {opportunity.tags.length > 0 ? (
              <div className="mt-4 rounded-xl border border-line bg-ink/35 p-4">
                <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Tags</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {opportunity.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-line bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-[#c7d2cc]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
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

          <OpportunitySection title="Opportunity Score" eyebrow="Placeholder scoring">
            <OpportunityScoreCard score={opportunity.score} />
            <p className="m-0 mt-3 text-xs leading-5 text-muted">
              These are placeholder executive metrics. Future scoring will evaluate ROI, CEO time, automation potential,
              startup cost, risk, and fit with the current company stage.
            </p>
          </OpportunitySection>

          <OpportunitySection title="Timeline" eyebrow="Lifecycle progress">
            <div className="space-y-3">
              {buildTimeline(opportunity).map((event) => {
                const isCurrent = event.status === 'Current'
                return (
                  <div key={event.id} className={`flex items-start gap-3 rounded-xl border p-3 ${isCurrent ? 'border-lime/40 bg-lime/[0.07]' : 'border-line bg-ink/30'}`}>
                    <div className={`mt-0.5 grid h-7 w-7 place-items-center rounded-full ${isCurrent ? 'bg-lime text-ink' : 'bg-mint text-ink'}`}>
                      <Check size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="m-0 text-sm font-semibold text-white">{event.title}</p>
                        <span className="text-[11px] text-muted">{formatDate(event.createdAt)}</span>
                      </div>
                      <p className="m-0 mt-1 text-xs leading-5 text-muted">{event.message}</p>
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
              {opportunity.convertedBusinessId ? (
                <Link to={`/businesses/${opportunity.convertedBusinessId}`} className="btn-secondary inline-flex items-center justify-center gap-2">
                  Open Converted Business <BriefcaseBusiness size={14} />
                </Link>
              ) : (
                <button
                  onClick={convertToBusiness}
                  disabled={opportunity.decisionStatus === 'Rejected' || opportunity.decisionStatus === 'Archived'}
                  className="btn-primary inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <BriefcaseBusiness size={14} /> Convert to Business
                </button>
              )}
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
