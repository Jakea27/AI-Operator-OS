import { normalizeCostType } from '@/src/services/operatingStore'
import type { ExpenseEntry, MoneyBudget, RevenueEntry } from '@/src/services/operatingStore'
import { expenseCategories } from '@/src/data/financeCategories'
import type {
  MoneyActivityItem,
  MoneyBudgetProgress,
  MoneyBudgetStatus,
  MoneyBudgetSummary,
  MoneyCategoryBreakdownItem,
  MoneyCostItem,
  MoneyHealthSummary,
  MoneyMetrics,
  MoneyRevenueItem,
  RecurringCostItem,
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

export function buildBudgetProgress(
  budgets: MoneyBudget[],
  costItems: ExpenseEntry[],
  now = new Date(),
): MoneyBudgetProgress[] {
  const categories = [
    ...expenseCategories,
    ...budgets.map((budget) => budget.category),
    ...costItems.filter((entry) => sameMonth(entry.date, now)).map((entry) => entry.category),
  ]
  const uniqueCategories = Array.from(new Set(categories.filter(Boolean)))

  return uniqueCategories
    .map((category) => {
      const budget = budgets.find((item) => item.category === category)
      const amount = budget?.amount ?? 0
      const spent = costItems
        .filter((entry) => entry.category === category && sameMonth(entry.date, now))
        .reduce((sum, entry) => sum + entry.amount, 0)
      const percentageUsed = amount > 0 ? (spent / amount) * 100 : spent > 0 ? 100 : 0
      const status: MoneyBudgetStatus = percentageUsed >= 100 ? 'Over Budget' : percentageUsed >= 75 ? 'Watch' : 'Healthy'

      return {
        id: budget?.id ?? `budget-${category}`,
        category,
        amount,
        createdAt: budget?.createdAt ?? '',
        updatedAt: budget?.updatedAt ?? '',
        spent,
        remaining: Math.max(0, amount - spent),
        percentageUsed,
        status,
      }
    })
    .sort((a, b) => b.percentageUsed - a.percentageUsed || a.category.localeCompare(b.category))
}

export function calculateBudgetSummary(
  budgetProgress: MoneyBudgetProgress[],
  recurringMonthlyCostTotal: number,
): MoneyBudgetSummary {
  const totalBudget = budgetProgress.reduce((sum, budget) => sum + budget.amount, 0)
  const totalSpent = budgetProgress.reduce((sum, budget) => sum + budget.spent, 0)

  return {
    totalBudget,
    totalSpent,
    remainingBudget: Math.max(0, totalBudget - totalSpent),
    recurringMonthlyCostTotal,
  }
}

export function buildRecurringCostItems(costItems: ExpenseEntry[], now = new Date()): RecurringCostItem[] {
  return costItems
    .filter((entry) => normalizeCostType(entry.costType) === 'monthly-recurring')
    .map((entry) => {
      const nextBillingDate = getNextBillingDate(entry.date, now)
      return {
        ...toMoneyCostItem(entry),
        name: entry.notes || entry.category,
        nextBillingDate,
      }
    })
    .sort((a, b) => (a.nextBillingDate ?? '').localeCompare(b.nextBillingDate ?? '') || b.amount - a.amount)
}

function getNextBillingDate(sourceDate: string, now: Date) {
  const parsed = new Date(`${sourceDate}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return undefined
  const candidate = new Date(now.getFullYear(), now.getMonth(), parsed.getDate(), 12, 0, 0)
  if (candidate < new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0)) {
    candidate.setMonth(candidate.getMonth() + 1)
  }
  return localDate(candidate)
}
