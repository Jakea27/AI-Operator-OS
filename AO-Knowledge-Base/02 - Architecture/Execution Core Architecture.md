# Execution Core Architecture

## Purpose

The Execution Core is the permanent local-first foundation for future AI Operator OS execution.

It defines execution records, references, logs, cost records, retry history, failure records, result references, and persistence.

This document describes the Sprint 012 Task 1 foundation only. It does not describe an execution engine, lifecycle engine, provider integration, queue processor, event bus, or external tool runtime.

## Scope

Sprint 012 Task 1 creates:

- Canonical TypeScript execution models.
- A local-first Execution Store.
- Source references to Work Items, Execution Queue items, Capability Plans, Approval records, providers, tools, and capabilities.
- Execution-owned records for attempt state, timing, retry history, logs, cost references, result references, and failure records.

Sprint 012 Task 1 does not create:

- Execution behavior.
- AI provider calls.
- Tool execution.
- Queue processing.
- Approval enforcement behavior.
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

These are storage operations only. They do not perform work or enforce lifecycle behavior.

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

Future Sprint 012 tasks will add lifecycle behavior, gates, integration, UI, and Command Center visibility.

## Safety Rules

- Execution Core must not execute work.
- Execution Core must not call providers.
- Execution Core must not invoke tools.
- Execution Core must not bypass Approval Queue.
- Execution Core must not store credentials.
- Execution Core must not become a duplicate Work Item, Approval, Capability Planning, or Money store.

## Future Extension Points

Future tasks may add:

- Deterministic lifecycle transition helpers.
- Capability and approval readiness gates.
- Execution Queue detail integration.
- Execution detail UI.
- Cost and logging polish.
- Command Center visibility.
- Provider and tool adapters after approval architecture remains stable.

These extensions should build on the Task 1 types and store instead of replacing them.
