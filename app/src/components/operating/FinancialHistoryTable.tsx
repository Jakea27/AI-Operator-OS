import { Pencil, Trash2 } from 'lucide-react'
import {
  ExpenseEntry,
  formatCurrency,
  RevenueEntry,
} from '@/src/services/operatingStore'

type FinancialHistoryTableProps =
  | {
      mode: 'revenue'
      entries: RevenueEntry[]
      onEdit: (entry: RevenueEntry) => void
      onDelete: (entry: RevenueEntry) => void
    }
  | {
      mode: 'expense'
      entries: ExpenseEntry[]
      onEdit: (entry: ExpenseEntry) => void
      onDelete: (entry: ExpenseEntry) => void
    }

export function FinancialHistoryTable(props: FinancialHistoryTableProps) {
  const isRevenue = props.mode === 'revenue'
  const entries = [...props.entries].sort(
    (a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt),
  )

  return (
    <section className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-6 py-5">
        <div>
          <p className="eyebrow mb-1">{isRevenue ? 'Revenue' : 'Expense'} History</p>
          <h3 className="m-0 text-lg font-semibold">{entries.length} recorded {entries.length === 1 ? 'entry' : 'entries'}</h3>
        </div>
        <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${isRevenue ? 'bg-mint/10 text-mint' : 'bg-[#ff9e8f]/10 text-[#ff9e8f]'}`}>
          {formatCurrency(entries.reduce((sum, entry) => sum + entry.amount, 0))}
        </span>
      </div>
      {entries.length === 0 ? (
        <div className="px-6 py-12 text-center text-xs text-muted">No {props.mode} entries yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-line text-[10px] uppercase tracking-[0.12em] text-muted">
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Business</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Notes</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-line last:border-0">
                  <td className="whitespace-nowrap px-6 py-4 text-xs text-muted">{new Date(`${entry.date}T12:00:00`).toLocaleDateString()}</td>
                  <td className="px-4 py-4 text-sm text-white">{entry.business}</td>
                  <td className="px-4 py-4"><span className="rounded-md bg-white/[0.05] px-2 py-1 text-[10px] text-[#aeb8b3]">{entry.category}</span></td>
                  <td className="max-w-64 truncate px-4 py-4 text-xs text-muted" title={entry.notes}>{entry.notes || '—'}</td>
                  <td className={`whitespace-nowrap px-4 py-4 text-right text-sm font-medium ${isRevenue ? 'text-mint' : 'text-[#ffb09f]'}`}>{isRevenue ? '+' : '-'}{formatCurrency(entry.amount)}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => props.onEdit(entry as never)} className="rounded-lg border border-line p-2 text-muted transition hover:text-white" aria-label={`Edit ${props.mode}`}><Pencil size={14} /></button>
                      <button type="button" onClick={() => props.onDelete(entry as never)} className="rounded-lg border border-line p-2 text-muted transition hover:border-[#ff9e8f]/50 hover:text-[#ff9e8f]" aria-label={`Delete ${props.mode}`}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
