import { OpportunityPriority, OpportunityStage } from './opportunityTypes'

export const opportunityStages: OpportunityStage[] = [
  'Idea',
  'Phase 1 Research',
  'CEO Review',
  'Phase 2 Blueprint',
  'Ready to Build',
  'Building',
  'Launching',
  'Operating',
  'Optimizing',
]

export const opportunityPriorities: OpportunityPriority[] = ['Low', 'Medium', 'High', 'Critical']

export function getStageIndex(stage: OpportunityStage) {
  return Math.max(0, opportunityStages.indexOf(stage))
}

export function getNextStage(stage: OpportunityStage) {
  const index = getStageIndex(stage)
  return opportunityStages[Math.min(opportunityStages.length - 1, index + 1)]
}

export function getPreviousStage(stage: OpportunityStage) {
  const index = getStageIndex(stage)
  return opportunityStages[Math.max(0, index - 1)]
}

export function getLifecycleProgress(stage: OpportunityStage) {
  const index = getStageIndex(stage)
  return Math.round((index / (opportunityStages.length - 1)) * 100)
}

