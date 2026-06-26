import { useSyncExternalStore } from 'react'
import { ApprovalRecord, OperatingState } from '@/src/services/operatingStore'
import { operatorStore } from './operatorStore'
import { OperatorId, OperatorSharedContext, OperatorTask, OperatorTaskPriority } from './operatorTypes'

export type CoordinatorRequestType =
  | 'architecture'
  | 'finance'
  | 'marketing'
  | 'operations'
  | 'research'
  | 'development'
  | 'memory'
  | 'approval'
  | 'general'

export type CoordinatorRequest = {
  id?: string
  title: string
  details: string
  type: CoordinatorRequestType
  priority: OperatorTaskPriority
  createdAt?: string
}

export type CoordinatorRoute = {
  operatorId: OperatorId
  reason: string
  taskId: string
}

export type CoordinatorDecision = {
  id: string
  request: CoordinatorRequest
  classifiedType: CoordinatorRequestType
  routes: CoordinatorRoute[]
  summary: string
  risky: boolean
  approvalId?: string
  createdAt: string
}

export type CoordinatorHistoryItem = CoordinatorDecision

type CoordinatorState = {
  version: 1
  history: CoordinatorHistoryItem[]
}

const STORAGE_KEY = 'ai-operator-os-executive-coordinator-v1'
const emptyState: CoordinatorState = {
  version: 1,
  history: [],
}
const listeners = new Set<() => void>()

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function readState(): CoordinatorState {
  if (typeof window === 'undefined') return emptyState
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return emptyState
    const parsed = JSON.parse(stored) as Partial<CoordinatorState>
    return {
      version: 1,
      history: Array.isArray(parsed.history) ? parsed.history : [],
    }
  } catch {
    return emptyState
  }
}

let state = readState()

function persist(next: CoordinatorState) {
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

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return
    state = readState()
    listeners.forEach((listener) => listener())
  })
}

export function classifyCoordinatorRequest(request: CoordinatorRequest): CoordinatorRequestType {
  if (request.type !== 'general') return request.type
  const text = `${request.title} ${request.details}`.toLowerCase()
  if (matches(text, ['architecture', 'technical', 'code', 'build', 'electron', 'vite', 'development'])) return 'architecture'
  if (matches(text, ['finance', 'money', 'profit', 'cost', 'expense', 'revenue', 'cash'])) return 'finance'
  if (matches(text, ['marketing', 'growth', 'content', 'lead', 'campaign', 'offer'])) return 'marketing'
  if (matches(text, ['operations', 'process', 'task', 'sop', 'workflow', 'delivery'])) return 'operations'
  if (matches(text, ['research', 'market', 'competitor', 'opportunity', 'evidence'])) return 'research'
  if (matches(text, ['memory', 'decision', 'knowledge', 'rule'])) return 'memory'
  if (matches(text, ['approval', 'approve', 'permission', 'review'])) return 'approval'
  return 'general'
}

export function selectCoordinatorOperators(type: CoordinatorRequestType): OperatorId[] {
  if (type === 'architecture' || type === 'development') return ['cto']
  if (type === 'finance') return ['cfo']
  if (type === 'marketing') return ['cmo']
  if (type === 'operations') return ['coo']
  if (type === 'research') return ['research']
  if (type === 'memory') return ['cto', 'research']
  if (type === 'approval') return ['coo']
  return ['cto', 'research']
}

export function isRiskyCoordinatorRequest(request: CoordinatorRequest) {
  const text = `${request.title} ${request.details}`.toLowerCase()
  return request.priority === 'High' ||
    request.type === 'approval' ||
    matches(text, ['spend', 'delete', 'send', 'contract', 'pricing', 'price', 'client deliverable', 'connect service'])
}

export function routeCoordinatorRequest({
  request,
  context,
  addApproval,
}: {
  request: CoordinatorRequest
  context: OperatorSharedContext
  addApproval?: (entry: Omit<ApprovalRecord, 'id' | 'status' | 'createdAt'>) => void
}) {
  const createdAt = new Date().toISOString()
  const classifiedType = classifyCoordinatorRequest(request)
  const operatorIds = selectCoordinatorOperators(classifiedType)
  const risky = isRiskyCoordinatorRequest({ ...request, type: classifiedType })
  const routes = operatorIds.map((operatorId) => {
    const task = operatorStore.addTask(operatorId, {
      title: request.title,
      description: buildTaskDescription(request, classifiedType, risky, context.operatingState),
      priority: request.priority,
      relatedIssue: request.details.match(/AO-\d+(?:\.\d+)?/)?.[0],
      source: 'coordinator',
      requiresApproval: risky,
    })
    return {
      operatorId,
      reason: routeReason(operatorId, classifiedType),
      taskId: task.id,
    }
  })

  const approvalId = risky ? createId('coordinator-approval') : undefined
  if (risky && addApproval) {
    addApproval({
      title: `Coordinator review: ${request.title}`,
      category: 'Executive Coordinator',
    })
  }

  const decision: CoordinatorDecision = {
    id: createId('coord'),
    request: {
      ...request,
      id: request.id ?? createId('coord-request'),
      createdAt: request.createdAt ?? createdAt,
    },
    classifiedType,
    routes,
    risky,
    approvalId,
    createdAt,
    summary: buildCoordinationSummary(request, classifiedType, routes, risky),
  }

  persist({
    ...state,
    history: [decision, ...state.history].slice(0, 50),
  })
  return decision
}

export function useExecutiveCoordinatorStore() {
  const data = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return {
    data,
    recentHistory: data.history.slice(0, 8),
  }
}

function matches(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term))
}

function routeReason(operatorId: OperatorId, type: CoordinatorRequestType) {
  const names: Record<OperatorId, string> = {
    cto: 'technical architecture and development ownership',
    cfo: 'financial ownership',
    cmo: 'marketing and growth ownership',
    coo: 'operations and approval-flow ownership',
    research: 'research and opportunity ownership',
  }
  return `${type} request routed for ${names[operatorId]}.`
}

function buildTaskDescription(request: CoordinatorRequest, type: CoordinatorRequestType, risky: boolean, state: OperatingState) {
  const risk = risky ? ' This request may require CEO approval before execution.' : ''
  return `${request.details || 'No details provided.'}\n\nCoordinator classification: ${type}. Current local context: ${state.tasks.length} tasks, ${state.approvals.filter((approval) => approval.status === 'pending').length} pending approvals.${risk}`
}

function buildCoordinationSummary(request: CoordinatorRequest, type: CoordinatorRequestType, routes: CoordinatorRoute[], risky: boolean) {
  const routedTo = routes.map((route) => route.operatorId.toUpperCase()).join(', ')
  return `Executive Coordinator classified "${request.title}" as ${type} and routed it to ${routedTo}. ${risky ? 'CEO approval review was queued because the request may be consequential.' : 'No approval was required for this draft/analysis task.'}`
}
