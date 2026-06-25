import {
  calculateMetrics,
  formatCurrency,
  OperatingState,
} from '@/src/services/operatingStore'
import { getImportantRecentMemories, MemoryEntry } from '@/src/core/memory'

export type DailyBriefing = {
  greeting: string
  date: string
  revenueToday: number
  revenueThisMonth: number
  expensesThisMonth: number
  profit: number
  profitMargin: number
  pendingApprovals: number
  sprintProgress: number
  topPriorities: string[]
  risks: string[]
  recommendations: string[]
  recentMemory: string[]
  executiveSignal: string
  generatedAt: string
  sourceFingerprint: string
}

export type BriefingContext = {
  state: OperatingState
  memories: MemoryEntry[]
  storageAvailable: boolean
  now?: Date
}

function fingerprint(state: OperatingState, memories: MemoryEntry[]) {
  return JSON.stringify({
    revenue: state.revenueEntries.map(({ id, amount, date, updatedAt }) => [id, amount, date, updatedAt]),
    expenses: state.expenseEntries.map(({ id, amount, date, updatedAt }) => [id, amount, date, updatedAt]),
    approvals: state.approvals.map(({ id, status, resolvedAt }) => [id, status, resolvedAt]),
    tasks: state.tasks.map(({ id, status, sprint, completedAt }) => [id, status, sprint, completedAt]),
    memory: memories.map(({ id, updatedAt, pinned, archived }) => [id, updatedAt, pinned, archived]),
    settings: state.settings,
  })
}

function greetingFor(date: Date, ownerName: string) {
  const hour = date.getHours()
  const salutation = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  return `${salutation}${ownerName ? `, ${ownerName}` : ''}.`
}

function buildPriorities(state: OperatingState, memories: MemoryEntry[]) {
  const pendingApprovals = state.approvals
    .filter((approval) => approval.status === 'pending')
    .slice(0, 3)
    .map((approval) => `Review approval: ${approval.title}`)
  const sprintTasks = state.tasks
    .filter((task) => task.sprint && task.status !== 'done')
    .sort((a, b) => {
      const order = { review: 0, 'in-progress': 1, backlog: 2, done: 3 }
      return order[a.status] - order[b.status]
    })
    .slice(0, 3)
    .map((task) => `Advance sprint task: ${task.title}`)
  const recentMemory = getImportantRecentMemories(memories, 1)
    .slice(0, 1)
    .map((entry) => `Apply recent ${entry.type.toLowerCase()} memory: ${entry.title}`)

  const priorities = [...pendingApprovals, ...sprintTasks, ...recentMemory].slice(0, 5)
  return priorities.length > 0 ? priorities : ['No urgent priorities are recorded.']
}

function buildRisks(
  state: OperatingState,
  storageAvailable: boolean,
  monthlyRevenue: number,
  monthlyCost: number,
  profit: number,
) {
  const risks: string[] = []
  if (!storageAvailable) risks.push('Local storage is unavailable, so new operating data may not persist.')
  if (monthlyRevenue === 0 && monthlyCost === 0) {
    risks.push('Financial data has not been entered yet.')
  } else if (monthlyRevenue === 0 && monthlyCost > 0) {
    risks.push('Expenses are recorded this month without any recorded revenue.')
  } else if (profit < 0) {
    risks.push(`The business is operating at a ${formatCurrency(Math.abs(profit))} monthly loss.`)
  }
  const pending = state.approvals.filter((approval) => approval.status === 'pending').length
  if (pending >= 3) risks.push(`${pending} approvals are waiting and may be slowing execution.`)
  const sprintTasks = state.tasks.filter((task) => task.sprint)
  if (sprintTasks.length > 0 && sprintTasks.every((task) => task.status !== 'done')) {
    risks.push('The current sprint has no completed tasks yet.')
  }
  return risks.length > 0 ? risks : ['No material risks are visible in the current local data.']
}

