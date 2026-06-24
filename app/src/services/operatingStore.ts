import { useSyncExternalStore } from 'react'

export type RevenueEntry = {
  id: string
  amount: number
  date: string
  business: string
  description: string
}

export type ExpenseEntry = {
  id: string
  amount: number
  date: string
  category: string
  description: string
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export type ApprovalRecord = {
  id: string
  title: string
  category: string
  amount?: number
  status: ApprovalStatus
  createdAt: string
  resolvedAt?: string
}

export type ProjectStatus = 'planned' | 'active' | 'paused' | 'complete'

export type ProjectRecord = {
  id: string
  name: string
  status: ProjectStatus
  createdAt: string
}

export type TaskStatus = 'backlog' | 'in-progress' | 'review' | 'done'

export type TaskRecord = {
  id: string
  title: string
  projectId?: string
  status: TaskStatus
  sprint: boolean
  createdAt: string
  completedAt?: string
}

export type MemoryEntry = {
  id: string
  title: string
  body: string
  tag: string
  createdAt: string
}

export type WorkspaceSettings = {
  businessName: string
  ownerName: string
  dailyBriefing: boolean
}

export type OperatingState = {
  version: 1
  revenueEntries: RevenueEntry[]
  expenseEntries: ExpenseEntry[]
  approvals: ApprovalRecord[]
  projects: ProjectRecord[]
  tasks: TaskRecord[]
  memoryEntries: MemoryEntry[]
  settings: WorkspaceSettings
  sampleDataLoaded: boolean
}

export type OperatingMetrics = {
  revenueToday: number
  monthlyRevenue: number
  monthlyCost: number
  profit: number
  profitMargin: number
  pendingApprovalCount: number
  sprintCompleted: number
  sprintTotal: number
  sprintProgress: number
}

const STORAGE_KEY = 'ai-operator-os-operating-state-v1'

const emptyState: OperatingState = {
  version: 1,
  revenueEntries: [],
  expenseEntries: [],
  approvals: [],
  projects: [],
  tasks: [],
  memoryEntries: [],
  settings: {
    businessName: '',
    ownerName: '',
    dailyBriefing: true,
  },
  sampleDataLoaded: false,
}

const listeners = new Set<() => void>()

function readState(): OperatingState {
  if (typeof window === 'undefined') return emptyState
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored ? { ...emptyState, ...JSON.parse(stored) } : emptyState
  } catch {
    return emptyState
  }
}

let state = readState()

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return
    state = readState()
    listeners.forEach((listener) => listener())
  })
}

