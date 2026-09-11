import { useSyncExternalStore } from 'react'
import type { ProductionBlueprintDeliverable, ProjectRecord } from '../projects'
import {
  ExecutionRequestReference,
  WorkItemInput,
  WorkItemPriority,
  WorkItemRecord,
  WorkItemStatus,
  WorkItemTimelineItem,
  WorkItemUpdate,
  WorkOrderProfile,
  WorkOrderType,
  workOrderStatuses,
  workOrderTypes,
} from './workItemTypes'

const STORAGE_KEY = 'ai-operator-os-work-items-v1'

const listeners = new Set<() => void>()

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function now() {
  return new Date().toISOString()
}

function timeline(message: string, createdAt = now()): WorkItemTimelineItem {
  return {
    id: id('work-item-timeline'),
    message,
    createdAt,
  }
}

function fallbackWorkItemCode(index: number) {
  return `WI-${String(index + 1).padStart(4, '0')}`
}

function generateWorkItemCode(existing: WorkItemRecord[]) {
  const max = existing.reduce((highest, workItem) => {
    const match = workItem.workItemId?.match(/^WI-(\d+)$/)
    if (!match) return highest
    return Math.max(highest, Number(match[1]))
  }, 0)

  return `WI-${String(max + 1).padStart(4, '0')}`
}

function normalizeHours(value: unknown) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.max(0, Math.round(numeric * 10) / 10)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function normalizeMetadata(value: unknown) {
  return isRecord(value)
    ? Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
    : {}
}

function normalizeExecutionRequest(raw: unknown): ExecutionRequestReference | undefined {
  if (!isRecord(raw)) return undefined

  return {
    requestId: normalizeString(raw.requestId, id('ER')),
    status: raw.status === 'Invalid' ? 'Invalid' : 'Built',
    requestedCapability: normalizeString(raw.requestedCapability, 'Text Generation'),
    workItemRecordId: normalizeString(raw.workItemRecordId),
    workItemId: normalizeString(raw.workItemId, 'WI-0000'),
    projectId: normalizeString(raw.projectId),
    projectCode: normalizeString(raw.projectCode, 'PROJ-0000'),
    businessAssetProjectId: normalizeString(raw.businessAssetProjectId),
    blueprintDeliverableId: normalizeString(raw.blueprintDeliverableId),
    blueprintDeliverableName: normalizeString(raw.blueprintDeliverableName),
    knowledgeReferenceIds: normalizeStringArray(raw.knowledgeReferenceIds),
    instructions: normalizeString(raw.instructions),
    outputRequirements: normalizeString(raw.outputRequirements),
    correlationMetadata: normalizeMetadata(raw.correlationMetadata),
    createdAt: normalizeString(raw.createdAt, now()),
  }
}

function normalizeWorkOrder(raw: unknown, workItemCreatedAt: string): WorkOrderProfile | undefined {
  if (!isRecord(raw) || raw.enabled !== true) return undefined

  const workOrderType = workOrderTypes.includes(raw.workOrderType as WorkOrderType)
    ? raw.workOrderType as WorkOrderType
    : 'Generate Title'
  const status = workOrderStatuses.includes(raw.status as WorkOrderProfile['status'])
    ? raw.status as WorkOrderProfile['status']
    : 'Prepared'
  const createdAt = normalizeString(raw.createdAt, workItemCreatedAt)

  return {
    enabled: true,
    workOrderId: normalizeString(raw.workOrderId, `WO-${Date.now()}`),
    workOrderType,
    status,
    assetType: normalizeString(raw.assetType, 'YouTube Video'),
    platform: normalizeString(raw.platform, 'YouTube'),
    businessAssetProjectId: normalizeString(raw.businessAssetProjectId),
    productionBlueprintType: normalizeString(raw.productionBlueprintType, 'YouTube Video Blueprint'),
    blueprintDeliverableId: normalizeString(raw.blueprintDeliverableId),
    blueprintDeliverableName: normalizeString(raw.blueprintDeliverableName),
    knowledgeReferenceIds: normalizeStringArray(raw.knowledgeReferenceIds),
    executionRequest: normalizeExecutionRequest(raw.executionRequest),
    createdAt,
    updatedAt: normalizeString(raw.updatedAt, createdAt),
    metadata: normalizeMetadata(raw.metadata),
  }
}

