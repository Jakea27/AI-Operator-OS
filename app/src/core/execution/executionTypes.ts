export type ExecutionStatus =
  | 'Prepared'
  | 'Awaiting Capability Review'
  | 'Awaiting Approval'
  | 'Approved'
  | 'Ready'
  | 'Running'
  | 'Paused'
  | 'Completed'
  | 'Failed'
  | 'Cancelled'
  | 'Requires Human Intervention'

export type ExecutionPriority = 'Low' | 'Medium' | 'High' | 'Critical'

export type ExecutionType = 'Manual' | 'Draft' | 'Review' | 'Future AI' | 'Future Automation'

export type ExecutionSourceType = 'Execution Queue' | 'Execution Request'

export type ExecutionRequestLifecycleStatus = 'Pending' | 'Accepted' | 'Executing' | 'Completed' | 'Failed'

export type ExecutionRiskLevel = 'Low' | 'Medium' | 'High' | 'Critical'

export type ExecutionLogLevel = 'Info' | 'Warning' | 'Error' | 'Audit'

export type ExecutionLogCategory =
  | 'Lifecycle'
  | 'Readiness'
  | 'Capability'
  | 'Approval'
  | 'Cost'
  | 'Failure'
  | 'Retry'
  | 'Result'
  | 'System'
  | 'Manual'

export type ExecutionEventType =
  | 'Execution Created'
  | 'State Updated'
  | 'Lifecycle Transition'
  | 'Capability Referenced'
  | 'Approval Referenced'
  | 'Provider Referenced'
  | 'Tool Referenced'
  | 'Result Referenced'
  | 'Cost Recorded'
  | 'Retry Recorded'
  | 'Failure Recorded'
  | 'Log Recorded'

export type ExecutionCostKind = 'Estimated' | 'Actual'

export type ExecutionCostCategory = 'Provider' | 'Tool' | 'Infrastructure' | 'Labor' | 'Other'

export type ExecutionCostStatus = 'Planned' | 'Recorded' | 'Reviewed' | 'Reconciled'

export type ExecutionResultStatus = 'Pending' | 'Recorded' | 'Reviewed' | 'Archived'

export type RetryStatus = 'Planned' | 'Attempted' | 'Succeeded' | 'Failed' | 'Cancelled'

export type FailureSeverity = 'Minor' | 'Moderate' | 'Major' | 'Critical'

export type ISODateTimeString = string

/**
 * Purpose: Reference the Work Item that defines the executable unit of work.
 * Fields: Stores source IDs and readable labels needed for execution context.
 * Relationships: Owned by Work Item module; Execution Store only references it.
 * Ownership: Work definition remains in Work Item records.
 * Future extensibility: May add immutable context snapshots without replacing Work Item ownership.
 */
export type ExecutionWorkItemReference = {
  workItemRecordId: string
  workItemId: string
  title: string
  projectId: string
  projectCode: string
  businessId: string
  businessCode: string
}

/**
 * Purpose: Reference the Execution Queue item that prepared work for execution.
 * Fields: Stores queue record/code, queue status at reference time, and source work item ID.
 * Relationships: Owned by Execution Queue; Execution Store only references it.
 * Ownership: Queue state remains in Execution Queue records.
 * Future extensibility: May include readiness snapshots after lifecycle work exists.
 */
export type ExecutionQueueItemReference = {
  queueRecordId: string
  queueId: string
  sourceWorkItemRecordId: string
  sourceWorkItemId: string
}

/**
 * Purpose: Reference the business-facing Work Order that requested execution.
 * Fields: Stores Work Order IDs, type/status, and Blueprint deliverable references only.
 * Relationships: Owned by Work Item/Project modules; Execution Store only references it.
 * Ownership: Work Order business request state remains on the specialized Work Item profile.
 * Future extensibility: Other asset types can add metadata by reference without a duplicate Work Order store.
 */