function persist(next: OperatingState) {
  state = next
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } finally {
    listeners.forEach((listener) => listener())
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return state
}

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function localDate(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

function sameMonth(date: string, reference: Date) {
  const parsed = new Date(`${date}T12:00:00`)
  return parsed.getFullYear() === reference.getFullYear() && parsed.getMonth() === reference.getMonth()
}

export function calculateMetrics(source: OperatingState, now = new Date()): OperatingMetrics {
  const today = localDate(now)
  const revenueToday = source.revenueEntries
    .filter((entry) => entry.date === today)
    .reduce((sum, entry) => sum + entry.amount, 0)
  const monthlyRevenue = source.revenueEntries
    .filter((entry) => sameMonth(entry.date, now))
    .reduce((sum, entry) => sum + entry.amount, 0)
  const monthlyCost = source.expenseEntries
    .filter((entry) => sameMonth(entry.date, now))
    .reduce((sum, entry) => sum + entry.amount, 0)
  const profit = monthlyRevenue - monthlyCost
  const sprintTasks = source.tasks.filter((task) => task.sprint)
  const sprintCompleted = sprintTasks.filter((task) => task.status === 'done').length

  return {
    revenueToday,
    monthlyRevenue,
    monthlyCost,
    profit,
    profitMargin: monthlyRevenue > 0 ? (profit / monthlyRevenue) * 100 : 0,
    pendingApprovalCount: source.approvals.filter((approval) => approval.status === 'pending').length,
    sprintCompleted,
    sprintTotal: sprintTasks.length,
    sprintProgress: sprintTasks.length > 0 ? Math.round((sprintCompleted / sprintTasks.length) * 100) : 0,
  }
}

export function createCeoReport(metrics: OperatingMetrics) {
  if (
    metrics.monthlyRevenue === 0 &&
    metrics.monthlyCost === 0 &&
    metrics.sprintTotal === 0 &&
    metrics.pendingApprovalCount === 0
  ) {
    return 'No operating data has been recorded yet. Add revenue, expenses, sprint tasks, or approvals to generate an executive signal.'
  }

  const financialSignal =
    metrics.monthlyRevenue === 0
      ? `Costs are ${formatCurrency(metrics.monthlyCost)} this month with no recorded revenue.`
      : `Monthly revenue is ${formatCurrency(metrics.monthlyRevenue)}, producing ${formatCurrency(metrics.profit)} in profit at a ${metrics.profitMargin.toFixed(1)}% margin.`
  const sprintSignal =
    metrics.sprintTotal === 0
      ? 'No sprint tasks are currently defined.'
      : `The current sprint is ${metrics.sprintProgress}% complete (${metrics.sprintCompleted} of ${metrics.sprintTotal} tasks).`
  const approvalSignal =
    metrics.pendingApprovalCount === 0
      ? 'The approval queue is clear.'
      : `${metrics.pendingApprovalCount} approval${metrics.pendingApprovalCount === 1 ? '' : 's'} require CEO review.`

  return `${financialSignal} ${sprintSignal} ${approvalSignal}`
}

export function checkStorageHealth() {
  try {
    const key = `${STORAGE_KEY}-health`
    window.localStorage.setItem(key, 'ok')
    window.localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export const operatingStore = {
  updateSettings(patch: Partial<WorkspaceSettings>) {
    persist({ ...state, settings: { ...state.settings, ...patch } })
  },
  addRevenue(entry: Omit<RevenueEntry, 'id'>) {
    persist({ ...state, revenueEntries: [{ ...entry, id: id('rev') }, ...state.revenueEntries] })
  },
  addExpense(entry: Omit<ExpenseEntry, 'id'>) {
    persist({ ...state, expenseEntries: [{ ...entry, id: id('exp') }, ...state.expenseEntries] })
  },
  addApproval(entry: Omit<ApprovalRecord, 'id' | 'status' | 'createdAt'>) {
    persist({
      ...state,
      approvals: [
        { ...entry, id: id('approval'), status: 'pending', createdAt: new Date().toISOString() },
        ...state.approvals,
      ],
    })
  },
  resolveApproval(approvalId: string, status: Exclude<ApprovalStatus, 'pending'>) {
    persist({
      ...state,
      approvals: state.approvals.map((approval) =>
        approval.id === approvalId
          ? { ...approval, status, resolvedAt: new Date().toISOString() }
          : approval,
      ),
    })
  },
  addProject(entry: Omit<ProjectRecord, 'id' | 'createdAt'>) {
    persist({
      ...state,
      projects: [{ ...entry, id: id('project'), createdAt: new Date().toISOString() }, ...state.projects],
    })
  },
  addTask(entry: Omit<TaskRecord, 'id' | 'createdAt' | 'completedAt'>) {
    persist({
      ...state,
      tasks: [{ ...entry, id: id('task'), createdAt: new Date().toISOString() }, ...state.tasks],
    })
  },
  updateTaskStatus(taskId: string, status: TaskStatus) {
    persist({
      ...state,
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status,
              completedAt: status === 'done' ? new Date().toISOString() : undefined,
            }
          : task,
      ),
    })
  },
  addMemory(entry: Omit<MemoryEntry, 'id' | 'createdAt'>) {
    persist({
      ...state,
      memoryEntries: [
        { ...entry, id: id('memory'), createdAt: new Date().toISOString() },
        ...state.memoryEntries,
      ],
    })
  },
  clearOperatingData() {
    persist({ ...emptyState, settings: state.settings })
  },
  loadSampleData() {
    if (
      state.revenueEntries.length > 0 ||
      state.expenseEntries.length > 0 ||
      state.approvals.length > 0 ||
      state.projects.length > 0 ||
      state.tasks.length > 0 ||
      state.memoryEntries.length > 0
    ) {
      return
    }
    const now = new Date()
    const date = (daysAgo: number) => {
      const value = new Date(now)
      value.setDate(value.getDate() - daysAgo)
      return localDate(value)
    }
    persist({
      ...state,
      revenueEntries: [
        { id: id('sample-rev'), amount: 2400, date: date(0), business: 'Sample Studio', description: 'Sample client payment' },
        { id: id('sample-rev'), amount: 1800, date: date(4), business: 'Sample Studio', description: 'Sample subscription revenue' },
        { id: id('sample-rev'), amount: 950, date: date(12), business: 'Sample Advisory', description: 'Sample advisory session' },
      ],
      expenseEntries: [
        { id: id('sample-exp'), amount: 320, date: date(2), category: 'Software', description: 'Sample software expense' },
        { id: id('sample-exp'), amount: 600, date: date(8), category: 'Growth', description: 'Sample campaign expense' },
      ],
      approvals: [
        { id: id('sample-approval'), title: 'Sample campaign approval', category: 'Marketing', amount: 600, status: 'pending', createdAt: new Date().toISOString() },
      ],
      projects: [
        { id: 'sample-project', name: 'Sample launch project', status: 'active', createdAt: new Date().toISOString() },
      ],
      tasks: [
        { id: id('sample-task'), title: 'Review sample offer', projectId: 'sample-project', status: 'done', sprint: true, createdAt: new Date().toISOString(), completedAt: new Date().toISOString() },
        { id: id('sample-task'), title: 'Publish sample landing page', projectId: 'sample-project', status: 'in-progress', sprint: true, createdAt: new Date().toISOString() },
      ],
      memoryEntries: [
        { id: id('sample-memory'), title: 'Sample operating note', body: 'This entry was loaded from optional sample data.', tag: 'Sample', createdAt: new Date().toISOString() },
      ],
      sampleDataLoaded: true,
    })
  },
}

export function useOperatingStore() {
  const data = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const metrics = calculateMetrics(data)
  return {
    data,
    metrics,
    ceoReport: createCeoReport(metrics),
    storageAvailable: checkStorageHealth(),
    ...operatingStore,
  }
}
