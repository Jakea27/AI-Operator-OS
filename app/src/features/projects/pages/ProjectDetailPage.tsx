import { ArrowLeft, Check, FolderKanban, Plus } from 'lucide-react'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useBusinessStore } from '@/src/core/businesses'
import { DepartmentRecord, useCompanyStructureStore } from '@/src/core/companyStructure'
import { ExecutionRecord, useExecutionStore } from '@/src/core/execution'
import {
  BusinessAssetProfile,
  BusinessAssetType,
  CREATIVE_CONCEPT_CANDIDATE_COUNT,
  CreativeBriefProfile,
  CreativeBriefStatus,
  CreativeAssetPackage,
  CreativeAssetPackageDeliverable,
  CreativeConcept,
  ProductionBlueprint,
  ProductionBlueprintDeliverable,
  ProductionBlueprintDeliverableStatus,
  ShortFormPlatform,
  ShortFormProductionProfile,
  ProjectKnowledgeEntry,
  ProjectKnowledgeSection,
  ProjectKnowledgeWorkspace,
  ProjectPriority,
  ProjectRecord,
  ProjectStatus,
  createCreativeConceptRecords,
  buildCreativeCostSummary,
  parseCreativeConceptCandidates,
  businessAssetProductionStages,
  businessAssetProductionStatuses,
  businessAssetTypes,
  creativeBriefStatuses,
  getProductionBlueprintDeliverableNames,
  productionBlueprintDeliverableStatuses,
  shortFormPlatforms,
  shortFormProductionStatuses,
  projectKnowledgeSections,
  projectPriorities,
  projectStatuses,
  useProjectStore,
} from '@/src/core/projects'
import { buildExecutionRequestFromWorkOrder, WorkItemRecord, useWorkItemStore } from '@/src/core/workItems'
import { useApprovalStore } from '@/src/features/approval/store/approvalStore'
import { Approval } from '@/src/features/approval/types/approvalTypes'
import { WorkItemCard } from '@/src/features/workItems/WorkItemCard'
import { WorkItemForm } from '@/src/features/workItems/WorkItemForm'
import { ProjectLifecycle } from '../components/ProjectLifecycle'

type ReviewModalState = {
  type: 'Needs Revision' | 'Fully Reject'
  deliverableId: string
}

type RevisionWorkOrderView = {
  workOrder: WorkItemRecord
  execution?: ExecutionRecord
}

function formatDate(value: string) {
  if (!value) return 'Not set'
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatMoney(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0)
}

function formatDuration(value?: number) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return 'Not recorded'
  if (value < 1000) return `${Math.round(value)} ms`
  const seconds = value / 1000
  if (seconds < 60) return `${seconds.toFixed(1)} sec`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)
  return `${minutes} min ${remainingSeconds} sec`
}

function reviewHistoryId() {
  return `blueprint-review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function packageId() {
  return `CAP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function unique(values: Array<string | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value && value.trim()))))
}

function supportsAiWorkOrder(deliverable: ProductionBlueprintDeliverable) {
  return ['Title', 'Hook', 'Script', 'Description', 'Tags', 'Thumbnail Concept'].includes(deliverable.name)
}

function collectRevisionLineage(deliverable: ProductionBlueprintDeliverable) {
  const metadataKeys = [
    'activeRevisionSourceReviewHistoryId',
    'activeRevisionWorkItemId',
    'activeRevisionWorkOrderId',
    'latestRevisionAttempt',
    'revisionSourceReviewHistoryId',
    'revisionSourceApprovalId',
    'originalExecutionId',
    'originalExecutionRecordId',
    'originalExecutionRequestId',
    'originalWorkOrderId',
  ]

  return unique([
    ...metadataKeys.map((key) => deliverable.metadata[key]),
    ...deliverable.reviewHistory.flatMap((item) => metadataKeys.map((key) => item.metadata?.[key])),
  ])
}

function buildPackageMarkdown(record: ProjectRecord, assetPackage: CreativeAssetPackage) {
  const deliverableText = assetPackage.deliverables.map((deliverable) => [
    `## ${deliverable.deliverableName}`,
    '',
    deliverable.approvedContent || '_No approved content recorded._',
  ].join('\n')).join('\n\n')

  return [
    `# ${record.name}`,
    '',
    `Package: ${assetPackage.packageId}`,
    `Project: ${assetPackage.projectId}`,
    `Asset Type: ${assetPackage.businessAssetType}`,
    `Platform: ${assetPackage.platform || 'Not specified'}`,
    `Target Platforms: ${assetPackage.targetPlatforms.length > 0 ? assetPackage.targetPlatforms.join(', ') : 'Not specified'}`,
    `Version: ${assetPackage.packageVersion}`,
    `Status: ${assetPackage.status}`,
    `Approval State: ${assetPackage.approvalState}`,
    `Created: ${assetPackage.createdAt}`,
    '',
    deliverableText,
    '',
    '---',
    'Source lineage remains inside AI Operator OS. This package is export-ready but not published.',
  ].join('\n')
}

function buildPackageJson(assetPackage: CreativeAssetPackage) {
  return JSON.stringify(assetPackage, null, 2)
}

