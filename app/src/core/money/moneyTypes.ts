import type { CostType, ExpenseEntry, RevenueEntry } from '@/src/services/operatingStore'

export type MoneyRecordType = 'revenue' | 'cost'
export type MoneyCostType = CostType

export type MoneyRevenueItem = RevenueEntry & {
  recordType: 'revenue'
}

export type MoneyCostItem = ExpenseEntry & {
  recordType: 'cost'
  costType: MoneyCostType
}

export type MoneyRevenueInput = Omit<RevenueEntry, 'id'>
export type MoneyCostInput = Omit<ExpenseEntry, 'id'> & {
  costType?: MoneyCostType
}

export type MoneyCurrentMonthTotals = {
  revenue: number
  costs: number
  monthlyRecurringCosts: number
  oneTimeCosts: number
  profit: number
}

export type MoneyMetrics = {
  revenueToday: number
  currentMonthRevenue: number
  currentMonthCosts: number
  monthlyRecurringCosts: number
  oneTimeCosts: number
  profit: number
  profitMargin: number
  currentMonthTotals: MoneyCurrentMonthTotals
}
