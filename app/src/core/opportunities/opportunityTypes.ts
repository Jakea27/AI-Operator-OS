export type OpportunityStage =
  | 'Idea'
  | 'Phase 1 Research'
  | 'CEO Review'
  | 'Phase 2 Blueprint'
  | 'Ready to Build'
  | 'Building'
  | 'Launching'
  | 'Operating'
  | 'Optimizing'

export type OpportunityPriority = 'Low' | 'Medium' | 'High' | 'Critical'

export type OpportunityDecisionStatus =
  | 'Active'
  | 'Approved'
  | 'Converted'
  | 'Changes Requested'
  | 'Rejected'
  | 'Archived'

export type OpportunityActivityType =
  | 'Created'
  | 'Updated'
  | 'Stage Changed'
  | 'Approved'
  | 'Converted'
  | 'Changes Requested'
  | 'Rejected'
  | 'Archived'

export type OpportunityActivity = {
  id: string
  type: OpportunityActivityType
  message: string
  createdAt: string
}

export type OpportunityScore = {
  roi: string
  ceoTimeRequired: string
  automationPotential: string
  startupCost: string
  risk: string
  stageFit: string
}

export type OpportunityRecord = {
  id: string
  opportunityId: string
  name: string
  description: string
  businessCategory: string
  notes: string
  tags: string[]
  score: OpportunityScore
  priority: OpportunityPriority
  stage: OpportunityStage
  decisionStatus: OpportunityDecisionStatus
  convertedBusinessId?: string
  convertedBusinessCode?: string
  convertedAt?: string
  createdAt: string
  updatedAt: string
  activity: OpportunityActivity[]
}

export type OpportunityInput = {
  name: string
  description: string
  businessCategory: string
  notes: string
  tags?: string[]
  priority?: OpportunityPriority
}

export type OpportunityFilters = {
  search: string
  businessCategory: 'All' | string
  stage: 'All' | OpportunityStage
  priority: 'All' | OpportunityPriority
  tag: 'All' | string
  status: 'All' | OpportunityDecisionStatus
  sort: 'newest' | 'oldest' | 'updated' | 'priority'
}

export const defaultOpportunityScore: OpportunityScore = {
  roi: 'Pending',
  ceoTimeRequired: 'TBD',
  automationPotential: 'TBD',
  startupCost: 'TBD',
  risk: 'TBD',
  stageFit: 'Unscored',
}

export const opportunityTagSuggestions = [
  'Content',
  'Ecommerce',
  'Subscription',
  'Recurring',
  'Automation',
  'Low Cost',
  'High Priority',
]
