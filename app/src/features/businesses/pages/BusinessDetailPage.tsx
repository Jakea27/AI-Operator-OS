import { ArrowLeft, BriefcaseBusiness, Check } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { BusinessStatus, businessStatuses, useBusinessStore } from '@/src/core/businesses'
import { BusinessLifecycle } from '../components/BusinessLifecycle'
import { BusinessMetrics } from '../components/BusinessMetrics'
import { BusinessSection } from '../components/BusinessSection'

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export function BusinessDetailPage() {
  const { businessId } = useParams()
  const businessStore = useBusinessStore()
  const business = businessStore.businesses.find((item) => item.id === businessId)

  if (!business) {
    return <Navigate to="/businesses" replace />
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/businesses" className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-white">
          <ArrowLeft size={15} /> Back to Business Manager
        </Link>
        <p className="eyebrow mb-2">Business Detail · {business.businessId}</p>
        <h2 className="m-0 font-display text-3xl font-semibold tracking-tight text-white">{business.name}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#8f9b95]">{business.description}</p>
      </div>

      <section className="panel border-lime/20 bg-gradient-to-br from-lime/[0.07] to-white/[0.025] p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-lime/10 text-lime">
            <BriefcaseBusiness size={18} />
          </div>
          <div>
            <p className="eyebrow mb-1">Executive Summary</p>
            <h3 className="m-0 font-display text-xl font-semibold text-white">Business operating view</h3>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
          <Info label="Business ID" value={business.businessId} />
          <Info label="Status" value={business.status} />
          <Info label="Health" value={business.health} />
          <Info label="Priority" value={business.priority} />
          <Info label="Portfolio" value={business.portfolioType} />
          <Info label="Created" value={formatDate(business.createdAt)} />
          <Info label="Updated" value={formatDate(business.updatedAt)} />
        </div>
      </section>

      <BusinessLifecycle status={business.status} />

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <BusinessSection title="Metrics" eyebrow="Placeholder performance">
            <BusinessMetrics metrics={business.metrics} />
          </BusinessSection>

          <BusinessSection title="Departments" eyebrow="Operating structure">
            <Placeholder text="Department ownership will appear here as the business grows. Future sections can connect Money, Marketing, Operations, Development, and Approval workflows." />
          </BusinessSection>

          <BusinessSection title="Financials" eyebrow="Local-first finance">
            <Placeholder text="Financials are placeholder-only for Sprint 002. Future work can connect this business to the Money Department without adding external APIs." />
          </BusinessSection>

          <BusinessSection title="Tasks" eyebrow="Execution queue">
            <Placeholder text="Business-specific tasks will appear here in a later sprint. No automation or background work is executed from this module yet." />
          </BusinessSection>
        </div>

        <div className="space-y-6">
          <BusinessSection title="Lifecycle Control" eyebrow="Manual status">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Current Status</span>
              <select value={business.status} onChange={(event) => businessStore.setStatus(business.id, event.target.value as BusinessStatus)} className="field">
                {businessStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>
            <p className="m-0 mt-3 text-xs leading-5 text-muted">
              Status changes are local record updates only. They do not trigger automation or execution.
            </p>
          </BusinessSection>

          <BusinessSection title="Timeline" eyebrow="Local history">
            <div className="space-y-3">
              {business.activity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 rounded-xl border border-line bg-ink/35 p-3">
                  <div className="mt-0.5 grid h-7 w-7 place-items-center rounded-full bg-mint text-ink">
                    <Check size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="m-0 text-sm font-semibold text-white">{activity.message}</p>
                      <span className="text-[11px] text-muted">{formatDate(activity.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </BusinessSection>

          <BusinessSection title="Notes" eyebrow="CEO context">
            {business.notes ? (
              <p className="m-0 whitespace-pre-wrap text-sm leading-6 text-[#dce7df]">{business.notes}</p>
            ) : (
              <p className="m-0 text-sm leading-6 text-muted">No notes recorded yet.</p>
            )}
          </BusinessSection>
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
      <p className="m-0 text-sm leading-6 text-[#aeb8b3]">{text}</p>
    </div>
  )
}

