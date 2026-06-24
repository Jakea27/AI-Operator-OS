import { OperatingState } from '@/src/services/operatingStore'

const expenseColors = ['#c8f560', '#80e5bd', '#5e8274', '#49665b', '#344740', '#26332e']

export function buildMonthlyTrend(state: OperatingState, now = new Date()) {
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
    const revenue = state.revenueEntries
      .filter((entry) => {
        const parsed = new Date(`${entry.date}T12:00:00`)
        return parsed.getFullYear() === date.getFullYear() && parsed.getMonth() === date.getMonth()
      })
      .reduce((sum, entry) => sum + entry.amount, 0)
    const cost = state.expenseEntries
      .filter((entry) => {
        const parsed = new Date(`${entry.date}T12:00:00`)
        return parsed.getFullYear() === date.getFullYear() && parsed.getMonth() === date.getMonth()
      })
      .reduce((sum, entry) => sum + entry.amount, 0)

    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      revenue,
      profit: revenue - cost,
    }
  })
}

export function buildRevenueByBusiness(state: OperatingState, now = new Date()) {
  const totals = new Map<string, number>()
  state.revenueEntries.forEach((entry) => {
    const parsed = new Date(`${entry.date}T12:00:00`)
    if (parsed.getFullYear() === now.getFullYear() && parsed.getMonth() === now.getMonth()) {
      totals.set(entry.business || 'Unassigned', (totals.get(entry.business || 'Unassigned') ?? 0) + entry.amount)
    }
  })
  return Array.from(totals, ([business, revenue]) => ({ business, revenue })).sort(
    (a, b) => b.revenue - a.revenue,
  )
}

export function buildExpenseBreakdown(state: OperatingState, now = new Date()) {
  const totals = new Map<string, number>()
  state.expenseEntries.forEach((entry) => {
    const parsed = new Date(`${entry.date}T12:00:00`)
    if (parsed.getFullYear() === now.getFullYear() && parsed.getMonth() === now.getMonth()) {
      totals.set(entry.category || 'Other', (totals.get(entry.category || 'Other') ?? 0) + entry.amount)
    }
  })
  return Array.from(totals, ([name, value], index) => ({
    name,
    value,
    color: expenseColors[index % expenseColors.length],
  })).sort((a, b) => b.value - a.value)
}

export function buildApprovalActivity(state: OperatingState, now = new Date()) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now)
    date.setDate(now.getDate() - (6 - index))
    const key = date.toISOString().slice(0, 10)
    const resolved = state.approvals.filter((approval) => approval.resolvedAt?.slice(0, 10) === key)
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      approved: resolved.filter((approval) => approval.status === 'approved').length,
      rejected: resolved.filter((approval) => approval.status === 'rejected').length,
    }
  })
}
