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

export type ExecutionRiskLevel = 'Low' | 'Medium' | 'High' | 'Critical'

export type ExecutionLogLevel = 'Info' | 'Warning' | 'Error' | 'Audit'

export type ExecutionEventType =
  | 'Execution Created'
  | 'State Updated'
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
  amount: number
  currency: string
  businessId?: string
  projectId?: string
  providerId?: string
  toolId?: string
  approvalId?: string
  notes: string
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
  priority: ExecutionPriority
  executionType: ExecutionType
  riskLevel: ExecutionRiskLevel
  workItem: ExecutionWorkItemReference
  queueItem: ExecutionQueueItemReference
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
