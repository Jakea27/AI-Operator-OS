# Execution Core Architecture

## Purpose

The Execution Core is the permanent local-first foundation for future AI Operator OS execution.

It defines execution records, references, logs, cost records, retry history, failure records, result references, and persistence.

This document describes the Sprint 012 execution foundation through Task 6.

It does not describe provider integration, queue processing, event bus behavior, external tool runtime, autonomous execution, or UI execution controls.

## Scope

Sprint 012 Task 1 created:

- Canonical TypeScript execution models.
- A local-first Execution Store.
- Source references to Work Items, Execution Queue items, Capability Plans, Approval records, providers, tools, and capabilities.
- Execution-owned records for attempt state, timing, retry history, logs, cost references, result references, and failure records.

Sprint 012 Task 2 created:

- Deterministic lifecycle transition validation.
- Allowed transition helpers.
- Invalid transition protection.
- Timestamp recording for lifecycle state changes.
- Immutable transition history entries.
- Pause and resume helpers.
- Retry support.
- Failure recording support.
- Execution Store integration for persisted lifecycle updates.

Sprint 012 Task 3 created:

- Capability Plan reference resolution.
- Approval Queue reference resolution.
- Capability readiness validation.
- Approval readiness validation.
- Execution readiness reports with blockers.
- Store helpers that advance eligible execution records through readiness and approval lifecycle gates.

Sprint 012 Task 4 created:

- Execution Record creation from the active Execution Queue detail workflow.
- Duplicate protection so one queue item does not create multiple execution records by accident.
- Queue-detail visibility for lifecycle state, Capability Plan references, Approval references, timing, retries, failures, costs, logs, readiness blockers, and result references.
- Reference synchronization from existing Capability Planning and Approval Queue records.
- Readiness-gate controls that use existing lifecycle/readiness helpers without executing work.

Sprint 012 Task 5 created:

- A read-only Execution Dashboard route.
- A read-only Execution Detail route.
- Execution Store summary metrics.
- Execution list filtering and sorting.
- Lifecycle, readiness, approval, capability, cost, log, retry, failure, event, and result visibility.
- Safe empty and missing-reference states.
- Relationship navigation to existing supported Work Item, Execution Queue, Capability Planning, and Approval Queue routes.

Sprint 012 Task 6 created:

- Structured execution audit helpers.
- Migration-safe normalization for older cost and log records.
- Cost record category, status, and recorded-by metadata.
- Log category metadata.
- Automatic audit logs for cost, retry, and failure record creation.
- Store validation helper for execution audit completeness.
- Dashboard cost variance and audit completeness visibility.
- Detail-page cost record and metadata readability improvements.

Sprint 012 Tasks 1-6 do not create:

- Execution behavior.
- AI provider calls.
- Tool execution.
- Queue processing.
- Approval execution behavior.
- Event bus behavior.
- External integrations.

## Data Ownership

The Execution Core follows the ownership model established in Sprint 012 Planning.

| Data | Authoritative Owner | Execution Core Responsibility |
| --- | --- | --- |
| Work definition | Work Item module | Reference Work Item IDs and labels. |
| Queue state | Execution Queue module | Reference the queue item that prepared work. |
| Capability requirements | Capability Planning module | Reference Capability Plan IDs and selected capability/tool/provider references. |
| Approval decisions | Approval Queue module | Reference approval state and decision metadata without owning decisions. |
| Execution attempts | Execution Store | Own attempt records, execution state, timing, retries, logs, failures, and result references. |
| Financial reporting | Money Department / Cost Tracking | Store attempt-level estimated/actual cost records for visibility, while Money remains the financial reporting owner. |

No Sprint 012 Task 1 record duplicates another module's source of truth.

## Core Records

The Execution Core defines:

- `ExecutionRecord`
- `ExecutionWorkItemReference`
- `ExecutionQueueItemReference`
- `CapabilityReference`
- `CapabilityPlanReference`
- `ToolReference`
- `ProviderReference`
- `ApprovalReference`
- `ExecutionResult`
- `CostRecord`
- `ExecutionEvent`
- `ExecutionLog`
- `RetryRecord`
- `FailureRecord`

Each model is documented in TypeScript with purpose, fields, relationships, ownership, and future extensibility.

## Store

The Execution Store lives at:

`app/src/core/execution/executionStore.ts`

The store uses the existing AI Operator OS persistence pattern:

- `localStorage`
- `useSyncExternalStore`
- module-owned persistence key
- safe empty defaults
- normalization on read
- automatic save on mutation

Storage key:

`ai-operator-os-execution-core-v1`

