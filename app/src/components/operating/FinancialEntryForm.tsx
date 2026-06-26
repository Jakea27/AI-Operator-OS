import { FormEvent, useEffect, useMemo, useState } from 'react'
import { CircleDollarSign, ReceiptText, X } from 'lucide-react'
import { expenseCategories, revenueCategories } from '@/src/data/financeCategories'
import {
  CostType,
  ExpenseEntry,
  RevenueEntry,
  useOperatingStore,
} from '@/src/services/operatingStore'

type FinancialEntryFormProps =
  | {
      mode: 'revenue'
      entry?: RevenueEntry
      onClose: () => void
    }
  | {
      mode: 'expense'
      entry?: ExpenseEntry
      onClose: () => void
    }

const today = () => {
  const date = new Date()
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

export function FinancialEntryForm(props: FinancialEntryFormProps) {
  const {
    data,
    addRevenue,
    updateRevenue,
    addExpense,
    updateExpense,
  } = useOperatingStore()
  const editing = Boolean(props.entry)
  const categories = props.mode === 'revenue' ? revenueCategories : expenseCategories
  const businesses = useMemo(
    () =>
      Array.from(
        new Set(
          [
            data.settings.businessName,
            ...data.revenueEntries.map((entry) => entry.business),
            ...data.expenseEntries.map((entry) => entry.business),
          ].filter(Boolean),
        ),
      ).sort(),
    [data],
  )
  const [form, setForm] = useState<{
    amount: string
    date: string
    business: string
    category: string
    costType: CostType
    notes: string
  }>({
    amount: '',
    date: today(),
    business: data.settings.businessName || '',
    category: categories[0],
    costType: 'one-time',
    notes: '',
  })

  useEffect(() => {
    const entry = props.entry
    setForm(
      entry
        ? {
            amount: String(entry.amount),
            date: entry.date,
            business: entry.business,
            category: entry.category,
            costType: props.mode === 'expense' ? props.entry?.costType ?? 'one-time' : 'one-time',
            notes: entry.notes,
          }
        : {
            amount: '',
            date: today(),
            business: data.settings.businessName || '',
            category: categories[0],
            costType: 'one-time',
            notes: '',
          },
    )
  }, [props.entry, props.mode])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const amount = Number(form.amount)
    if (!Number.isFinite(amount) || amount <= 0) return
    const record = {
      amount,
      date: form.date,
      business: form.business.trim() || 'Unassigned',
      category: form.category,
      notes: form.notes.trim(),
    }

    if (props.mode === 'revenue') {
      if (props.entry) {
        updateRevenue(props.entry.id, record)
      } else {
        const timestamp = new Date().toISOString()
        addRevenue({ ...record, createdAt: timestamp, updatedAt: timestamp })
      }
    } else if (props.entry) {
      updateExpense(props.entry.id, { ...record, costType: form.costType })
    } else {
      const timestamp = new Date().toISOString()
      addExpense({ ...record, costType: form.costType, createdAt: timestamp, updatedAt: timestamp })
    }
    props.onClose()
  }

  const isRevenue = props.mode === 'revenue'
  const Icon = isRevenue ? CircleDollarSign : ReceiptText

  return (
    <section id="manual-entry" className="panel scroll-mt-24 p-6">
      <div className="mb-5 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`rounded-xl p-2.5 ${isRevenue ? 'bg-mint/10 text-mint' : 'bg-[#ff9e8f]/10 text-[#ff9e8f]'}`}>
            <Icon size={18} />
          </div>
          <div>
            <p className="eyebrow mb-1">{editing ? 'Edit record' : 'New record'}</p>
            <h3 className="m-0 text-lg font-semibold">{editing ? 'Update' : 'Add'} {props.mode}</h3>
          </div>
        </div>
        <button type="button" onClick={props.onClose} className="rounded-lg border border-line p-2 text-muted hover:text-white" aria-label="Close form">
          <X size={16} />
        </button>
      </div>

      <form onSubmit={submit}>
        <div className="grid grid-cols-4 gap-4">
          <label className="text-xs text-muted">
            Amount
            <input required min="0.01" step="0.01" type="number" className="field mt-2" placeholder="0.00" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
          </label>
          <label className="text-xs text-muted">
            Date
            <input required type="date" className="field mt-2" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          </label>
          <label className="text-xs text-muted">
            Category
            <select className="field mt-2" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
          <label className="text-xs text-muted">
            Business
            <input required list={`${props.mode}-businesses`} className="field mt-2" placeholder="Select or enter business" value={form.business} onChange={(event) => setForm({ ...form, business: event.target.value })} />
            <datalist id={`${props.mode}-businesses`}>
              {businesses.map((business) => <option key={business} value={business} />)}
            </datalist>
          </label>
          {!isRevenue && (
            <label className="text-xs text-muted">
              Cost Type
              <select className="field mt-2" value={form.costType} onChange={(event) => setForm({ ...form, costType: event.target.value as CostType })}>
                <option value="one-time">One-time cost</option>
                <option value="monthly-recurring">Monthly recurring cost</option>
              </select>
            </label>
          )}
          <label className="col-span-4 text-xs text-muted">
            Notes
            <textarea className="field mt-2 min-h-24 resize-y" placeholder={`Notes about this ${props.mode} entry`} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <button type="button" onClick={props.onClose} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary">{editing ? 'Save changes' : `Add ${props.mode}`}</button>
        </div>
      </form>
    </section>
  )
}
