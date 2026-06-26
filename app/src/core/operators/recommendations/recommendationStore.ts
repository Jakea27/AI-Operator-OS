import { useSyncExternalStore } from 'react'
import {
  CTORecommendation,
  CTORecommendationStatus,
  CTORecommendationStoreState,
} from './recommendationTypes'

const STORAGE_KEY = 'ai-operator-os-cto-recommendations-v1'
const emptyState: CTORecommendationStoreState = {
  version: 1,
  recommendations: [],
}
const listeners = new Set<() => void>()

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function normalizeRecommendation(recommendation: Partial<CTORecommendation>): CTORecommendation {
  const timestamp = new Date().toISOString()
  return {
    id: recommendation.id ?? createId('cto-rec'),
    type: recommendation.type ?? 'Architecture',
    title: recommendation.title ?? 'Untitled CTO recommendation',
    summary: recommendation.summary ?? '',
    reasoning: recommendation.reasoning ?? '',
    businessValue: recommendation.businessValue ?? '',
    estimatedEffort: recommendation.estimatedEffort ?? 'Medium',
    dependencies: Array.isArray(recommendation.dependencies) ? recommendation.dependencies : [],
    risk: recommendation.risk ?? 'Medium',
    confidence: recommendation.confidence ?? 'Medium',
    supportingEvidence: Array.isArray(recommendation.supportingEvidence) ? recommendation.supportingEvidence : [],
    recommendedNextAction: recommendation.recommendedNextAction ?? '',
    requiresCEOApproval: Boolean(recommendation.requiresCEOApproval),
    status: recommendation.status ?? 'Draft',
    createdAt: recommendation.createdAt ?? timestamp,
    updatedAt: recommendation.updatedAt ?? recommendation.createdAt ?? timestamp,
    history: Array.isArray(recommendation.history) ? recommendation.history : [],
  }
}

function readState(): CTORecommendationStoreState {
  if (typeof window === 'undefined') return emptyState
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return emptyState
    const parsed = JSON.parse(stored) as Partial<CTORecommendationStoreState>
    return {
      version: 1,
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations.map(normalizeRecommendation)
        : [],
    }
  } catch {
    return emptyState
  }
}

let state = readState()

function persist(next: CTORecommendationStoreState) {
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

export const ctoRecommendationStore = {
  add(recommendation: Omit<CTORecommendation, 'id' | 'createdAt' | 'updatedAt' | 'history'>) {
    const timestamp = new Date().toISOString()
    const entry: CTORecommendation = {
      ...recommendation,
      id: createId('cto-rec'),
      createdAt: timestamp,
      updatedAt: timestamp,
      history: [{
        id: createId('cto-rec-event'),
        event: 'Recommendation generated',
        status: recommendation.status,
        createdAt: timestamp,
      }],
    }
    persist({
      ...state,
      recommendations: [entry, ...state.recommendations],
    })
    return entry
  },
  updateStatus(id: string, status: CTORecommendationStatus, event: string) {
    const timestamp = new Date().toISOString()
    persist({
      ...state,
      recommendations: state.recommendations.map((recommendation) => recommendation.id === id
        ? updateRecommendationStatus(recommendation, status, event, timestamp)
        : recommendation),
    })
  },
}

function updateRecommendationStatus(
  recommendation: CTORecommendation,
  status: CTORecommendationStatus,
  event: string,
  timestamp: string,
) {
  const latest = recommendation.history[0]
  const isDuplicateLatestEvent = recommendation.status === status &&
    latest?.status === status &&
    latest?.event === event

  return {
    ...recommendation,
    status,
    updatedAt: isDuplicateLatestEvent ? recommendation.updatedAt : timestamp,
    history: isDuplicateLatestEvent
      ? recommendation.history
      : [{
          id: createId('cto-rec-event'),
          event,
          status,
          createdAt: timestamp,
        }, ...recommendation.history],
  }
}

export function useCTORecommendationStore() {
  const data = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return {
    data,
    recommendations: data.recommendations,
    ...ctoRecommendationStore,
  }
}
