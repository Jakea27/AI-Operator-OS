import { useSyncExternalStore } from 'react'
import {
  OperatorId,
  OperatorLocalState,
  OperatorRecommendation,
  OperatorRecommendationStatus,
  OperatorTask,
  OperatorTaskPriority,
} from './operatorTypes'

const STORAGE_KEY = 'ai-operator-os-operator-workspace-v1'
const operatorIds: OperatorId[] = ['cto', 'cfo', 'cmo', 'coo', 'research']

const emptyState: OperatorLocalState = {
  version: 1,
  tasks: {
    cto: [],
    cfo: [],
    cmo: [],
    coo: [],
    research: [],
  },
  recommendations: {
    cto: [],
    cfo: [],
    cmo: [],
    coo: [],
    research: [],
  },
}

const listeners = new Set<() => void>()

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function normalizeState(raw: Partial<OperatorLocalState>): OperatorLocalState {
  return {
    version: 1,
    tasks: Object.fromEntries(operatorIds.map((id) => [
      id,
      Array.isArray(raw.tasks?.[id])
        ? raw.tasks[id].map((task) => ({
          ...task,
          priority: task.priority ?? 'Medium',
        }))
        : [],
    ])) as OperatorLocalState['tasks'],
    recommendations: Object.fromEntries(operatorIds.map((id) => [
      id,
      Array.isArray(raw.recommendations?.[id])
        ? raw.recommendations[id].map((recommendation) => ({
          ...recommendation,
          title: recommendation.title ?? recommendation.summary ?? 'Operator recommendation',
          confidence: recommendation.confidence ?? 'Medium',
          riskLevel: recommendation.riskLevel ?? 'Medium',
          source: recommendation.source ?? 'Operator workspace',
          status: recommendation.status ?? 'Draft',
        }))
        : [],
    ])) as OperatorLocalState['recommendations'],
  }
}

function readState(): OperatorLocalState {
  if (typeof window === 'undefined') return emptyState
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return emptyState
    return normalizeState(JSON.parse(stored) as Partial<OperatorLocalState>)
  } catch {
    return emptyState
  }
}

let state = readState()

function persist(next: OperatorLocalState) {
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

export const operatorStore = {
  addTask(operatorId: OperatorId, task: {
    title: string
    description: string
    priority: OperatorTaskPriority
    relatedIssue?: string
    relatedMemoryId?: string
    source?: OperatorTask['source']
    requiresApproval?: boolean
  }) {
    const entry: OperatorTask = {
      id: createId(`${operatorId}-task`),
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: 'queued',
      createdAt: new Date().toISOString(),
      source: task.source ?? 'operator',
      requiresApproval: task.requiresApproval ?? false,
      relatedIssue: task.relatedIssue,
      relatedMemoryId: task.relatedMemoryId,
    }
    persist({
      ...state,
      tasks: {
        ...state.tasks,
        [operatorId]: [entry, ...state.tasks[operatorId]],
      },
    })
    return entry
  },
  completeTask(operatorId: OperatorId, taskId: string) {
    persist({
      ...state,
      tasks: {
        ...state.tasks,
        [operatorId]: state.tasks[operatorId].map((task) => task.id === taskId ? { ...task, status: 'done', completedAt: new Date().toISOString() } : task),
      },
    })
  },
  removeTask(operatorId: OperatorId, taskId: string) {
    persist({
      ...state,
      tasks: {
        ...state.tasks,
        [operatorId]: state.tasks[operatorId].filter((task) => task.id !== taskId),
      },
    })
  },
  addRecommendation(operatorId: OperatorId, recommendation: {
    title: string
    summary: string
    rationale: string
    source: string
    status: OperatorRecommendationStatus
    confidence: 'Low' | 'Medium' | 'High'
    riskLevel: 'Low' | 'Medium' | 'High'
    requiresApproval: boolean
  }) {
    const entry: OperatorRecommendation = {
      id: createId(`${operatorId}-rec`),
      createdAt: new Date().toISOString(),
      ...recommendation,
    }
    persist({
      ...state,
      recommendations: {
        ...state.recommendations,
        [operatorId]: [entry, ...state.recommendations[operatorId]],
      },
    })
    return entry
  },
  updateRecommendationStatus(operatorId: OperatorId, recommendationId: string, status: OperatorRecommendationStatus) {
    persist({
      ...state,
      recommendations: {
        ...state.recommendations,
        [operatorId]: state.recommendations[operatorId].map((recommendation) =>
          recommendation.id === recommendationId ? { ...recommendation, status } : recommendation,
        ),
      },
    })
  },
}

export function useOperatorStore() {
  const data = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return {
    data,
    ...operatorStore,
  }
}
