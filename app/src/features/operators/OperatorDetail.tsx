import { ArrowLeft, Check, UserRound } from 'lucide-react'
import { ReactNode, useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import {
  WorkforceOperatorHealth,
  WorkforceOperatorRecord,
  WorkforceOperatorStatus,
  workforceOperatorHealthOptions,
  workforceOperatorStatuses,
  useWorkforceOperatorStore,
} from '@/src/core/operators'

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export function OperatorDetail() {
  const { operatorId } = useParams()
  const operatorStore = useWorkforceOperatorStore()
  const operator = operatorStore.operators.find((item) => item.id === operatorId)
  const [draft, setDraft] = useState<WorkforceOperatorRecord | undefined>(operator)

  useEffect(() => {
    setDraft(operator)
  }, [operator])

  if (!operator || !draft) {
    return <Navigate to="/operators" replace />
  }

  function save(operatorRecord: WorkforceOperatorRecord, draftRecord: WorkforceOperatorRecord) {
    operatorStore.updateOperator(operatorRecord.id, {
      name: draftRecord.name,
      role: draftRecord.role,
      status: draftRecord.status,
      health: draftRecord.health,
      primarySkill: draftRecord.primarySkill,
      currentAssignment: draftRecord.currentAssignment,
      notes: draftRecord.notes,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/operators" className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-white">
          <ArrowLeft size={15} /> Back to Operators
        </Link>
        <p className="eyebrow mb-2">Operator Detail · {operator.operatorId}</p>
        <h2 className="m-0 font-display text-3xl font-semibold tracking-tight text-white">{operator.name}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#8f9b95]">{operator.role}</p>
      </div>

      <section className="panel border-lime/20 bg-gradient-to-br from-lime/[0.07] to-white/[0.025] p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-lime/10 text-lime">
            <UserRound size={18} />
          </div>
          <div>
            <p className="eyebrow mb-1">Executive Summary</p>
            <h3 className="m-0 font-display text-xl font-semibold text-white">Workforce operator record</h3>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <Info label="Operator ID" value={operator.operatorId} />
          <Info label="Business" value={operator.businessCode} />
          <Info label="Department" value={operator.departmentName} />
          <Info label="Manager" value={operator.assignedManagerName} />
          <Info label="Status" value={operator.status} />
          <Info label="Health" value={operator.health} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Section title="Identity" eyebrow="Editable record">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Name</span>
                <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="field" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Role</span>
                <input value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value })} className="field" />
              </label>
              <Info label="Business" value={`${operator.businessCode} · ${operator.businessName}`} />
              <Info label="Department" value={`${operator.departmentCode} · ${operator.departmentName}`} />
              <Info label="Assigned Manager" value={operator.assignedManagerName} />
              <Info label="Created" value={formatDate(operator.createdAt)} />
            </div>
          </Section>

          <Section title="Status and Health" eyebrow="Editable">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Status</span>
                <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as WorkforceOperatorStatus })} className="field">
                  {workforceOperatorStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Health</span>
                <select value={draft.health} onChange={(event) => setDraft({ ...draft, health: event.target.value as WorkforceOperatorHealth })} className="field">
                  {workforceOperatorHealthOptions.map((health) => <option key={health} value={health}>{health}</option>)}
                </select>
              </label>
            </div>
          </Section>

          <Section title="Skills" eyebrow="Placeholder capability">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Primary Skill</span>
              <input value={draft.primarySkill} onChange={(event) => setDraft({ ...draft, primarySkill: event.target.value })} className="field" />
            </label>
          </Section>

          <Section title="Assignment" eyebrow="Current ownership">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Current Assignment</span>
              <input value={draft.currentAssignment} onChange={(event) => setDraft({ ...draft, currentAssignment: event.target.value })} className="field" />
            </label>
          </Section>

          <Section title="Notes" eyebrow="CEO context">
            <textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} className="field min-h-[120px]" />
            <button onClick={() => save(operator, draft)} className="btn-primary mt-4">Save Operator</button>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Timeline" eyebrow="Local history">
            <div className="space-y-3">
              {operator.timeline.map((item) => (
                <div key={item.id} className="flex items-start gap-3 rounded-xl border border-line bg-ink/35 p-3">
                  <div className="mt-0.5 grid h-7 w-7 place-items-center rounded-full bg-mint text-ink">
                    <Check size={14} />
                  </div>
                  <div>
                    <p className="m-0 text-sm font-semibold text-white">{item.message}</p>
                    <p className="m-0 mt-1 text-[11px] text-muted">{formatDate(item.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Placeholder Metrics" eyebrow="Future measurement">
            <Placeholder text={operator.placeholderMetrics} />
          </Section>

          <Section title="Placeholder Queue" eyebrow="Future queue">
            <Placeholder text={operator.placeholderQueue} />
          </Section>
        </div>
      </div>
    </div>
  )
}

function Section({ title, eyebrow, children }: { title: string; eyebrow: string; children: ReactNode }) {
  return (
    <section className="panel p-5">
      <p className="eyebrow mb-2">{eyebrow}</p>
      <h3 className="m-0 font-display text-lg font-semibold text-white">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
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