Task 4 added queue-detail creation helpers:

- `createExecutionFromQueueItem`
- `getExecutionForQueueItem`

These helpers map an existing Execution Queue record into an Execution Record by reference. They do not duplicate Work Item, Queue, Capability Plan, Approval, or finance ownership.

## Lifecycle Engine

The lifecycle engine lives at:

`app/src/core/execution/executionLifecycle.ts`

The lifecycle engine owns validation rules only.

It provides:

- `executionAllowedTransitions`
- `getAllowedExecutionTransitions`
- `canTransitionExecution`
- `assertCanTransitionExecution`
- `transitionExecutionRecord`
- `pauseExecutionRecord`
- `resumeExecutionRecord`
- `markExecutionRequiresHumanIntervention`
- `recordFailureForExecution`
- `recordRetryForExecution`

Allowed transitions:

| From | Allowed To |
| --- | --- |
| Prepared | Awaiting Capability Review, Cancelled |
| Awaiting Capability Review | Awaiting Approval, Requires Human Intervention, Cancelled |
| Awaiting Approval | Approved, Requires Human Intervention, Cancelled |
| Approved | Ready, Cancelled |
| Ready | Running, Requires Human Intervention, Cancelled |
| Running | Paused, Completed, Failed, Requires Human Intervention, Cancelled |
| Paused | Running, Requires Human Intervention, Cancelled |
| Failed | Requires Human Intervention, Ready, Cancelled |
| Requires Human Intervention | Awaiting Capability Review, Awaiting Approval, Ready, Cancelled |
| Completed | No outgoing transitions |
| Cancelled | No outgoing transitions |

Invalid transitions return structured failure results and do not mutate persisted execution records.

The lifecycle engine records state changes as transition history and execution events. It does not execute work.

## Capability and Approval Readiness

The readiness integration lives at:

`app/src/core/execution/executionReadiness.ts`

The readiness integration reads existing module stores:

- Capability Planning: `app/src/core/capabilityPlanning`
- Approval Queue: `app/src/features/approval`

The readiness integration provides:

- `evaluateExecutionReadiness`
- `applyReadinessReferences`
- `readinessMessage`

Execution Store exposes:

- `syncReadinessReferences`
- `evaluateReadiness`
- `advanceFromCapabilityReview`
- `advanceFromApprovalReview`
- `markReadyWhenEligible`

Readiness rules:

| Lifecycle Step | Required Existing Record | Required State |
| --- | --- | --- |
| Awaiting Capability Review -> Awaiting Approval | Capability Plan | Capability Plan is Approved and has no missing requirements |
| Awaiting Approval -> Approved | Approval Queue record | Approval status is Approved |
| Approved -> Ready | Capability Plan and Approval Queue record | Capability ready and approval ready |

Capability Planning remains the owner of:

- Required capabilities.
- Preferred providers.
- Required tools.
- Required permissions.
- Required operator roles.
- Estimated cost.
- Readiness status.

Approval Queue remains the owner of:

- Approval decision state.
- Decision notes.
- Decision history.
- CEO approval status.

Execution Core stores:

- Capability Plan references.
- Capability, tool, and provider references derived from the existing Capability Plan.
- Approval references derived from the existing Approval Queue record.
- Readiness blockers.
- Lifecycle transitions caused by satisfied readiness gates.

Invalid or incomplete readiness does not mutate execution lifecycle state.

Task 3 does not execute work, call providers, process queues, or bypass the Approval Queue.

## Execution Queue Detail Integration

Sprint 012 Task 4 connects the active Execution Queue detail page to the Execution Core.

The active UI file is:

`app/src/features/executionQueue/ExecutionQueueDetailPage.tsx`

The detail page now supports:

- Creating a local Execution Record for the current queue item.
- Preventing duplicate Execution Records for the same queue item.
- Displaying the linked Execution ID.
- Displaying lifecycle state.
- Displaying linked Capability Plan and Approval references.
- Displaying created, updated, ready, started, completed, and failed timestamps.
- Displaying retry, failure, log, cost, and result-reference summaries.
- Showing readiness blockers from existing Capability Planning and Approval Queue records.
- Synchronizing readiness references.
- Advancing readiness gates through existing lifecycle helpers when records are eligible.

This integration is infrastructure visibility only.

It does not:

- Execute work.
- Run AI.
- Call providers.
- Invoke tools.
- Process queues automatically.
- Create duplicate Capability Planning or Approval Queue records.
- Change routing.
- Redesign the UI.

## Execution Dashboard and Detail Page

Sprint 012 Task 5 adds the first CEO-facing execution inspection workspace.