function normalizeWorkItem(raw: Partial<WorkItemRecord>, index = 0): WorkItemRecord {
  const timestamp = raw.createdAt ?? now()
  return {
    id: raw.id ?? id('work-item'),
    workItemId: raw.workItemId ?? fallbackWorkItemCode(index),
    title: raw.title?.trim() || 'Untitled Work Item',
    description: raw.description?.trim() || 'No description recorded yet.',
    status: raw.status ?? 'Planning',
    priority: raw.priority ?? 'Medium',
    businessId: raw.businessId ?? '',
    businessCode: raw.businessCode ?? 'BIZ-0000',
    businessName: raw.businessName ?? 'Unknown Business',
    projectId: raw.projectId ?? '',
    projectCode: raw.projectCode ?? 'PROJ-0000',
    projectName: raw.projectName ?? 'Unknown Project',
    departmentId: raw.departmentId ?? '',
    departmentCode: raw.departmentCode ?? 'DEP-0000',
    departmentName: raw.departmentName ?? 'Unassigned Department',
    assignedManagerId: raw.assignedManagerId,
    assignedManagerName: raw.assignedManagerName ?? 'Unassigned',
    assignedOperatorId: raw.assignedOperatorId,
    assignedOperatorCode: raw.assignedOperatorCode,
    assignedOperatorName: raw.assignedOperatorName ?? 'Unassigned',
    estimatedHours: normalizeHours(raw.estimatedHours),
    dueDate: raw.dueDate ?? '',
    notes: raw.notes ?? '',
    placeholderMetrics: raw.placeholderMetrics ?? 'No Work Item metrics connected yet.',
    placeholderNotes: raw.placeholderNotes ?? 'Execution notes will remain placeholders until the execution layer exists.',
    createdAt: timestamp,
    updatedAt: raw.updatedAt ?? timestamp,
    timeline: Array.isArray(raw.timeline) && raw.timeline.length > 0
      ? raw.timeline
      : [timeline('Work Item record created.', timestamp)],
    workOrder: normalizeWorkOrder(raw.workOrder, timestamp),
  }
}

