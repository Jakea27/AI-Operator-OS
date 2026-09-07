import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BusinessAttentionSummary, BusinessRecord } from '@/src/core/businesses'
import { BusinessMetrics } from './BusinessMetrics'

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

const healthClass: Record<BusinessRecord['health'], string> = {
  Healthy: 'border-lime/20 bg-lime/[0.08] text-lime',
  Stable: 'border-mint/20 bg-mint/[0.08] text-mint',
  Watch: 'border-amber-300/20 bg-amber-300/[0.08] text-amber-200',
  'At Risk': 'border-red-300/20 bg-red-400/[0.08] text-red-200',
  Unrated: 'border-white/10 bg-white/[0.04] text-muted',
}

export function BusinessCard({
  business,
  attentionSummary,
}: {
  business: BusinessRecord
  attentionSummary?: BusinessAttentionSummary
}) {
  const highestPriority = attentionSummary?.items.find((item) => item.priority !== 'Unspecified')?.priority ??
    (attentionSummary && attentionSummary.attentionItemCount > 0 ? 'Unspecified' : 'None')

  return (
    <article className="record-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">{business.businessId} · {business.portfolioType}</p>
          <h3 className="m-0 font-display text-xl font-semibold text-white">{business.name}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#95a09b]">{business.description}</p>
        </div>
        <span className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold ${healthClass[business.health]}`}>
          {business.health}
        </span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Info label="Status" value={business.status} />
        <Info label="Model" value={business.businessModel} />
        <Info label="Priority" value={business.priority} />
      </div>
      <div className="mt-4 rounded-xl border border-line bg-white/[0.025] p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Current Attention</p>
            <p className="m-0 mt-1 text-sm font-semibold text-white">
              {attentionSummary?.attentionItemCount ?? 0} item{attentionSummary?.attentionItemCount === 1 ? '' : 's'}
            </p>
          </div>
          <div className="text-right">
            <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Highest Recorded Priority</p>
            <p className="m-0 mt-1 text-sm font-semibold text-white">{highestPriority}</p>
          </div>
        </div>
        <p className="m-0 mt-2 text-xs leading-5 text-muted">
          Derived from current approvals, execution state, and blocked work. No attention does not prove health or profitability.
        </p>
      </div>
      <div className="mt-4">
        <BusinessMetrics metrics={business.metrics} />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
        <span>Updated {formatDate(business.updatedAt)}</span>
      </div>
      <Link to={`/businesses/${business.businessId}`} className="btn-secondary mt-5 inline-flex items-center gap-2">
        Open Business <ArrowRight size={14} />
      </Link>
    </article>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-ink/35 p-3">
      <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="m-0 mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  )
}