export type ExecutionWorkOrderReference = {
  workOrderId: string
  workOrderType: string
  workOrderStatus: string
  assetType: string
  platform: string
  businessAssetProjectId: string
  blueprintDeliverableId: string
  blueprintDeliverableName: string
}

/**
 * Purpose: Snapshot the provider-independent Execution Request accepted by the Execution Core.
 * Fields: Stores request ID/status/capability and source context references.
 * Relationships: Built from a Work Order; provider selection and execution remain outside the request.
 * Ownership: Execution Request metadata remains part of the Work Order profile; Execution Store references it for lifecycle ownership.
 * Future extensibility: Can route through provider-independent execution without exposing provider adapters to business modules.
 */
export type ExecutionRequestReferenceSnapshot = {
  requestId: string
  status: string
  requestedCapability: string
  workItemRecordId: string
  workItemId: string
  projectId: string
  projectCode: string
  businessAssetProjectId: string
  blueprintDeliverableId: string
  blueprintDeliverableName: string
  knowledgeReferenceIds: string[]
  instructions: string
  outputRequirements: string
  createdAt: ISODateTimeString
}

export type ExecutionRequestLifecycleHistoryItem = {
  id: string
  fromStatus?: ExecutionRequestLifecycleStatus
  toStatus: ExecutionRequestLifecycleStatus
  actor: string
  reason: string
  valid: boolean
  createdAt: ISODateTimeString
}

/**
 * Purpose: Own the Sprint 014 Work Order / Execution Request lifecycle inside the existing Execution Core.
 * Fields: Stores lifecycle state, lifecycle timestamps, and immutable-style lifecycle history.
 * Relationships: Relates an Execution Request to operational execution state without executing providers.
 * Ownership: Execution Core owns this lifecycle; Work Order and Production Blueprint ownership do not move.
 * Future extensibility: Future automation can read this lifecycle without introducing a duplicate lifecycle store.
 */
export type ExecutionRequestLifecycle = {
  status: ExecutionRequestLifecycleStatus
  acceptedAt?: ISODateTimeString
  executingAt?: ISODateTimeString
  completedAt?: ISODateTimeString
  failedAt?: ISODateTimeString
  history: ExecutionRequestLifecycleHistoryItem[]
}

/**
 * Purpose: Reference an approved or candidate capability without owning capability requirements.
 * Fields: Stores capability ID/name/category and optional capability plan relationship.
 * Relationships: Capability requirements remain owned by Capability Planning.
 * Ownership: Execution Store owns the selected reference used by an execution attempt.
 * Future extensibility: Can link to a future Capability Manager without changing execution records.
 */
export type CapabilityReference = {
  capabilityId: string
  name: string
  category: string
  capabilityPlanId?: string
}

/**
 * Purpose: Reference the Capability Plan that describes required infrastructure.
 * Fields: Stores plan ID, source queue item ID, readiness status, and estimate reference.
 * Relationships: Owned by Capability Planning; Execution Store does not duplicate requirements.
 * Ownership: Capability Planning owns capability/tool/provider requirements.
 * Future extensibility: May include validation checkpoint IDs when capability gates are implemented.
 */
export type CapabilityPlanReference = {
  capabilityPlanRecordId: string
  capabilityPlanId: string
  sourceQueueItemId: string
  readinessStatus: string
  estimatedCost?: number
}

/**
 * Purpose: Reference a controlled action interface that execution may eventually use.
 * Fields: Stores tool ID/name/category and permission class only.
 * Relationships: Tool Manager owns tool definitions and permissions.
 * Ownership: Execution Store owns which tool reference was selected for an attempt.
 * Future extensibility: Can point to future adapters without storing credentials or implementation details.
 */
export type ToolReference = {
  toolId: string
  name: string
  category: string
  permissionClass?: string
}

/**
 * Purpose: Reference a replaceable external or local provider candidate.
 * Fields: Stores provider ID/name/category/model and optional cost estimate.
 * Relationships: Provider/Model Selection owns provider configuration.
 * Ownership: Execution Store owns only the selected provider reference.
 * Future extensibility: Supports swapping OpenAI, Claude, Gemini, local models, or future providers.
 */
