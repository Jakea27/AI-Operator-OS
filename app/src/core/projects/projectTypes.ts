export type ProjectStatus = 'Planning' | 'Active' | 'On Hold' | 'Completed' | 'Archived'

export type ProjectPriority = 'Low' | 'Medium' | 'High' | 'Critical'

export type ProjectTimelineItem = {
  id: string
  message: string
  createdAt: string
}

export type BusinessAssetType = 'YouTube Video'

export type BusinessAssetProductionStatus = 'Planning' | 'Ready' | 'In Production' | 'Review' | 'Approved' | 'Packaged' | 'Archived'

export type BusinessAssetProductionStage = 'Intake' | 'Brief' | 'Research' | 'Production Planning' | 'Drafting' | 'Review' | 'Approved' | 'Packaged'

export type BusinessAssetProfile = {
  enabled: boolean
  assetType: BusinessAssetType
  platform: string
  topic: string
  goal: string
  targetAudience: string
  tone: string
  targetLength: string
  additionalNotes: string
  currentProductionStage: BusinessAssetProductionStage
  productionStatus: BusinessAssetProductionStatus
  departmentId: string
  departmentName: string
  createdAt: string
  updatedAt: string
  metadata: Record<string, string>
}

export type ProjectKnowledgeSection = 'Research Notes' | 'Reference Links' | 'Keywords' | 'Competitor Research' | 'CEO Notes' | 'Ideas' | 'Source References'

export type ProjectKnowledgeEntry = {
  id: string
  section: ProjectKnowledgeSection
  title: string
  content: string
  url: string
  tags: string[]
  createdAt: string
  updatedAt: string
  metadata: Record<string, string>
}

export type ProjectKnowledgeWorkspace = {
  enabled: boolean
  entries: ProjectKnowledgeEntry[]
  createdAt: string
  updatedAt: string
  metadata: Record<string, string>
}

export type CreativeBriefStatus = 'Draft' | 'Ready'

export type CreativeBriefProfile = {
  enabled: boolean
  briefId: string
  status: CreativeBriefStatus
  selectedKnowledgeEntryIds: string[]
  offerContext: string
  keyMessage: string
  callToAction: string
  constraints: string
  requiredInclusions: string
  prohibitedContent: string
  platformInstructions: string
  assetInstructions: string
  createdAt: string
  updatedAt: string
  metadata: Record<string, string>
}

export type CreativeConceptStatus = 'Generated' | 'Selected' | 'Archived'

export type CreativeConceptSourceReferences = {
  projectRecordId: string
  projectId: string
  businessAssetProjectId: string
  creativeBriefId?: string
  selectedKnowledgeEntryIds: string[]
  workItemRecordId?: string
  workItemId?: string
  workOrderId?: string
  executionRequestId?: string
  executionRecordId?: string
  executionId?: string
  executionResultId?: string
  providerName?: string
  modelName?: string
  capability?: string
}

export type CreativeConcept = {
  conceptId: string
  title: string
  summary: string
  angle: string
  rationale: string
  audienceValue: string
  hookDirection: string
  status: CreativeConceptStatus
  selected: boolean
  sourceReferences: CreativeConceptSourceReferences
  createdAt: string
  updatedAt: string
  metadata: Record<string, string>
}

export type ProductionBlueprintType = 'YouTube Video Blueprint'

export type ProductionBlueprintDeliverableName = 'Title' | 'Hook' | 'Script' | 'Description' | 'Tags' | 'Thumbnail Concept'

export type ProductionBlueprintDeliverableStatus = 'Not Started' | 'Draft' | 'Complete'

export type ProductionBlueprintDeliverableReviewStatus = 'Not Ready' | 'Draft' | 'Approved' | 'Needs Revision' | 'Rejected'

export type ProductionBlueprintDeliverableReviewDecision =
  | 'Draft Applied'
  | 'Revision Work Order Created'
  | 'Approved'
  | 'Needs Revision'
  | 'Rejected'

export type ProductionBlueprintDeliverableReviewHistoryItem = {
  id: string
  decision: ProductionBlueprintDeliverableReviewDecision
  actor: string
  note: string
  createdAt: string
  executionRecordId?: string
  executionId?: string
  executionRequestId?: string
  resultId?: string
  workItemId?: string
  workOrderId?: string
  approvalId?: string
  metadata?: Record<string, string>
}

export type ProductionBlueprintDeliverable = {
  id: string
  name: ProductionBlueprintDeliverableName
  status: ProductionBlueprintDeliverableStatus
  content: string
  reviewStatus: ProductionBlueprintDeliverableReviewStatus
  activeReview: boolean
  draftContent: string
  approvedContent: string
  appliedExecutionRecordId?: string
  appliedExecutionId?: string
  appliedExecutionRequestId?: string
  appliedResultId?: string
  appliedWorkItemId?: string
  appliedWorkOrderId?: string
  reviewApprovalId?: string
  reviewFeedback?: string
  rejectionReason?: string
  reviewedAt?: string
  reviewHistory: ProductionBlueprintDeliverableReviewHistoryItem[]
  updatedAt: string
  metadata: Record<string, string>
}

export type CreativeAssetPackageStatus = 'Export Ready' | 'Exported' | 'Archived'

