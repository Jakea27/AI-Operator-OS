import { useLocalStorage } from './useLocalStorage'

export type Approval = {
  id: number
  title: string
  category: string
  amount?: string
}

export type OperatorData = {
  revenueToday: number
  monthlyRevenue: number
  monthlyCost: number
  sprintProgress: number
  ceoReport: string
  approvals: Approval[]
  businessName: string
  ownerName: string
  dailyBriefing: boolean
}

const defaults: OperatorData = {
  revenueToday: 2840,
  monthlyRevenue: 48620,
  monthlyCost: 12840,
  sprintProgress: 72,
  ceoReport:
    'Revenue is pacing 14% above plan. The strongest leverage this week is shipping the onboarding automation before expanding paid acquisition.',
  approvals: [
    { id: 1, title: 'Launch onboarding campaign', category: 'Marketing', amount: '$1,200' },
    { id: 2, title: 'Merge billing automation', category: 'Development' },
    { id: 3, title: 'Renew research workspace', category: 'Operations', amount: '$89/mo' },
  ],
  businessName: 'Operator Studio',
  ownerName: 'Owner',
  dailyBriefing: true,
}

export function useOperatorData() {
  const [data, setData] = useLocalStorage<OperatorData>('operator-os-data', defaults)

  const update = (patch: Partial<OperatorData>) => {
    setData((current) => ({ ...current, ...patch }))
  }

  const resolveApproval = (id: number) => {
    setData((current) => ({
      ...current,
      approvals: current.approvals.filter((approval) => approval.id !== id),
    }))
  }

  const reset = () => setData(defaults)

  return { data, update, resolveApproval, reset }
}
