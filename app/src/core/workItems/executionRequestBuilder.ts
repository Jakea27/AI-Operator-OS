import { buildCreativeConceptInstructions, CREATIVE_CONCEPT_CANDIDATE_COUNT } from '../projects'
import type { BusinessAssetType, ProjectRecord, ProductionBlueprintDeliverableName } from '../projects'
import type { ProviderCapability } from '../providers'
import type { ExecutionRequestReference, WorkItemRecord, WorkOrderType } from './workItemTypes'

export type ExecutionRequestBuildResult =
  | {
    success: true
    request: ExecutionRequestReference
    warnings: string[]
  }
  | {
    success: false
    errors: string[]
    warnings: string[]
  }

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function now() {
  return new Date().toISOString()
}

const workOrderCapabilityMap: Record<WorkOrderType, ProviderCapability> = {
  'Generate Title': 'Text Generation',
  'Generate Hook': 'Text Generation',
  'Generate Script': 'Text Generation',
  'Generate Description': 'Text Generation',
  'Generate Tags': 'Text Generation',
  'Generate Thumbnail Concept': 'Text Generation',
  'Develop Creative Concepts': 'Text Generation',
}

function deliverableInstructionName(name: ProductionBlueprintDeliverableName, assetType: BusinessAssetType) {
  if (assetType === 'Short-Form Video') {
    if (name === 'Hook') return 'Create a concise opening hook for a vertical short-form video.'
    if (name === 'Script') return 'Create a concise vertical short-form video script structured for the recorded target length and platforms.'
    return `Create draft ${name.toLowerCase()} production instructions for a vertical short-form video.`
  }

  switch (name) {
    case 'Title':
      return 'Create a clear YouTube title candidate.'
    case 'Hook':
      return 'Create an opening hook for the YouTube video.'
    case 'Script':
      return 'Create a structured YouTube script draft.'
    case 'Description':
      return 'Create a YouTube video description draft.'
    case 'Tags':
      return 'Create relevant YouTube tags.'
    case 'Thumbnail Concept':
      return 'Create a thumbnail concept for the YouTube video.'
    default:
      return `Create draft ${name.toLowerCase()} content for the YouTube video.`
  }
}

function outputRequirements(name: ProductionBlueprintDeliverableName, assetType: BusinessAssetType) {
  if (assetType === 'Short-Form Video') {
    if (name === 'Hook') return 'Return one concise hook suitable for CEO review and a vertical short-form opening.'
    if (name === 'Script') return 'Return a concise spoken and visual short-form script suitable for CEO review. Do not publish or execute anything.'
    return `Return concise draft ${name.toLowerCase()} instructions suitable for CEO review. Do not publish or execute anything.`
  }

  switch (name) {
    case 'Tags':
      return 'Return concise comma-separated tags suitable for a YouTube video.'
    case 'Thumbnail Concept':
      return 'Return a concise thumbnail concept with visual subject, text idea, and emotional angle.'
    case 'Script':
      return 'Return a structured draft suitable for CEO review. Do not publish or execute anything.'
    default:
      return `Return draft ${name.toLowerCase()} content suitable for CEO review. Do not publish or execute anything.`
  }
}

