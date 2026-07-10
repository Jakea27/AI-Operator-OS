import { ArrowLeft, Check, Cpu, Plus, Trash2 } from 'lucide-react'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import {
  CapabilityOperatorRequirement,
  CapabilityPermissionRequirement,
  CapabilityPlanRecord,
  CapabilityRequirement,
  CapabilityRequirementPriority,
  CapabilityToolRequirement,
  ProviderCandidate,
  capabilityCatalog,
  capabilityReadinessStatuses,
  operatorRoleCatalog,
  permissionCatalog,
  providerCatalog,
  useCapabilityPlanningStore,
} from '@/src/core/capabilityPlanning'
import { useExecutionQueueStore } from '@/src/core/executionQueue'
import { CapabilityReadinessSummary } from '../components/CapabilityReadinessSummary'

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export function CapabilityPlanDetailPage() {
  const { capabilityPlanId } = useParams()
  const capabilityPlanning = useCapabilityPlanningStore()
  const executionQueue = useExecutionQueueStore()
  const plan = capabilityPlanning.capabilityPlans.find((item) => item.id === capabilityPlanId || item.capabilityPlanId === capabilityPlanId)
  const queueItem = executionQueue.queueItems.find((item) => item.id === plan?.sourceQueueItemId)
  const [draft, setDraft] = useState<CapabilityPlanRecord | undefined>(plan)

  useEffect(() => {
    setDraft(plan)
  }, [plan])

  const capabilityOptions = useMemo(() => capabilityCatalog, [])
  const providerOptions = useMemo(() => providerCatalog, [])

  if (!plan || !draft) {
    return <Navigate to="/capability-planning" replace />
  }

  const activePlan = plan

  function save() {
    if (!draft) return
    capabilityPlanning.updateCapabilityPlan(activePlan.id, {
      readinessStatus: draft.readinessStatus,
      estimatedCost: draft.estimatedCost,
      estimatedRuntimeMinutes: draft.estimatedRuntimeMinutes,
      notes: draft.notes,
    })
  }

  function updatePlan(updates: Parameters<typeof capabilityPlanning.updateCapabilityPlan>[1]) {
    capabilityPlanning.updateCapabilityPlan(activePlan.id, updates)
  }

  function addCapability(name: string, priority: CapabilityRequirementPriority) {
    const item = capabilityOptions.find((option) => option.name === name)
    if (!item) return
    const next: CapabilityRequirement = { id: id('capability'), name: item.name, category: item.category, priority, notes: '' }
    updatePlan({ requiredCapabilities: [...activePlan.requiredCapabilities, next] })
  }

  function addProvider(name: string) {
    const item = providerOptions.find((option) => option.name === name)
    if (!item) return
    const next: ProviderCandidate = { id: id('provider'), name: item.name, category: item.category, notes: '' }
    updatePlan({ preferredProviders: [...activePlan.preferredProviders, next] })
  }

  function addTool(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    const next: CapabilityToolRequirement = { id: id('tool'), name: trimmed, category: 'Tool', notes: '' }
    updatePlan({ requiredTools: [...activePlan.requiredTools, next] })
  }

  function addPermission(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    const next: CapabilityPermissionRequirement = { id: id('permission'), name: trimmed, notes: '' }
    updatePlan({ requiredPermissions: [...activePlan.requiredPermissions, next] })
  }

  function addOperator(role: string) {
    const trimmed = role.trim()
    if (!trimmed) return
    const next: CapabilityOperatorRequirement = { id: id('operator-role'), role: trimmed, notes: '' }
    updatePlan({ requiredOperators: [...activePlan.requiredOperators, next] })
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/capability-planning" className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-white">
          <ArrowLeft size={15} /> Back to Capability Planning
        </Link>
        <p className="eyebrow mb-2">Capability Plan Detail · {plan.capabilityPlanId}</p>
        <h2 className="m-0 font-display text-3xl font-semibold tracking-tight text-white">{plan.workItemTitle}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#8f9b95]">
          Infrastructure planning for {plan.sourceQueueCode}. This plan does not execute work or connect to external providers.
        </p>
      </div>

      <section className="panel border-lime/20 bg-gradient-to-br from-lime/[0.07] to-white/[0.025] p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-lime/10 text-lime">
            <Cpu size={18} />
          </div>
          <div>
            <p className="eyebrow mb-1">Executive Summary</p>
            <h3 className="m-0 font-display text-xl font-semibold text-white">Required infrastructure before future execution</h3>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
          <Info label="Plan ID" value={plan.capabilityPlanId} />
          <Info label="Queue Item" value={plan.sourceQueueCode} />
          <Info label="Work Item" value={plan.sourceWorkItemId} />
          <Info label="Business" value={plan.sourceBusinessCode} />
          <Info label="Project" value={plan.sourceProjectCode} />
          <Info label="Estimated Cost" value={formatCurrency(plan.estimatedCost)} />
          <Info label="Runtime" value={`${plan.estimatedRuntimeMinutes} min`} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Section title="Plan Controls" eyebrow="Infrastructure readiness">
            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Readiness Status</span>
                <select value={draft.readinessStatus} onChange={(event) => setDraft({ ...draft, readinessStatus: event.target.value as CapabilityPlanRecord['readinessStatus'] })} className="field">
                  {capabilityReadinessStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Estimated Cost</span>
                <input type="number" min="0" step="0.01" value={draft.estimatedCost} onChange={(event) => setDraft({ ...draft, estimatedCost: Number(event.target.value) })} className="field" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Runtime Minutes</span>
                <input type="number" min="0" step="1" value={draft.estimatedRuntimeMinutes} onChange={(event) => setDraft({ ...draft, estimatedRuntimeMinutes: Number(event.target.value) })} className="field" />
              </label>
            </div>
            <button onClick={save} className="btn-primary mt-4">Save Plan Controls</button>
          </Section>

          <EditableCollection
            title="Required Capabilities"
            eyebrow="What the work needs"
            empty="No capabilities recorded yet."
            items={plan.requiredCapabilities}
            renderItem={(item) => `${item.name} · ${item.category} · ${item.priority}`}
            onRemove={(itemId) => updatePlan({ requiredCapabilities: plan.requiredCapabilities.filter((item) => item.id !== itemId) })}
          >
            <AddCapabilityForm onAdd={addCapability} />
          </EditableCollection>

          <EditableCollection
            title="Preferred Providers"
            eyebrow="Who could satisfy capabilities"
            empty="No provider candidates recorded yet."
            items={plan.preferredProviders}
            renderItem={(item) => `${item.name} · ${item.category}`}
            onRemove={(itemId) => updatePlan({ preferredProviders: plan.preferredProviders.filter((item) => item.id !== itemId) })}
          >
            <AddProviderForm onAdd={addProvider} />
          </EditableCollection>

          <EditableCollection
            title="Required Tools"
            eyebrow="Tools needed"
            empty="No tools recorded yet."
            items={plan.requiredTools}
            renderItem={(item) => `${item.name} · ${item.category}`}
            onRemove={(itemId) => updatePlan({ requiredTools: plan.requiredTools.filter((item) => item.id !== itemId) })}
          >
            <AddTextForm placeholder="Tool name" buttonLabel="Add Tool" onAdd={addTool} />
          </EditableCollection>

          <EditableCollection
            title="Required Permissions"
            eyebrow="Authority needed"
            empty="No permissions recorded yet."
            items={plan.requiredPermissions}
            renderItem={(item) => item.name}
            onRemove={(itemId) => updatePlan({ requiredPermissions: plan.requiredPermissions.filter((item) => item.id !== itemId) })}
          >
            <AddPermissionForm onAdd={addPermission} />
          </EditableCollection>

          <EditableCollection
            title="Required Operators"
            eyebrow="Planning references only"
            empty="No required operator roles recorded yet."
            items={plan.requiredOperators}
            renderItem={(item) => item.role}
            onRemove={(itemId) => updatePlan({ requiredOperators: plan.requiredOperators.filter((item) => item.id !== itemId) })}
          >
            <AddOperatorForm onAdd={addOperator} />
          </EditableCollection>

          <Section title="Notes" eyebrow="Planning notes">
            <textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} className="field min-h-[120px]" />
            <button onClick={save} className="btn-primary mt-4">Save Notes</button>
          </Section>
        </div>

        <div className="space-y-6">
          <CapabilityReadinessSummary plan={plan} />

          <Section title="Future Infrastructure Approval" eyebrow="Future sprint">
            <p className="m-0 text-sm leading-6 text-muted">
              A later sprint may send this capability plan to the Approval Queue for CEO approval. Sprint 009 does not create Approval Queue records, install tools, store credentials, or execute work.
            </p>
          </Section>

          <Section title="Source Context" eyebrow="Queue ownership">
            <div className="grid gap-3">
              <Info label="Queue Item" value={`${plan.sourceQueueCode} · ${plan.workItemTitle}`} />
              <Info label="Work Item" value={plan.sourceWorkItemId} />
              <Info label="Business" value={`${plan.sourceBusinessCode} · ${plan.businessName}`} />
              <Info label="Project" value={`${plan.sourceProjectCode} · ${plan.projectName}`} />
              {queueItem && <Link to={`/execution-queue/${queueItem.id}`} className="btn-primary inline-flex w-fit">Open Queue Item</Link>}
            </div>
          </Section>

          <Section title="Timeline" eyebrow="Local history">
            <div className="space-y-3">
              {plan.history.map((item) => (
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
      <p className="m-0 mt-2 text-sm font-semibold text-white">{value || 'Unassigned'}</p>
    </div>
  )
}

type CollectionItem = { id: string }

function EditableCollection<T extends CollectionItem>({
  title,
  eyebrow,
  empty,
  items,
  renderItem,
  onRemove,
  children,
}: {
  title: string
  eyebrow: string
  empty: string
  items: T[]
  renderItem: (item: T) => string
  onRemove: (itemId: string) => void
  children: ReactNode
}) {
  return (
    <Section title={title} eyebrow={eyebrow}>
      {children}
      <div className="mt-4 space-y-2">
        {items.length > 0 ? items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-ink/35 p-3">
            <p className="m-0 text-sm font-semibold text-white">{renderItem(item)}</p>
            <button onClick={() => onRemove(item.id)} className="rounded-lg border border-line px-2 py-2 text-muted hover:border-red-400/40 hover:text-red-300" aria-label="Remove item">
              <Trash2 size={14} />
            </button>
          </div>
        )) : (
          <p className="m-0 rounded-xl border border-dashed border-line bg-white/[0.02] p-4 text-sm text-muted">{empty}</p>
        )}
      </div>
    </Section>
  )
}

function AddCapabilityForm({ onAdd }: { onAdd: (name: string, priority: CapabilityRequirementPriority) => void }) {
  const [name, setName] = useState(capabilityCatalog[0]?.name ?? '')
  const [priority, setPriority] = useState<CapabilityRequirementPriority>('Required')
  return (
    <div className="grid gap-3 md:grid-cols-[1fr_160px_auto]">
      <select value={name} onChange={(event) => setName(event.target.value)} className="field">
        {capabilityCatalog.map((item) => <option key={item.name} value={item.name}>{item.name} · {item.category}</option>)}
      </select>
      <select value={priority} onChange={(event) => setPriority(event.target.value as CapabilityRequirementPriority)} className="field">
        <option value="Required">Required</option>
        <option value="Optional">Optional</option>
      </select>
      <button onClick={() => onAdd(name, priority)} className="btn-secondary inline-flex items-center gap-2"><Plus size={14} /> Add</button>
    </div>
  )
}

function AddProviderForm({ onAdd }: { onAdd: (name: string) => void }) {
  const [name, setName] = useState(providerCatalog[0]?.name ?? '')
  return (
    <div className="grid gap-3 md:grid-cols-[1fr_auto]">
      <select value={name} onChange={(event) => setName(event.target.value)} className="field">
        {providerCatalog.map((item) => <option key={item.name} value={item.name}>{item.name} · {item.category}</option>)}
      </select>
      <button onClick={() => onAdd(name)} className="btn-secondary inline-flex items-center gap-2"><Plus size={14} /> Add Provider</button>
    </div>
  )
}

function AddPermissionForm({ onAdd }: { onAdd: (name: string) => void }) {
  const [name, setName] = useState(permissionCatalog[0] ?? '')
  return (
    <div className="grid gap-3 md:grid-cols-[1fr_auto]">
      <select value={name} onChange={(event) => setName(event.target.value)} className="field">
        {permissionCatalog.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
      <button onClick={() => onAdd(name)} className="btn-secondary inline-flex items-center gap-2"><Plus size={14} /> Add Permission</button>
    </div>
  )
}

function AddOperatorForm({ onAdd }: { onAdd: (role: string) => void }) {
  const [role, setRole] = useState(operatorRoleCatalog[0] ?? '')
  return (
    <div className="grid gap-3 md:grid-cols-[1fr_auto]">
      <select value={role} onChange={(event) => setRole(event.target.value)} className="field">
        {operatorRoleCatalog.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
      <button onClick={() => onAdd(role)} className="btn-secondary inline-flex items-center gap-2"><Plus size={14} /> Add Operator Role</button>
    </div>
  )
}

function AddTextForm({ placeholder, buttonLabel, onAdd }: { placeholder: string; buttonLabel: string; onAdd: (value: string) => void }) {
  const [value, setValue] = useState('')
  return (
    <div className="grid gap-3 md:grid-cols-[1fr_auto]">
      <input value={value} onChange={(event) => setValue(event.target.value)} placeholder={placeholder} className="field" />
      <button
        onClick={() => {
          onAdd(value)
          setValue('')
        }}
        className="btn-secondary inline-flex items-center gap-2"
      >
        <Plus size={14} /> {buttonLabel}
      </button>
    </div>
  )
}