export function ProjectDetailPage() {
  const { projectId } = useParams()
  const projectStore = useProjectStore()
  const workItemStore = useWorkItemStore()
  const executionStore = useExecutionStore()
  const approvalStore = useApprovalStore()
  const businessStore = useBusinessStore()
  const companyStructure = useCompanyStructureStore()
  const project = projectStore.projects.find((item) => item.id === projectId)
  const [draft, setDraft] = useState<ProjectRecord | undefined>(project)
  const [showWorkItemForm, setShowWorkItemForm] = useState(false)
  const [knowledgeSection, setKnowledgeSection] = useState<ProjectKnowledgeSection>('Research Notes')
  const [knowledgeTitle, setKnowledgeTitle] = useState('')
  const [knowledgeContent, setKnowledgeContent] = useState('')
  const [knowledgeUrl, setKnowledgeUrl] = useState('')
  const [knowledgeTags, setKnowledgeTags] = useState('')
  const [executionRequestNotice, setExecutionRequestNotice] = useState('')
  const [executingExecutionId, setExecutingExecutionId] = useState<string | undefined>()
  const [reviewModal, setReviewModal] = useState<ReviewModalState | undefined>()
  const [reviewNote, setReviewNote] = useState('')

  useEffect(() => {
    setDraft(project)
  }, [project])

  const departments = useMemo(
    () => companyStructure.departments.filter((department) => department.businessId === draft?.businessId && department.enabled && department.status !== 'Archived'),
    [companyStructure.departments, draft?.businessId],
  )

  if (!project || !draft) {
    return <Navigate to="/projects" replace />
  }

  const activeProject = project
  const activeDraft = draft
  const projectWorkItems = workItemStore.workItems.filter((workItem) =>
    workItem.projectId === activeProject.id ||
    workItem.projectCode === activeProject.projectId,
  )
  const projectWorkOrders = projectWorkItems.filter((workItem) => workItem.workOrder?.enabled)
  const regularProjectWorkItems = projectWorkItems.filter((workItem) => !workItem.workOrder?.enabled)
  const creativeCostSummary = useMemo(
    () => buildCreativeCostSummary(activeProject, executionStore.executions),
    [activeProject, executionStore.executions],
  )

  function selectBusiness(nextBusinessId: string) {
    const business = businessStore.businesses.find((item) => item.id === nextBusinessId)
    const nextDepartment = companyStructure.departments.find((department) => department.businessId === nextBusinessId && department.enabled && department.status !== 'Archived')
    if (!business) return

    setDraft((current) => current ? {
      ...current,
      businessId: business.id,
      businessCode: business.businessId,
      businessName: business.name,
      departmentId: nextDepartment?.id ?? '',
      departmentCode: nextDepartment?.departmentId ?? 'DEP-0000',
      departmentName: nextDepartment?.departmentName ?? 'Unassigned Department',
      managerId: nextDepartment?.manager?.managerId,
      managerName: nextDepartment?.manager?.name ?? 'Unassigned',
    } : current)
  }

  function selectDepartment(nextDepartmentId: string) {
    const department = departments.find((item) => item.id === nextDepartmentId)
    if (!department) return

    setDraft((current) => current ? {
      ...current,
      departmentId: department.id,
      departmentCode: department.departmentId,
      departmentName: department.departmentName,
      managerId: department.manager?.managerId,
      managerName: department.manager?.name ?? 'Unassigned',
    } : current)
  }

  function save(projectRecord: ProjectRecord, draftRecord: ProjectRecord) {
    const businessAsset = draftRecord.businessAsset?.enabled
      ? {
        ...draftRecord.businessAsset,
        departmentId: draftRecord.departmentId,
        departmentName: draftRecord.departmentName,
        updatedAt: new Date().toISOString(),
      }
      : undefined

    projectStore.updateProject(projectRecord.id, {
      name: draftRecord.name,
      description: draftRecord.description,
      businessId: draftRecord.businessId,
      businessCode: draftRecord.businessCode,
      businessName: draftRecord.businessName,
      departmentId: draftRecord.departmentId,
      departmentCode: draftRecord.departmentCode,
      departmentName: draftRecord.departmentName,
      managerId: draftRecord.managerId,
      managerName: draftRecord.managerName,
      priority: draftRecord.priority,
      status: draftRecord.status,
      progress: draftRecord.progress,
      startDate: draftRecord.startDate,
      targetDate: draftRecord.targetDate,
      notes: draftRecord.notes,
      businessAsset,
      knowledgeWorkspace: draftRecord.knowledgeWorkspace,
      creativeBrief: businessAsset ? draftRecord.creativeBrief : undefined,
      productionBlueprint: businessAsset ? draftRecord.productionBlueprint : undefined,
      shortFormProduction: businessAsset?.assetType === 'Short-Form Video' ? draftRecord.shortFormProduction : undefined,
    })
  }

  function defaultBusinessAsset(record: ProjectRecord): BusinessAssetProfile {
    const timestamp = new Date().toISOString()
    return {
      enabled: true,
      assetType: 'Short-Form Video',
      platform: 'Short-Form Multi-Platform',
      targetPlatforms: [],
      topic: '',
      goal: '',
      targetAudience: '',
      tone: '',
      targetLength: '',
      additionalNotes: '',
      currentProductionStage: 'Intake',
      productionStatus: 'Planning',
      departmentId: record.departmentId,
      departmentName: record.departmentName,
      createdAt: timestamp,
      updatedAt: timestamp,
      metadata: {},
    }
  }

  function updateBusinessAsset(updates: Partial<BusinessAssetProfile>) {
    setDraft((current) => {
      if (!current) return current
      const currentBusinessAsset = current.businessAsset ?? defaultBusinessAsset(current)
      const nextAssetType = updates.assetType ?? currentBusinessAsset.assetType
      const targetPlatforms = nextAssetType === 'Short-Form Video'
        ? updates.targetPlatforms ?? currentBusinessAsset.targetPlatforms
        : []
      return {
        ...current,
        businessAsset: {
          ...currentBusinessAsset,
          ...updates,
          platform: nextAssetType === 'YouTube Video' ? 'YouTube' : 'Short-Form Multi-Platform',
          targetPlatforms,
          updatedAt: new Date().toISOString(),
        },
        shortFormProduction: nextAssetType === 'Short-Form Video'
          ? current.shortFormProduction ?? defaultShortFormProduction(current)
          : undefined,
      }
    })
  }

  function toggleShortFormPlatform(platform: ShortFormPlatform) {
    const current = draft?.businessAsset?.targetPlatforms ?? []
    updateBusinessAsset({
      targetPlatforms: current.includes(platform)
        ? current.filter((item) => item !== platform)
        : [...current, platform],
    })
  }

  function defaultKnowledgeWorkspace(record: ProjectRecord): ProjectKnowledgeWorkspace {
    const timestamp = new Date().toISOString()
    return {
      enabled: true,
      entries: record.knowledgeWorkspace?.entries ?? [],
      createdAt: record.knowledgeWorkspace?.createdAt ?? timestamp,
      updatedAt: timestamp,
      metadata: record.knowledgeWorkspace?.metadata ?? {},
    }
  }

  function updateKnowledgeWorkspace(updates: Partial<ProjectKnowledgeWorkspace>) {
    setDraft((current) => {
      if (!current) return current
      const workspace = current.knowledgeWorkspace ?? defaultKnowledgeWorkspace(current)
      return {
        ...current,
        knowledgeWorkspace: {
          ...workspace,
          ...updates,
          updatedAt: new Date().toISOString(),
        },
      }
    })
  }

  function addKnowledgeEntry() {
    if (!draft) return
    const workspace = draft.knowledgeWorkspace ?? defaultKnowledgeWorkspace(draft)
    const timestamp = new Date().toISOString()
    const entry: ProjectKnowledgeEntry = {
      id: `knowledge-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      section: knowledgeSection,
      title: knowledgeTitle.trim() || `${knowledgeSection} entry`,
      content: knowledgeContent.trim(),
      url: knowledgeUrl.trim(),
      tags: knowledgeTags.split(',').map((tag) => tag.trim()).filter(Boolean),
      createdAt: timestamp,
      updatedAt: timestamp,
      metadata: {},
    }

    updateKnowledgeWorkspace({
      entries: [entry, ...workspace.entries],
    })
    setKnowledgeTitle('')
    setKnowledgeContent('')
    setKnowledgeUrl('')
    setKnowledgeTags('')
  }

  function updateKnowledgeEntry(entryId: string, updates: Partial<ProjectKnowledgeEntry>) {
    if (!draft?.knowledgeWorkspace) return
    updateKnowledgeWorkspace({
      entries: draft.knowledgeWorkspace.entries.map((entry) =>
        entry.id === entryId
          ? {
            ...entry,
            ...updates,
            updatedAt: new Date().toISOString(),
          }
          : entry,
      ),
    })
  }

  function deleteKnowledgeEntry(entryId: string) {
    if (!draft?.knowledgeWorkspace) return
    updateKnowledgeWorkspace({
      entries: draft.knowledgeWorkspace.entries.filter((entry) => entry.id !== entryId),
    })
  }

  function defaultCreativeBrief(record: ProjectRecord): CreativeBriefProfile {
    const timestamp = new Date().toISOString()
    return {
      enabled: true,
      briefId: record.creativeBrief?.briefId ?? `CB-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: record.creativeBrief?.status ?? 'Draft',
      selectedKnowledgeEntryIds: record.creativeBrief?.selectedKnowledgeEntryIds ?? [],
      offerContext: record.creativeBrief?.offerContext ?? '',
      keyMessage: record.creativeBrief?.keyMessage ?? '',
      callToAction: record.creativeBrief?.callToAction ?? '',
      constraints: record.creativeBrief?.constraints ?? '',
      requiredInclusions: record.creativeBrief?.requiredInclusions ?? '',
      prohibitedContent: record.creativeBrief?.prohibitedContent ?? '',
      platformInstructions: record.creativeBrief?.platformInstructions ?? '',
      assetInstructions: record.creativeBrief?.assetInstructions ?? '',
      createdAt: record.creativeBrief?.createdAt ?? timestamp,
      updatedAt: timestamp,
      metadata: record.creativeBrief?.metadata ?? {},
    }
  }

  function updateCreativeBrief(updates: Partial<CreativeBriefProfile>) {
    setDraft((current) => {
      if (!current) return current
      const brief = current.creativeBrief ?? defaultCreativeBrief(current)
      return {
        ...current,
        creativeBrief: {
          ...brief,
          ...updates,
          updatedAt: new Date().toISOString(),
        },
      }
    })
  }

  function toggleCreativeBriefKnowledgeEntry(entryId: string) {
    if (!draft) return
    const brief = draft.creativeBrief ?? defaultCreativeBrief(draft)
    const selected = new Set(brief.selectedKnowledgeEntryIds)
    if (selected.has(entryId)) {
      selected.delete(entryId)
    } else {
      selected.add(entryId)
    }
    updateCreativeBrief({ selectedKnowledgeEntryIds: Array.from(selected) })
  }

  const knowledgeEntriesBySection = useMemo(() => {
    const entries = draft?.knowledgeWorkspace?.entries ?? []
    return projectKnowledgeSections.map((section) => ({
      section,
      entries: entries.filter((entry) => entry.section === section),
    }))
  }, [draft?.knowledgeWorkspace?.entries])

  function defaultProductionBlueprint(record: ProjectRecord): ProductionBlueprint {
    const timestamp = new Date().toISOString()
    const assetType = record.businessAsset?.assetType ?? 'Short-Form Video'
    const blueprintType: ProductionBlueprint['blueprintType'] = assetType === 'Short-Form Video'
      ? 'Short-Form Video Blueprint'
      : 'YouTube Video Blueprint'
    return {
      enabled: true,
      blueprintType,
      assetType,
      deliverables: getProductionBlueprintDeliverableNames(blueprintType).map((name) => ({
        id: `blueprint-${Date.now()}-${name.toLowerCase().replace(/\s+/g, '-')}`,
        name,
        status: 'Not Started',
        content: '',
        reviewStatus: 'Not Ready',
        activeReview: false,
        draftContent: '',
        approvedContent: '',
        reviewHistory: [],
        updatedAt: timestamp,
        metadata: {},
      })),
      creativeAssetPackages: record.productionBlueprint?.creativeAssetPackages ?? [],
      createdAt: timestamp,
      updatedAt: timestamp,
      metadata: {},
    }
  }

  function defaultShortFormProduction(record: ProjectRecord): ShortFormProductionProfile {
    const timestamp = new Date().toISOString()
    return {
      enabled: true,
      productionId: `SFP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: 'Not Started',
      createdAt: record.shortFormProduction?.createdAt ?? timestamp,
      updatedAt: timestamp,
      metadata: record.shortFormProduction?.metadata ?? {},
    }
  }

  function updateShortFormProduction(updates: Partial<ShortFormProductionProfile>) {
    setDraft((current) => {
      if (!current) return current
      const production = current.shortFormProduction ?? defaultShortFormProduction(current)
      return {
        ...current,
        shortFormProduction: {
          ...production,
          ...updates,
          enabled: true,
          updatedAt: new Date().toISOString(),
        },
      }
    })
  }

  function updateProductionBlueprint(updates: Partial<ProductionBlueprint>) {
    setDraft((current) => {
      if (!current) return current
      const blueprint = current.productionBlueprint ?? defaultProductionBlueprint(current)
      return {
        ...current,
        productionBlueprint: {
          ...blueprint,
          ...updates,
          assetType: current.businessAsset?.assetType ?? blueprint.assetType,
          updatedAt: new Date().toISOString(),
        },
      }
    })
  }

  function updateBlueprintDeliverable(deliverableId: string, updates: Partial<ProductionBlueprintDeliverable>) {
    if (!draft) return
    const blueprint = draft.productionBlueprint ?? defaultProductionBlueprint(draft)
    updateProductionBlueprint({
      deliverables: blueprint.deliverables.map((deliverable) =>
        deliverable.id === deliverableId
          ? {
            ...deliverable,
            ...updates,
            updatedAt: new Date().toISOString(),
          }
          : deliverable,
      ),
    })
  }

  function persistBlueprintDeliverable(deliverableId: string, updates: Partial<ProductionBlueprintDeliverable>) {
    const currentProject = projectStore.projects.find((item) => item.id === activeProject.id) ?? activeDraft
    if (!currentProject) return undefined
    const blueprint = currentProject.productionBlueprint ?? defaultProductionBlueprint(currentProject)
    const timestamp = new Date().toISOString()
    const nextBlueprint: ProductionBlueprint = {
      ...blueprint,
      updatedAt: timestamp,
      deliverables: blueprint.deliverables.map((deliverable) =>
        deliverable.id === deliverableId
          ? {
            ...deliverable,
            ...updates,
            updatedAt: timestamp,
          }
          : deliverable,
      ),
    }

    projectStore.updateProject(currentProject.id, { productionBlueprint: nextBlueprint })
    setDraft({ ...currentProject, productionBlueprint: nextBlueprint, updatedAt: timestamp })
    return nextBlueprint.deliverables.find((deliverable) => deliverable.id === deliverableId)
  }

  function findReviewApproval(deliverable: ProductionBlueprintDeliverable, execution?: ExecutionRecord) {
    if (execution) {
      return approvalStore.approvals.find((approval) =>
        approval.sourceProjectId === activeProject.id &&
        approval.sourceBlueprintDeliverableId === deliverable.id &&
        (
          approval.sourceResultId === execution.result?.resultId ||
          approval.sourceExecutionRecordId === execution.id ||
          approval.sourceExecutionRequestId === execution.executionRequest?.requestId
        ),
      )
    }

    return approvalStore.approvals.find((approval) => approval.id === deliverable.reviewApprovalId)
  }

  function createDraftReviewApproval(deliverable: ProductionBlueprintDeliverable, workOrder: WorkItemRecord | undefined, execution: ExecutionRecord) {
    const existingApproval = findReviewApproval(deliverable, execution)
    if (existingApproval) return existingApproval
    const correlationMetadata = execution.executionRequest?.correlationMetadata ?? {}
    const isRevision = correlationMetadata.isRevision === 'true'

    return approvalStore.addApproval({
      title: `Review ${isRevision ? 'revised ' : ''}${deliverable.name} draft for ${activeProject.name}`,
      description: [
        `A provider execution completed successfully and produced a ${isRevision ? 'revised ' : ''}draft ${deliverable.name} for CEO review.`,
        '',
        `Project: ${activeProject.projectId} · ${activeProject.name}`,
        `Blueprint Deliverable: ${deliverable.name}`,
        `Work Order: ${workOrder?.workOrder?.workOrderId ?? workOrder?.workItemId ?? execution.workOrder?.workOrderId ?? 'Not linked'}`,
        `Execution Request: ${execution.executionRequest?.requestId ?? 'Not linked'}`,
        `Execution Record: ${execution.executionId}`,
        `Provider: ${execution.result?.provider?.name ?? 'Not recorded'}`,
        `Model: ${execution.result?.model?.name ?? 'Not recorded'}`,
        ...(isRevision ? [
          '',
          `Revision Attempt: ${correlationMetadata.revisionAttempt ?? 'Not recorded'}`,
          `Revision Instructions: ${correlationMetadata.revisionInstructions ?? 'Not recorded'}`,
          `Original Execution: ${correlationMetadata.originalExecutionId ?? correlationMetadata.originalExecutionRecordId ?? 'Not recorded'}`,
        ] : []),
      ].join('\n'),
      submittedBy: 'AI Operator OS',
      operator: 'System',
      department: activeProject.departmentName,
      relatedIssue: workOrder?.workItemId ?? execution.executionRequest?.workItemId ?? execution.executionId,
      recommendationId: '',
      priority: activeProject.priority,
      effort: 'Medium',
      risk: 'Low',
      status: 'Pending',
      requiresCEOApproval: true,
      submittedAt: new Date().toISOString(),
      businessValue: 'CEO review is required before this draft can become an approved Blueprint deliverable.',
      supportingEvidence: [
        `Project: ${activeProject.projectId}`,
        `Deliverable: ${deliverable.name}`,
        `Execution Record: ${execution.executionId}`,
        `Execution Result: ${execution.result?.resultId ?? 'Not recorded'}`,
        ...(isRevision ? [
          `Revision Attempt: ${correlationMetadata.revisionAttempt ?? 'Not recorded'}`,
          `Original Review: ${correlationMetadata.revisionSourceReviewHistoryId ?? 'Not recorded'}`,
          `Original Execution: ${correlationMetadata.originalExecutionId ?? correlationMetadata.originalExecutionRecordId ?? 'Not recorded'}`,
        ] : []),
        'No publishing, sending, or external action is triggered by this review.',
      ],
      recommendedNextAction: `Open project ${activeProject.projectId}, review the ${isRevision ? 'revised ' : ''}${deliverable.name} draft, then choose Approve, Needs Revision, or Fully Reject.`,
      sourceWorkItemId: workOrder?.id ?? execution.executionRequest?.workItemRecordId,
      sourceProjectId: activeProject.id,
      sourceBusinessId: activeProject.businessId,
      sourceExecutionRecordId: execution.id,
      sourceExecutionId: execution.executionId,
      sourceExecutionRequestId: execution.executionRequest?.requestId,
      sourceBlueprintDeliverableId: deliverable.id,
      sourceBlueprintDeliverableName: deliverable.name,
      sourceResultId: execution.result?.resultId,
      sourceReviewStatus: isRevision ? 'Revision Draft' : 'Draft',
    })
  }

  function applyDraftForReview(deliverable: ProductionBlueprintDeliverable, workOrder: WorkItemRecord | undefined, execution: ExecutionRecord | undefined) {
    const responseText = execution?.result?.responseText ?? ''
    if (!execution?.result?.success || !responseText.trim()) {
      setExecutionRequestNotice('Draft review blocked: a successful structured execution result is required before applying a draft.')
      return
    }

    if (deliverable.appliedResultId === execution.result.resultId) {
      setExecutionRequestNotice(`${deliverable.name} already references this execution result. No duplicate draft application or review item was created.`)
      return
    }

    const correlationMetadata = execution.executionRequest?.correlationMetadata ?? {}
    const isRevision = correlationMetadata.isRevision === 'true'
    const approval = createDraftReviewApproval(deliverable, workOrder, execution)
    const timestamp = new Date().toISOString()
    persistBlueprintDeliverable(deliverable.id, {
      status: 'Draft',
      content: responseText,
      reviewStatus: 'Draft',
      activeReview: true,
      draftContent: responseText,
      approvedContent: deliverable.approvedContent,
      appliedExecutionRecordId: execution.id,
      appliedExecutionId: execution.executionId,
      appliedExecutionRequestId: execution.executionRequest?.requestId,
      appliedResultId: execution.result.resultId,
      appliedWorkItemId: workOrder?.id ?? execution.executionRequest?.workItemRecordId,
      appliedWorkOrderId: workOrder?.workOrder?.workOrderId ?? execution.workOrder?.workOrderId,
      reviewApprovalId: approval.id,
      reviewFeedback: undefined,
      rejectionReason: undefined,
      reviewedAt: undefined,
      metadata: {
        ...deliverable.metadata,
        latestDraftExecutionRecordId: execution.id,
        latestDraftExecutionId: execution.executionId,
        latestDraftResultId: execution.result.resultId,
        latestDraftIsRevision: isRevision ? 'true' : 'false',
        latestRevisionAttempt: isRevision ? correlationMetadata.revisionAttempt ?? '' : deliverable.metadata.latestRevisionAttempt ?? '',
      },
      reviewHistory: [
        {
          id: reviewHistoryId(),
          decision: 'Draft Applied',
          actor: 'AI Operator OS',
          note: `${isRevision ? 'Revised draft' : 'Draft'} applied from ${execution.executionId} and queued for CEO review.`,
          createdAt: timestamp,
          executionRecordId: execution.id,
          executionId: execution.executionId,
          executionRequestId: execution.executionRequest?.requestId,
          resultId: execution.result.resultId,
          workItemId: workOrder?.id ?? execution.executionRequest?.workItemRecordId,
          workOrderId: workOrder?.workOrder?.workOrderId ?? execution.workOrder?.workOrderId,
          approvalId: approval.id,
          metadata: {
            ...correlationMetadata,
            draftContentSnapshot: responseText,
            reviewApprovalId: approval.id,
          },
        },
        ...deliverable.reviewHistory,
      ],
    })
    setExecutionRequestNotice(`${deliverable.name} ${isRevision ? 'revised ' : ''}draft applied and CEO notification created in the Approval Queue.`)
  }

  function recordReviewDecision(deliverable: ProductionBlueprintDeliverable, decision: 'Approved' | 'Needs Revision' | 'Rejected', note = '') {
    if (!deliverable.activeReview && deliverable.reviewStatus !== 'Draft') {
      setExecutionRequestNotice(`Review decision blocked: ${deliverable.name} does not have an active draft review.`)
      return
    }

    const timestamp = new Date().toISOString()
    const reviewApproval = findReviewApproval(deliverable)
    if (reviewApproval) {
      approvalStore.updateStatus(
        reviewApproval.id,
        decision === 'Approved' ? 'Approved' : decision === 'Needs Revision' ? 'Changes Requested' : 'Rejected',
        note,
      )
    }

    persistBlueprintDeliverable(deliverable.id, {
      status: decision === 'Approved' ? 'Complete' : 'Draft',
      content: deliverable.draftContent || deliverable.content,
      reviewStatus: decision,
      activeReview: false,
      approvedContent: decision === 'Approved' ? (deliverable.draftContent || deliverable.content) : deliverable.approvedContent,
      reviewFeedback: decision === 'Needs Revision' ? note : deliverable.reviewFeedback,
      rejectionReason: decision === 'Rejected' ? note : deliverable.rejectionReason,
      reviewedAt: timestamp,
      reviewHistory: [
        {
          id: reviewHistoryId(),
          decision,
          actor: 'CEO',
          note: note || (decision === 'Approved'
            ? 'Approved by CEO.'
            : decision === 'Rejected'
              ? 'Fully rejected by CEO.'
              : 'Revision requested by CEO.'),
          createdAt: timestamp,
          executionRecordId: deliverable.appliedExecutionRecordId,
          executionId: deliverable.appliedExecutionId,
          executionRequestId: deliverable.appliedExecutionRequestId,
          resultId: deliverable.appliedResultId,
          workItemId: deliverable.appliedWorkItemId,
          workOrderId: deliverable.appliedWorkOrderId,
          approvalId: reviewApproval?.id ?? deliverable.reviewApprovalId,
          metadata: {
            reviewedDraftContent: deliverable.draftContent || deliverable.content,
            sourceReviewStatus: deliverable.reviewStatus,
          },
        },
        ...deliverable.reviewHistory,
      ],
    })

    const decisionLabel = decision === 'Rejected' ? 'Fully Reject' : decision
    setExecutionRequestNotice(`${deliverable.name} review decision recorded: ${decisionLabel}.`)
  }

  function openReviewModal(type: ReviewModalState['type'], deliverable: ProductionBlueprintDeliverable) {
    setReviewModal({ type, deliverableId: deliverable.id })
    setReviewNote('')
  }

  function closeReviewModal() {
    setReviewModal(undefined)
    setReviewNote('')
  }

  function submitReviewModal() {
    if (!reviewModal) return
    const deliverable = activeDraft.productionBlueprint?.deliverables.find((item) => item.id === reviewModal.deliverableId)
    if (!deliverable) {
      setExecutionRequestNotice('Review decision blocked: Blueprint deliverable is no longer available.')
      closeReviewModal()
      return
    }

    const note = reviewNote.trim()
    if (reviewModal.type === 'Needs Revision' && note.length === 0) {
      setExecutionRequestNotice('Needs Revision requires written feedback before it can be submitted.')
      return
    }

    recordReviewDecision(deliverable, reviewModal.type === 'Needs Revision' ? 'Needs Revision' : 'Rejected', note)
    closeReviewModal()
  }

  const blueprintCompletion = useMemo(() => {
    const deliverables = draft?.productionBlueprint?.deliverables ?? []
    if (deliverables.length === 0) return { complete: 0, total: 0, percent: 0 }
    const complete = deliverables.filter((deliverable) => deliverable.status === 'Complete').length
    return {
      complete,
      total: deliverables.length,
      percent: Math.round((complete / deliverables.length) * 100),
    }
  }, [draft?.productionBlueprint?.deliverables])

  const shortFormPlanningReady = useMemo(() => {
    if (draft?.businessAsset?.assetType !== 'Short-Form Video') return false
    const targetsReady = draft.businessAsset.targetPlatforms.length > 0
    const deliverables = draft.productionBlueprint?.blueprintType === 'Short-Form Video Blueprint'
      ? draft.productionBlueprint.deliverables
      : []
    const deliverablesReady = deliverables.length > 0 && deliverables.every((deliverable) =>
      Boolean(deliverable.approvedContent.trim() || deliverable.draftContent.trim() || deliverable.content.trim()),
    )
    return targetsReady && deliverablesReady
  }, [draft?.businessAsset, draft?.productionBlueprint])

  const packageReadiness = useMemo(() => {
    const deliverables = draft?.productionBlueprint?.deliverables ?? []
    const blocked = deliverables.filter((deliverable) =>
      deliverable.reviewStatus !== 'Approved' ||
      deliverable.approvedContent.trim().length === 0
    )

    return {
      ready: deliverables.length > 0 && blocked.length === 0,
      blocked,
    }
  }, [draft?.productionBlueprint?.deliverables])

  function createCreativeAssetPackage() {
    const blueprint = activeDraft.productionBlueprint
    const businessAsset = activeDraft.businessAsset
    if (!blueprint?.enabled || !businessAsset?.enabled) {
      setExecutionRequestNotice('Creative Asset Package blocked: Business Asset and Production Blueprint are required.')
      return
    }

    const blockedDeliverables = blueprint.deliverables.filter((deliverable) =>
      deliverable.reviewStatus !== 'Approved' ||
      deliverable.approvedContent.trim().length === 0
    )
    if (blockedDeliverables.length > 0) {
      setExecutionRequestNotice(`Creative Asset Package blocked: ${blockedDeliverables.map((item) => item.name).join(', ')} must be CEO-approved before packaging.`)
      return
    }

    const timestamp = new Date().toISOString()
    const existingPackages = blueprint.creativeAssetPackages ?? []
    const nextVersion = existingPackages.reduce((highest, item) => Math.max(highest, item.packageVersion), 0) + 1
    const packageDeliverables: CreativeAssetPackageDeliverable[] = blueprint.deliverables.map((deliverable) => ({
      id: packageId(),
      deliverableId: deliverable.id,
      deliverableName: deliverable.name,
      approvedContent: deliverable.approvedContent,
      approvedAt: deliverable.reviewedAt,
      reviewApprovalId: deliverable.reviewApprovalId,
      sourceExecutionRecordId: deliverable.appliedExecutionRecordId,
      sourceExecutionId: deliverable.appliedExecutionId,
      sourceExecutionRequestId: deliverable.appliedExecutionRequestId,
      sourceResultId: deliverable.appliedResultId,
      sourceWorkItemId: deliverable.appliedWorkItemId,
      sourceWorkOrderId: deliverable.appliedWorkOrderId,
      reviewHistoryIds: deliverable.reviewHistory.map((item) => item.id),
      metadata: {
        reviewStatusAtPackaging: deliverable.reviewStatus,
        deliverableStatusAtPackaging: deliverable.status,
      },
    }))
    const assetPackage: CreativeAssetPackage = {
      id: packageId(),
      packageId: packageId(),
      projectRecordId: activeProject.id,
      projectId: activeProject.projectId,
      businessAssetType: businessAsset.assetType,
      platform: businessAsset.platform,
      targetPlatforms: businessAsset.targetPlatforms,
      blueprintType: blueprint.blueprintType,
      packageVersion: nextVersion,
      status: 'Export Ready',
      createdAt: timestamp,
      updatedAt: timestamp,
      approvalState: 'CEO Approved',
      deliverables: packageDeliverables,
      sourceReviewIds: unique(blueprint.deliverables.flatMap((deliverable) => deliverable.reviewHistory.map((item) => item.approvalId))),
      sourceExecutionRecordIds: unique(blueprint.deliverables.flatMap((deliverable) => [
        deliverable.appliedExecutionRecordId,
        ...deliverable.reviewHistory.map((item) => item.executionRecordId),
      ])),
      sourceExecutionRequestIds: unique(blueprint.deliverables.flatMap((deliverable) => [
        deliverable.appliedExecutionRequestId,
        ...deliverable.reviewHistory.map((item) => item.executionRequestId),
      ])),
      sourceWorkItemIds: unique(blueprint.deliverables.flatMap((deliverable) => [
        deliverable.appliedWorkItemId,
        ...deliverable.reviewHistory.map((item) => item.workItemId),
      ])),
      sourceWorkOrderIds: unique(blueprint.deliverables.flatMap((deliverable) => [
        deliverable.appliedWorkOrderId,
        ...deliverable.reviewHistory.map((item) => item.workOrderId),
      ])),
      sourceResultIds: unique(blueprint.deliverables.flatMap((deliverable) => [
        deliverable.appliedResultId,
        ...deliverable.reviewHistory.map((item) => item.resultId),
      ])),
      revisionLineageReferences: unique(blueprint.deliverables.flatMap(collectRevisionLineage)),
      exportFormats: ['Markdown', 'JSON'],
      metadata: {
        packageCreationPolicy: 'Manual after final CEO approval',
        publishingState: 'Not published',
        sourceOfTruth: 'Project Store / Production Blueprint',
      },
    }

    const nextBlueprint: ProductionBlueprint = {
      ...blueprint,
      creativeAssetPackages: [assetPackage, ...existingPackages],
      updatedAt: timestamp,
    }

    projectStore.updateProject(activeProject.id, { productionBlueprint: nextBlueprint })
    setDraft({ ...activeDraft, productionBlueprint: nextBlueprint, updatedAt: timestamp })
    setExecutionRequestNotice(`Creative Asset Package ${assetPackage.packageId} created as export-ready version ${assetPackage.packageVersion}. No publishing or external action occurred.`)
  }

  function createWorkOrder(deliverable: ProductionBlueprintDeliverable) {
    if (!project) return
    const workOrder = workItemStore.createWorkOrderFromBlueprintDeliverable(project, deliverable)
    if (!workOrder) {
      setExecutionRequestNotice(`${deliverable.name} is a manual production-plan deliverable in Sprint 016 Task 2 and does not create an AI Work Order.`)
      return
    }
    setExecutionRequestNotice(`${workOrder.workOrder?.workOrderId ?? workOrder.workItemId} is prepared for ${deliverable.name}.`)
  }

  function createRevisionWorkOrder(deliverable: ProductionBlueprintDeliverable) {
    if (!project) return
    const revisionWorkOrder = workItemStore.createRevisionWorkOrderFromNeedsRevision(project, deliverable)
    if (!revisionWorkOrder) {
      setExecutionRequestNotice('Revision Work Order blocked: a completed Needs Revision decision with written feedback is required.')
      return
    }

    const sourceReviewHistoryId = revisionWorkOrder.workOrder?.metadata.revisionSourceReviewHistoryId
    const alreadyRecorded = Boolean(sourceReviewHistoryId && deliverable.reviewHistory.some((item) =>
      item.decision === 'Revision Work Order Created' &&
      item.metadata?.revisionSourceReviewHistoryId === sourceReviewHistoryId,
    ))

    if (!alreadyRecorded) {
      persistBlueprintDeliverable(deliverable.id, {
        metadata: {
          ...deliverable.metadata,
          activeRevisionWorkItemId: revisionWorkOrder.id,
          activeRevisionWorkOrderId: revisionWorkOrder.workOrder?.workOrderId ?? '',
          activeRevisionSourceReviewHistoryId: sourceReviewHistoryId ?? '',
        },
        reviewHistory: [
          {
            id: reviewHistoryId(),
            decision: 'Revision Work Order Created',
            actor: 'AI Operator OS',
            note: `Manual revision Work Order ${revisionWorkOrder.workOrder?.workOrderId ?? revisionWorkOrder.workItemId} created from CEO Needs Revision feedback.`,
            createdAt: new Date().toISOString(),
            workItemId: revisionWorkOrder.id,
            workOrderId: revisionWorkOrder.workOrder?.workOrderId,
            approvalId: revisionWorkOrder.workOrder?.metadata.revisionSourceApprovalId,
            metadata: revisionWorkOrder.workOrder?.metadata ?? {},
          },
          ...deliverable.reviewHistory,
        ],
      })
    }

    setExecutionRequestNotice(`${revisionWorkOrder.workOrder?.workOrderId ?? revisionWorkOrder.workItemId} is prepared for manual revision of ${deliverable.name}.`)
  }

  function buildExecutionRequest(workItem: WorkItemRecord) {
    if (!project) return
    const result = buildExecutionRequestFromWorkOrder(workItem, project)
    if (!result.success) {
      setExecutionRequestNotice(`Execution Request blocked: ${result.errors.join(' ')}`)
      return
    }

    workItemStore.attachExecutionRequest(workItem.id, result.request)
    const warningText = result.warnings.length > 0 ? ` ${result.warnings.join(' ')}` : ''
    setExecutionRequestNotice(`Execution Request ${result.request.requestId} built for ${workItem.workOrder?.workOrderId ?? workItem.workItemId}.${warningText}`)
  }

  function createExecutionLifecycle(workItem: WorkItemRecord) {
    const execution = executionStore.createExecutionFromWorkOrder(workItem)
    if (!execution) {
      setExecutionRequestNotice('Execution lifecycle blocked: build an Execution Request before creating the lifecycle record.')
      return
    }

    setExecutionRequestNotice(`Execution Core lifecycle ${execution.executionId} established for ${execution.executionRequest?.requestId ?? workItem.workItemId}. No provider execution started.`)
  }

  async function executeProviderPath(execution: ExecutionRecord) {
    setExecutingExecutionId(execution.id)
    setExecutionRequestNotice(`Executing provider-independent path for ${execution.executionId}.`)

    try {
      const result = await executionStore.executeProviderRequest(execution.id)

      if (!result) {
        setExecutionRequestNotice('Provider execution blocked: no valid Execution Request lifecycle record was found.')
        return
      }

      setExecutionRequestNotice(result.success
        ? `Provider execution completed for ${result.execution.executionId} using ${result.provider} / ${result.model}.`
        : `Provider execution failed for ${result.execution.executionId}: ${result.errorMessage}`)
    } finally {
      setExecutingExecutionId(undefined)
    }
  }

  function retryProviderPath(execution: ExecutionRecord) {
    const retryExecution = executionStore.createRetryExecution(execution.id)
    if (!retryExecution) {
      setExecutionRequestNotice('Retry lifecycle blocked: the selected execution is not a failed provider attempt or an active retry already exists.')
      return
    }

    setExecutionRequestNotice(`Retry lifecycle ${retryExecution.executionId} established from failed execution ${execution.executionId}. The failed record remains in history and no provider execution started.`)
  }

  function createCreativeConceptWorkOrder() {
    if (!activeProject.businessAsset?.enabled) {
      setExecutionRequestNotice('Creative Concept Work Order blocked: enable Business Asset context before topic development.')
      return
    }

    if (!activeProject.creativeBrief?.enabled) {
      setExecutionRequestNotice('Creative Concept Work Order blocked: enable Creative Brief context before topic development.')
      return
    }

    const workOrder = workItemStore.createCreativeConceptWorkOrder(activeProject)
    setExecutionRequestNotice(`${workOrder.workOrder?.workOrderId ?? workOrder.workItemId} is prepared for creative concept development. Generation remains manual.`)
  }

  function appendConceptsFromExecution(execution: ExecutionRecord) {
    if (!execution.result?.success || !execution.result.responseText) {
      setExecutionRequestNotice('Creative Concept parsing blocked: a successful provider Execution Result is required.')
      return
    }

    if (execution.executionRequest?.correlationMetadata.workOrderType !== 'Develop Creative Concepts') {
      setExecutionRequestNotice('Creative Concept parsing blocked: selected execution is not a creative concept development result.')
      return
    }

    const parseResult = parseCreativeConceptCandidates(execution.result.responseText)
    if (!parseResult.success) {
      setExecutionRequestNotice(parseResult.error)
      return
    }

    const timestamp = new Date().toISOString()
    const workOrder = projectWorkOrders.find((item) =>
      item.id === execution.executionRequest?.workItemRecordId ||
      item.workOrder?.workOrderId === execution.workOrder?.workOrderId
    )
    const concepts = createCreativeConceptRecords(parseResult.candidates, {
      projectRecordId: activeProject.id,
      projectId: activeProject.projectId,
      businessAssetProjectId: activeProject.id,
      creativeBriefId: activeProject.creativeBrief?.briefId,
      selectedKnowledgeEntryIds: activeProject.creativeBrief?.selectedKnowledgeEntryIds ?? [],
      workItemRecordId: workOrder?.id ?? execution.executionRequest?.workItemRecordId,
      workItemId: workOrder?.workItemId ?? execution.executionRequest?.workItemId,
      workOrderId: workOrder?.workOrder?.workOrderId ?? execution.workOrder?.workOrderId,
      executionRequestId: execution.executionRequest?.requestId,
      executionRecordId: execution.id,
      executionId: execution.executionId,
      executionResultId: execution.result.resultId,
      providerName: execution.result.provider?.name,
      modelName: execution.result.model?.name,
      capability: execution.executionRequest?.requestedCapability,
    }, timestamp)

    const existingConcepts = activeProject.creativeConcepts ?? []
    const nextConcepts = [...concepts, ...existingConcepts]
    projectStore.updateProject(activeProject.id, { creativeConcepts: nextConcepts })
    setDraft({ ...activeDraft, creativeConcepts: nextConcepts, updatedAt: timestamp })
    setExecutionRequestNotice(`${concepts.length} creative concepts were parsed and saved. Previous concepts were preserved.`)
  }

  function selectCreativeConcept(conceptId: string) {
    const timestamp = new Date().toISOString()
    const nextConcepts = (activeProject.creativeConcepts ?? []).map((concept): CreativeConcept => ({
      ...concept,
      selected: concept.conceptId === conceptId,
      status: concept.conceptId === conceptId ? 'Selected' : concept.status === 'Selected' ? 'Generated' : concept.status,
      updatedAt: concept.conceptId === conceptId || concept.status === 'Selected' ? timestamp : concept.updatedAt,
    }))

    projectStore.updateProject(activeProject.id, { creativeConcepts: nextConcepts })
    setDraft({ ...activeDraft, creativeConcepts: nextConcepts, updatedAt: timestamp })
    setExecutionRequestNotice('Creative concept selected for planning only. No Blueprint, Work Order, execution, package, publishing, upload, or external action was triggered.')
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/projects" className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-white">
          <ArrowLeft size={15} /> Back to Projects
        </Link>
        <p className="eyebrow mb-2">Project Detail · {project.projectId}</p>
        <h2 className="m-0 font-display text-3xl font-semibold tracking-tight text-white">{project.name}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#8f9b95]">{project.description}</p>
      </div>

      <section className="panel border-lime/20 bg-gradient-to-br from-lime/[0.07] to-white/[0.025] p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-lime/10 text-lime">
            <FolderKanban size={18} />
          </div>
          <div>
            <p className="eyebrow mb-1">Executive Summary</p>
            <h3 className="m-0 font-display text-xl font-semibold text-white">Project operating container</h3>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
          <Info label="Project ID" value={project.projectId} />
          <Info label="Business" value={project.businessCode} />
          <Info label="Department" value={project.departmentName} />
          <Info label="Manager" value={project.managerName} />
          <Info label="Status" value={project.status} />
          <Info label="Progress" value={`${project.progress}%`} />
          <Info label="Updated" value={formatDate(project.updatedAt)} />
        </div>
      </section>

      <ProjectLifecycle status={project.status} />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Section title="Identity" eyebrow="Editable project record">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Project Name</span>
                <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="field" />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Description</span>
                <textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className="field min-h-[100px]" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Business</span>
                <select value={draft.businessId} onChange={(event) => selectBusiness(event.target.value)} className="field">
                  {businessStore.businesses.map((business) => (
                    <option key={business.id} value={business.id}>{business.businessId} · {business.name}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Department Owner</span>
                <select value={draft.departmentId} onChange={(event) => selectDepartment(event.target.value)} className="field" disabled={departments.length === 0}>
                  {departments.map((department: DepartmentRecord) => (
                    <option key={department.id} value={department.id}>{department.departmentId} · {department.departmentName}</option>
                  ))}
                </select>
              </label>
              <Info label="Assigned Manager" value={draft.managerName} />
              <Info label="Created" value={formatDate(project.createdAt)} />
            </div>
          </Section>

          <Section title="Progress" eyebrow="Manual planning status">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Status</span>
                <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as ProjectStatus })} className="field">
                  {projectStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Priority</span>
                <select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as ProjectPriority })} className="field">
                  {projectPriorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Progress</span>
                <input type="number" min={0} max={100} value={draft.progress} onChange={(event) => setDraft({ ...draft, progress: Number(event.target.value) })} className="field" />
              </label>
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Completion Bar</span>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full bg-lime" style={{ width: `${draft.progress}%` }} />
                </div>
              </div>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Start Date</span>
                <input type="date" value={draft.startDate} onChange={(event) => setDraft({ ...draft, startDate: event.target.value })} className="field" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Target Date</span>
                <input type="date" value={draft.targetDate} onChange={(event) => setDraft({ ...draft, targetDate: event.target.value })} className="field" />
              </label>
            </div>
          </Section>

          <Section title="Business Asset" eyebrow="Reusable creative production profile">
            <label className="flex items-start gap-3 rounded-2xl border border-line bg-ink/35 p-4">
              <input
                type="checkbox"
                checked={Boolean(draft.businessAsset?.enabled)}
                onChange={(event) => {
                  const businessAsset = draft.businessAsset ?? defaultBusinessAsset(draft)
                  setDraft({
                    ...draft,
                    businessAsset: event.target.checked ? businessAsset : undefined,
                    shortFormProduction: event.target.checked && businessAsset.assetType === 'Short-Form Video'
                      ? draft.shortFormProduction ?? defaultShortFormProduction(draft)
                      : draft.shortFormProduction,
                  })
                }}
                className="mt-1 h-4 w-4 accent-lime"
              />
              <span>
                <span className="block text-sm font-semibold text-white">Enable Business Asset profile</span>
                <span className="mt-1 block text-sm leading-6 text-muted">
                  Business Assets extend this Project record. Short-Form Video is the primary operating direction; existing YouTube Video records remain supported without a new Project system.
                </span>
              </span>
            </label>

            {draft.businessAsset?.enabled ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Asset Type</span>
                  <select
                    value={draft.businessAsset.assetType}
                    onChange={(event) => updateBusinessAsset({ assetType: event.target.value as BusinessAssetType })}
                    className="field"
                    disabled={Boolean(draft.productionBlueprint?.enabled)}
                  >
                    {businessAssetTypes.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                  {draft.productionBlueprint?.enabled ? (
                    <span className="block text-xs leading-5 text-muted">Asset type is locked while a Production Blueprint exists, protecting its deliverables and history.</span>
                  ) : null}
                </label>
                <Info label="Platform Model" value={draft.businessAsset.platform} />
                {draft.businessAsset.assetType === 'Short-Form Video' ? (
                  <div className="space-y-3 md:col-span-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Target Platforms</span>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {shortFormPlatforms.map((platform) => (
                        <label key={platform} className="flex items-center gap-3 rounded-xl border border-line bg-ink/35 p-3">
                          <input
                            type="checkbox"
                            checked={draft.businessAsset?.targetPlatforms.includes(platform) ?? false}
                            onChange={() => toggleShortFormPlatform(platform)}
                            className="h-4 w-4 accent-lime"
                          />
                          <span className="text-sm font-semibold text-white">{platform}</span>
                        </label>
                      ))}
                    </div>
                    <p className="m-0 text-xs leading-5 text-muted">
                      Select one or more destinations. The production capability remains shared; selecting platforms does not publish or connect an account.
                    </p>
                  </div>
                ) : null}
                <label className="space-y-2 md:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Topic</span>
                  <input value={draft.businessAsset.topic} onChange={(event) => updateBusinessAsset({ topic: event.target.value })} className="field" placeholder="What should this asset be about?" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Goal</span>
                  <input value={draft.businessAsset.goal} onChange={(event) => updateBusinessAsset({ goal: event.target.value })} className="field" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Target Audience</span>
                  <input value={draft.businessAsset.targetAudience} onChange={(event) => updateBusinessAsset({ targetAudience: event.target.value })} className="field" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Tone</span>
                  <input value={draft.businessAsset.tone} onChange={(event) => updateBusinessAsset({ tone: event.target.value })} className="field" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Target Length</span>
                  <input value={draft.businessAsset.targetLength} onChange={(event) => updateBusinessAsset({ targetLength: event.target.value })} className="field" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Production Stage</span>
                  <select value={draft.businessAsset.currentProductionStage} onChange={(event) => updateBusinessAsset({ currentProductionStage: event.target.value as BusinessAssetProfile['currentProductionStage'] })} className="field">
                    {businessAssetProductionStages.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Production Status</span>
                  <select value={draft.businessAsset.productionStatus} onChange={(event) => updateBusinessAsset({ productionStatus: event.target.value as BusinessAssetProfile['productionStatus'] })} className="field">
                    {businessAssetProductionStatuses.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                <Info label="Department" value={draft.departmentName} />
                <Info label="Business Asset Created" value={formatDate(draft.businessAsset.createdAt)} />
                <label className="space-y-2 md:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Additional Notes</span>
                  <textarea value={draft.businessAsset.additionalNotes} onChange={(event) => updateBusinessAsset({ additionalNotes: event.target.value })} className="field min-h-[100px]" />
                </label>
              </div>
            ) : (
              <Placeholder text="This is a normal Project. Enable the Business Asset profile to prepare it for Creative Production Engine workflows." />
            )}

            <button onClick={() => save(project, draft)} className="btn-primary mt-4">Save Business Asset</button>
          </Section>

          {draft.businessAsset?.enabled ? (
            <Section title="Creative Brief" eyebrow="Structured upstream production context">
              <p className="m-0 mb-4 text-sm leading-6 text-muted">
                Creative Brief composes production direction for this Business Asset without duplicating Business Asset fields or copying Knowledge Workspace content. It does not generate, execute, approve, package, publish, or create Blueprints.
              </p>

              <label className="mb-4 flex items-start gap-3 rounded-2xl border border-line bg-ink/35 p-4">
                <input
                  type="checkbox"
                  checked={Boolean(draft.creativeBrief?.enabled)}
                  onChange={(event) => {
                    const existingBrief = draft.creativeBrief ?? defaultCreativeBrief(draft)
                    setDraft({
                      ...draft,
                      creativeBrief: {
                        ...existingBrief,
                        enabled: event.target.checked,
                        updatedAt: new Date().toISOString(),
                      },
                    })
                  }}
                  className="mt-1 h-4 w-4 accent-lime"
                />
                <span>
                  <span className="block text-sm font-semibold text-white">Enable Creative Brief</span>
                  <span className="mt-1 block text-sm leading-6 text-muted">
                    Creative Brief is stored on the existing Project record. It references Knowledge entries by ID and uses inherited Business Asset context as the source of truth.
                  </span>
                </span>
              </label>

              {draft.creativeBrief?.enabled ? (
                <div className="space-y-5">
                  <div className="grid gap-3 md:grid-cols-4">
                    <Info label="Brief ID" value={draft.creativeBrief.briefId} />
                    <Info label="Owner" value="Project Store" />
                    <Info label="Created" value={formatDate(draft.creativeBrief.createdAt)} />
                    <Info label="Updated" value={formatDate(draft.creativeBrief.updatedAt)} />
                  </div>

                  <div className="rounded-2xl border border-line bg-ink/35 p-4">
                    <p className="eyebrow mb-3">Inherited Business Asset Context</p>
                    <div className="grid gap-3 md:grid-cols-4">
                      <Info label="Topic" value={draft.businessAsset.topic || 'Not specified'} />
                      <Info label="Goal" value={draft.businessAsset.goal || 'Not specified'} />
                      <Info label="Audience" value={draft.businessAsset.targetAudience || 'Not specified'} />
                      <Info label="Tone" value={draft.businessAsset.tone || 'Not specified'} />
                      <Info label="Target Length" value={draft.businessAsset.targetLength || 'Not specified'} />
                      <Info label="Platform" value={draft.businessAsset.platform || 'Not specified'} />
                      <Info label="Asset Type" value={draft.businessAsset.assetType} />
                      <Info label="Source" value="Business Asset profile" />
                    </div>
                    <p className="m-0 mt-3 text-xs leading-5 text-muted">
                      Edit inherited context in the Business Asset section. Creative Brief does not create override copies.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Brief Status</span>
                      <select value={draft.creativeBrief.status} onChange={(event) => updateCreativeBrief({ status: event.target.value as CreativeBriefStatus })} className="field">
                        {creativeBriefStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </label>
                    <Info label="Persistence" value="ai-operator-os-projects-v1" />
                    <label className="space-y-2 md:col-span-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Offer / Business Context</span>
                      <textarea value={draft.creativeBrief.offerContext} onChange={(event) => updateCreativeBrief({ offerContext: event.target.value })} className="field min-h-[88px]" />
                    </label>
                    <label className="space-y-2 md:col-span-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Key Message</span>
                      <textarea value={draft.creativeBrief.keyMessage} onChange={(event) => updateCreativeBrief({ keyMessage: event.target.value })} className="field min-h-[88px]" />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Call To Action</span>
                      <textarea value={draft.creativeBrief.callToAction} onChange={(event) => updateCreativeBrief({ callToAction: event.target.value })} className="field min-h-[88px]" />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Constraints</span>
                      <textarea value={draft.creativeBrief.constraints} onChange={(event) => updateCreativeBrief({ constraints: event.target.value })} className="field min-h-[88px]" />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Required Inclusions</span>
                      <textarea value={draft.creativeBrief.requiredInclusions} onChange={(event) => updateCreativeBrief({ requiredInclusions: event.target.value })} className="field min-h-[88px]" />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Prohibited Content</span>
                      <textarea value={draft.creativeBrief.prohibitedContent} onChange={(event) => updateCreativeBrief({ prohibitedContent: event.target.value })} className="field min-h-[88px]" />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Platform Instructions</span>
                      <textarea value={draft.creativeBrief.platformInstructions} onChange={(event) => updateCreativeBrief({ platformInstructions: event.target.value })} className="field min-h-[88px]" />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Asset Instructions</span>
                      <textarea value={draft.creativeBrief.assetInstructions} onChange={(event) => updateCreativeBrief({ assetInstructions: event.target.value })} className="field min-h-[88px]" />
                    </label>
                  </div>

                  <div className="rounded-2xl border border-line bg-ink/35 p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="eyebrow mb-1">Knowledge References</p>
                        <h4 className="m-0 font-display text-base font-semibold text-white">Selected Knowledge Workspace Entries</h4>
                      </div>
                      <span className="rounded-full border border-line px-3 py-1 text-xs text-muted">
                        {draft.creativeBrief.selectedKnowledgeEntryIds.length} selected
                      </span>
                    </div>
                    {draft.knowledgeWorkspace?.enabled && draft.knowledgeWorkspace.entries.length > 0 ? (
                      <div className="space-y-3">
                        {knowledgeEntriesBySection.map(({ section, entries }) => entries.length > 0 ? (
                          <div key={section} className="rounded-xl border border-line bg-white/[0.02] p-3">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">{section}</p>
                            <div className="space-y-2">
                              {entries.map((entry) => (
                                <label key={entry.id} className="flex items-start gap-3 rounded-lg border border-line bg-ink/30 p-3">
                                  <input
                                    type="checkbox"
                                    checked={draft.creativeBrief?.selectedKnowledgeEntryIds.includes(entry.id) ?? false}
                                    onChange={() => toggleCreativeBriefKnowledgeEntry(entry.id)}
                                    className="mt-1 h-4 w-4 accent-lime"
                                  />
                                  <span>
                                    <span className="block text-sm font-semibold text-white">{entry.title}</span>
                                    <span className="mt-1 block text-xs leading-5 text-muted">
                                      {entry.url ? `${entry.url} · ` : ''}{entry.tags.length > 0 ? entry.tags.join(', ') : 'No tags'}
                                    </span>
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ) : null)}
                      </div>
                    ) : (
                      <Placeholder text="Enable Knowledge Workspace and add entries to reference them from the Creative Brief." />
                    )}
                    {draft.creativeBrief.selectedKnowledgeEntryIds.some((entryId) => !draft.knowledgeWorkspace?.entries.some((entry) => entry.id === entryId)) ? (
                      <p className="m-0 mt-3 text-xs leading-5 text-orange-200">
                        One or more selected Knowledge references no longer resolve to an existing entry. The reference IDs remain stored for safe review.
                      </p>
                    ) : null}
                  </div>

                  <button onClick={() => save(project, draft)} className="btn-primary">Save Creative Brief</button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Placeholder text="Enable Creative Brief to add upstream production direction before Blueprint work begins. Existing Creative Brief data remains stored when disabled." />
                  {draft.creativeBrief ? (
                    <button onClick={() => save(project, draft)} className="btn-secondary">Save Creative Brief Setting</button>
                  ) : null}
                </div>
              )}
            </Section>
          ) : null}

          {draft.businessAsset?.enabled ? (
            <Section title="Knowledge Workspace" eyebrow="Structured production knowledge">
              <p className="m-0 mb-4 text-sm leading-6 text-muted">
                Store project knowledge for this Business Asset. Task 2 keeps this local, structured, and reusable for future departments without adding a separate knowledge store.
              </p>

              <label className="mb-4 flex items-start gap-3 rounded-2xl border border-line bg-ink/35 p-4">
                <input
                  type="checkbox"
                  checked={Boolean(draft.knowledgeWorkspace?.enabled)}
                  onChange={(event) => {
                    setDraft({
                      ...draft,
                      knowledgeWorkspace: event.target.checked ? draft.knowledgeWorkspace ?? defaultKnowledgeWorkspace(draft) : undefined,
                    })
                  }}
                  className="mt-1 h-4 w-4 accent-lime"
                />
                <span>
                  <span className="block text-sm font-semibold text-white">Enable Knowledge Workspace</span>
                  <span className="mt-1 block text-sm leading-6 text-muted">
                    Knowledge entries are stored on this Project record and organized by reusable sections.
                  </span>
                </span>
              </label>

              {draft.knowledgeWorkspace?.enabled ? (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-line bg-ink/35 p-4">
                    <p className="eyebrow mb-3">Add Knowledge</p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Section</span>
                        <select value={knowledgeSection} onChange={(event) => setKnowledgeSection(event.target.value as ProjectKnowledgeSection)} className="field">
                          {projectKnowledgeSections.map((section) => <option key={section} value={section}>{section}</option>)}
                        </select>
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Title</span>
                        <input value={knowledgeTitle} onChange={(event) => setKnowledgeTitle(event.target.value)} className="field" placeholder="Audience insight, source, keyword..." />
                      </label>
                      <label className="space-y-2 md:col-span-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Content</span>
                        <textarea value={knowledgeContent} onChange={(event) => setKnowledgeContent(event.target.value)} className="field min-h-[92px]" placeholder="What did we learn?" />
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Reference URL</span>
                        <input value={knowledgeUrl} onChange={(event) => setKnowledgeUrl(event.target.value)} className="field" placeholder="https://..." />
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Tags</span>
                        <input value={knowledgeTags} onChange={(event) => setKnowledgeTags(event.target.value)} className="field" placeholder="Comma-separated tags" />
                      </label>
                    </div>
                    <button onClick={addKnowledgeEntry} className="btn-primary mt-4">Add Knowledge Entry</button>
                  </div>

                  <div className="space-y-4">
                    {knowledgeEntriesBySection.map(({ section, entries }) => (
                      <div key={section} className="rounded-2xl border border-line bg-white/[0.02] p-4">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <h4 className="m-0 font-display text-base font-semibold text-white">{section}</h4>
                          <span className="rounded-full border border-line px-3 py-1 text-xs text-muted">{entries.length} entries</span>
                        </div>
                        {entries.length > 0 ? (
                          <div className="space-y-3">
                            {entries.map((entry) => (
                              <KnowledgeEntryEditor
                                key={entry.id}
                                entry={entry}
                                onUpdate={(updates) => updateKnowledgeEntry(entry.id, updates)}
                                onDelete={() => deleteKnowledgeEntry(entry.id)}
                              />
                            ))}
                          </div>
                        ) : (
                          <p className="m-0 text-sm leading-6 text-muted">No {section.toLowerCase()} recorded yet.</p>
                        )}
                      </div>
                    ))}
                  </div>

                  <button onClick={() => save(project, draft)} className="btn-primary">Save Knowledge Workspace</button>
                </div>
              ) : (
                <Placeholder text="Enable the Knowledge Workspace to collect structured research, references, keywords, CEO notes, and ideas for this Business Asset." />
              )}
            </Section>
          ) : null}

          {draft.businessAsset?.enabled && draft.creativeBrief?.enabled ? (
            <Section title="Creative Concepts" eyebrow="AI topic development foundation">
              <p className="m-0 mb-4 text-sm leading-6 text-muted">
                Generate exactly {CREATIVE_CONCEPT_CANDIDATE_COUNT} reusable creative topic/concept candidates from Business Asset context, Creative Brief direction, and selected Knowledge references. Concepts are Project-owned planning records and do not modify Blueprints, create downstream work, publish, or trigger autonomy.
              </p>

              {executionRequestNotice ? (
                <div className="mb-4 rounded-xl border border-lime/20 bg-lime/[0.06] p-3 text-sm text-lime">
                  {executionRequestNotice}
                </div>
              ) : null}

              <CreativeConceptDevelopmentPanel
                project={activeProject}
                workOrders={projectWorkOrders.filter((item) => item.workOrder?.workOrderType === 'Develop Creative Concepts')}
                executions={executionStore.executions}
                executingExecutionId={executingExecutionId}
                onCreateWorkOrder={createCreativeConceptWorkOrder}
                onBuildRequest={buildExecutionRequest}
                onCreateLifecycle={createExecutionLifecycle}
                onExecuteProviderPath={executeProviderPath}
                onParseConcepts={appendConceptsFromExecution}
                onSelectConcept={selectCreativeConcept}
              />
            </Section>
          ) : null}

          {draft.businessAsset?.enabled ? (
            <Section title="Creative Cost Visibility" eyebrow="Read-only execution cost summary">
              <CreativeCostVisibilityPanel summary={creativeCostSummary} />
            </Section>
          ) : null}

          {draft.businessAsset?.enabled ? (
            <Section title="Production Blueprint" eyebrow="Reusable production contract">
              <p className="m-0 mb-4 text-sm leading-6 text-muted">
                Define what this Business Asset must produce. The Blueprint is a planning contract only; it does not generate, execute, export, or publish content.
              </p>

              <label className="mb-4 flex items-start gap-3 rounded-2xl border border-line bg-ink/35 p-4">
                <input
                  type="checkbox"
                  checked={Boolean(draft.productionBlueprint?.enabled)}
                  onChange={(event) => {
                    const productionBlueprint = draft.productionBlueprint ?? defaultProductionBlueprint(draft)
                    setDraft({
                      ...draft,
                      productionBlueprint: event.target.checked ? productionBlueprint : undefined,
                      shortFormProduction: event.target.checked && draft.businessAsset?.assetType === 'Short-Form Video'
                        ? draft.shortFormProduction ?? defaultShortFormProduction(draft)
                        : draft.shortFormProduction,
                    })
                  }}
                  className="mt-1 h-4 w-4 accent-lime"
                />
                <span>
                  <span className="block text-sm font-semibold text-white">Enable Production Blueprint</span>
                  <span className="mt-1 block text-sm leading-6 text-muted">
                    Blueprint requirements follow the selected asset type. Short-Form Video and existing YouTube Video reuse the same Project-owned production architecture.
                  </span>
                </span>
              </label>

              {draft.productionBlueprint?.enabled ? (
                <div className="space-y-5">
                  <div className="grid gap-3 md:grid-cols-4">
                    <Info label="Blueprint Type" value={draft.productionBlueprint.blueprintType} />
                    <Info label="Asset Type" value={draft.productionBlueprint.assetType} />
                    <Info label="Complete" value={`${blueprintCompletion.complete}/${blueprintCompletion.total}`} />
                    <Info label="Progress" value={`${blueprintCompletion.percent}%`} />
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full bg-lime" style={{ width: `${blueprintCompletion.percent}%` }} />
                  </div>

                  <div className="grid gap-4">
                    {draft.productionBlueprint.deliverables.map((deliverable) => (
                      <BlueprintDeliverableEditor
                        key={deliverable.id}
                        deliverable={deliverable}
                        onUpdate={(updates) => updateBlueprintDeliverable(deliverable.id, updates)}
                      />
                    ))}
                  </div>

                  <CreativeAssetPackagePanel
                    project={activeProject}
                    blueprint={draft.productionBlueprint}
                    ready={packageReadiness.ready}
                    blockedDeliverables={packageReadiness.blocked.map((deliverable) => deliverable.name)}
                    onCreatePackage={createCreativeAssetPackage}
                  />

                  <button onClick={() => save(project, draft)} className="btn-primary">Save Production Blueprint</button>
                </div>
              ) : (
                <Placeholder text={draft.businessAsset.assetType === 'Short-Form Video'
                  ? 'Enable the Production Blueprint to define the Hook, Script, Shot and Visual Plan, On-Screen Text and Audio Plan, Caption/CTA/Platform Metadata, and Source Asset Requirements.'
                  : 'Enable the Production Blueprint to define the Title, Hook, Script, Description, Tags, and Thumbnail Concept required for this YouTube Business Asset.'}
                />
              )}
            </Section>
          ) : null}

          {draft.businessAsset?.assetType === 'Short-Form Video' && draft.shortFormProduction?.enabled ? (
            <Section title="Short-Form Production Foundation" eyebrow="Shared operating readiness">
              <p className="m-0 mb-4 text-sm leading-6 text-muted">
                This Project-owned record tracks whether the shared production plan is ready. It does not create a finished video, perform QA, publish, schedule, or call an external platform.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                <Info label="Production ID" value={draft.shortFormProduction.productionId} />
                <Info
                  label="Target Platforms"
                  value={draft.businessAsset.targetPlatforms.length > 0 ? draft.businessAsset.targetPlatforms.join(', ') : 'Required'}
                />
                <Info label="Planning Readiness" value={shortFormPlanningReady ? 'Complete' : 'Incomplete'} />
                <label className="space-y-2 md:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Foundation Status</span>
                  <select
                    value={draft.shortFormProduction.status}
                    onChange={(event) => updateShortFormProduction({ status: event.target.value as ShortFormProductionProfile['status'] })}
                    className="field"
                  >
                    {shortFormProductionStatuses
                      .filter((status) => status === 'Not Started' || status === 'Ready')
                      .map((status) => (
                        <option key={status} value={status} disabled={status === 'Ready' && !shortFormPlanningReady}>{status}</option>
                      ))}
                  </select>
                  <span className="block text-xs leading-5 text-muted">
                    Ready requires at least one target platform and content in every Short-Form Blueprint deliverable.
                  </span>
                </label>
              </div>
              {!shortFormPlanningReady ? (
                <div className="mt-4 rounded-xl border border-orange-300/25 bg-orange-300/[0.05] p-3 text-sm leading-6 text-orange-100">
                  Complete the target-platform selection and every Short-Form Blueprint deliverable before marking the foundation Ready.
                </div>
              ) : null}
              <button onClick={() => save(project, draft)} className="btn-primary mt-4">Save Short-Form Foundation</button>
            </Section>
          ) : null}

          {draft.businessAsset?.enabled && draft.productionBlueprint?.enabled ? (
            <Section title="Work Orders" eyebrow="Blueprint deliverable requests">
              <p className="m-0 mb-4 text-sm leading-6 text-muted">
                Work Orders are specialized Work Items for AI-supported Blueprint deliverables. Short-Form Hook and Script reuse the existing provider-independent path; the remaining Short-Form production-plan deliverables are completed manually in the Blueprint during Task 2.
              </p>

              {executionRequestNotice ? (
                <div className="mb-4 rounded-xl border border-lime/20 bg-lime/[0.06] p-3 text-sm text-lime">
                  {executionRequestNotice}
                </div>
              ) : null}

              <div className="grid gap-4">
                {draft.productionBlueprint.deliverables.filter(supportsAiWorkOrder).map((deliverable) => {
                  const workOrder = projectWorkOrders.find((item) =>
                    item.workOrder?.blueprintDeliverableId === deliverable.id &&
                    item.workOrder?.metadata.isRevision !== 'true',
                  )
                  const executionRequest = workOrder?.workOrder?.executionRequest
                  const execution = executionRequest ? executionStore.executions.find((record) => record.executionRequest?.requestId === executionRequest.requestId) : undefined
                  const revisionWorkOrders: RevisionWorkOrderView[] = projectWorkOrders
                    .filter((item) =>
                      item.workOrder?.blueprintDeliverableId === deliverable.id &&
                      item.workOrder?.metadata.isRevision === 'true',
                    )
                    .map((item) => {
                      const revisionRequest = item.workOrder?.executionRequest
                      return {
                        workOrder: item,
                        execution: revisionRequest ? executionStore.executions.find((record) => record.executionRequest?.requestId === revisionRequest.requestId) : undefined,
                      }
                    })
                  return (
                    <WorkOrderBlueprintRow
                      key={deliverable.id}
                      deliverable={deliverable}
                      workOrder={workOrder}
                      execution={execution}
                      revisionWorkOrders={revisionWorkOrders}
                      reviewApproval={findReviewApproval(deliverable)}
                      executing={executingExecutionId === execution?.id || revisionWorkOrders.some((item) => item.execution?.id === executingExecutionId)}
                      onCreate={() => createWorkOrder(deliverable)}
                      onBuildRequest={() => workOrder ? buildExecutionRequest(workOrder) : undefined}
                      onCreateLifecycle={() => workOrder ? createExecutionLifecycle(workOrder) : undefined}
                      onExecuteProviderPath={() => execution ? executeProviderPath(execution) : undefined}
                      onRetryProviderPath={() => execution ? retryProviderPath(execution) : undefined}
                      onApplyDraft={() => applyDraftForReview(deliverable, workOrder, execution)}
                      onCreateRevisionWorkOrder={() => createRevisionWorkOrder(deliverable)}
                      onBuildRevisionRequest={(revisionWorkOrder) => buildExecutionRequest(revisionWorkOrder)}
                      onCreateRevisionLifecycle={(revisionWorkOrder) => createExecutionLifecycle(revisionWorkOrder)}
                      onExecuteRevisionProviderPath={(revisionExecution) => executeProviderPath(revisionExecution)}
                      onRetryRevisionProviderPath={(revisionExecution) => retryProviderPath(revisionExecution)}
                      onApplyRevisionDraft={(revisionWorkOrder, revisionExecution) => applyDraftForReview(deliverable, revisionWorkOrder, revisionExecution)}
                      onApproveDraft={() => recordReviewDecision(deliverable, 'Approved')}
                      onNeedsRevision={() => openReviewModal('Needs Revision', deliverable)}
                      onFullyReject={() => openReviewModal('Fully Reject', deliverable)}
                    />
                  )
                })}
              </div>
            </Section>
          ) : null}

          <Section title="Notes" eyebrow="CEO context">
            <textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} className="field min-h-[120px]" />
            <button onClick={() => save(project, draft)} className="btn-primary mt-4">Save Project</button>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Work Items" eyebrow="Project-owned executable units">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="m-0 text-sm leading-6 text-muted">
                Work Items belong to this Project. They are records only and do not execute automatically.
              </p>
              <button onClick={() => setShowWorkItemForm(true)} className="btn-primary inline-flex items-center gap-2">
                <Plus size={15} /> New Work Item
              </button>
            </div>

            {showWorkItemForm ? (
              <WorkItemForm
                fixedProject={project}
                onCancel={() => setShowWorkItemForm(false)}
                onCreate={(input) => {
                  workItemStore.createWorkItem(input)
                  setShowWorkItemForm(false)
                }}
              />
            ) : null}

            {regularProjectWorkItems.length > 0 ? (
              <div className="grid gap-4">
                {regularProjectWorkItems.map((workItem) => (
                  <WorkItemCard key={workItem.id} workItem={workItem} />
                ))}
              </div>
            ) : (
              <Placeholder text={project.placeholderWorkItems} />
            )}
          </Section>

          <Section title="Timeline" eyebrow="Local history">
            <div className="space-y-3">
              {project.timeline.map((item) => (
                <div key={item.id} className="flex items-start gap-3 rounded-xl border border-line bg-ink/35 p-3">
                  <div className="mt-0.5 grid h-7 w-7 place-items-center rounded-full bg-mint text-ink">
                    <Check size={14} />
                  </div>
                  <div>
                    <p className="m-0 text-sm font-semibold text-white">{item.message}</p>
                    <p className="m-0 mt-1 text-[11px] text-muted">{formatDate(item.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
      {reviewModal ? (
        <ReviewDecisionModal
          type={reviewModal.type}
          note={reviewNote}
          onChangeNote={setReviewNote}
          onCancel={closeReviewModal}
          onSubmit={submitReviewModal}
        />
      ) : null}
    </div>
  )
}

function Section({ title, eyebrow, children }: { title: string; eyebrow: string; children: ReactNode }) {
  return (
    <section className="panel p-5">
      <p className="eyebrow mb-2">{eyebrow}</p>
      <h3 className="m-0 font-display text-lg font-semibold text-white">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-ink/35 p-4">
      <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="m-0 mt-2 text-sm font-semibold text-white">{value || 'Not assigned'}</p>
    </div>
  )
}

function CreativeCostVisibilityPanel({
  summary,
}: {
  summary: ReturnType<typeof buildCreativeCostSummary>
}) {
  const topProviderModels = summary.providerModelBreakdown.slice(0, 4)
  const topWorkOrderCapabilities = summary.workOrderCapabilityBreakdown.slice(0, 4)

  return (
    <section className="rounded-2xl border border-line bg-ink/35 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow mb-2">Observation Only</p>
          <h4 className="m-0 font-display text-base font-semibold text-white">Project creative execution cost</h4>
          <p className="m-0 mt-2 text-sm leading-6 text-muted">
            This summary is derived from existing Execution Core records. It does not write Money records, Cost Records, provider data, Work Orders, Execution Requests, or Project financial records.
          </p>
        </div>
        <span className="rounded-full border border-line px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          Read-only
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <Info label="Recorded Execution Cost" value={formatMoney(summary.actualRecordedCost)} />
        <Info label="Estimated Execution Cost" value={formatMoney(summary.estimatedExecutionCost)} />
        <Info label="Execution Count" value={String(summary.executionCount)} />
        <Info label="No Cost Recorded" value={String(summary.noCostRecordedCount)} />
        <Info label="Successful Executions" value={String(summary.successfulExecutionCount)} />
        <Info label="Failed Executions" value={String(summary.failedExecutionCount)} />
        <Info label="Execution Duration" value={formatDuration(summary.totalExecutionDurationMs)} />
        <Info label="Average Latency" value={formatDuration(summary.averageLatencyMs)} />
      </div>

      <div className="mt-4 rounded-xl border border-orange-300/20 bg-orange-300/[0.045] p-3">
        <p className="m-0 text-sm leading-6 text-orange-100">
          Cost Source: Actual Recorded Cost and Estimated Execution Cost come only from existing Execution Core cost fields and Cost Records. Local Provider Direct Cost may be $0.00 for local providers; hardware, electricity, labor, and other indirect costs are not tracked here.
        </p>
        {summary.localProviderDirectCostCount > 0 ? (
          <p className="m-0 mt-2 text-xs leading-5 text-orange-100">
            Local Provider Direct Cost: {summary.localProviderDirectCostCount} execution{summary.localProviderDirectCostCount === 1 ? '' : 's'} currently have local direct provider cost with no monetary provider/API cost recorded.
          </p>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-line bg-white/[0.025] p-4">
          <p className="eyebrow mb-3">Provider / Model Breakdown</p>
          {topProviderModels.length > 0 ? (
            <div className="space-y-3">
              {topProviderModels.map((item) => (
                <BreakdownRow key={item.key} item={item} />
              ))}
            </div>
          ) : (
            <p className="m-0 text-sm leading-6 text-muted">No provider/model execution records are linked to this Project yet.</p>
          )}
        </div>

        <div className="rounded-xl border border-line bg-white/[0.025] p-4">
          <p className="eyebrow mb-3">Work Order / Capability Breakdown</p>
          {topWorkOrderCapabilities.length > 0 ? (
            <div className="space-y-3">
              {topWorkOrderCapabilities.map((item) => (
                <BreakdownRow key={item.key} item={item} />
              ))}
            </div>
          ) : (
            <p className="m-0 text-sm leading-6 text-muted">No Work Order or capability execution records are linked to this Project yet.</p>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Info
          label="Revision Executions"
          value={`${summary.revisionExecutionCount} / ${formatMoney(summary.revisionActualRecordedCost)} actual / ${formatMoney(summary.revisionEstimatedExecutionCost)} estimated`}
        />
        <Info
          label="Topic Development"
          value={`${summary.topicDevelopmentExecutionCount} / ${formatMoney(summary.topicDevelopmentActualRecordedCost)} actual / ${formatMoney(summary.topicDevelopmentEstimatedExecutionCost)} estimated`}
        />
      </div>
    </section>
  )
}

function BreakdownRow({
  item,
}: {
  item: {
    label: string
    executionCount: number
    actualRecordedCost: number
    estimatedExecutionCost: number
  }
}) {
  return (
    <div className="rounded-lg border border-line bg-ink/35 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="m-0 text-sm font-semibold text-white">{item.label}</p>
        <span className="rounded-full border border-line px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-muted">
          {item.executionCount} execution{item.executionCount === 1 ? '' : 's'}
        </span>
      </div>
      <p className="m-0 mt-2 text-xs leading-5 text-muted">
        Actual Recorded Cost: {formatMoney(item.actualRecordedCost)} · Estimated Execution Cost: {formatMoney(item.estimatedExecutionCost)}
      </p>
    </div>
  )
}

function CreativeAssetPackagePanel({
  project,
  blueprint,
  ready,
  blockedDeliverables,
  onCreatePackage,
}: {
  project: ProjectRecord
  blueprint: ProductionBlueprint
  ready: boolean
  blockedDeliverables: string[]
  onCreatePackage: () => void
}) {
  const [copyNotice, setCopyNotice] = useState('')
  const packages = blueprint.creativeAssetPackages ?? []

  async function copyText(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopyNotice(`${label} copied. Source package records were not modified.`)
    } catch {
      setCopyNotice(`${label} copy failed. Select the text manually and copy it from the field.`)
    }
  }

  return (
    <section className="rounded-2xl border border-lime/20 bg-lime/[0.035] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow mb-2">Creative Asset Package</p>
          <h4 className="m-0 font-display text-base font-semibold text-white">Export-ready package foundation</h4>
          <p className="m-0 mt-2 text-sm leading-6 text-muted">
            Packages are manual, local-first snapshots of final CEO-approved Blueprint deliverables. They prepare approved work for outside use but do not publish, upload, or trigger external actions.
          </p>
        </div>
        <button onClick={onCreatePackage} className="btn-primary" disabled={!ready}>
          Create Package
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <Info label="Package Owner" value="Project Store / Production Blueprint" />
        <Info label="Approval Gate" value={ready ? 'All deliverables approved' : 'Approval incomplete'} />
        <Info label="Package Count" value={String(packages.length)} />
        <Info label="Export Scope" value="Copy Markdown / JSON" />
      </div>

      {!ready ? (
        <div className="mt-4 rounded-xl border border-orange-300/25 bg-orange-300/[0.05] p-3">
          <p className="m-0 text-sm leading-6 text-orange-100">
            Package creation is blocked until every deliverable has final CEO-approved content.
            {blockedDeliverables.length > 0 ? ` Blocking deliverables: ${blockedDeliverables.join(', ')}.` : ''}
          </p>
        </div>
      ) : null}

      {copyNotice ? (
        <div className="mt-4 rounded-xl border border-line bg-ink/35 p-3 text-sm text-lime">{copyNotice}</div>
      ) : null}

      {packages.length > 0 ? (
        <div className="mt-4 space-y-4">
          {packages.map((assetPackage) => {
            const markdown = buildPackageMarkdown(project, assetPackage)
            const json = buildPackageJson(assetPackage)

            return (
              <article key={assetPackage.id} className="rounded-xl border border-line bg-ink/40 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="eyebrow mb-2">Package Version {assetPackage.packageVersion}</p>
                    <h5 className="m-0 font-display text-base font-semibold text-white">{assetPackage.packageId}</h5>
                    <p className="m-0 mt-2 text-sm leading-6 text-muted">
                      {assetPackage.businessAssetType} package for {assetPackage.projectId}. Status: {assetPackage.status}. Created {formatDate(assetPackage.createdAt)}.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => copyText('Markdown package', markdown)} className="btn-secondary">Copy Markdown</button>
                    <button onClick={() => copyText('JSON package', json)} className="btn-secondary">Copy JSON</button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <Info label="Deliverables" value={String(assetPackage.deliverables.length)} />
                  <Info label="Review References" value={String(assetPackage.sourceReviewIds.length)} />
                  <Info label="Execution References" value={String(assetPackage.sourceExecutionRecordIds.length)} />
                </div>

                <div className="mt-4 grid gap-3">
                  {assetPackage.deliverables.map((deliverable) => (
                    <div key={deliverable.id} className="rounded-lg border border-line bg-white/[0.025] p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="m-0 text-sm font-semibold text-white">{deliverable.deliverableName}</p>
                        <span className="text-[10px] uppercase tracking-[0.12em] text-muted">
                          Review {deliverable.reviewApprovalId ?? 'not recorded'} - Execution {deliverable.sourceExecutionId ?? 'not recorded'}
                        </span>
                      </div>
                      <p className="m-0 mt-2 whitespace-pre-wrap text-sm leading-6 text-[#d7e2dc]">{deliverable.approvedContent}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Copyable Markdown</span>
                    <textarea readOnly value={markdown} className="field min-h-[220px] font-mono text-xs" />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Copyable JSON</span>
                    <textarea readOnly value={json} className="field min-h-[220px] font-mono text-xs" />
                  </label>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <Placeholder text="No Creative Asset Package has been created yet. Create a package after all Blueprint deliverables are CEO-approved." />
      )}
    </section>
  )
}

function CreativeConceptDevelopmentPanel({
  project,
  workOrders,
  executions,
  executingExecutionId,
  onCreateWorkOrder,
  onBuildRequest,
  onCreateLifecycle,
  onExecuteProviderPath,
  onParseConcepts,
  onSelectConcept,
}: {
  project: ProjectRecord
  workOrders: WorkItemRecord[]
  executions: ExecutionRecord[]
  executingExecutionId?: string
  onCreateWorkOrder: () => void
  onBuildRequest: (workOrder: WorkItemRecord) => void
  onCreateLifecycle: (workOrder: WorkItemRecord) => void
  onExecuteProviderPath: (execution: ExecutionRecord) => void
  onParseConcepts: (execution: ExecutionRecord) => void
  onSelectConcept: (conceptId: string) => void
}) {
  const concepts = project.creativeConcepts ?? []
  const latestWorkOrder = workOrders[0]
  const executionRequest = latestWorkOrder?.workOrder?.executionRequest
  const execution = executionRequest ? executions.find((record) => record.executionRequest?.requestId === executionRequest.requestId) : undefined
  const lifecycleState = execution?.requestLifecycle?.status
  const canExecute = Boolean(execution && lifecycleState !== 'Completed' && lifecycleState !== 'Failed')
  const sourceResultAlreadyParsed = Boolean(execution?.result?.resultId && concepts.some((concept) => concept.sourceReferences.executionResultId === execution.result?.resultId))

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-line bg-ink/35 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow mb-2">Manual Generation</p>
            <h4 className="m-0 font-display text-base font-semibold text-white">Creative concept development Work Order</h4>
            <p className="m-0 mt-2 text-sm leading-6 text-muted">
              Uses the existing Work Item / Work Order, Execution Request, Execution Core, Capability Resolver, Provider Manager, and provider path. It requests exactly {CREATIVE_CONCEPT_CANDIDATE_COUNT} structured candidates.
            </p>
          </div>
          <button onClick={onCreateWorkOrder} className="btn-primary">Create Concept Work Order</button>
        </div>

        {latestWorkOrder ? (
          <div className="mt-4 space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <Info label="Work Order" value={latestWorkOrder.workOrder?.workOrderId ?? latestWorkOrder.workItemId} />
              <Info label="Type" value={latestWorkOrder.workOrder?.workOrderType ?? 'Not assigned'} />
              <Info label="Execution Request" value={executionRequest?.requestId ?? 'Not built'} />
              <Info label="Lifecycle" value={execution?.requestLifecycle?.status ?? 'Not established'} />
              <Info label="Provider" value={execution?.result?.provider?.name ?? 'Provider Manager selects'} />
              <Info label="Model" value={execution?.result?.model?.name ?? 'Provider Manager selects'} />
              <Info label="Candidate Count" value={String(CREATIVE_CONCEPT_CANDIDATE_COUNT)} />
              <Info label="Policy" value="Manual only" />
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={() => onBuildRequest(latestWorkOrder)} className="btn-secondary" disabled={Boolean(executionRequest)}>
                {executionRequest ? 'Execution Request Built' : 'Build Execution Request'}
              </button>
              {executionRequest ? (
                <button onClick={() => onCreateLifecycle(latestWorkOrder)} className="btn-secondary" disabled={Boolean(execution)}>
                  {execution ? 'Lifecycle Established' : 'Create Lifecycle'}
                </button>
              ) : null}
              {execution ? (
                <button onClick={() => onExecuteProviderPath(execution)} className="btn-primary" disabled={!canExecute || executingExecutionId === execution.id}>
                  {executingExecutionId === execution.id
                    ? 'Executing...'
                    : lifecycleState === 'Completed'
                      ? 'Provider Result Recorded'
                      : lifecycleState === 'Failed'
                        ? 'Provider Execution Failed'
                        : 'Execute Provider Path'}
                </button>
              ) : null}
              {execution?.result?.success ? (
                <button onClick={() => onParseConcepts(execution)} className="btn-secondary" disabled={sourceResultAlreadyParsed}>
                  {sourceResultAlreadyParsed ? 'Concepts Parsed' : 'Parse + Save Concepts'}
                </button>
              ) : null}
            </div>

            {execution?.result?.responseText ? (
              <div className="rounded-xl border border-line bg-white/[0.025] p-3">
                <p className="eyebrow mb-2">Raw Structured Execution Result</p>
                <p className="m-0 max-h-[240px] overflow-auto whitespace-pre-wrap text-xs leading-5 text-[#d7e2dc]">{execution.result.responseText}</p>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-4">
            <Placeholder text="No Creative Concept Work Order exists yet. Create one manually to begin provider-independent topic development." />
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-line bg-ink/35 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="eyebrow mb-1">Generated Concepts</p>
            <h4 className="m-0 font-display text-base font-semibold text-white">Project-owned planning candidates</h4>
          </div>
          <span className="rounded-full border border-line px-3 py-1 text-xs text-muted">{concepts.length} stored</span>
        </div>

        {concepts.length > 0 ? (
          <div className="grid gap-3">
            {concepts.map((concept) => (
              <article key={concept.conceptId} className={`rounded-xl border p-4 ${concept.selected ? 'border-lime/40 bg-lime/[0.06]' : 'border-line bg-white/[0.025]'}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="eyebrow mb-2">{concept.status}</p>
                    <h5 className="m-0 font-display text-base font-semibold text-white">{concept.title}</h5>
                    <p className="m-0 mt-2 text-sm leading-6 text-[#d7e2dc]">{concept.summary}</p>
                  </div>
                  <button onClick={() => onSelectConcept(concept.conceptId)} className={concept.selected ? 'btn-secondary' : 'btn-primary'} disabled={concept.selected}>
                    {concept.selected ? 'Selected' : 'Select for Planning'}
                  </button>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <Info label="Angle" value={concept.angle} />
                  <Info label="Audience Value" value={concept.audienceValue} />
                  <Info label="Hook Direction" value={concept.hookDirection} />
                  <Info label="Source Execution" value={concept.sourceReferences.executionId ?? 'Not linked'} />
                </div>
                <div className="mt-3 rounded-lg border border-line bg-ink/40 p-3">
                  <p className="m-0 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Rationale</p>
                  <p className="m-0 mt-2 text-sm leading-6 text-[#d7e2dc]">{concept.rationale}</p>
                </div>
                <p className="m-0 mt-3 text-xs leading-5 text-muted">
                  Lineage: Work Order {concept.sourceReferences.workOrderId ?? 'not linked'} - Execution Request {concept.sourceReferences.executionRequestId ?? 'not linked'} - Result {concept.sourceReferences.executionResultId ?? 'not linked'}.
                </p>
              </article>
            ))}
          </div>
        ) : (
          <Placeholder text="No creative concepts have been saved yet. Run one manual concept-development execution and parse the structured result." />
        )}
      </div>
    </div>
  )
}