export type CreativeAssetPackageDeliverable = {
  id: string
  deliverableId: string
  deliverableName: ProductionBlueprintDeliverableName
  approvedContent: string
  approvedAt?: string
  reviewApprovalId?: string
  sourceExecutionRecordId?: string
  sourceExecutionId?: string
  sourceExecutionRequestId?: string
  sourceResultId?: string
  sourceWorkItemId?: string
  sourceWorkOrderId?: string
  reviewHistoryIds: string[]
  metadata: Record<string, string>
}

export type CreativeAssetPackage = {
  id: string
  packageId: string
  projectRecordId: string
  projectId: string
  businessAssetType: BusinessAssetType
  platform: string
  blueprintType: ProductionBlueprintType
  packageVersion: number
  status: CreativeAssetPackageStatus
  createdAt: string
  updatedAt: string
  approvalState: 'CEO Approved'
  deliverables: CreativeAssetPackageDeliverable[]
  sourceReviewIds: string[]
  sourceExecutionRecordIds: string[]
  sourceExecutionRequestIds: string[]
  sourceWorkItemIds: string[]
  sourceWorkOrderIds: string[]
  sourceResultIds: string[]
  revisionLineageReferences: string[]
  exportFormats: ('Markdown' | 'JSON')[]
  metadata: Record<string, string>
}

export type ProductionBlueprint = {
  enabled: boolean
  blueprintType: ProductionBlueprintType
  assetType: BusinessAssetType
  deliverables: ProductionBlueprintDeliverable[]
  creativeAssetPackages: CreativeAssetPackage[]
  createdAt: string
  updatedAt: string
  metadata: Record<string, string>
}

export type ProjectRecord = {
  id: string
  projectId: string
  name: string
  description: string
  businessId: string
  businessCode: string
  businessName: string
  departmentId: string
  departmentCode: string
  departmentName: string
  managerId?: string
  managerName: string
  priority: ProjectPriority
  status: ProjectStatus
  progress: number
  startDate: string
  targetDate: string
  notes: string
  placeholderWorkItems: string
  openWorkItems: number
  createdAt: string
  updatedAt: string
  timeline: ProjectTimelineItem[]
  businessAsset?: BusinessAssetProfile
  knowledgeWorkspace?: ProjectKnowledgeWorkspace
  creativeBrief?: CreativeBriefProfile
  creativeConcepts?: CreativeConcept[]
  productionBlueprint?: ProductionBlueprint
}

export type ProjectInput = {
  name: string
  description: string
  businessId: string
  businessCode: string
  businessName: string
  departmentId: string
  departmentCode: string
  departmentName: string
  managerId?: string
  managerName: string
  priority: ProjectPriority
  status: ProjectStatus
  progress: number
  startDate: string
  targetDate: string
  notes: string
  businessAsset?: BusinessAssetProfile
  knowledgeWorkspace?: ProjectKnowledgeWorkspace
  creativeBrief?: CreativeBriefProfile
  creativeConcepts?: CreativeConcept[]
  productionBlueprint?: ProductionBlueprint
}

export type ProjectUpdate = Partial<Pick<
  ProjectRecord,
  | 'name'
  | 'description'
  | 'businessId'
  | 'businessCode'
  | 'businessName'
  | 'departmentId'
  | 'departmentCode'
  | 'departmentName'
  | 'managerId'
  | 'managerName'
  | 'priority'
  | 'status'
  | 'progress'
  | 'startDate'
  | 'targetDate'
  | 'notes'
  | 'businessAsset'
  | 'knowledgeWorkspace'
  | 'creativeBrief'
  | 'creativeConcepts'
  | 'productionBlueprint'
>>

export const businessAssetTypes: BusinessAssetType[] = ['YouTube Video']

export const businessAssetProductionStatuses: BusinessAssetProductionStatus[] = ['Planning', 'Ready', 'In Production', 'Review', 'Approved', 'Packaged', 'Archived']

export const businessAssetProductionStages: BusinessAssetProductionStage[] = ['Intake', 'Brief', 'Research', 'Production Planning', 'Drafting', 'Review', 'Approved', 'Packaged']

export const projectKnowledgeSections: ProjectKnowledgeSection[] = ['Research Notes', 'Reference Links', 'Keywords', 'Competitor Research', 'CEO Notes', 'Ideas', 'Source References']

export const creativeBriefStatuses: CreativeBriefStatus[] = ['Draft', 'Ready']

export const creativeConceptStatuses: CreativeConceptStatus[] = ['Generated', 'Selected', 'Archived']

export const productionBlueprintTypes: ProductionBlueprintType[] = ['YouTube Video Blueprint']

export const productionBlueprintDeliverableNames: ProductionBlueprintDeliverableName[] = ['Title', 'Hook', 'Script', 'Description', 'Tags', 'Thumbnail Concept']

export const productionBlueprintDeliverableStatuses: ProductionBlueprintDeliverableStatus[] = ['Not Started', 'Draft', 'Complete']

export const productionBlueprintDeliverableReviewStatuses: ProductionBlueprintDeliverableReviewStatus[] = ['Not Ready', 'Draft', 'Approved', 'Needs Revision', 'Rejected']

export const creativeAssetPackageStatuses: CreativeAssetPackageStatus[] = ['Export Ready', 'Exported', 'Archived']