export type ProviderReference = {
  providerId: string
  name: string
  category: string
  model?: string
  estimatedUnitCost?: number
}

/**
 * Purpose: Reference the human approval decision that gates risky execution.
 * Fields: Stores approval ID/status/decision metadata and source queue/work references.
 * Relationships: Approval Queue owns decisions and decision history.
 * Ownership: Execution Store never owns approval state; it stores a reference for auditability.
 * Future extensibility: Can support granular policy gates without duplicating Approval Queue.
 */
export type ApprovalReference = {
  approvalId: string
  status: string
  decidedAt?: ISODateTimeString
  decision?: string
  sourceQueueItemId?: string
  sourceWorkItemId?: string
}

/**
 * Purpose: Record the outcome summary of an execution attempt.
 * Fields: Stores result ID/status/summary/artifact references and next-action notes.
 * Relationships: Belongs to an Execution record and references source work by ID.
 * Ownership: Execution Store owns result references and outcome summaries.
 * Future extensibility: Artifact references can later point to files, URLs, documents, or external systems.
 */
export type ExecutionResult = {
  id: string
  resultId: string
  executionRecordId: string
  executionId: string
  status: ExecutionResultStatus
  summary: string
  success?: boolean
  failure?: boolean
  provider?: {
    providerId: string
    providerRecordId: string
    name: string
  }
  model?: {
    modelId: string
    modelRecordId: string
    name: string
  }
  responseText?: string
  latencyMs?: number
  startedAt?: ISODateTimeString
  completedAt?: ISODateTimeString
  lifecycleState?: ExecutionRequestLifecycleStatus
  errorMessage?: string
  artifactRefs: string[]
  recommendedNextAction?: string
  createdAt: ISODateTimeString
  updatedAt: ISODateTimeString
}

/**
 * Purpose: Track estimated or actual execution-related cost while preserving Money ownership.
 * Fields: Stores cost ID/kind/amount/currency/provider/tool references and notes.
 * Relationships: References Business, Project, Execution, Provider, Tool, and Approval.
 * Ownership: Execution Store owns attempt-level estimate/actual cost records; Money owns financial reporting.
 * Future extensibility: Can later reconcile to Money Department records by reference.
 */
export type CostRecord = {
  id: string
  costRecordId: string
  executionRecordId: string
  executionId: string
  kind: ExecutionCostKind
  category: ExecutionCostCategory
  status: ExecutionCostStatus
  amount: number
  currency: string
  businessId?: string
  projectId?: string
  providerId?: string
  toolId?: string
  approvalId?: string
  notes: string
  recordedBy: string
  createdAt: ISODateTimeString
}

/**
 * Purpose: Preserve structured execution-domain history.
 * Fields: Stores event ID/type/message/source/timestamp and optional metadata.
 * Relationships: Belongs to Execution Store and may reference source modules by ID.
 * Ownership: Execution Store owns execution events; source modules own their original state.
 * Future extensibility: Can feed a future event bus without becoming one in Task 1.
 */
export type ExecutionEvent = {
  id: string
  eventType: ExecutionEventType
  message: string
  source: string
  metadata?: Record<string, string | number | boolean | null>
  createdAt: ISODateTimeString
}

/**
 * Purpose: Store immutable-style audit notes for execution attempts.
 * Fields: Stores log ID/level/message/source/timestamp and optional metadata.
 * Relationships: Belongs to an Execution record.
 * Ownership: Execution Store owns execution logs.
 * Future extensibility: Can later include tool-call/provider-call references without storing secrets.
 */
export type ExecutionLog = {
  id: string
  logId: string
  level: ExecutionLogLevel
  category: ExecutionLogCategory
  message: string
  source: string
  metadata?: Record<string, string | number | boolean | null>
  createdAt: ISODateTimeString
}

