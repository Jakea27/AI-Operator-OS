import { FormEvent, useState } from 'react'
import { OpportunityInput, OpportunityPriority, opportunityPriorities } from '@/src/core/opportunities'

const initialForm: OpportunityInput = {
  name: '',
  description: '',
  businessCategory: '',
  notes: '',
  priority: 'Medium',
}

export function OpportunityForm({
  onCreate,
  onCancel,
}: {
  onCreate: (input: OpportunityInput) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<OpportunityInput>(initialForm)

  function submit(event: FormEvent) {
    event.preventDefault()
    onCreate(form)
    setForm(initialForm)
  }

  return (
    <form onSubmit={submit} className="panel mb-6 p-5">
      <div className="mb-5">
        <p className="eyebrow mb-1">New Opportunity</p>
        <h3 className="m-0 font-display text-xl font-semibold text-white">Enter a business idea into the pipeline.</h3>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-2 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Opportunity Name</span>
          <input
            required
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            className="field"
            placeholder="Example: Local services lead-generation business"
          />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Priority</span>
          <select
            value={form.priority}
            onChange={(event) => setForm({ ...form, priority: event.target.value as OpportunityPriority })}
            className="field"
          >
            {opportunityPriorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Business Category</span>
          <input
            required
            value={form.businessCategory}
            onChange={(event) => setForm({ ...form, businessCategory: event.target.value })}
            className="field"
            placeholder="SaaS, Ecommerce, YouTube, Agency..."
          />
        </label>
        <label className="space-y-2 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Description</span>
          <input
            required
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            className="field"
            placeholder="What business outcome should this opportunity create?"
          />
        </label>
        <label className="space-y-2 md:col-span-3">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Notes</span>
          <textarea
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
            className="field min-h-[110px]"
            placeholder="Capture context, constraints, assumptions, or CEO concerns."
          />
        </label>
      </div>
      <div className="mt-5 flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary">Save Opportunity</button>
      </div>
    </form>
  )
}