export function buildExecutionRequestFromWorkOrder(workItem: WorkItemRecord, project: ProjectRecord): ExecutionRequestBuildResult {
  const errors: string[] = []
  const warnings: string[] = []
  const workOrder = workItem.workOrder

  if (!workOrder?.enabled) errors.push('Work Item does not contain a Work Order profile.')
  if (workItem.projectId !== project.id && workItem.projectCode !== project.projectId) errors.push('Work Order does not reference the supplied Project.')
  if (!project.businessAsset?.enabled) errors.push('Project does not have an enabled Business Asset profile.')
  if (workOrder?.workOrderType !== 'Develop Creative Concepts' && !project.productionBlueprint?.enabled) errors.push('Project does not have an enabled Production Blueprint.')

  const deliverable = project.productionBlueprint?.deliverables.find((item) => item.id === workOrder?.blueprintDeliverableId)
  const isConceptDevelopment = workOrder?.workOrderType === 'Develop Creative Concepts'
  if (!deliverable && !isConceptDevelopment) errors.push('Referenced Blueprint deliverable could not be resolved.')
  if (!project.knowledgeWorkspace?.enabled) warnings.push('Knowledge Workspace is not enabled; request will use Business Asset and Blueprint references only.')

  if (errors.length > 0 || !workOrder || (!deliverable && !isConceptDevelopment)) {
    return { success: false, errors, warnings }
  }

  const timestamp = now()
  const capability = workOrderCapabilityMap[workOrder.workOrderType]
  const knowledgeReferenceIds = project.knowledgeWorkspace?.entries.map((entry) => entry.id) ?? []
  const asset = project.businessAsset
  const assetType: BusinessAssetType = asset?.assetType ?? 'YouTube Video'
  const targetPlatforms = asset?.targetPlatforms?.join(', ') || 'Not specified'
  const isRevision = workOrder.metadata.isRevision === 'true'
  const selectedCreativeBriefKnowledgeIds = project.creativeBrief?.selectedKnowledgeEntryIds ?? []
  const revisionInstructions = workOrder.metadata.revisionInstructions ?? ''
  const originalDraftContent = deliverable
    ? workOrder.metadata.originalDraftContent ?? deliverable.draftContent ?? deliverable.content
    : ''
  const baseInstructions = isConceptDevelopment
    ? [buildCreativeConceptInstructions(project)]
    : isRevision && deliverable
    ? [
      `Revise the existing ${deliverable.name} draft using the CEO revision instructions.`,
      `Deliverable: ${deliverable.name}`,
      `Topic: ${asset?.topic || 'Not specified'}`,
      `Goal: ${asset?.goal || 'Not specified'}`,
      `Audience: ${asset?.targetAudience || 'Not specified'}`,
      `Tone: ${asset?.tone || 'Not specified'}`,
      `Target Length: ${asset?.targetLength || 'Not specified'}`,
      `Target Platforms: ${targetPlatforms}`,
      '',
      'Current Draft:',
      originalDraftContent || 'No current draft content recorded.',
      '',
      'CEO Revision Instructions:',
      revisionInstructions || 'No revision instructions recorded.',
      '',
      'Preserve the intent of the original draft while applying only the requested revision. Return revised draft content only.',
    ]
    : [
      deliverableInstructionName(deliverable!.name, assetType),
      `Topic: ${asset?.topic || 'Not specified'}`,
      `Goal: ${asset?.goal || 'Not specified'}`,
      `Audience: ${asset?.targetAudience || 'Not specified'}`,
      `Tone: ${asset?.tone || 'Not specified'}`,
      `Target Length: ${asset?.targetLength || 'Not specified'}`,
      `Target Platforms: ${targetPlatforms}`,
      `Existing Blueprint Placeholder: ${deliverable!.content || 'Empty'}`,
    ]
  const request: ExecutionRequestReference = {
    requestId: id('ER'),
    status: 'Built',
    requestedCapability: capability,
    workItemRecordId: workItem.id,
    workItemId: workItem.workItemId,
    projectId: project.id,
    projectCode: project.projectId,
    businessAssetProjectId: project.id,
    blueprintDeliverableId: deliverable?.id ?? '',
    blueprintDeliverableName: deliverable?.name ?? 'Creative Concept Development',
    knowledgeReferenceIds: isConceptDevelopment ? selectedCreativeBriefKnowledgeIds : knowledgeReferenceIds,
    instructions: baseInstructions.join('\n'),
    outputRequirements: isConceptDevelopment
      ? `Return JSON only with exactly ${CREATIVE_CONCEPT_CANDIDATE_COUNT} creative topic/concept candidates in a concepts array. Each candidate must include title, summary, angle, rationale, audienceValue, and hookDirection.`
      : isRevision && deliverable
        ? `${outputRequirements(deliverable.name, assetType)} This is a manual revision attempt. Do not approve, publish, send, or start another revision.`
        : outputRequirements(deliverable!.name, assetType),
    correlationMetadata: {
      workOrderId: workOrder.workOrderId,
      workOrderType: workOrder.workOrderType,
      workOrderKind: workOrder.metadata.workOrderKind ?? '',
      businessId: project.businessId,
      businessCode: project.businessCode,
      projectId: project.projectId,
      assetType: asset?.assetType ?? workOrder.assetType,
      platform: asset?.platform ?? workOrder.platform,
      targetPlatforms,
      productionBlueprintType: project.productionBlueprint?.blueprintType ?? workOrder.productionBlueprintType,
      creativeBriefId: project.creativeBrief?.briefId ?? '',
      selectedKnowledgeEntryIds: selectedCreativeBriefKnowledgeIds.join(','),
      candidateCount: isConceptDevelopment ? String(CREATIVE_CONCEPT_CANDIDATE_COUNT) : '',
      ...workOrder.metadata,
    },
    createdAt: timestamp,
  }

  return { success: true, request, warnings }
}