/**
 * Purpose: Record retry attempts without implementing retry behavior.
 * Fields: Stores retry ID/attempt number/status/reason/timestamps and result summary.
 * Relationships: Belongs to an Execution record.
 * Ownership: Execution Store owns retry history.
 * Future extensibility: Task 2+ may enforce retry limits and transition rules.
 */
export type RetryRecord = {
  id: string
  retryId: string
  attemptNumber: number
  status: RetryStatus
  reason: string
  resultSummary?: string
  createdAt: ISODateTimeString
  updatedAt: ISODateTimeString
}

/**
 * Purpose: Record failure state and diagnostic context without handling recovery.
 * Fields: Stores failure ID/severity/message/cause/resolution notes/timestamps.
 * Relationships: Belongs to an Execution record.
 * Ownership: Execution Store owns failure history; external modules own their source records.
 * Future extensibility: Can trigger future human-intervention workflows after lifecycle work exists.
 */
export type FailureRecord = {
  id: string
  failureId: string
  severity: FailureSeverity
  message: string
  cause?: string
  resolutionNotes?: string
  createdAt: ISODateTimeString
  resolvedAt?: ISODateTimeString
}

export type ExecutionTiming = {
  preparedAt?: ISODateTimeString
  readyAt?: ISODateTimeString
  startedAt?: ISODateTimeString
  pausedAt?: ISODateTimeString
  completedAt?: ISODateTimeString
  failedAt?: ISODateTimeString
  cancelledAt?: ISODateTimeString
  durationMs?: number
}

/**
 * Purpose: Preserve immutable lifecycle state transition history.
 * Fields: Stores source state, target state, actor, reason, validity, and timestamp.
 * Relationships: Belongs to an Execution record and is created by the lifecycle engine.
 * Ownership: Execution Store owns persisted lifecycle history; lifecycle utilities own transition validation rules.
 * Future extensibility: Can later be displayed in execution detail UI or used by approval/readiness gates.
 */
export type ExecutionTransitionHistoryItem = {
  id: string
  fromStatus: ExecutionStatus
  toStatus: ExecutionStatus
  actor: string
  reason: string
  valid: boolean
  createdAt: ISODateTimeString
}

/**
 * Purpose: Canonical execution attempt record for AI Operator OS.
 * Fields: Stores execution ID, source references, execution state, timing, selected infrastructure references, costs, logs, events, retries, failures, and result reference.
 * Relationships: Created from Execution Queue work and references Work Item, Capability Plan, Approval, Capability, Tool, Provider, Business, Project, Department, Manager, and Operator IDs.
 * Ownership: Execution Store owns execution attempts and execution-state history only.
 * Future extensibility: Lifecycle engine, approval gates, provider calls, tool calls, and dashboards can attach to this model later without reshaping the foundation.
 */
export type ExecutionRecord = {
  id: string
  executionId: string
  title: string
  description: string
  status: ExecutionStatus
  sourceType: ExecutionSourceType
  priority: ExecutionPriority
  executionType: ExecutionType
  riskLevel: ExecutionRiskLevel
  workItem: ExecutionWorkItemReference
  queueItem?: ExecutionQueueItemReference
  workOrder?: ExecutionWorkOrderReference
  executionRequest?: ExecutionRequestReferenceSnapshot
  requestLifecycle?: ExecutionRequestLifecycle
  capabilityPlan?: CapabilityPlanReference
  selectedCapabilities: CapabilityReference[]
  selectedTools: ToolReference[]
  selectedProviders: ProviderReference[]
  approval?: ApprovalReference
  businessId: string
  businessCode: string
  businessName: string
  projectId: string
  projectCode: string
  projectName: string
  departmentId: string
  departmentCode: string
  departmentName: string
  managerId?: string
  managerName: string
  operatorId?: string
  operatorCode?: string
  operatorName: string
  timing: ExecutionTiming
  estimatedCost: number
  actualCost: number
  costRecords: CostRecord[]
  result?: ExecutionResult
  resultRef?: string
  events: ExecutionEvent[]
  transitionHistory: ExecutionTransitionHistoryItem[]
  logs: ExecutionLog[]
  retryHistory: RetryRecord[]
  failures: FailureRecord[]
  notes: string
  createdAt: ISODateTimeString
  updatedAt: ISODateTimeString
}

