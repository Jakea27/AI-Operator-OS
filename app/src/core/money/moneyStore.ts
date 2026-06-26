import { calculateMoneyMetrics, toMoneyCostItem, toMoneyRevenueItem } from './moneyCalculations'
import type { MoneyCostInput, MoneyRevenueInput } from './moneyTypes'
import { normalizeCostType, useOperatingStore } from '@/src/services/operatingStore'

export function useMoneyStore() {
  const operating = useOperatingStore()
  const revenueItems = operating.data.revenueEntries.map(toMoneyRevenueItem)
  const costItems = operating.data.expenseEntries.map(toMoneyCostItem)
  const metrics = calculateMoneyMetrics(operating.data.revenueEntries, operating.data.expenseEntries)

  return {
    revenueItems,
    costItems,
    metrics,
    storageAvailable: operating.storageAvailable,
    addRevenueItem: (entry: MoneyRevenueInput) => operating.addRevenue(entry),
    updateRevenueItem: (entryId: string, patch: Omit<MoneyRevenueInput, 'createdAt' | 'updatedAt'>) =>
      operating.updateRevenue(entryId, patch),
    deleteRevenueItem: operating.deleteRevenue,
    addCostItem: (entry: MoneyCostInput) =>
      operating.addExpense({
        ...entry,
        costType: normalizeCostType(entry.costType),
      }),
    updateCostItem: (entryId: string, patch: Omit<MoneyCostInput, 'createdAt' | 'updatedAt'>) =>
      operating.updateExpense(entryId, {
        ...patch,
        costType: normalizeCostType(patch.costType),
      }),
    deleteCostItem: operating.deleteExpense,
  }
}
