import { FormEvent, useState } from 'react'
import { MinusCircle, PlusCircle } from 'lucide-react'
import { useOperatingStore } from '@/src/services/operatingStore'

const today = () => new Date().toISOString().slice(0, 10)

export function FinancialEntryForms() {
  const { addRevenue, addExpense, data } = useOperatingStore()
  const [revenue, setRevenue] = useState({ amount: '', date: today(), business: '', description: '' })
  const [expense, setExpense] = useState({ amount: '', date: today(), category: '', description: '' })

  const submitRevenue = (event: FormEvent) => {
    event.preventDefault()
    const amount = Number(revenue.amount)
    if (!amount || amount < 0) return
    addRevenue({
      amount,
      date: revenue.date,
      business: revenue.business || data.settings.businessName || 'Unassigned',
      description: revenue.description || 'Revenue entry',
    })
    setRevenue({ amount: '', date: today(), business: revenue.business, description: '' })
  }

  const submitExpense = (event: FormEvent) => {
    event.preventDefault()
    const amount = Number(expense.amount)
    if (!amount || amount < 0) return
    addExpense({
      amount,
      date: expense.date,
      category: expense.category || 'Other',
      description: expense.description || 'Expense entry',
    })
    setExpense({ amount: '', date: today(), category: expense.category, description: '' })
  }

  return (
    <section id="manual-entry" className="panel col-span-12 scroll-mt-24 p-6">
      <div className="mb-5">
        <p className="eyebrow mb-1">Manual Entry</p>
        <h3 className="m-0 text-lg font-semibold">Record operating activity</h3>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <form onSubmit={submitRevenue} className="rounded-xl border border-line bg-ink/35 p-4">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-mint">
            <PlusCircle size={16} /> Add revenue
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input required min="0.01" step="0.01" type="number" className="field" placeholder="Amount" value={revenue.amount} onChange={(event) => setRevenue({ ...revenue, amount: event.target.value })} />
            <input required type="date" className="field" value={revenue.date} onChange={(event) => setRevenue({ ...revenue, date: event.target.value })} />
            <input className="field" placeholder="Business" value={revenue.business} onChange={(event) => setRevenue({ ...revenue, business: event.target.value })} />
            <input className="field" placeholder="Description" value={revenue.description} onChange={(event) => setRevenue({ ...revenue, description: event.target.value })} />
          </div>
          <button className="btn-primary mt-3 w-full" type="submit">Save revenue</button>
        </form>
        <form onSubmit={submitExpense} className="rounded-xl border border-line bg-ink/35 p-4">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#ffb09f]">
            <MinusCircle size={16} /> Add expense
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input required min="0.01" step="0.01" type="number" className="field" placeholder="Amount" value={expense.amount} onChange={(event) => setExpense({ ...expense, amount: event.target.value })} />
            <input required type="date" className="field" value={expense.date} onChange={(event) => setExpense({ ...expense, date: event.target.value })} />
            <input className="field" placeholder="Category" value={expense.category} onChange={(event) => setExpense({ ...expense, category: event.target.value })} />
            <input className="field" placeholder="Description" value={expense.description} onChange={(event) => setExpense({ ...expense, description: event.target.value })} />
          </div>
          <button className="btn-secondary mt-3 w-full" type="submit">Save expense</button>
        </form>
      </div>
    </section>
  )
}