The active files are:

- `app/src/features/execution/ExecutionDashboardPage.tsx`
- `app/src/features/execution/ExecutionDetailPage.tsx`

The active routes are:

- `/executions`
- `/executions/:executionId`

Navigation decision:

- No new sidebar item was added.
- Execution Queue remains the operations entry point.
- Execution Queue links to the Execution Dashboard.
- Queue detail records link to their read-only Execution Detail page.

The Execution Dashboard reads the existing Execution Store and displays:

- Total execution records.
- Lifecycle counts for every Execution Status.
- CEO action, failure, long-running/paused, recent completion, estimated cost, and actual cost indicators.
- Local filtering by lifecycle, approval status, capability readiness, failure state, human-intervention state, and completed state.
- Local sorting by updated time, oldest waiting, retry count, estimated cost, and actual cost.

The Execution Detail Page reads the existing Execution Store and displays:

- Execution identity.
- Work Item and Execution Queue references.
- Lifecycle timing.
- Transition history.
- Pause/resume history.
- Retry history.
- Failure history.
- Execution logs.
- Event history.
- Capability Plan reference.
- Approval reference.
- Selected capability, tool, and provider references.
- Estimated and actual cost.
- Cost records.
- Result reference.

Task 5 is read-only.

It does not expose buttons that:

- Start execution.
- Retry execution.
- Cancel execution.
- Approve work.
- Reject work.
- Change lifecycle state.
- Assign providers.
- Assign tools.
- Trigger external actions.

## Cost Tracking and Logging Polish

Sprint 012 Task 6 strengthens attempt-level auditability without adding execution behavior.

Execution Core owns:

- Estimated execution cost stored on the execution record.
- Actual execution cost stored on the execution record.
- Append-only attempt-level cost records.
- Append-only execution logs.
- Execution events.
- Retry history.
- Failure history.

Execution cost records include:

- Cost kind.
- Cost category.
- Review/reconciliation status.
- Amount.
- Currency.
- Source references for business, project, provider, tool, and approval where available.
- Recorded-by metadata.
- Notes.
- Timestamp.

Execution logs include:

- Log level.
- Log category.
- Message.
- Source.
- Optional metadata.
- Timestamp.

Cost, retry, and failure record creation adds matching audit logs. This improves inspection quality while preserving the rule that Execution Core records infrastructure history only.

Task 6 does not:

- Create Money Department records.
- Reconcile accounting.
- Execute providers.
- Call external APIs.
- Mutate external modules.
- Add autonomous behavior.

## Persistence

Execution records persist locally.

The store supports:

- Creating execution foundation records.
- Updating execution records.
- Adding logs.
- Adding retry records.
- Adding failure records.
- Adding estimated or actual cost records.
- Attaching result references.
- Reading executions by queue item or work item.
- Transitioning execution state through validated lifecycle helpers.
- Persisting transition history.
- Synchronizing Capability Planning and Approval Queue references.
- Evaluating readiness blockers.
- Advancing through readiness/approval lifecycle gates only when referenced records satisfy requirements.
- Creating and finding Execution Records from Execution Queue detail records.

These are storage, lifecycle-state, and readiness-gate operations only. They do not perform work, call providers, invoke tools, or execute approvals.

## Relationships

Execution Core sits after Capability Planning and Approval Queue in the architecture. Through Task 4, the active Execution Queue detail workflow can create and inspect the Execution Core record for a queue item.

Current relationship:

Opportunity
↓
Business
↓
Project
↓
Work Item
↓
Execution Queue
↓
Capability Planning
↓
Approval Queue
↓
Execution Core

Future Sprint 012 tasks will add cost/logging polish and Command Center visibility.

## Safety Rules

- Execution Core must not execute work.
- Execution Core must not call providers.
- Execution Core must not invoke tools.
- Execution Core must not bypass Approval Queue.
- Lifecycle helpers must not execute work.
- Lifecycle helpers must not become a queue processor or event bus.
- Readiness gates must read existing Capability Planning and Approval Queue records instead of duplicating them.
- Execution Queue detail integration must create and display Execution Records by reference only.
- Execution Dashboard and Detail Page must remain read-only until a later approved task authorizes lifecycle controls.
- Execution Core must not store credentials.
- Execution Core must not become a duplicate Work Item, Approval, Capability Planning, or Money store.

## Future Extension Points

Future tasks may add:

- Cost and logging polish.
- Command Center visibility.
- Provider and tool adapters after approval architecture remains stable.

These extensions should build on the Task 1 types and store instead of replacing them.
