import { Eye } from 'lucide-react'
import { Approval } from '../types/approvalTypes'

const priorityClass = {
  Critical: 'border-red-400/30 bg-red-400/10 text-red-300',
  High: 'border-orange-400/30 bg-orange-400/10 text-orange-300',
  Medium: 'border-lime/30 bg-lime/10 text-lime',
  Low: 'border-white/10 bg-white/[0.05] text-muted',
}

const riskClass = {
  High: 'text-red-300',
  Medium: 'text-orange-300',
  Low: 'text-mint',
}

export function ApprovalCard({ approval }: { approval: Approval }) {
  return (
    <article className="rounded-2xl border border-line bg-ink/35 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-lime/20 bg-lime/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-lime">{approval.operator}</span>
            <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${priorityClass[approval.priority]}`}>{approval.priority}</span>
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">{approval.status}</span>
          </div>
          <h3 className="m-0 text-lg font-semibold text-white">{approval.title}</h3>
          <p className="mb-0 mt-2 text-sm leading-6 text-[#c3cbc7]">{approval.description}</p>
        </div>
        <button className="btn-secondary flex shrink-0 items-center gap-2" type="button"><Eye size={14} /> View Details</button>
      </div>

      <div className="mt-4 grid grid-cols-5 gap-3 text-xs">
        <Info label="Department" value={approval.department} />
        <Info label="Risk" value={approval.risk} className={riskClass[approval.risk]} />
        <Info label="Created" value={new Date(approval.created).toLocaleDateString()} />
        <Info label="Related Issue" value={approval.relatedIssue || 'None'} />
        <Info label="Submitted By" value={approval.submittedBy} />
      </div>
    </article>
  )
}

function Info({ label, value, className = 'text-white' }: { label: string; value: string; className?: string }) {
  return (
    <div className="rounded-xl border border-line bg-white/[0.025] p-3">
      <p className="eyebrow mb-1">{label}</p>
      <p className={`m-0 truncate font-semibold ${className}`}>{value}</p>
    </div>
  )
}