function buildRecommendations(state: OperatingState, profit: number, sprintProgress: number) {
  const recommendations: string[] = []
  const hasMoneyData = state.revenueEntries.length > 0 || state.expenseEntries.length > 0
  const pendingApprovals = state.approvals.filter((approval) => approval.status === 'pending').length
  const sprintTasks = state.tasks.filter((task) => task.sprint)

  if (!hasMoneyData) recommendations.push('Enter revenue and expenses to establish a financial baseline.')
  if (pendingApprovals > 0) recommendations.push('Clear the highest-impact approval before starting additional work.')
  if (sprintTasks.length === 0) {
    recommendations.push('Define the current sprint so execution progress can be measured.')
  } else if (sprintProgress < 100) {
    recommendations.push('Complete the current sprint before expanding the operating scope.')
  }
  if (hasMoneyData && profit < 0) recommendations.push('Review the largest expense categories and protect near-term cash flow.')
  if (recommendations.length === 0) recommendations.push('Maintain the current operating cadence and record new decisions as they occur.')
  return recommendations.slice(0, 4)
}

function buildExecutiveSignal(
  state: OperatingState,
  monthlyRevenue: number,
  monthlyCost: number,
  profit: number,
  sprintProgress: number,
  pendingApprovals: number,
) {
  const hasMoneyData = state.revenueEntries.length > 0 || state.expenseEntries.length > 0
  const hasSprintData = state.tasks.some((task) => task.sprint)
  const financialSentence = !hasMoneyData
    ? 'Financial data has not been entered yet.'
    : profit >= 0
      ? `Revenue is ${formatCurrency(monthlyRevenue)} this month against ${formatCurrency(monthlyCost)} in expenses, producing ${formatCurrency(profit)} in profit.`
      : `Expenses exceed revenue by ${formatCurrency(Math.abs(profit))} this month.`
  const approvalSentence = pendingApprovals === 0
    ? 'There are no pending approvals.'
    : `${pendingApprovals} approval${pendingApprovals === 1 ? '' : 's'} require CEO attention.`
  const sprintSentence = !hasSprintData
    ? 'Sprint data is not available yet.'
    : `The current sprint is ${sprintProgress}% complete.`
  const nextMove = pendingApprovals > 0
    ? 'The strongest next move is to clear the approval queue and protect execution flow.'
    : hasSprintData && sprintProgress < 100
      ? 'The strongest next move is to complete the current sprint before expanding automation.'
      : hasMoneyData
        ? 'The strongest next move is to maintain financial discipline and record the next operating priority.'
        : 'The strongest next move is to enter the first financial and sprint records.'

  return `${financialSentence} ${approvalSentence} ${sprintSentence} ${nextMove}`
}

export function generateDailyBriefing({
  state,
  memories,
  storageAvailable,
  now = new Date(),
}: BriefingContext): DailyBriefing {
  const metrics = calculateMetrics(state, now)
  const briefing: DailyBriefing = {
    greeting: greetingFor(now, state.settings.ownerName),
    date: now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }),
    revenueToday: metrics.revenueToday,
    revenueThisMonth: metrics.monthlyRevenue,
    expensesThisMonth: metrics.monthlyCost,
    profit: metrics.profit,
    profitMargin: metrics.profitMargin,
    pendingApprovals: metrics.pendingApprovalCount,
    sprintProgress: metrics.sprintProgress,
    topPriorities: buildPriorities(state, memories),
    risks: buildRisks(
      state,
      storageAvailable,
      metrics.monthlyRevenue,
      metrics.monthlyCost,
      metrics.profit,
    ),
    recommendations: buildRecommendations(state, metrics.profit, metrics.sprintProgress),
    recentMemory: getImportantRecentMemories(memories, 5).map((entry) => (
      `${entry.relatedIssue ? `${entry.relatedIssue} ` : ''}${entry.title}`
    )),
    executiveSignal: buildExecutiveSignal(
      state,
      metrics.monthlyRevenue,
      metrics.monthlyCost,
      metrics.profit,
      metrics.sprintProgress,
      metrics.pendingApprovalCount,
    ),
    generatedAt: now.toISOString(),
    sourceFingerprint: fingerprint(state, memories),
  }
  validateDailyBriefing(briefing)
  return briefing
}

export function validateDailyBriefing(briefing: DailyBriefing) {
  const numericFields = [
    briefing.revenueToday,
    briefing.revenueThisMonth,
    briefing.expensesThisMonth,
    briefing.profit,
    briefing.profitMargin,
    briefing.pendingApprovals,
    briefing.sprintProgress,
  ]
  if (numericFields.some((value) => !Number.isFinite(value))) {
    throw new Error('Daily briefing contains an invalid numeric value.')
  }
  if (!briefing.executiveSignal || !briefing.generatedAt || !briefing.sourceFingerprint) {
    throw new Error('Daily briefing is missing required executive content.')
  }
  return true
}
