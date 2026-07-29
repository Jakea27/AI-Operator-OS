import { useSyncExternalStore } from 'react'
import {
  BusinessAssetProfile,
  businessAssetProductionStages,
  businessAssetProductionStatuses,
  businessAssetTypes,
  ProductionBlueprint,
  ProductionBlueprintDeliverable,
  ProductionBlueprintDeliverableReviewHistoryItem,
  ProjectKnowledgeEntry,
  ProjectKnowledgeWorkspace,
  productionBlueprintDeliverableNames,
  productionBlueprintDeliverableReviewStatuses,
  productionBlueprintDeliverableStatuses,
  productionBlueprintTypes,
  projectKnowledgeSections,
  ProjectInput,
  ProjectPriority,
  ProjectRecord,
  ProjectStatus,
  ProjectTimelineItem,
  ProjectUpdate,
} from './projectTypes'

const STORAGE_KEY = 'ai-operator-os-projects-v1'

const listeners = new Set<() => void>()

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function now() {
  return new Date().toISOString()
}

function timeline(message: string, createdAt = now()): ProjectTimelineItem {
  return {
    id: id('project-timeline'),
    message,
    createdAt,
  }
}

function fallbackProjectCode(index: number) {
  return `PROJ-${String(index + 1).padStart(4, '0')}`
}

function generateProjectCode(existing: ProjectRecord[]) {
  const max = existing.reduce((highest, project) => {
    const match = project.projectId?.match(/^PROJ-(\d+)$/)
    if (!match) return highest
    return Math.max(highest, Number(match[1]))
  }, 0)

  return `PROJ-${String(max + 1).padStart(4, '0')}`
}

