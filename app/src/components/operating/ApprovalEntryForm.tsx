import { FormEvent, useState } from 'react'
import { Plus } from 'lucide-react'
import { useOperatingStore } from '@/src/services/operatingStore'

export function ApprovalEntryForm() {
  const { addApproval } = useOperatingStore()
  const [form, setForm] = useState({ title: '', category: '', amount: '' })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!form.title.trim()) return
    addApproval({
      title: form.title.trim(),
      category: form.category.trim() || 'General',
      amount: form.amount ? Number(form.amount) : undefined,
    })
    setForm({ title: '', category: '', amount: '' })
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-[1fr_180px_140px_auto] gap-3 border-b border-line bg-white/[0.015] px-6 py-4">
      <input required className="field" placeholder="Approval request" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
      <input className="field" placeholder="Category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
      <input min="0" step="0.01" type="number" className="field" placeholder="Amount" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
      <button type="submit" className="btn-primary flex items-center gap-2"><Plus size={14} /> Add</button>
    </form>
  )
}