function WorkOrderBlueprintRow({
  deliverable,
  workOrder,
  execution,
  revisionWorkOrders,
  reviewApproval,
  executing,
  onCreate,
  onBuildRequest,
  onCreateLifecycle,
  onExecuteProviderPath,
  onRetryProviderPath,
  onApplyDraft,
  onCreateRevisionWorkOrder,
  onBuildRevisionRequest,
  onCreateRevisionLifecycle,
  onExecuteRevisionProviderPath,
  onRetryRevisionProviderPath,
  onApplyRevisionDraft,
  onApproveDraft,
  onNeedsRevision,
  onFullyReject,
}: {
  deliverable: ProductionBlueprintDeliverable
  workOrder?: WorkItemRecord
  execution?: ExecutionRecord
  revisionWorkOrders: RevisionWorkOrderView[]
  reviewApproval?: Approval
  executing?: boolean
  onCreate: () => void
  onBuildRequest: () => void
  onCreateLifecycle: () => void
  onExecuteProviderPath: () => void
  onRetryProviderPath: () => void
  onApplyDraft: () => void
  onCreateRevisionWorkOrder: () => void
  onBuildRevisionRequest: (workOrder: WorkItemRecord) => void
  onCreateRevisionLifecycle: (workOrder: WorkItemRecord) => void
  onExecuteRevisionProviderPath: (execution: ExecutionRecord) => void
  onRetryRevisionProviderPath: (execution: ExecutionRecord) => void
  onApplyRevisionDraft: (workOrder: WorkItemRecord, execution: ExecutionRecord) => void
  onApproveDraft: () => void
  onNeedsRevision: () => void
  onFullyReject: () => void
}) {
  const executionRequest = workOrder?.workOrder?.executionRequest
  const lifecycleState = execution?.requestLifecycle?.status
  const canExecuteProviderPath = Boolean(execution && lifecycleState !== 'Completed' && lifecycleState !== 'Failed')
  const canApplyDraft = Boolean(execution?.result?.success && execution.result.responseText?.trim() && deliverable.appliedResultId !== execution.result.resultId)
  const canReviewDraft = deliverable.activeReview && deliverable.reviewStatus === 'Draft'
  const canCreateRevisionWorkOrder = deliverable.reviewStatus === 'Needs Revision' && !deliverable.activeReview && Boolean(deliverable.reviewFeedback?.trim())
  const latestNeedsRevisionReview = deliverable.reviewHistory.find((item) => item.decision === 'Needs Revision')
  const activeRevisionWorkOrder = latestNeedsRevisionReview
    ? revisionWorkOrders.find(({ workOrder: revisionWorkOrder }) =>
      revisionWorkOrder.workOrder?.metadata.revisionSourceReviewHistoryId === latestNeedsRevisionReview.id,
    )
    : undefined

  return (
    <article className="rounded-xl border border-line bg-ink/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow mb-1">Blueprint Deliverable</p>
          <h4 className="m-0 font-display text-base font-semibold text-white">{deliverable.name}</h4>
          <p className="m-0 mt-2 text-sm leading-6 text-muted">
            Blueprint status: {deliverable.status} · Review status: {deliverable.reviewStatus}
          </p>
        </div>
        {workOrder ? (
          <div className="flex flex-wrap gap-2">
            <button onClick={onBuildRequest} className="btn-secondary" disabled={Boolean(executionRequest)}>
              {executionRequest ? 'Execution Request Built' : 'Build Execution Request'}
            </button>
            {executionRequest ? (
              <button onClick={onCreateLifecycle} className="btn-secondary" disabled={Boolean(execution)}>
                {execution ? 'Lifecycle Established' : 'Create Lifecycle'}
              </button>
            ) : null}
            {execution && lifecycleState !== 'Failed' ? (
              <button onClick={onExecuteProviderPath} className="btn-primary" disabled={!canExecuteProviderPath || executing}>
                {executing
                  ? 'Executing...'
                  : lifecycleState === 'Completed'
                    ? 'Provider Result Recorded'
                    : 'Execute Provider Path'}
              </button>
            ) : null}
            {execution && lifecycleState === 'Failed' ? (
              <button onClick={onRetryProviderPath} className="btn-secondary">Create Retry Lifecycle</button>
            ) : null}
            {execution?.result?.success ? (
              <button onClick={onApplyDraft} className="btn-secondary" disabled={!canApplyDraft}>
                {canApplyDraft ? 'Apply Draft for Review' : 'Draft Applied'}
              </button>
            ) : null}
          </div>
        ) : (
          <button onClick={onCreate} className="btn-primary">Create Work Order</button>
        )}
      </div>

      {workOrder ? (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Info label="Work Order" value={workOrder.workOrder?.workOrderId ?? workOrder.workItemId} />
          <Info label="Work Item" value={workOrder.workItemId} />
          <Info label="Status" value={workOrder.workOrder?.status ?? workOrder.status} />
          <Info label="Type" value={workOrder.workOrder?.workOrderType ?? 'Not assigned'} />
          <Info label="Capability" value={executionRequest?.requestedCapability ?? 'Not built'} />
          <Info label="Execution Request" value={executionRequest?.requestId ?? 'Not built'} />
          <Info label="Execution Lifecycle" value={execution?.requestLifecycle?.status ?? 'Not established'} />
          <Info label="Execution Core" value={execution?.executionId ?? 'Not linked'} />
          <Info label="Review Status" value={deliverable.reviewStatus} />
          <Info label="Current CEO Review" value={reviewApproval ? reviewApproval.status : 'Not queued'} />
        </div>
      ) : (
        <div className="mt-4">
          <Placeholder text="No Work Order exists yet for this Blueprint deliverable." />
        </div>
      )}

      {executionRequest ? (
        <div className="mt-4 rounded-xl border border-line bg-white/[0.025] p-4">
          <p className="eyebrow mb-2">Execution Request Relationship</p>
          <p className="m-0 text-sm leading-6 text-muted">
            {executionRequest.requestId} references {executionRequest.workItemId}, {executionRequest.projectCode}, {executionRequest.blueprintDeliverableName}, and {executionRequest.knowledgeReferenceIds.length} Knowledge entries. It is read-only here and does not execute work.
          </p>
          {execution ? (
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <Info label="Execution Record" value={execution.executionId} />
              <Info label="Lifecycle State" value={execution.requestLifecycle?.status ?? 'Pending'} />
              <Info label="Source" value={execution.sourceType} />
              <Info label="Provider" value={execution.result?.provider?.name ?? execution.selectedProviders[0]?.name ?? 'Not selected'} />
              <Info label="Model" value={execution.result?.model?.name ?? execution.selectedProviders[0]?.model ?? 'Not selected'} />
              <Info label="Result" value={execution.result?.success ? 'Success' : execution.result?.failure ? 'Failed' : 'Not recorded'} />
            </div>
          ) : null}
          {execution?.result?.responseText ? (
            <div className="mt-3 rounded-xl border border-line bg-ink/40 p-3">
              <p className="eyebrow mb-2">Structured Execution Result</p>
              <p className="m-0 whitespace-pre-wrap text-sm leading-6 text-white">{execution.result.responseText}</p>
            </div>
          ) : null}
          {deliverable.reviewStatus !== 'Not Ready' ? (
            <div className="mt-3 rounded-xl border border-lime/20 bg-lime/[0.04] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="eyebrow mb-2">CEO Review</p>
                  <p className="m-0 text-sm leading-6 text-[#d7e2dc]">
                    {deliverable.activeReview
                      ? 'Draft is ready for CEO review. Approve it, request written revisions, or fully reject it.'
                      : `Latest review decision: ${deliverable.reviewStatus}.`}
                  </p>
                  {reviewApproval ? (
                    <p className="m-0 mt-2 text-xs text-muted">
                      Current Approval Queue item: {reviewApproval.id} · {reviewApproval.status} · <Link to="/approval" className="text-lime hover:text-white">Open Approval Queue</Link>
                    </p>
                  ) : (
                    <p className="m-0 mt-2 text-xs text-muted">No active Approval Queue notification is linked.</p>
                  )}
                  {deliverable.reviewFeedback ? <p className="m-0 mt-2 text-xs leading-5 text-orange-200">Revision feedback: {deliverable.reviewFeedback}</p> : null}
                  {deliverable.rejectionReason ? <p className="m-0 mt-2 text-xs leading-5 text-rose-200">Rejection reason: {deliverable.rejectionReason}</p> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={onApproveDraft} className="btn-primary" disabled={!canReviewDraft}>Approve</button>
                  <button onClick={onNeedsRevision} className="btn-secondary" disabled={!canReviewDraft}>Needs Revision</button>
                  <button onClick={onFullyReject} className="rounded-lg border border-rose-400/30 px-3 py-2 text-xs text-rose-200 hover:border-rose-400/70 disabled:cursor-not-allowed disabled:opacity-50" disabled={!canReviewDraft}>Fully Reject</button>
                </div>
              </div>
              {deliverable.reviewHistory.length > 0 ? (
                <div className="mt-3 border-t border-line pt-3">
                  <p className="eyebrow mb-2">Persistent Decision History</p>
                  <div className="space-y-2">
                    {deliverable.reviewHistory.slice(0, 3).map((item) => (
                      <div key={item.id} className="rounded-lg border border-line bg-ink/35 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="m-0 text-sm font-semibold text-white">{item.decision}</p>
                          <span className="text-[10px] uppercase tracking-[0.12em] text-muted">{formatDate(item.createdAt)}</span>
                        </div>
                        <p className="m-0 mt-1 text-xs text-muted">Actor: {item.actor}</p>
                        {item.note ? <p className="m-0 mt-2 text-xs leading-5 text-[#c3cbc7]">{item.note}</p> : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
          {canCreateRevisionWorkOrder || revisionWorkOrders.length > 0 ? (
            <div className="mt-3 rounded-xl border border-orange-300/20 bg-orange-300/[0.04] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="eyebrow mb-2">Revision Execution</p>
                  <p className="m-0 text-sm leading-6 text-[#d7e2dc]">
                    Needs Revision creates a separate manual revision Work Order and Execution Request. The original draft, execution, and review history stay intact.
                  </p>
                  {deliverable.reviewFeedback ? <p className="m-0 mt-2 text-xs leading-5 text-orange-200">CEO instructions: {deliverable.reviewFeedback}</p> : null}
                </div>
                <button
                  onClick={onCreateRevisionWorkOrder}
                  className="btn-secondary"
                  disabled={!canCreateRevisionWorkOrder || Boolean(activeRevisionWorkOrder)}
                >
                  {activeRevisionWorkOrder ? 'Revision Work Order Created' : 'Create Revision Work Order'}
                </button>
              </div>

              {revisionWorkOrders.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {revisionWorkOrders.map(({ workOrder: revisionWorkOrder, execution: revisionExecution }) => {
                    const revisionRequest = revisionWorkOrder.workOrder?.executionRequest
                    const revisionLifecycle = revisionExecution?.requestLifecycle?.status
                    const revisionCanExecute = Boolean(revisionExecution && revisionLifecycle !== 'Completed' && revisionLifecycle !== 'Failed')
                    const revisionCanApply = Boolean(
                      revisionExecution?.result?.success &&
                      revisionExecution.result.responseText?.trim() &&
                      deliverable.appliedResultId !== revisionExecution.result.resultId,
                    )

                    return (
                      <div key={revisionWorkOrder.id} className="rounded-xl border border-line bg-ink/35 p-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="m-0 text-sm font-semibold text-white">{revisionWorkOrder.workOrder?.workOrderId ?? revisionWorkOrder.workItemId}</p>
                            <p className="m-0 mt-1 text-xs leading-5 text-muted">
                              Manual revision attempt {revisionWorkOrder.workOrder?.metadata.revisionAttempt ?? '1'}.
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => onBuildRevisionRequest(revisionWorkOrder)} className="btn-secondary" disabled={Boolean(revisionRequest)}>
                              {revisionRequest ? 'Revision Request Built' : 'Build Revision Request'}
                            </button>
                            {revisionRequest ? (
                              <button onClick={() => onCreateRevisionLifecycle(revisionWorkOrder)} className="btn-secondary" disabled={Boolean(revisionExecution)}>
                                {revisionExecution ? 'Revision Lifecycle Established' : 'Create Revision Lifecycle'}
                              </button>
                            ) : null}
                            {revisionExecution && revisionLifecycle !== 'Failed' ? (
                              <button onClick={() => onExecuteRevisionProviderPath(revisionExecution)} className="btn-primary" disabled={!revisionCanExecute || executing}>
                                {executing
                                  ? 'Executing...'
                                  : revisionLifecycle === 'Completed'
                                    ? 'Revision Result Recorded'
                                    : 'Execute Revision Manually'}
                              </button>
                            ) : null}
                            {revisionExecution && revisionLifecycle === 'Failed' ? (
                              <button onClick={() => onRetryRevisionProviderPath(revisionExecution)} className="btn-secondary">Create Retry Lifecycle</button>
                            ) : null}
                            {revisionExecution?.result?.success ? (
                              <button onClick={() => onApplyRevisionDraft(revisionWorkOrder, revisionExecution)} className="btn-secondary" disabled={!revisionCanApply}>
                                {revisionCanApply ? 'Apply Revised Draft for Review' : 'Revised Draft Applied'}
                              </button>
                            ) : null}
                          </div>
                        </div>

                        <div className="mt-3 grid gap-3 md:grid-cols-3">
                          <Info label="Revision Request" value={revisionRequest?.requestId ?? 'Not built'} />
                          <Info label="Revision Execution" value={revisionExecution?.executionId ?? 'Not linked'} />
                          <Info label="Lifecycle" value={revisionLifecycle ?? 'Not established'} />
                          <Info label="Result" value={revisionExecution?.result?.success ? 'Success' : revisionExecution?.result?.failure ? 'Failed' : 'Not recorded'} />
                          <Info label="Original Execution" value={revisionWorkOrder.workOrder?.metadata.originalExecutionId ?? revisionWorkOrder.workOrder?.metadata.originalExecutionRecordId ?? 'Not recorded'} />
                          <Info label="Source Review" value={revisionWorkOrder.workOrder?.metadata.revisionSourceReviewHistoryId ?? 'Not recorded'} />
                        </div>

                        {revisionWorkOrder.workOrder?.metadata.revisionInstructions ? (
                          <p className="m-0 mt-3 text-xs leading-5 text-orange-100">
                            Instructions: {revisionWorkOrder.workOrder.metadata.revisionInstructions}
                          </p>
                        ) : null}

                        {revisionExecution?.result?.responseText ? (
                          <div className="mt-3 rounded-xl border border-line bg-ink/40 p-3">
                            <p className="eyebrow mb-2">Revised Structured Result</p>
                            <p className="m-0 whitespace-pre-wrap text-sm leading-6 text-white">{revisionExecution.result.responseText}</p>
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </div>
          ) : null}
          {execution?.result?.errorMessage ? (
            <div className="mt-3 rounded-xl border border-rose-400/25 bg-rose-400/[0.06] p-3">
              <p className="eyebrow mb-2 text-rose-200">Execution Failure</p>
              <p className="m-0 text-sm leading-6 text-rose-100">{execution.result.errorMessage}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}

function ReviewDecisionModal({
  type,
  note,
  onChangeNote,
  onCancel,
  onSubmit,
}: {
  type: ReviewModalState['type']
  note: string
  onChangeNote: (value: string) => void
  onCancel: () => void
  onSubmit: () => void
}) {
  const isRevision = type === 'Needs Revision'
  const title = isRevision ? 'Needs Revision' : 'Fully Reject Draft'
  const helperText = isRevision
    ? 'What needs to be changed? Written revision instructions are required and no AI rerun will start automatically.'
    : 'This draft will not be revised or used. You can optionally record why it was fully rejected.'
  const label = isRevision ? 'What needs to be changed?' : 'Optional rejection reason'

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/80 p-4 backdrop-blur-sm">
      <section className="w-full max-w-xl rounded-2xl border border-line bg-[#101714] p-5 shadow-2xl">
        <p className="eyebrow mb-2">CEO Review Decision</p>
        <h3 className="m-0 font-display text-xl font-semibold text-white">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted">{helperText}</p>

        <label className="mt-4 block space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{label}</span>
          <textarea
            value={note}
            onChange={(event) => onChangeNote(event.target.value)}
            className="field min-h-[120px]"
            placeholder={isRevision ? 'Describe the required changes before another draft is produced.' : 'Optional: explain why this draft is rejected.'}
          />
        </label>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button onClick={onCancel} className="btn-secondary" type="button">Cancel</button>
          <button
            onClick={onSubmit}
            className={isRevision ? 'btn-primary' : 'rounded-lg border border-rose-400/30 px-4 py-2 text-sm font-semibold text-rose-200 hover:border-rose-400/70 disabled:cursor-not-allowed disabled:opacity-50'}
            type="button"
            disabled={isRevision && note.trim().length === 0}
          >
            {isRevision ? 'Submit Revision Request' : 'Fully Reject'}
          </button>
        </div>
      </section>
    </div>
  )
}

function BlueprintDeliverableEditor({
  deliverable,
  onUpdate,
}: {
  deliverable: ProductionBlueprintDeliverable
  onUpdate: (updates: Partial<ProductionBlueprintDeliverable>) => void
}) {
  return (
    <article className="rounded-xl border border-line bg-ink/40 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow mb-1">Deliverable</p>
          <h4 className="m-0 font-display text-base font-semibold text-white">{deliverable.name}</h4>
          <p className="m-0 mt-2 text-sm leading-6 text-muted">Review status: {deliverable.reviewStatus}</p>
        </div>
        <label className="min-w-[180px] space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Status</span>
          <select value={deliverable.status} onChange={(event) => onUpdate({ status: event.target.value as ProductionBlueprintDeliverableStatus })} className="field">
            {productionBlueprintDeliverableStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>
      </div>
      <label className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Placeholder Content</span>
        <textarea
          value={deliverable.content}
          onChange={(event) => onUpdate({ content: event.target.value })}
          className="field min-h-[110px]"
          placeholder={`Draft ${deliverable.name.toLowerCase()} requirements here.`}
        />
      </label>
      {deliverable.reviewFeedback ? <p className="m-0 mt-3 text-xs leading-5 text-orange-200">Revision feedback: {deliverable.reviewFeedback}</p> : null}
      {deliverable.rejectionReason ? <p className="m-0 mt-3 text-xs leading-5 text-rose-200">Rejection reason: {deliverable.rejectionReason}</p> : null}
      <p className="m-0 mt-3 text-xs text-muted">
        Updated {formatDate(deliverable.updatedAt)}
        {deliverable.reviewedAt ? ` · Reviewed ${formatDate(deliverable.reviewedAt)}` : ''}
      </p>
    </article>
  )
}

function KnowledgeEntryEditor({
  entry,
  onUpdate,
  onDelete,
}: {
  entry: ProjectKnowledgeEntry
  onUpdate: (updates: Partial<ProjectKnowledgeEntry>) => void
  onDelete: () => void
}) {
  return (
    <article className="rounded-xl border border-line bg-ink/40 p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Section</span>
          <select value={entry.section} onChange={(event) => onUpdate({ section: event.target.value as ProjectKnowledgeSection })} className="field">
            {projectKnowledgeSections.map((section) => <option key={section} value={section}>{section}</option>)}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Title</span>
          <input value={entry.title} onChange={(event) => onUpdate({ title: event.target.value })} className="field" />
        </label>
        <label className="space-y-2 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Content</span>
          <textarea value={entry.content} onChange={(event) => onUpdate({ content: event.target.value })} className="field min-h-[88px]" />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Reference URL</span>
          <input value={entry.url} onChange={(event) => onUpdate({ url: event.target.value })} className="field" />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Tags</span>
          <input value={entry.tags.join(', ')} onChange={(event) => onUpdate({ tags: event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean) })} className="field" />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-xs text-muted">Updated {formatDate(entry.updatedAt)}</p>
        <button onClick={onDelete} className="btn-secondary text-rose-200 hover:text-white">Delete Entry</button>
      </div>
    </article>
  )
}

function Placeholder({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-white/[0.02] p-4">
      <p className="m-0 text-sm leading-6 text-[#aeb8b3]">{text}</p>
    </div>
  )
}