function readState(): WorkItemRecord[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return parsed.map((item, index) => normalizeWorkItem(item, index))
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

function persist(next: WorkItemRecord[]) {
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

function generateWorkOrderCode(existing: WorkItemRecord[]) {
  const max = existing.reduce((highest, workItem) => {
    const match = workItem.workOrder?.workOrderId?.match(/^WO-(\d+)$/)
    if (!match) return highest
    return Math.max(highest, Number(match[1]))
  }, 0)

  return `WO-${String(max + 1).padStart(4, '0')}`
}

function workOrderTypeForDeliverable(deliverable: ProductionBlueprintDeliverable): WorkOrderType | undefined {
  switch (deliverable.name) {
    case 'Title':
      return 'Generate Title'
    case 'Hook':
      return 'Generate Hook'
    case 'Script':
      return 'Generate Script'
    case 'Description':
      return 'Generate Description'
    case 'Tags':
      return 'Generate Tags'
    case 'Thumbnail Concept':
      return 'Generate Thumbnail Concept'
    default:
      return undefined
  }
}

export const workItemStore = {
  createWorkItem(input: WorkItemInput) {
    const timestamp = now()
    const workItem: WorkItemRecord = {
      id: id('work-item'),
      workItemId: generateWorkItemCode(state),
      title: input.title.trim() || 'Untitled Work Item',
      description: input.description.trim() || 'No description recorded yet.',
      status: input.status,
      priority: input.priority,
      businessId: input.businessId,
      businessCode: input.businessCode,
      businessName: input.businessName,
      projectId: input.projectId,
      projectCode: input.projectCode,
      projectName: input.projectName,
      departmentId: input.departmentId,
      departmentCode: input.departmentCode,
      departmentName: input.departmentName,
      assignedManagerId: input.assignedManagerId,
      assignedManagerName: input.assignedManagerName || 'Unassigned',
      assignedOperatorId: input.assignedOperatorId,
      assignedOperatorCode: input.assignedOperatorCode,
      assignedOperatorName: input.assignedOperatorName || 'Unassigned',
      estimatedHours: normalizeHours(input.estimatedHours),
      dueDate: input.dueDate,
      notes: input.notes.trim(),
      placeholderMetrics: 'No Work Item metrics connected yet.',
      placeholderNotes: 'Execution notes will remain placeholders until the execution layer exists.',
      createdAt: timestamp,
      updatedAt: timestamp,
      timeline: [timeline(`Work Item created for ${input.projectCode}.`, timestamp)],
      workOrder: normalizeWorkOrder(input.workOrder, timestamp),
    }

    persist([workItem, ...state])
    return workItem
  },

  createCreativeConceptWorkOrder(project: ProjectRecord) {
    const existing = state.find((workItem) =>
      workItem.workOrder?.businessAssetProjectId === project.id &&
      workItem.workOrder?.workOrderType === 'Develop Creative Concepts' &&
      workItem.workOrder?.status !== 'Cancelled' &&
      !workItem.workOrder.executionRequest,
    )

    if (existing) return existing

    const timestamp = now()
    const selectedKnowledgeEntryIds = project.creativeBrief?.selectedKnowledgeEntryIds ?? []
    const workOrder: WorkOrderProfile = {
      enabled: true,
      workOrderId: generateWorkOrderCode(state),
      workOrderType: 'Develop Creative Concepts',
      status: 'Prepared',
      assetType: project.businessAsset?.assetType ?? 'YouTube Video',
      platform: project.businessAsset?.platform ?? 'YouTube',
      businessAssetProjectId: project.id,
      productionBlueprintType: project.productionBlueprint?.blueprintType ?? '',
      blueprintDeliverableId: '',
      blueprintDeliverableName: 'Creative Concept Development',
      knowledgeReferenceIds: selectedKnowledgeEntryIds,
      executionRequest: undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
      metadata: {
        source: 'Creative Brief',
        workOrderKind: 'Creative Concept Development',
        creativeBriefId: project.creativeBrief?.briefId ?? '',
        selectedKnowledgeEntryIds: selectedKnowledgeEntryIds.join(','),
        candidateCount: '4',
        executionPolicy: 'Manual',
      },
    }

    const workItem: WorkItemRecord = {
      id: id('work-item'),
      workItemId: generateWorkItemCode(state),
      title: `Develop Creative Concepts: ${project.name}`,
      description: `Work Order for bounded creative topic/concept development in ${project.projectId}. This record prepares a provider-independent Execution Request and does not modify Blueprint deliverables.`,
      status: 'Planning',
      priority: project.priority,
      businessId: project.businessId,
      businessCode: project.businessCode,
      businessName: project.businessName,
      projectId: project.id,
      projectCode: project.projectId,
      projectName: project.name,
      departmentId: project.departmentId,
      departmentCode: project.departmentCode,
      departmentName: project.departmentName,
      assignedManagerId: project.managerId,
      assignedManagerName: project.managerName || 'Unassigned',
      assignedOperatorId: undefined,
      assignedOperatorCode: undefined,
      assignedOperatorName: 'Unassigned',
      estimatedHours: 0,
      dueDate: project.targetDate,
      notes: 'Manual creative concept development request. Produces exactly 4 structured candidates for CEO planning review.',
      placeholderMetrics: 'Creative concept metrics are not connected yet.',
      placeholderNotes: 'Concept generation uses existing Execution Core and Provider Manager. Selection is planning-only.',
      createdAt: timestamp,
      updatedAt: timestamp,
      timeline: [timeline(`Creative Concept Work Order ${workOrder.workOrderId} created.`, timestamp)],
      workOrder,
    }

    persist([workItem, ...state])
    return workItem
  },

  createWorkOrderFromBlueprintDeliverable(project: ProjectRecord, deliverable: ProductionBlueprintDeliverable) {
    const existing = state.find((workItem) =>
      workItem.workOrder?.businessAssetProjectId === project.id &&
      workItem.workOrder?.blueprintDeliverableId === deliverable.id &&
      workItem.workOrder?.metadata.isRevision !== 'true',
    )

    if (existing) return existing

    const timestamp = now()
    const workOrderType = workOrderTypeForDeliverable(deliverable)
    if (!workOrderType) return undefined
    const workOrder: WorkOrderProfile = {
      enabled: true,
      workOrderId: generateWorkOrderCode(state),
      workOrderType,
      status: 'Prepared',
      assetType: project.businessAsset?.assetType ?? 'YouTube Video',
      platform: project.businessAsset?.platform ?? 'YouTube',
      businessAssetProjectId: project.id,
      productionBlueprintType: project.productionBlueprint?.blueprintType ?? 'YouTube Video Blueprint',
      blueprintDeliverableId: deliverable.id,
      blueprintDeliverableName: deliverable.name,
      knowledgeReferenceIds: project.knowledgeWorkspace?.entries.map((entry) => entry.id) ?? [],
      executionRequest: undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
      metadata: {
        source: 'Production Blueprint',
        blueprintDeliverableStatus: deliverable.status,
      },
    }

    const workItem: WorkItemRecord = {
      id: id('work-item'),
      workItemId: generateWorkItemCode(state),
      title: `${workOrderType}: ${project.name}`,
      description: `Work Order for ${deliverable.name} deliverable in ${project.projectId}. This record prepares a provider-independent Execution Request and does not execute work.`,
      status: 'Planning',
      priority: project.priority,
      businessId: project.businessId,
      businessCode: project.businessCode,
      businessName: project.businessName,
      projectId: project.id,
      projectCode: project.projectId,
      projectName: project.name,
      departmentId: project.departmentId,
      departmentCode: project.departmentCode,
      departmentName: project.departmentName,
      assignedManagerId: project.managerId,
      assignedManagerName: project.managerName || 'Unassigned',
      assignedOperatorId: undefined,
      assignedOperatorCode: undefined,
      assignedOperatorName: 'Unassigned',
      estimatedHours: 0,
      dueDate: project.targetDate,
      notes: `Prepared from Production Blueprint deliverable: ${deliverable.name}.`,
      placeholderMetrics: 'Work Order metrics are not connected yet.',
      placeholderNotes: 'Execution Request relationship is read-only until execution infrastructure consumes the request.',
      createdAt: timestamp,
      updatedAt: timestamp,
      timeline: [timeline(`Work Order ${workOrder.workOrderId} created for ${deliverable.name}.`, timestamp)],
      workOrder,
    }

    persist([workItem, ...state])
    return workItem
  },

  createRevisionWorkOrderFromNeedsRevision(project: ProjectRecord, deliverable: ProductionBlueprintDeliverable) {
    const revisionInstructions = deliverable.reviewFeedback?.trim() ?? ''
    const sourceReview = deliverable.reviewHistory.find((item) =>
      item.decision === 'Needs Revision' &&
      (item.approvalId === deliverable.reviewApprovalId || !deliverable.reviewApprovalId)
    ) ?? deliverable.reviewHistory.find((item) => item.decision === 'Needs Revision')

    if (deliverable.reviewStatus !== 'Needs Revision' || deliverable.activeReview || revisionInstructions.length === 0 || !sourceReview) {
      return undefined
    }

    const existing = state.find((workItem) =>
      workItem.workOrder?.businessAssetProjectId === project.id &&
      workItem.workOrder?.blueprintDeliverableId === deliverable.id &&
      workItem.workOrder?.metadata.isRevision === 'true' &&
      workItem.workOrder?.metadata.revisionSourceReviewHistoryId === sourceReview.id &&
      workItem.workOrder?.status !== 'Cancelled',
    )

    if (existing) return existing

    const timestamp = now()
    const workOrderType = workOrderTypeForDeliverable(deliverable)
    if (!workOrderType) return undefined
    const revisionAttempt = String(
      state.filter((workItem) =>
        workItem.workOrder?.businessAssetProjectId === project.id &&
        workItem.workOrder?.blueprintDeliverableId === deliverable.id &&
        workItem.workOrder?.metadata.isRevision === 'true',
      ).length + 1,
    )
    const workOrder: WorkOrderProfile = {
      enabled: true,
      workOrderId: generateWorkOrderCode(state),
      workOrderType,
      status: 'Prepared',
      assetType: project.businessAsset?.assetType ?? 'YouTube Video',
      platform: project.businessAsset?.platform ?? 'YouTube',
      businessAssetProjectId: project.id,
      productionBlueprintType: project.productionBlueprint?.blueprintType ?? 'YouTube Video Blueprint',
      blueprintDeliverableId: deliverable.id,
      blueprintDeliverableName: deliverable.name,
      knowledgeReferenceIds: project.knowledgeWorkspace?.entries.map((entry) => entry.id) ?? [],
      executionRequest: undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
      metadata: {
        source: 'Needs Revision Review',
        isRevision: 'true',
        revisionAttempt,
        revisionInstructions,
        revisionSourceReviewHistoryId: sourceReview.id,
        revisionSourceApprovalId: sourceReview.approvalId ?? deliverable.reviewApprovalId ?? '',
        originalWorkItemId: sourceReview.workItemId ?? deliverable.appliedWorkItemId ?? '',
        originalWorkOrderId: sourceReview.workOrderId ?? deliverable.appliedWorkOrderId ?? '',
        originalExecutionRecordId: sourceReview.executionRecordId ?? deliverable.appliedExecutionRecordId ?? '',
        originalExecutionId: sourceReview.executionId ?? deliverable.appliedExecutionId ?? '',
        originalExecutionRequestId: sourceReview.executionRequestId ?? deliverable.appliedExecutionRequestId ?? '',
        originalResultId: sourceReview.resultId ?? deliverable.appliedResultId ?? '',
        originalDraftContent: deliverable.draftContent || deliverable.content,
      },
    }

    const workItem: WorkItemRecord = {
      id: id('work-item'),
      workItemId: generateWorkItemCode(state),
      title: `Revise ${deliverable.name}: ${project.name}`,
      description: `Revision Work Order for ${deliverable.name} deliverable in ${project.projectId}. This record uses CEO Needs Revision instructions and remains manual-only.`,
      status: 'Planning',
      priority: project.priority,
      businessId: project.businessId,
      businessCode: project.businessCode,
      businessName: project.businessName,
      projectId: project.id,
      projectCode: project.projectId,
      projectName: project.name,
      departmentId: project.departmentId,
      departmentCode: project.departmentCode,
      departmentName: project.departmentName,
      assignedManagerId: project.managerId,
      assignedManagerName: project.managerName || 'Unassigned',
      assignedOperatorId: undefined,
      assignedOperatorCode: undefined,
      assignedOperatorName: 'Unassigned',
      estimatedHours: 0,
      dueDate: project.targetDate,
      notes: `Manual revision requested for ${deliverable.name}.\n\nCEO revision instructions:\n${revisionInstructions}`,
      placeholderMetrics: 'Revision Work Order metrics are not connected yet.',
      placeholderNotes: 'Revision execution remains manual-only and uses the existing Execution Core path.',
      createdAt: timestamp,
      updatedAt: timestamp,
      timeline: [timeline(`Revision Work Order ${workOrder.workOrderId} created for ${deliverable.name}.`, timestamp)],
      workOrder,
    }

    persist([workItem, ...state])
    return workItem
  },

  attachExecutionRequest(workItemRecordId: string, executionRequest: ExecutionRequestReference) {
    const timestamp = now()
    let updated: WorkItemRecord | undefined
    persist(state.map((workItem) => {
      if (workItem.id !== workItemRecordId || !workItem.workOrder) return workItem
      updated = {
        ...workItem,
        status: 'Ready',
        updatedAt: timestamp,
        timeline: [timeline(`Execution Request ${executionRequest.requestId} built for ${workItem.workOrder.workOrderId}.`, timestamp), ...workItem.timeline],
        workOrder: {
          ...workItem.workOrder,
          status: 'Request Built',
          executionRequest,
          updatedAt: timestamp,
        },
      }
      return updated
    }))
    return updated
  },

  updateWorkItem(workItemRecordId: string, updates: WorkItemUpdate) {
    const timestamp = now()
    persist(state.map((workItem) =>
      workItem.id === workItemRecordId
        ? {
          ...workItem,
          ...updates,
          title: updates.title?.trim() || workItem.title,
          description: updates.description?.trim() || workItem.description,
          assignedOperatorName: updates.assignedOperatorName ?? workItem.assignedOperatorName,
          estimatedHours: updates.estimatedHours === undefined ? workItem.estimatedHours : normalizeHours(updates.estimatedHours),
          notes: updates.notes ?? workItem.notes,
          workOrder: updates.workOrder === undefined ? workItem.workOrder : normalizeWorkOrder(updates.workOrder, workItem.createdAt),
          updatedAt: timestamp,
          timeline: [timeline('Work Item record updated.', timestamp), ...workItem.timeline],
        }
        : workItem,
    ))
  },

  getWorkItems() {
    return state
  },

  getWorkItem(workItemRecordId: string) {
    return state.find((workItem) => workItem.id === workItemRecordId)
  },
}

export function useWorkItemStore() {
  const workItems = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return {
    workItems,
    createWorkItem: workItemStore.createWorkItem,
    createWorkOrderFromBlueprintDeliverable: workItemStore.createWorkOrderFromBlueprintDeliverable,
    createCreativeConceptWorkOrder: workItemStore.createCreativeConceptWorkOrder,
    createRevisionWorkOrderFromNeedsRevision: workItemStore.createRevisionWorkOrderFromNeedsRevision,
    attachExecutionRequest: workItemStore.attachExecutionRequest,
    updateWorkItem: workItemStore.updateWorkItem,
  }
}

export const workItemStatuses: WorkItemStatus[] = ['Planning', 'Ready', 'In Progress', 'Blocked', 'Review', 'Completed', 'Archived']

export const workItemPriorities: WorkItemPriority[] = ['Low', 'Medium', 'High', 'Critical']
