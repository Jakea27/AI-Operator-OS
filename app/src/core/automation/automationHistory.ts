import { AutomationHistoryItem, AutomationRecord, AutomationStatus } from './automationTypes'

export function createAutomationId(prefix = 'automation') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function createAutomationHistoryItem(action: string, actor = 'AI Operator OS', note = '', createdAt = new Date().toISOString()): AutomationHistoryItem {
  return {
    id: createAutomationId('automation-history'),
    action,
    actor,
    note,
    createdAt,
  }
}

export function appendAutomationHistory(
  automation: AutomationRecord,
  action: string,
  actor = 'AI Operator OS',
  note = '',
  createdAt = new Date().toISOString(),
): AutomationRecord {
  const latest = automation.history[0]
  const duplicateLatest =
    latest?.action === action &&
    latest?.actor === actor &&
    latest?.note === note

  return {
    ...automation,
    updatedAt: duplicateLatest ? automation.updatedAt : createdAt,
    history: duplicateLatest
      ? automation.history
      : [createAutomationHistoryItem(action, actor, note, createdAt), ...automation.history],
  }
}

export function statusHistoryNote(status: AutomationStatus) {
  if (status === 'Draft') return 'Automation draft created.'
  if (status === 'Queued') return 'Automation queued for future review.'
  if (status === 'Needs Approval') return 'Automation requires CEO approval before execution.'
  if (status === 'Approved') return 'Automation approved by CEO. Execution is still not automatic.'
  if (status === 'Ready') return 'Automation marked ready for a future execution workflow.'
  if (status === 'Running') return 'Automation marked running locally. AO-007.1 does not execute external workflows.'
  if (status === 'Completed') return 'Automation marked completed locally.'
  if (status === 'Failed') return 'Automation marked failed locally.'
  if (status === 'Blocked') return 'Automation blocked pending new context or decision.'
  return 'Automation archived locally.'
}

