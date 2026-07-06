import { useState } from 'react'
import { Archive, Check, Clock3, Eye, RotateCcw, X } from 'lucide-react'
import { Approval, ApprovalStatus } from '../types/approvalTypes'

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

export function ApprovalCard({
  approval,
  onDecision,
  onViewDetails,
}: {
  approval: Approval
  onDecision: (status: ApprovalStatus, note: string) => void
  onViewDetails: () => void
}) {
  const [note, setNote] = useState('')
  const normalizedStatus = normalizeApprovalStatus(approval.status)
  const isPending = normalizedStatus === 'Pending'
  const isArchived = normalizedStatus === 'Archived'
  const hasCeoDecision = ['Approved', 'Rejected', 'Changes Requested', 'Deferred'].includes(normalizedStatus)
  const submitDecision = (status: ApprovalStatus) => {
    if (!isPending && normalizedStatus !== 'Draft' && status !== 'Archived') return
    if (isArchived) return
    onDecision(status, note.trim())
    setNote('')
  }

  return (
    <article className="rounded-2xl border border-line bg-ink/35 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-lime/20 bg-lime/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-lime">{approval.operator}</span>
            <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${priorityClass[approval.priority]}`}>{approval.priority}</span>
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">{normalizedStatus}</span>
          </div>
          <h3 className="m-0 text-lg font-semibold text-white">{approval.title}</h3>
          <p className="mb-0 mt-2 text-sm leading-6 text-[#c3cbc7]">{approval.description}</p>
        </div>
        <button onClick={onViewDetails} className="btn-secondary flex shrink-0 items-center gap-2" type="button"><Eye size={14} /> View Details</button>
      </div>

      <div className="mt-4 grid grid-cols-6 gap-3 text-xs">
        {approval.sourceQueueCode ? <Info label="Queue Item" value={approval.sourceQueueCode} /> : null}
        {approval.sourceWorkItemId ? <Info label="Work Item" value={approval.relatedIssue || approval.sourceWorkItemId} /> : null}
        <Info label="Department" value={approval.department} />
        <Info label="Risk" value={approval.risk} className={riskClass[approval.risk]} />
        <Info label="Effort" value={approval.effort} />
        <Info label="Created" value={new Date(approval.created).toLocaleDateString()} />
        <Info label="Updated" value={new Date(approval.updated).toLocaleDateString()} />
        <Info label="Related Issue" value={approval.relatedIssue || 'None'} />
        <Info label="Submitted By" value={approval.submittedBy} />
      </div>

      <div className="mt-4 rounded-xl border border-line bg-white/[0.025] p-3">
        <p className="eyebrow mb-2">Decision History Preview</p>
        {approval.decisionHistory.length === 0 ? (
          <p className="m-0 text-xs text-muted">No decisions recorded yet.</p>
        ) : (
          <p className="m-0 text-xs leading-5 text-muted">
            {approval.decisionHistory[0].action} by {approval.decisionHistory[0].actor}
            {approval.decisionHistory[0].note ? ` — ${approval.decisionHistory[0].note}` : ''}
          </p>
        )}
      </div>

      <div className="mt-4 border-t border-line pt-4">
        {isPending && (
          <>
            <textarea
              className="field min-h-20 resize-y"
              placeholder="Optional CEO decision note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => submitDecision('Approved')} className="btn-secondary flex items-center gap-2" type="button"><Check size={14} /> Approve</button>
              <button onClick={() => submitDecision('Rejected')} className="rounded-lg border border-red-400/30 px-3 py-2 text-xs text-red-300 hover:border-red-400/70" type="button"><X size={14} className="mr-1 inline" /> Reject</button>
              <button onClick={() => submitDecision('Changes Requested')} className="btn-secondary flex items-center gap-2" type="button"><RotateCcw size={14} /> Request Changes</button>
              <button onClick={() => submitDecision('Deferred')} className="btn-secondary flex items-center gap-2" type="button"><Clock3 size={14} /> Defer</button>
              <button onClick={() => submitDecision('Archived')} className="rounded-lg border border-line px-3 py-2 text-xs text-muted hover:border-red-400/40 hover:text-red-300" type="button"><Archive size={14} className="mr-1 inline" /> Archive</button>
            </div>
          </>
        )}
        {hasCeoDecision && (
          <div className="flex flex-wrap items-center gap-3">
            <p className="m-0 rounded-xl border border-lime/20 bg-lime/[0.04] p-3 text-xs leading-5 text-lime">CEO decision recorded. Execution is not automated.</p>
            <button onClick={() => submitDecision('Archived')} className="rounded-lg border border-line px-3 py-2 text-xs text-muted hover:border-red-400/40 hover:text-red-300" type="button"><Archive size={14} className="mr-1 inline" /> Archive</button>
          </div>
        )}
        {isArchived && (
          <p className="m-0 rounded-xl border border-line bg-white/[0.025] p-3 text-xs leading-5 text-muted">Archived approval. Decision controls are hidden.</p>
        )}
      </div>
    </article>
  )
}

function normalizeApprovalStatus(status: ApprovalStatus | string): ApprovalStatus {
  const normalized = status.trim().toLowerCase()
  if (normalized === 'approved') return 'Approved'
  if (normalized === 'rejected') return 'Rejected'
  if (normalized === 'changes requested' || normalized === 'changes-requested') return 'Changes Requested'
  if (normalized === 'deferred') return 'Deferred'
  if (normalized === 'archived') return 'Archived'
  if (normalized === 'draft') return 'Draft'
  return 'Pending'
}

function Info({ label, value, className = 'text-white' }: { label: string; value: string; className?: string }) {
  return (
    <div className="rounded-xl border border-line bg-white/[0.025] p-3">
      <p className="eyebrow mb-1">{label}</p>
      <p className={`m-0 truncate font-semibold ${className}`}>{value}</p>
    </div>
  )
}
