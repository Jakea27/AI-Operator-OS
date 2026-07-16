# Execution Core Architecture

## Purpose

The Execution Core is the permanent local-first foundation for future AI Operator OS execution.

It defines execution records, references, logs, cost records, retry history, failure records, result references, and persistence.

This document describes the Sprint 012 execution foundation through Task 2.

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

Sprint 012 Tasks 1-2 do not create:

- Execution behavior.
- AI provider calls.
- Tool execution.
- Queue processing.
- Approval enforcement behavior.
- Event bus behavior.
- Dashboard or Command Center UI.
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

These are storage and lifecycle-state operations only. They do not perform work, call providers, invoke tools, or enforce approval gates.

## Relationships

Execution Core sits after Capability Planning and Approval Queue in the architecture, but Task 1 only creates the data foundation.

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

Future Sprint 012 tasks will add capability and approval gates, integration, UI, and Command Center visibility.

## Safety Rules

- Execution Core must not execute work.
- Execution Core must not call providers.
- Execution Core must not invoke tools.
- Execution Core must not bypass Approval Queue.
- Lifecycle helpers must not execute work.
- Lifecycle helpers must not become a queue processor or event bus.
- Execution Core must not store credentials.
- Execution Core must not become a duplicate Work Item, Approval, Capability Planning, or Money store.

## Future Extension Points

Future tasks may add:

- Capability and approval readiness gates.
- Execution Queue detail integration.
- Execution detail UI.
- Cost and logging polish.
- Command Center visibility.
- Provider and tool adapters after approval architecture remains stable.

These extensions should build on the Task 1 types and store instead of replacing them.