export type ExecutionInput = {
  title: string
  description: string
  priority: ExecutionPriority
  executionType: ExecutionType
  riskLevel: ExecutionRiskLevel
  workItem: ExecutionWorkItemReference
  queueItem: ExecutionQueueItemReference
  capabilityPlan?: CapabilityPlanReference
  selectedCapabilities?: CapabilityReference[]
  selectedTools?: ToolReference[]
  selectedProviders?: ProviderReference[]
  approval?: ApprovalReference
  businessId: string
  businessCode: string
  businessName: string
  projectId: string
  projectCode: string
  projectName: string
  departmentId: string
  departmentCode: string
  departmentName: string
  managerId?: string
  managerName: string
  operatorId?: string
  operatorCode?: string
  operatorName: string
  estimatedCost?: number
  actualCost?: number
  notes: string
}

export type ExecutionUpdate = Partial<Pick<
  ExecutionRecord,
  | 'title'
  | 'description'
  | 'status'
  | 'priority'
  | 'executionType'
  | 'riskLevel'
  | 'capabilityPlan'
  | 'selectedCapabilities'
  | 'selectedTools'
  | 'selectedProviders'
  | 'approval'
  | 'timing'
  | 'estimatedCost'
  | 'actualCost'
  | 'result'
  | 'resultRef'
  | 'notes'
>>

export type ExecutionStoreSnapshot = ExecutionRecord[]

export type ExecutionLifecycleTransitionInput = {
  toStatus: ExecutionStatus
  actor?: string
  reason?: string
  createdAt?: ISODateTimeString
}

export type ExecutionLifecycleTransitionResult =
  | {
    success: true
    execution: ExecutionRecord
    message: string
  }
  | {
    success: false
    execution: ExecutionRecord
    message: string
    allowedTransitions: ExecutionStatus[]
  }

export type ExecutionRequestLifecycleTransitionInput = {
  toStatus: ExecutionRequestLifecycleStatus
  actor?: string
  reason?: string
  createdAt?: ISODateTimeString
}

export type ExecutionRequestLifecycleTransitionResult =
  | {
    success: true
    execution: ExecutionRecord
    message: string
  }
  | {
    success: false
    execution: ExecutionRecord
    message: string
    allowedTransitions: ExecutionRequestLifecycleStatus[]
  }

export type ExecutionProviderRunResult =
  | {
    success: true
    execution: ExecutionRecord
    provider: string
    model: string
    responseText: string
    latencyMs: number
    startedAt: ISODateTimeString
    completedAt: ISODateTimeString
    lifecycleState: ExecutionRequestLifecycleStatus
  }
  | {
    success: false
    execution: ExecutionRecord
    provider?: string
    model?: string
    responseText: ''
    latencyMs?: number
    startedAt: ISODateTimeString
    completedAt: ISODateTimeString
    lifecycleState: ExecutionRequestLifecycleStatus
    errorMessage: string
  }

export type ExecutionReadinessBlocker = {
  code:
    | 'Missing Capability Plan'
    | 'Capability Plan Not Approved'
    | 'Capability Requirements Missing'
    | 'Missing Approval'
    | 'Approval Not Approved'
    | 'Invalid Current State'
  message: string
}

export type ExecutionReadinessReport = {
  executionRecordId: string
  executionId: string
  capabilityPlan?: CapabilityPlanReference
  approval?: ApprovalReference
  capabilityReady: boolean
  approvalReady: boolean
  eligibleForAwaitingApproval: boolean
  eligibleForApproved: boolean
  eligibleForReady: boolean
  blockers: ExecutionReadinessBlocker[]
}
