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
  | 'Changes Requested'
  | 'Rejected'
  | 'Archived'

export type OpportunityActivityType =
  | 'Created'
  | 'Updated'
  | 'Stage Changed'
  | 'Approved'
  | 'Changes Requested'
  | 'Rejected'
  | 'Archived'

export type OpportunityActivity = {
  id: string
  type: OpportunityActivityType
  message: string
  createdAt: string
}

export type OpportunityRecord = {
  id: string
  name: string
  description: string
  businessCategory: string
  notes: string
  priority: OpportunityPriority
  stage: OpportunityStage
  decisionStatus: OpportunityDecisionStatus
  createdAt: string
  updatedAt: string
  activity: OpportunityActivity[]
}

export type OpportunityInput = {
  name: string
  description: string
  businessCategory: string
  notes: string
  priority?: OpportunityPriority
}

export type OpportunityFilters = {
  search: string
  stage: 'All' | OpportunityStage
  priority: 'All' | OpportunityPriority
  status: 'All' | OpportunityDecisionStatus
  sort: 'newest' | 'oldest' | 'updated' | 'priority'
}

