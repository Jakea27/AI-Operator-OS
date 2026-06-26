import { normalizeCostType } from '@/src/services/operatingStore'
import type { ExpenseEntry, RevenueEntry } from '@/src/services/operatingStore'
import type {
  MoneyActivityItem,
  MoneyCategoryBreakdownItem,
  MoneyCostItem,
  MoneyHealthSummary,
  MoneyMetrics,
  MoneyRevenueItem,
} from './moneyTypes'

function localDate(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

function sameMonth(date: string, reference: Date) {
  const parsed = new Date(`${date}T12:00:00`)
  return parsed.getFullYear() === reference.getFullYear() && parsed.getMonth() === reference.getMonth()
}

export function toMoneyRevenueItem(entry: RevenueEntry): MoneyRevenueItem {
  return {
    ...entry,
    recordType: 'revenue',
  }
}

export function toMoneyCostItem(entry: ExpenseEntry): MoneyCostItem {
  return {
    ...entry,
    recordType: 'cost',
    costType: normalizeCostType(entry.costType),
  }
}

export function calculateMoneyMetrics(
  revenueItems: RevenueEntry[],
  costItems: ExpenseEntry[],
  now = new Date(),
): MoneyMetrics {
  const today = localDate(now)
  const currentMonthRevenue = revenueItems
    .filter((entry) => sameMonth(entry.date, now))
    .reduce((sum, entry) => sum + entry.amount, 0)
  const currentMonthCostItems = costItems.filter((entry) => sameMonth(entry.date, now))
  const currentMonthCosts = currentMonthCostItems.reduce((sum, entry) => sum + entry.amount, 0)
  const monthlyRecurringCosts = currentMonthCostItems
    .filter((entry) => normalizeCostType(entry.costType) === 'monthly-recurring')
    .reduce((sum, entry) => sum + entry.amount, 0)
  const oneTimeCosts = currentMonthCostItems
    .filter((entry) => normalizeCostType(entry.costType) === 'one-time')
    .reduce((sum, entry) => sum + entry.amount, 0)
  const profit = currentMonthRevenue - currentMonthCosts

  return {
    revenueToday: revenueItems
      .filter((entry) => entry.date === today)
      .reduce((sum, entry) => sum + entry.amount, 0),
    currentMonthRevenue,
    currentMonthCosts,
    monthlyRecurringCosts,
    oneTimeCosts,
    profit,
    profitMargin: currentMonthRevenue > 0 ? (profit / currentMonthRevenue) * 100 : 0,
    currentMonthTotals: {
      revenue: currentMonthRevenue,
      costs: currentMonthCosts,
      monthlyRecurringCosts,
      oneTimeCosts,
      profit,
    },
  }
}

export function buildExpenseCategoryBreakdown(
  costItems: ExpenseEntry[],
  now = new Date(),
): MoneyCategoryBreakdownItem[] {
  const currentMonthItems = costItems.filter((entry) => sameMonth(entry.date, now))
  const categories = currentMonthItems.reduce<Record<string, MoneyCategoryBreakdownItem>>((grouped, entry) => {
    const category = entry.category || 'Uncategorized'
    const current = grouped[category] ?? { category, total: 0, count: 0 }
    grouped[category] = {
      ...current,
      total: current.total + entry.amount,
      count: current.count + 1,
    }
    return grouped
  }, {})

  return Object.values(categories).sort((a, b) => b.total - a.total || a.category.localeCompare(b.category))
}

export function buildRecentMoneyActivity(
  revenueItems: RevenueEntry[],
  costItems: ExpenseEntry[],
  limit = 8,
): MoneyActivityItem[] {
  return [
    ...revenueItems.map((entry) => ({
      id: entry.id,
      recordType: 'revenue' as const,
      amount: entry.amount,
      category: entry.category,
      date: entry.date,
      description: entry.notes || 'Revenue entry',
    })),
    ...costItems.map((entry) => ({
      id: entry.id,
      recordType: 'cost' as const,
      amount: entry.amount,
      category: entry.category,
      date: entry.date,
      description: entry.notes || 'Cost entry',
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit)
}

export function getMoneyHealthSummary(metrics: MoneyMetrics): MoneyHealthSummary {
  const status =
    metrics.profit > 0 && metrics.profitMargin >= 30
      ? 'Healthy'
      : metrics.profit > 0
        ? 'Stable'
        : 'Warning'

  return {
    netProfit: metrics.profit,
    recurringCostTotal: metrics.monthlyRecurringCosts,
    profitMargin: metrics.profitMargin,
    status,
  }
}
