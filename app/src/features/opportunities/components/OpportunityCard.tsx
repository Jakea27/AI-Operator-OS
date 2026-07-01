import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getLifecycleProgress, OpportunityRecord } from '@/src/core/opportunities'
import { OpportunityScoreCard } from './OpportunityScoreCard'

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

const priorityClass: Record<OpportunityRecord['priority'], string> = {
  Low: 'border-white/10 bg-white/[0.04] text-muted',
  Medium: 'border-mint/20 bg-mint/[0.06] text-mint',
  High: 'border-amber-300/20 bg-amber-300/[0.08] text-amber-200',
  Critical: 'border-red-300/20 bg-red-400/[0.08] text-red-200',
}

const statusClass: Record<OpportunityRecord['decisionStatus'], string> = {
  Active: 'border-lime/20 bg-lime/[0.08] text-lime',
  Approved: 'border-blue-300/20 bg-blue-400/[0.08] text-blue-200',
  Converted: 'border-mint/20 bg-mint/[0.08] text-mint',
  'Changes Requested': 'border-amber-300/20 bg-amber-300/[0.08] text-amber-200',
  Rejected: 'border-red-300/20 bg-red-400/[0.08] text-red-200',
  Archived: 'border-white/10 bg-white/[0.04] text-muted',
}

export function OpportunityCard({ opportunity }: { opportunity: OpportunityRecord }) {
  return (
    <article className="panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">{opportunity.opportunityId} · {opportunity.businessCategory}</p>
          <h3 className="m-0 font-display text-xl font-semibold text-white">{opportunity.name}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#95a09b]">{opportunity.description}</p>
        </div>
        <span className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold ${priorityClass[opportunity.priority]}`}>
          {opportunity.priority}
        </span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-ink/35 p-3">
          <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Current Stage</p>
          <p className="m-0 mt-1 text-sm font-semibold text-white">{opportunity.stage}</p>
        </div>
        <div className="rounded-xl border border-line bg-ink/35 p-3">
          <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">CEO Status</p>
          <span className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClass[opportunity.decisionStatus]}`}>
            {opportunity.decisionStatus}
          </span>
        </div>
      </div>
      <div className="mt-4 h-1.5 rounded-full bg-white/[0.05]">
        <div className="h-full rounded-full bg-gradient-to-r from-mint to-lime" style={{ width: `${getLifecycleProgress(opportunity.stage)}%` }} />
      </div>
      {opportunity.tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {opportunity.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-line bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-[#c7d2cc]">
              {tag}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-4">
        <OpportunityScoreCard score={opportunity.score} compact />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
        <span>Created {formatDate(opportunity.createdAt)}</span>
        <span>Updated {formatDate(opportunity.updatedAt)}</span>
      </div>
      <Link to={`/opportunities/${opportunity.id}`} className="btn-secondary mt-5 inline-flex items-center gap-2">
        Open Opportunity <ArrowRight size={14} />
      </Link>
    </article>
  )
}
