export type BusinessStatus =
  | 'Building'
  | 'Launching'
  | 'Operating'
  | 'Optimizing'
  | 'Scaling'
  | 'Paused'
  | 'Archived'

export type BusinessPriority = 'Low' | 'Medium' | 'High' | 'Critical'

export type BusinessHealth = 'Healthy' | 'Stable' | 'Watch' | 'At Risk' | 'Unrated'

export type BusinessMetrics = {
  monthlyRevenue: string
  monthlyProfit: string
  ceoTimeRequired: string
  automationLevel: string
}

export type BusinessActivity = {
  id: string
  message: string
  createdAt: string
}

export type BusinessRecord = {
  id: string
  businessId: string
  name: string
  description: string
  portfolioType: string
  businessModel: string
  status: BusinessStatus
  health: BusinessHealth
  priority: BusinessPriority
  notes: string
  metrics: BusinessMetrics
  sourceOpportunityId?: string
  sourceOpportunityCode?: string
  sourceOpportunityName?: string
  createdAt: string
  updatedAt: string
  activity: BusinessActivity[]
}

export type BusinessInput = {
  name: string
  description: string
  portfolioType: string
  businessModel: string
  status: BusinessStatus
  notes: string
  priority: BusinessPriority
  sourceOpportunityId?: string
  sourceOpportunityCode?: string
  sourceOpportunityName?: string
}

export const defaultBusinessMetrics: BusinessMetrics = {
  monthlyRevenue: '$0',
  monthlyProfit: '$0',
  ceoTimeRequired: 'TBD',
  automationLevel: 'TBD',
}