function clampProgress(value: unknown) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.min(100, Math.max(0, Math.round(numeric)))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function normalizeBusinessAsset(raw: unknown, fallbackDepartmentId: string, fallbackDepartmentName: string, projectCreatedAt: string): BusinessAssetProfile | undefined {
  if (!isRecord(raw) || raw.enabled !== true) return undefined

  const assetType = businessAssetTypes.includes(raw.assetType as BusinessAssetProfile['assetType'])
    ? raw.assetType as BusinessAssetProfile['assetType']
    : 'YouTube Video'
  const currentProductionStage = businessAssetProductionStages.includes(raw.currentProductionStage as BusinessAssetProfile['currentProductionStage'])
    ? raw.currentProductionStage as BusinessAssetProfile['currentProductionStage']
    : 'Intake'
  const productionStatus = businessAssetProductionStatuses.includes(raw.productionStatus as BusinessAssetProfile['productionStatus'])
    ? raw.productionStatus as BusinessAssetProfile['productionStatus']
    : 'Planning'
  const createdAt = normalizeString(raw.createdAt, projectCreatedAt)
  const updatedAt = normalizeString(raw.updatedAt, createdAt)
  const metadata = isRecord(raw.metadata)
    ? Object.fromEntries(Object.entries(raw.metadata).filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
    : {}

  return {
    enabled: true,
    assetType,
    platform: normalizeString(raw.platform, assetType === 'YouTube Video' ? 'YouTube' : ''),
    topic: normalizeString(raw.topic),
    goal: normalizeString(raw.goal),
    targetAudience: normalizeString(raw.targetAudience),
    tone: normalizeString(raw.tone),
    targetLength: normalizeString(raw.targetLength),
    additionalNotes: normalizeString(raw.additionalNotes),
    currentProductionStage,
    productionStatus,
    departmentId: normalizeString(raw.departmentId, fallbackDepartmentId),
    departmentName: normalizeString(raw.departmentName, fallbackDepartmentName),
    createdAt,
    updatedAt,
    metadata,
  }
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function normalizeKnowledgeEntry(raw: unknown, workspaceCreatedAt: string): ProjectKnowledgeEntry | undefined {
  if (!isRecord(raw)) return undefined

  const section = projectKnowledgeSections.includes(raw.section as ProjectKnowledgeEntry['section'])
    ? raw.section as ProjectKnowledgeEntry['section']
    : 'Research Notes'
  const createdAt = normalizeString(raw.createdAt, workspaceCreatedAt)
  const updatedAt = normalizeString(raw.updatedAt, createdAt)
  const metadata = isRecord(raw.metadata)
    ? Object.fromEntries(Object.entries(raw.metadata).filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
    : {}

  return {
    id: normalizeString(raw.id, id('knowledge-entry')),
    section,
    title: normalizeString(raw.title, 'Untitled Knowledge Entry'),
    content: normalizeString(raw.content),
    url: normalizeString(raw.url),
    tags: normalizeStringArray(raw.tags),
    createdAt,
    updatedAt,
    metadata,
  }
}

function normalizeKnowledgeWorkspace(raw: unknown, projectCreatedAt: string): ProjectKnowledgeWorkspace | undefined {
  if (!isRecord(raw) || raw.enabled !== true) return undefined

  const createdAt = normalizeString(raw.createdAt, projectCreatedAt)
  const updatedAt = normalizeString(raw.updatedAt, createdAt)
  const metadata = isRecord(raw.metadata)
    ? Object.fromEntries(Object.entries(raw.metadata).filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
    : {}
  const entries = Array.isArray(raw.entries)
    ? raw.entries.map((entry) => normalizeKnowledgeEntry(entry, createdAt)).filter((entry): entry is ProjectKnowledgeEntry => Boolean(entry))
    : []

  return {
    enabled: true,
    entries,
    createdAt,
    updatedAt,
    metadata,
  }
}

function defaultBlueprintDeliverables(updatedAt: string): ProductionBlueprintDeliverable[] {
  return productionBlueprintDeliverableNames.map((name) => ({
    id: id('blueprint-deliverable'),
    name,
    status: 'Not Started',
    content: '',
    reviewStatus: 'Not Ready',
    activeReview: false,
    draftContent: '',
    approvedContent: '',
    reviewHistory: [],
    updatedAt,
    metadata: {},
  }))
}

function normalizeReviewHistoryItem(raw: unknown): ProductionBlueprintDeliverableReviewHistoryItem | undefined {
  if (!isRecord(raw)) return undefined
  const decision = ['Draft Applied', 'Approved', 'Needs Revision', 'Rejected'].includes(String(raw.decision))
    ? raw.decision as ProductionBlueprintDeliverableReviewHistoryItem['decision']
    : undefined
  if (!decision) return undefined

  return {
    id: normalizeString(raw.id, id('blueprint-review-history')),
    decision,
    actor: normalizeString(raw.actor, 'AI Operator OS'),
    note: normalizeString(raw.note),
    createdAt: normalizeString(raw.createdAt, now()),
    executionRecordId: normalizeString(raw.executionRecordId) || undefined,
    executionId: normalizeString(raw.executionId) || undefined,
    executionRequestId: normalizeString(raw.executionRequestId) || undefined,
    resultId: normalizeString(raw.resultId) || undefined,
    workItemId: normalizeString(raw.workItemId) || undefined,
    workOrderId: normalizeString(raw.workOrderId) || undefined,
    approvalId: normalizeString(raw.approvalId) || undefined,
  }
}

function normalizeBlueprintDeliverable(raw: unknown, fallbackName: ProductionBlueprintDeliverable['name'], updatedAt: string): ProductionBlueprintDeliverable {
  const source = isRecord(raw) ? raw : {}
  const name = productionBlueprintDeliverableNames.includes(source.name as ProductionBlueprintDeliverable['name'])
    ? source.name as ProductionBlueprintDeliverable['name']
    : fallbackName
  const status = productionBlueprintDeliverableStatuses.includes(source.status as ProductionBlueprintDeliverable['status'])
    ? source.status as ProductionBlueprintDeliverable['status']
    : 'Not Started'
  const reviewStatus = productionBlueprintDeliverableReviewStatuses.includes(source.reviewStatus as ProductionBlueprintDeliverable['reviewStatus'])
    ? source.reviewStatus as ProductionBlueprintDeliverable['reviewStatus']
    : 'Not Ready'
  const metadata = isRecord(source.metadata)
    ? Object.fromEntries(Object.entries(source.metadata).filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
    : {}
  const reviewHistory = Array.isArray(source.reviewHistory)
    ? source.reviewHistory.map(normalizeReviewHistoryItem).filter((item): item is ProductionBlueprintDeliverableReviewHistoryItem => Boolean(item))
    : []

  return {
    id: normalizeString(source.id, id('blueprint-deliverable')),
    name,
    status,
    content: normalizeString(source.content),
    reviewStatus,
    activeReview: source.activeReview === true,
    draftContent: normalizeString(source.draftContent),
    approvedContent: normalizeString(source.approvedContent),
    appliedExecutionRecordId: normalizeString(source.appliedExecutionRecordId) || undefined,
    appliedExecutionId: normalizeString(source.appliedExecutionId) || undefined,
    appliedExecutionRequestId: normalizeString(source.appliedExecutionRequestId) || undefined,
    appliedResultId: normalizeString(source.appliedResultId) || undefined,
    appliedWorkItemId: normalizeString(source.appliedWorkItemId) || undefined,
    appliedWorkOrderId: normalizeString(source.appliedWorkOrderId) || undefined,
    reviewApprovalId: normalizeString(source.reviewApprovalId) || undefined,
    reviewFeedback: normalizeString(source.reviewFeedback) || undefined,
    rejectionReason: normalizeString(source.rejectionReason) || undefined,
    reviewedAt: normalizeString(source.reviewedAt) || undefined,
    reviewHistory,
    updatedAt: normalizeString(source.updatedAt, updatedAt),
    metadata,
  }
}

function normalizeProductionBlueprint(raw: unknown, projectCreatedAt: string, assetType?: BusinessAssetProfile['assetType']): ProductionBlueprint | undefined {
  if (!isRecord(raw) || raw.enabled !== true) return undefined

  const createdAt = normalizeString(raw.createdAt, projectCreatedAt)
  const updatedAt = normalizeString(raw.updatedAt, createdAt)
  const blueprintType = productionBlueprintTypes.includes(raw.blueprintType as ProductionBlueprint['blueprintType'])
    ? raw.blueprintType as ProductionBlueprint['blueprintType']
    : 'YouTube Video Blueprint'
  const normalizedAssetType = businessAssetTypes.includes(raw.assetType as BusinessAssetProfile['assetType'])
    ? raw.assetType as BusinessAssetProfile['assetType']
    : assetType ?? 'YouTube Video'
  const metadata = isRecord(raw.metadata)
    ? Object.fromEntries(Object.entries(raw.metadata).filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
    : {}
  const rawDeliverables = Array.isArray(raw.deliverables) ? raw.deliverables : []
  const deliverables = productionBlueprintDeliverableNames.map((name) => {
    const matching = rawDeliverables.find((item) => isRecord(item) && item.name === name)
    return normalizeBlueprintDeliverable(matching, name, updatedAt)
  })

  return {
    enabled: true,
    blueprintType,
    assetType: normalizedAssetType,
    deliverables,
    createdAt,
    updatedAt,
    metadata,
  }
}

function normalizeProject(raw: Partial<ProjectRecord>, index = 0): ProjectRecord {
  const timestamp = raw.createdAt ?? now()
  const businessAsset = normalizeBusinessAsset(raw.businessAsset, raw.departmentId ?? '', raw.departmentName ?? 'Unassigned Department', timestamp)
  return {
    id: raw.id ?? id('project'),
    projectId: raw.projectId ?? fallbackProjectCode(index),
    name: raw.name?.trim() || 'Untitled Project',
    description: raw.description?.trim() || 'No project description recorded yet.',
    businessId: raw.businessId ?? '',
    businessCode: raw.businessCode ?? 'BIZ-0000',
    businessName: raw.businessName ?? 'Unknown Business',
    departmentId: raw.departmentId ?? '',
    departmentCode: raw.departmentCode ?? 'DEP-0000',
    departmentName: raw.departmentName ?? 'Unassigned Department',
    managerId: raw.managerId,
    managerName: raw.managerName ?? 'Unassigned',
    priority: raw.priority ?? 'Medium',
    status: raw.status ?? 'Planning',
    progress: clampProgress(raw.progress),
    startDate: raw.startDate ?? '',
    targetDate: raw.targetDate ?? '',
    notes: raw.notes ?? '',
    placeholderWorkItems: raw.placeholderWorkItems ?? 'Work Items will appear here in a later sprint. Projects organize work but do not execute it.',
    openWorkItems: Number.isFinite(Number(raw.openWorkItems)) ? Number(raw.openWorkItems) : 0,
    createdAt: timestamp,
    updatedAt: raw.updatedAt ?? timestamp,
    timeline: Array.isArray(raw.timeline) && raw.timeline.length > 0
      ? raw.timeline
      : [timeline('Project record created.', timestamp)],
    businessAsset,
    knowledgeWorkspace: normalizeKnowledgeWorkspace(raw.knowledgeWorkspace, timestamp),
    productionBlueprint: normalizeProductionBlueprint(raw.productionBlueprint, timestamp, businessAsset?.assetType),
  }
}

function readState(): ProjectRecord[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return parsed.map((item, index) => normalizeProject(item, index))
  } catch {
    return []
  }
}

let state = readState()

if (typeof window !== 'undefined' && state.length > 0) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Keep normalized in-memory state if localStorage is temporarily unavailable.
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return
    state = readState()
    listeners.forEach((listener) => listener())
  })
}

function persist(next: ProjectRecord[]) {
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

export const projectStore = {
  createProject(input: ProjectInput) {
    const timestamp = now()
    const project: ProjectRecord = {
      id: id('project'),
      projectId: generateProjectCode(state),
      name: input.name.trim() || 'Untitled Project',
      description: input.description.trim() || 'No project description recorded yet.',
      businessId: input.businessId,
      businessCode: input.businessCode,
      businessName: input.businessName,
      departmentId: input.departmentId,
      departmentCode: input.departmentCode,
      departmentName: input.departmentName,
      managerId: input.managerId,
      managerName: input.managerName || 'Unassigned',
      priority: input.priority,
      status: input.status,
      progress: clampProgress(input.progress),
      startDate: input.startDate,
      targetDate: input.targetDate,
      notes: input.notes.trim(),
      placeholderWorkItems: 'Work Items will appear here in a later sprint. Projects organize work but do not execute it.',
      openWorkItems: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
      timeline: [timeline(`Project created for ${input.businessCode}.`, timestamp)],
      businessAsset: normalizeBusinessAsset(input.businessAsset, input.departmentId, input.departmentName, timestamp),
      knowledgeWorkspace: normalizeKnowledgeWorkspace(input.knowledgeWorkspace, timestamp),
      productionBlueprint: normalizeProductionBlueprint(input.productionBlueprint, timestamp, input.businessAsset?.assetType),
    }

    persist([project, ...state])
    return project
  },

  updateProject(projectRecordId: string, updates: ProjectUpdate) {
    const timestamp = now()
    persist(state.map((project) =>
      project.id === projectRecordId
        ? {
          ...project,
          ...updates,
          name: updates.name?.trim() || project.name,
          description: updates.description?.trim() || project.description,
          managerName: updates.managerName ?? project.managerName,
          progress: updates.progress === undefined ? project.progress : clampProgress(updates.progress),
          notes: updates.notes ?? project.notes,
          businessAsset: updates.businessAsset === undefined
            ? project.businessAsset
            : normalizeBusinessAsset(updates.businessAsset, updates.departmentId ?? project.departmentId, updates.departmentName ?? project.departmentName, project.createdAt),
          knowledgeWorkspace: updates.knowledgeWorkspace === undefined
            ? project.knowledgeWorkspace
            : normalizeKnowledgeWorkspace(updates.knowledgeWorkspace, project.createdAt),
          productionBlueprint: updates.productionBlueprint === undefined
            ? project.productionBlueprint
            : normalizeProductionBlueprint(updates.productionBlueprint, project.createdAt, updates.businessAsset?.assetType ?? project.businessAsset?.assetType),
          updatedAt: timestamp,
          timeline: [timeline('Project record updated.', timestamp), ...project.timeline],
        }
        : project,
    ))
  },

  getProjects() {
    return state
  },

  getProject(projectRecordId: string) {
    return state.find((project) => project.id === projectRecordId)
  },
}

export function useProjectStore() {
  const projects = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return {
    projects,
    createProject: projectStore.createProject,
    updateProject: projectStore.updateProject,
  }
}

export const projectStatuses: ProjectStatus[] = ['Planning', 'Active', 'On Hold', 'Completed', 'Archived']

export const projectPriorities: ProjectPriority[] = ['Low', 'Medium', 'High', 'Critical']
