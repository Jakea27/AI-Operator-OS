import { FormEvent, useState } from 'react'
import { BusinessInput, BusinessPriority, BusinessStatus, businessPriorities, businessStatuses } from '@/src/core/businesses'

const initialForm: BusinessInput = {
  name: '',
  description: '',
  portfolioType: '',
  businessModel: '',
  status: 'Building',
  notes: '',
  priority: 'Medium',
}

export function BusinessForm({
  onCreate,
  onCancel,
}: {
  onCreate: (input: BusinessInput) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<BusinessInput>(initialForm)

  function submit(event: FormEvent) {
    event.preventDefault()
    onCreate(form)
    setForm(initialForm)
  }

  return (
    <form onSubmit={submit} className="panel mb-6 p-5">
      <div className="mb-5">
        <p className="eyebrow mb-1">New Business</p>
        <h3 className="m-0 font-display text-xl font-semibold text-white">Create an active business record.</h3>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-2 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Business Name</span>
          <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="field" placeholder="Example: Local AI lead-generation studio" />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Priority</span>
          <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as BusinessPriority })} className="field">
            {businessPriorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Portfolio Type</span>
          <input required value={form.portfolioType} onChange={(event) => setForm({ ...form, portfolioType: event.target.value })} className="field" placeholder="Content, SaaS, Ecommerce..." />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Business Model</span>
          <input required value={form.businessModel} onChange={(event) => setForm({ ...form, businessModel: event.target.value })} className="field" placeholder="Subscription, affiliate, services..." />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Status</span>
          <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as BusinessStatus })} className="field">
            {businessStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>
        <label className="space-y-2 md:col-span-3">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Description</span>
          <input required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="field" placeholder="What does this business do and why does it exist?" />
        </label>
        <label className="space-y-2 md:col-span-3">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Notes</span>
          <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="field min-h-[110px]" placeholder="Capture operating context, constraints, founder notes, or near-term focus." />
        </label>
      </div>
      <div className="mt-5 flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary">Save Business</button>
      </div>
    </form>
  )
}

