import { AutomationInput, AutomationRecord, AutomationStats, automationRisks, automationStatuses, automationTypes } from './automationTypes'
import { automationStore } from './automationStore'
import { classifyAutomationRisk, determineApprovalRequirement, enforceAutomationSafety } from './automationSafety'

export function createDraftAutomation(input: AutomationInput) {
  return automationStore.createAutomation({
    ...input,
    status: 'Draft',
    canAutoExecute: false,
  })
}

export function queueAutomation(automationIdOrInput: string | AutomationInput) {
  if (typeof automationIdOrInput === 'string') {
    const automation = automationStore.getAutomationById(automationIdOrInput)
    if (!automation) return undefined
    if (automation.requiresCEOApproval) return automationStore.markNeedsApproval(automation.id)
    return automationStore.queueAutomation(automation.id)
  }

  const safe = enforceAutomationSafety(automationIdOrInput)
  const automation = automationStore.createAutomation({
    ...safe,
    status: safe.requiresCEOApproval ? 'Needs Approval' : 'Queued',
  })
  return automation
}

export { classifyAutomationRisk, determineApprovalRequirement }

export function generateAutomationSummary(automation: AutomationRecord) {
  const approval = automation.requiresCEOApproval
    ? 'CEO approval is required before any execution workflow.'
    : 'CEO approval is not currently required, but auto-execution remains disabled.'

  return `${automation.title} is a ${automation.risk.toLowerCase()}-risk ${automation.type.toLowerCase()} automation in ${automation.category}. Status: ${automation.status}. ${approval}`
}

export function getAutomationStats(automations: AutomationRecord[]): AutomationStats {
  const byRisk = Object.fromEntries(automationRisks.map((risk) => [risk, 0])) as AutomationStats['byRisk']
  const byType = Object.fromEntries(automationTypes.map((type) => [type, 0])) as AutomationStats['byType']

  for (const automation of automations) {
    byRisk[automation.risk] += 1
    byType[automation.type] += 1
  }

  return {
    total: automations.length,
    draft: automations.filter((automation) => automation.status === 'Draft').length,
    queued: automations.filter((automation) => automation.status === 'Queued').length,
    needsApproval: automations.filter((automation) => automation.status === 'Needs Approval').length,
    approved: automations.filter((automation) => automation.status === 'Approved').length,
    ready: automations.filter((automation) => automation.status === 'Ready').length,
    running: automations.filter((automation) => automation.status === 'Running').length,
    completed: automations.filter((automation) => automation.status === 'Completed').length,
    failed: automations.filter((automation) => automation.status === 'Failed').length,
    blocked: automations.filter((automation) => automation.status === 'Blocked').length,
    archived: automations.filter((automation) => automation.status === 'Archived').length,
    requiresCEOApproval: automations.filter((automation) => automation.requiresCEOApproval).length,
    canAutoExecute: automations.filter((automation) => automation.canAutoExecute).length,
    byRisk,
    byType,
  }
}

export function getAutomationLifecycleSummary(automation: AutomationRecord) {
  const statusIndex = automationStatuses.indexOf(automation.status)
  return {
    status: automation.status,
    statusIndex,
    isTerminal: automation.status === 'Completed' || automation.status === 'Failed' || automation.status === 'Archived',
    isBlocked: automation.status === 'Blocked',
    waitingOnApproval: automation.status === 'Needs Approval',
    canExecuteNow: false,
  }
}

