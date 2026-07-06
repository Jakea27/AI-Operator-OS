import { X } from 'lucide-react'
import { Approval } from '../types/approvalTypes'

export function ApprovalDetailPanel({
  approval,
  onClose,
}: {
  approval: Approval
  onClose: () => void
}) {
  return (
    <section className="panel p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Approval Detail View</p>
          <h2 className="m-0 text-2xl font-semibold text-white">{approval.title}</h2>
          <p className="mb-0 mt-2 text-sm leading-6 text-muted">Linked recommendation: {approval.recommendationId || 'None'} · Related issue: {approval.relatedIssue || 'None'}</p>
        </div>
        <button onClick={onClose} className="rounded-xl border border-line p-2 text-muted hover:border-red-400/40 hover:text-red-300" type="button" aria-label="Close details"><X size={16} /></button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {approval.sourceQueueCode ? <Info label="Queue Item" value={approval.sourceQueueCode} /> : null}
        {approval.sourceWorkItemId ? <Info label="Source Work Item" value={approval.relatedIssue || approval.sourceWorkItemId} /> : null}
        {approval.sourceProjectId ? <Info label="Source Project" value={approval.sourceProjectId} /> : null}
        {approval.sourceBusinessId ? <Info label="Source Business" value={approval.sourceBusinessId} /> : null}
        <Info label="Operator" value={approval.operator} />
        <Info label="Department" value={approval.department} />
        <Info label="Risk" value={approval.risk} />
        <Info label="Effort" value={approval.effort} />
      </div>

      <div className="mt-5 grid gap-4">
        <TextBlock label="Full Recommendation Context" value={approval.description} />
        <TextBlock label="Business Value" value={approval.businessValue || 'No business value recorded.'} />
        <TextBlock label="Recommended Next Action" value={approval.recommendedNextAction || 'No next action recorded.'} />
        <div>
          <p className="eyebrow mb-2">Supporting Evidence</p>
          {approval.supportingEvidence && approval.supportingEvidence.length > 0 ? (
            <ul className="m-0 space-y-1 pl-4 text-xs leading-5 text-muted">
              {approval.supportingEvidence.map((item) => <li key={item}>{item}</li>)}
            </ul>
          ) : (
            <p className="m-0 text-xs text-muted">No supporting evidence recorded.</p>
          )}
        </div>
      </div>

      <div className="mt-5 border-t border-line pt-5">
        <p className="eyebrow mb-3">Full Decision History</p>
        {approval.decisionHistory.length === 0 ? (
          <p className="m-0 text-xs text-muted">No decision history yet.</p>
        ) : (
          <div className="space-y-2">
            {approval.decisionHistory.map((item) => (
              <div key={item.id} className="rounded-xl border border-line bg-ink/35 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="m-0 text-sm font-semibold text-white">{item.action}</p>
                  <span className="text-[10px] uppercase tracking-[0.12em] text-muted">{new Date(item.createdAt).toLocaleString()}</span>
                </div>
                <p className="mb-0 mt-1 text-xs text-muted">Actor: {item.actor}</p>
                {item.note && <p className="mb-0 mt-2 text-xs leading-5 text-[#c3cbc7]">{item.note}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-white/[0.025] p-3">
      <p className="eyebrow mb-1">{label}</p>
      <p className="m-0 font-semibold text-white">{value}</p>
    </div>
  )
}

function TextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="eyebrow mb-2">{label}</p>
      <p className="m-0 whitespace-pre-wrap text-sm leading-6 text-[#c3cbc7]">{value}</p>
    </div>
  )
}
