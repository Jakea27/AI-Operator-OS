import { useSyncExternalStore } from 'react'
import {
  BusinessAssetProfile,
  businessAssetProductionStages,
  businessAssetProductionStatuses,
  businessAssetTypes,
  CreativeBriefProfile,
  creativeBriefStatuses,
  CreativeAssetPackage,
  CreativeAssetPackageDeliverable,
  CreativeConcept,
  creativeConceptStatuses,
  creativeAssetPackageStatuses,
  getProductionBlueprintDeliverableNames,
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
  shortFormPlatforms,
  shortFormProductionStatuses,
  ShortFormProductionProfile,
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
    platform: normalizeString(raw.platform, assetType === 'YouTube Video' ? 'YouTube' : 'Short-Form Multi-Platform'),
    targetPlatforms: Array.isArray(raw.targetPlatforms)
      ? Array.from(new Set(raw.targetPlatforms.filter((item): item is BusinessAssetProfile['targetPlatforms'][number] =>
        shortFormPlatforms.includes(item as BusinessAssetProfile['targetPlatforms'][number]),
      )))
      : [],
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

function normalizeMetadata(value: unknown) {
  return isRecord(value)
    ? Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
    : {}
}

function normalizeKnowledgeEntry(raw: unknown, workspaceCreatedAt: string): ProjectKnowledgeEntry | undefined {
  if (!isRecord(raw)) return undefined

  const section = projectKnowledgeSections.includes(raw.section as ProjectKnowledgeEntry['section'])
    ? raw.section as ProjectKnowledgeEntry['section']
    : 'Research Notes'
  const createdAt = normalizeString(raw.createdAt, workspaceCreatedAt)
  const updatedAt = normalizeString(raw.updatedAt, createdAt)
  const metadata = normalizeMetadata(raw.metadata)

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
  const metadata = normalizeMetadata(raw.metadata)
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

function normalizeCreativeBrief(raw: unknown, projectCreatedAt: string): CreativeBriefProfile | undefined {
  if (!isRecord(raw)) return undefined

  const createdAt = normalizeString(raw.createdAt, projectCreatedAt)
  const updatedAt = normalizeString(raw.updatedAt, createdAt)
  const status = creativeBriefStatuses.includes(raw.status as CreativeBriefProfile['status'])
    ? raw.status as CreativeBriefProfile['status']
    : 'Draft'

  return {
    enabled: raw.enabled === true,
    briefId: normalizeString(raw.briefId, id('CB')),
    status,
    selectedKnowledgeEntryIds: normalizeStringArray(raw.selectedKnowledgeEntryIds),
    offerContext: normalizeString(raw.offerContext),
    keyMessage: normalizeString(raw.keyMessage),
    callToAction: normalizeString(raw.callToAction),
    constraints: normalizeString(raw.constraints),
    requiredInclusions: normalizeString(raw.requiredInclusions),
    prohibitedContent: normalizeString(raw.prohibitedContent),
    platformInstructions: normalizeString(raw.platformInstructions),
    assetInstructions: normalizeString(raw.assetInstructions),
    createdAt,
    updatedAt,
    metadata: normalizeMetadata(raw.metadata),
  }
}

function normalizeCreativeConcept(raw: unknown, projectRecordId: string, projectId: string, businessAssetProjectId: string, createdAt: string): CreativeConcept | undefined {
  if (!isRecord(raw)) return undefined

  const conceptCreatedAt = normalizeString(raw.createdAt, createdAt)
  const sourceReferences = isRecord(raw.sourceReferences) ? raw.sourceReferences : {}
  const status = creativeConceptStatuses.includes(raw.status as CreativeConcept['status'])
    ? raw.status as CreativeConcept['status']
    : raw.selected === true ? 'Selected' : 'Generated'

  return {
    conceptId: normalizeString(raw.conceptId, id('CC')),
    title: normalizeString(raw.title),
    summary: normalizeString(raw.summary),
    angle: normalizeString(raw.angle),
    rationale: normalizeString(raw.rationale),
    audienceValue: normalizeString(raw.audienceValue),
    hookDirection: normalizeString(raw.hookDirection),
    status,
    selected: status === 'Selected' || raw.selected === true,
    sourceReferences: {
      projectRecordId: normalizeString(sourceReferences.projectRecordId, projectRecordId),
      projectId: normalizeString(sourceReferences.projectId, projectId),
      businessAssetProjectId: normalizeString(sourceReferences.businessAssetProjectId, businessAssetProjectId),
      creativeBriefId: normalizeString(sourceReferences.creativeBriefId) || undefined,
      selectedKnowledgeEntryIds: normalizeStringArray(sourceReferences.selectedKnowledgeEntryIds),
      workItemRecordId: normalizeString(sourceReferences.workItemRecordId) || undefined,
      workItemId: normalizeString(sourceReferences.workItemId) || undefined,
      workOrderId: normalizeString(sourceReferences.workOrderId) || undefined,
      executionRequestId: normalizeString(sourceReferences.executionRequestId) || undefined,
      executionRecordId: normalizeString(sourceReferences.executionRecordId) || undefined,
      executionId: normalizeString(sourceReferences.executionId) || undefined,
      executionResultId: normalizeString(sourceReferences.executionResultId) || undefined,
      providerName: normalizeString(sourceReferences.providerName) || undefined,
      modelName: normalizeString(sourceReferences.modelName) || undefined,
      capability: normalizeString(sourceReferences.capability) || undefined,
    },
    createdAt: conceptCreatedAt,
    updatedAt: normalizeString(raw.updatedAt, conceptCreatedAt),
    metadata: normalizeMetadata(raw.metadata),
  }
}

function defaultBlueprintDeliverables(blueprintType: ProductionBlueprint['blueprintType'], updatedAt: string): ProductionBlueprintDeliverable[] {
  return getProductionBlueprintDeliverableNames(blueprintType).map((name) => ({
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
  const decision = ['Draft Applied', 'Revision Work Order Created', 'Approved', 'Needs Revision', 'Rejected'].includes(String(raw.decision))
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
    metadata: normalizeMetadata(raw.metadata),
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
  const metadata = normalizeMetadata(source.metadata)
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

function normalizeCreativeAssetPackageDeliverable(raw: unknown): CreativeAssetPackageDeliverable | undefined {
  if (!isRecord(raw)) return undefined
  const deliverableName = productionBlueprintDeliverableNames.includes(raw.deliverableName as CreativeAssetPackageDeliverable['deliverableName'])
    ? raw.deliverableName as CreativeAssetPackageDeliverable['deliverableName']
    : undefined
  if (!deliverableName) return undefined

  return {
    id: normalizeString(raw.id, id('asset-package-deliverable')),
    deliverableId: normalizeString(raw.deliverableId),
    deliverableName,
    approvedContent: normalizeString(raw.approvedContent),
    approvedAt: normalizeString(raw.approvedAt) || undefined,
    reviewApprovalId: normalizeString(raw.reviewApprovalId) || undefined,
    sourceExecutionRecordId: normalizeString(raw.sourceExecutionRecordId) || undefined,
    sourceExecutionId: normalizeString(raw.sourceExecutionId) || undefined,
    sourceExecutionRequestId: normalizeString(raw.sourceExecutionRequestId) || undefined,
    sourceResultId: normalizeString(raw.sourceResultId) || undefined,
    sourceWorkItemId: normalizeString(raw.sourceWorkItemId) || undefined,
    sourceWorkOrderId: normalizeString(raw.sourceWorkOrderId) || undefined,
    reviewHistoryIds: normalizeStringArray(raw.reviewHistoryIds),
    metadata: normalizeMetadata(raw.metadata),
  }
}

function normalizeCreativeAssetPackage(raw: unknown, projectRecordId: string, projectId: string, createdAt: string, blueprintType: ProductionBlueprint['blueprintType'], assetType: BusinessAssetProfile['assetType']): CreativeAssetPackage | undefined {
  if (!isRecord(raw)) return undefined
  const packageCreatedAt = normalizeString(raw.createdAt, createdAt)
  const status = creativeAssetPackageStatuses.includes(raw.status as CreativeAssetPackage['status'])
    ? raw.status as CreativeAssetPackage['status']
    : 'Export Ready'
  const exportFormats: CreativeAssetPackage['exportFormats'] = Array.isArray(raw.exportFormats)
    ? raw.exportFormats.filter((item): item is CreativeAssetPackage['exportFormats'][number] => item === 'Markdown' || item === 'JSON')
    : ['Markdown', 'JSON']

  return {
    id: normalizeString(raw.id, id('asset-package')),
    packageId: normalizeString(raw.packageId, id('CAP')),
    projectRecordId: normalizeString(raw.projectRecordId, projectRecordId),
    projectId: normalizeString(raw.projectId, projectId),
    businessAssetType: businessAssetTypes.includes(raw.businessAssetType as BusinessAssetProfile['assetType'])
      ? raw.businessAssetType as BusinessAssetProfile['assetType']
      : assetType,
    platform: normalizeString(raw.platform, assetType === 'YouTube Video' ? 'YouTube' : 'Short-Form Multi-Platform'),
    targetPlatforms: Array.isArray(raw.targetPlatforms)
      ? Array.from(new Set(raw.targetPlatforms.filter((item): item is CreativeAssetPackage['targetPlatforms'][number] =>
        shortFormPlatforms.includes(item as CreativeAssetPackage['targetPlatforms'][number]),
      )))
      : [],
    blueprintType: productionBlueprintTypes.includes(raw.blueprintType as ProductionBlueprint['blueprintType'])
      ? raw.blueprintType as ProductionBlueprint['blueprintType']
      : blueprintType,
    packageVersion: Number.isFinite(Number(raw.packageVersion)) ? Math.max(1, Math.round(Number(raw.packageVersion))) : 1,
    status,
    createdAt: packageCreatedAt,
    updatedAt: normalizeString(raw.updatedAt, packageCreatedAt),
    approvalState: 'CEO Approved',
    deliverables: Array.isArray(raw.deliverables)
      ? raw.deliverables.map(normalizeCreativeAssetPackageDeliverable).filter((item): item is CreativeAssetPackageDeliverable => Boolean(item))
      : [],
    sourceReviewIds: normalizeStringArray(raw.sourceReviewIds),
    sourceExecutionRecordIds: normalizeStringArray(raw.sourceExecutionRecordIds),
    sourceExecutionRequestIds: normalizeStringArray(raw.sourceExecutionRequestIds),
    sourceWorkItemIds: normalizeStringArray(raw.sourceWorkItemIds),
    sourceWorkOrderIds: normalizeStringArray(raw.sourceWorkOrderIds),
    sourceResultIds: normalizeStringArray(raw.sourceResultIds),
    revisionLineageReferences: normalizeStringArray(raw.revisionLineageReferences),
    exportFormats: exportFormats.length > 0 ? exportFormats : ['Markdown', 'JSON'],
    metadata: normalizeMetadata(raw.metadata),
  }
}

function normalizeProductionBlueprint(raw: unknown, projectCreatedAt: string, assetType?: BusinessAssetProfile['assetType']): ProductionBlueprint | undefined {
  if (!isRecord(raw) || raw.enabled !== true) return undefined

  const createdAt = normalizeString(raw.createdAt, projectCreatedAt)
  const updatedAt = normalizeString(raw.updatedAt, createdAt)
  const normalizedAssetType = businessAssetTypes.includes(raw.assetType as BusinessAssetProfile['assetType'])
    ? raw.assetType as BusinessAssetProfile['assetType']
    : assetType ?? 'YouTube Video'
  const fallbackBlueprintType: ProductionBlueprint['blueprintType'] = normalizedAssetType === 'Short-Form Video'
    ? 'Short-Form Video Blueprint'
    : 'YouTube Video Blueprint'
  const blueprintType = productionBlueprintTypes.includes(raw.blueprintType as ProductionBlueprint['blueprintType'])
    ? raw.blueprintType as ProductionBlueprint['blueprintType']
    : fallbackBlueprintType
  const metadata = normalizeMetadata(raw.metadata)
  const rawDeliverables = Array.isArray(raw.deliverables) ? raw.deliverables : []
  const deliverables = getProductionBlueprintDeliverableNames(blueprintType).map((name) => {
    const matching = rawDeliverables.find((item) => isRecord(item) && item.name === name)
    return normalizeBlueprintDeliverable(matching, name, updatedAt)
  })
  const creativeAssetPackages = Array.isArray(raw.creativeAssetPackages)
    ? raw.creativeAssetPackages
      .map((item) => normalizeCreativeAssetPackage(
        item,
        normalizeString(raw.projectRecordId),
        normalizeString(raw.projectId),
        createdAt,
        blueprintType,
        normalizedAssetType,
      ))
      .filter((item): item is CreativeAssetPackage => Boolean(item))
    : []

  return {
    enabled: true,
    blueprintType,
    assetType: normalizedAssetType,
    deliverables,
    creativeAssetPackages,
    createdAt,
    updatedAt,
    metadata,
  }
}

function normalizeShortFormProduction(raw: unknown, projectCreatedAt: string): ShortFormProductionProfile | undefined {
  if (!isRecord(raw) || raw.enabled !== true) return undefined

  const createdAt = normalizeString(raw.createdAt, projectCreatedAt)
  const status = shortFormProductionStatuses.includes(raw.status as ShortFormProductionProfile['status'])
    ? raw.status as ShortFormProductionProfile['status']
    : 'Not Started'

  return {
    enabled: true,
    productionId: normalizeString(raw.productionId, id('SFP')),
    status,
    createdAt,
    updatedAt: normalizeString(raw.updatedAt, createdAt),
    metadata: normalizeMetadata(raw.metadata),
  }
}

function isShortFormPlanReady(businessAsset: BusinessAssetProfile | undefined, blueprint: ProductionBlueprint | undefined) {
  if (businessAsset?.assetType !== 'Short-Form Video' || businessAsset.targetPlatforms.length === 0) return false
  if (blueprint?.blueprintType !== 'Short-Form Video Blueprint') return false
  const requiredNames = getProductionBlueprintDeliverableNames('Short-Form Video Blueprint')
  return requiredNames.every((name) => {
    const deliverable = blueprint.deliverables.find((item) => item.name === name)
    return Boolean(deliverable && (deliverable.approvedContent.trim() || deliverable.draftContent.trim() || deliverable.content.trim()))
  })
}

function gateShortFormProduction(
  production: ShortFormProductionProfile | undefined,
  businessAsset: BusinessAssetProfile | undefined,
  blueprint: ProductionBlueprint | undefined,
) {
  if (!production || production.status !== 'Ready' || isShortFormPlanReady(businessAsset, blueprint)) return production
  return {
    ...production,
    status: 'Not Started' as const,
  }
}

function normalizeProject(raw: Partial<ProjectRecord>, index = 0): ProjectRecord {
  const timestamp = raw.createdAt ?? now()
  const businessAsset = normalizeBusinessAsset(raw.businessAsset, raw.departmentId ?? '', raw.departmentName ?? 'Unassigned Department', timestamp)
  const productionBlueprint = normalizeProductionBlueprint(raw.productionBlueprint, timestamp, businessAsset?.assetType)
  const shortFormProduction = businessAsset?.assetType === 'Short-Form Video'
    ? normalizeShortFormProduction(raw.shortFormProduction, timestamp)
    : undefined
  const projectId = raw.projectId ?? fallbackProjectCode(index)
  const projectRecordId = raw.id ?? id('project')
  return {
    id: projectRecordId,
    projectId,
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
    creativeBrief: normalizeCreativeBrief(raw.creativeBrief, timestamp),
    creativeConcepts: Array.isArray(raw.creativeConcepts)
      ? raw.creativeConcepts
        .map((concept) => normalizeCreativeConcept(concept, projectRecordId, projectId, projectRecordId, timestamp))
        .filter((concept): concept is CreativeConcept => Boolean(concept))
      : [],
    productionBlueprint,
    shortFormProduction: gateShortFormProduction(shortFormProduction, businessAsset, productionBlueprint),
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
  const normalized = next.map((project, index) => normalizeProject(project, index))
  state = normalized
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
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
    const projectRecordId = id('project')
    const projectCode = generateProjectCode(state)
    const project: ProjectRecord = {
      id: projectRecordId,
      projectId: projectCode,
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
      creativeBrief: normalizeCreativeBrief(input.creativeBrief, timestamp),
      creativeConcepts: Array.isArray(input.creativeConcepts)
        ? input.creativeConcepts
          .map((concept) => normalizeCreativeConcept(concept, projectRecordId, projectCode, projectRecordId, timestamp))
          .filter((concept): concept is CreativeConcept => Boolean(concept))
        : [],
      productionBlueprint: normalizeProductionBlueprint(input.productionBlueprint, timestamp, input.businessAsset?.assetType),
      shortFormProduction: input.businessAsset?.assetType === 'Short-Form Video'
        ? normalizeShortFormProduction(input.shortFormProduction, timestamp)
        : undefined,
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
          creativeBrief: updates.creativeBrief === undefined
            ? project.creativeBrief
            : normalizeCreativeBrief(updates.creativeBrief, project.createdAt),
          creativeConcepts: updates.creativeConcepts === undefined
            ? project.creativeConcepts ?? []
            : updates.creativeConcepts
              .map((concept) => normalizeCreativeConcept(concept, project.id, project.projectId, project.id, project.createdAt))
              .filter((concept): concept is CreativeConcept => Boolean(concept)),
          productionBlueprint: updates.productionBlueprint === undefined
            ? project.productionBlueprint
            : normalizeProductionBlueprint(updates.productionBlueprint, project.createdAt, updates.businessAsset?.assetType ?? project.businessAsset?.assetType),
          shortFormProduction: (updates.businessAsset?.assetType ?? project.businessAsset?.assetType) === 'Short-Form Video'
            ? updates.shortFormProduction === undefined
              ? project.shortFormProduction
              : normalizeShortFormProduction(updates.shortFormProduction, project.createdAt)
            : undefined,
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
