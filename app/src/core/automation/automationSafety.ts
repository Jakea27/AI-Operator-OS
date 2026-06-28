import { AutomationInput, AutomationRecord, AutomationRisk, AutomationType } from './automationTypes'

const approvalKeywords = [
  'spend',
  'purchase',
  'buy',
  'budget',
  'ad spend',
  'publish',
  'post',
  'upload',
  'contact',
  'email',
  'message',
  'lead',
  'customer',
  'price',
  'pricing',
  'discount',
  'connect',
  'integration',
  'external',
  'delete',
  'remove data',
  'launch',
  'store',
  'product',
  'deliverable',
  'client',
  'workflow',
  'fulfillment',
]

const highRiskTypes: AutomationType[] = ['Content', 'Money', 'Store', 'Product', 'Marketing', 'Approval']

export function determineApprovalRequirement(input: Pick<AutomationInput | AutomationRecord, 'title' | 'description' | 'type' | 'category' | 'risk'>) {
  const text = `${input.title} ${input.description} ${input.type ?? ''} ${input.category ?? ''}`.toLowerCase()
  const keywordMatch = approvalKeywords.some((keyword) => text.includes(keyword))
  const typeMatch = input.type ? highRiskTypes.includes(input.type) : false
  const riskMatch = input.risk === 'High' || input.risk === 'Critical'
  return keywordMatch || typeMatch || riskMatch
}

export function classifyAutomationRisk(input: Pick<AutomationInput | AutomationRecord, 'title' | 'description' | 'type' | 'category' | 'risk'>): AutomationRisk {
  if (input.risk) return input.risk

  const text = `${input.title} ${input.description} ${input.type ?? ''} ${input.category ?? ''}`.toLowerCase()

  if (['delete', 'launch', 'spend', 'purchase', 'client deliverable', 'external workflow'].some((keyword) => text.includes(keyword))) return 'Critical'
  if (['publish', 'contact', 'price', 'pricing', 'store', 'product', 'customer'].some((keyword) => text.includes(keyword))) return 'High'
  if (['marketing', 'approval', 'roadmap', 'operations', 'content'].some((keyword) => text.includes(keyword))) return 'Medium'
  return 'Low'
}

export function enforceAutomationSafety<T extends AutomationInput>(input: T): T & { requiresCEOApproval: boolean; canAutoExecute: false; risk: AutomationRisk } {
  const risk = classifyAutomationRisk(input)
  return {
    ...input,
    risk,
    requiresCEOApproval: input.requiresCEOApproval ?? determineApprovalRequirement({ ...input, risk }),
    canAutoExecute: false,
  }
}

export function canAutomationRunWithoutApproval(automation: AutomationRecord) {
  return !automation.requiresCEOApproval && automation.status === 'Ready' && automation.canAutoExecute === true
}

