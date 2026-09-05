# Sprint 015 - Multi-Business Management

Status: ACTIVE  
Owner: Jake Allen  
Last Updated: 2026-09-05

## Sprint Mission

Sprint 015 improves AI Operator OS's ability to manage multiple active businesses without increasing CEO workload linearly.

The sprint mission is:

Help the CEO identify which businesses need attention, understand why, and open the correct work through Business Manager and Command Center.

## Sprint Tasks

1. Sprint 015 Task 1 - Multi-Business Management Architecture Definition.
2. Sprint 015 Task 2 - Shared Attention Summary Foundation.
3. Sprint 015 Task 3 - Business Manager Integration.
4. Sprint 015 Task 4 - Command Center Integration and Consistent Priority Ordering.
5. Sprint 015 Task 5 - Integration QA, CEO QA, documentation, and repository closeout.

Task 1 produces documentation, ownership rules, attention semantics, and the implementation contract. Tasks 2-4 are the planned application implementation tasks. Task 5 verifies and closes the sprint.

## Sprint 015 Task 1 - Multi-Business Management Architecture Definition

Status: DOCUMENTATION COMPLETE / ARCHITECTURE FROZEN / REPOSITORY CLOSEOUT PENDING.

Task 1 formalizes the Sprint 015 mission, ownership rules, attention rules, implementation boundary, and architecture freeze for Task 2.

Task 1 does not implement application code.

## Architecture Reuse

Sprint 015 must reuse existing architecture:

- Business Store and Business Manager.
- Project Store.
- Work Item Store and Work Orders.
- Execution Queue where existing queue records remain relevant.
- Execution Core and existing execution lifecycle records.
- Approval Queue.
- Existing Command Center / Dashboard attention patterns.
- Existing routing and detail pages.
- Existing local-first persistence.

Sprint 015 must not create an Attention Store, Portfolio Store, Notification Store, Workflow Engine, rules engine, graph engine, duplicate Approval Queue, duplicate Execution Core, duplicate Work Item Store, duplicate Project Store, duplicate Business Store, or new persistence key.

## Ownership Boundaries

- Business Store owns businesses, internal business record IDs, readable business codes, lifecycle status, business health labels, and business priority.
- Project Store owns projects, Business Asset context, Knowledge Workspace, Creative Brief, Creative Concepts, Production Blueprint, Creative Asset Packages, and project/business relationships.
- Work Item Store owns Work Items, Work Orders, Work Item status, blockers, priority, and Work Item-to-project/business references.
- Execution Queue owns existing queue records and queue state where that layer remains in use.
- Execution Core owns execution records, execution attempts, execution lifecycle, failures, human-intervention state, timing, logs, provider/model metadata, cost records, execution results, and Work Order / Execution Request lineage.
- Approval Queue owns approval decisions, current approval status, decision history, review records, and CEO approval/review state.
- Command Center and Business Manager may display derived attention summaries, but neither owns source records.
- Attention summaries are read-only derived information and must not become a second source of truth.

Money Department remains the authority for broader financial truth. Sprint 015 attention summaries must not infer profitability, revenue performance, financial health, ROI, or cost-based urgency.

## Business Ownership Resolution

Sprint 015 attention summaries must resolve business ownership through stable IDs and linked records.

Business ownership resolution must distinguish:

- Internal Business Store record ID: `BusinessRecord.id`.
- Readable business code: `BusinessRecord.businessId`.
- Project business references: `ProjectRecord.businessId`, `businessCode`, and related business fields where present.
- Work Item business references: `businessId`, `businessCode`, and related fields where present.
- Execution Queue business references.
- Execution Core business references and linked Work Item / Work Order / Execution Request references.
- Approval Queue source business/project/work/execution references.

Business names alone must never establish ownership.

When explicit stable references resolve to different businesses, the item must be treated as an ownership conflict and must not be silently assigned to one business. When no reliable ownership reference exists, the item is unidentified. Conflicting and unidentified items remain visible outside individual business totals so the CEO can see data-quality issues without corrupting business-level counts.

Missing references and contradictory references must be displayed as different conditions. Task 2 must not automatically repair, reassign, rewrite, or mutate source records while deriving attention.

Paused and archived businesses remain visible/discoverable with lifecycle status. Attention can still be shown for paused or archived businesses, but the UI must not imply they are active operating businesses.

## Initial Attention Signals

Sprint 015's initial attention signals are intentionally small:

- Pending CEO approvals.
- Executions currently requiring human intervention.
- Current failed executions.
- Work Items currently Blocked.

Blocked means needs review. Not every blocked Work Item requires a CEO decision.

Business lifecycle, business health, and business attention are separate concepts. No current attention does not mean a business is healthy, profitable, complete, or low risk.

## State Authority Rules

Current Approval Queue status owns current approval decisions. Cached approval references on other records must not override the current Approval Queue decision.

Missing linked approvals must be visible as missing-reference issues, not fabricated pending decisions.

Current failed execution attention must be based on current execution state, not historical failure history alone. Existing Execution Dashboard behavior currently treats an execution as failed when `execution.status === 'Failed'` or `execution.failures.length > 0`; Sprint 015 Task 2 must use stricter current-attention semantics so a resolved historical failure does not create a false current alert.

Execution Core currently has two relevant lifecycle representations:

- `ExecutionRecord.status`, including `Requires Human Intervention`, `Failed`, `Completed`, and other execution states.
- `ExecutionRequestLifecycleStatus`, including `Pending`, `Accepted`, `Executing`, `Completed`, and `Failed`.

Task 2 must document and implement the exact current-failure predicates it uses for both representations. If the two representations conflict, the derived attention item should expose the inconsistency rather than choosing silently.

## Duplicate and Counting Rules

The same explicit approval ID represents one approval decision.

Related execution, request, Work Order, or deliverable references may attach context to that decision, but they must not duplicate the approval decision count.

Shared business, project, Work Item, title, or description does not prove duplicate identity.

Separate approval IDs are separate decisions.

Independent signals must not disappear only because they are linked in the same chain. For example, a pending approval and a current execution failure may both be legitimate attention items if they are distinct source conditions.

Views must distinguish:

- Attention item count: the number of derived current attention items shown to the CEO.
- Underlying source record count: the number of source records that contributed context.

Business Manager and Command Center must consume the same derived results so counts and ordering stay consistent.

## Priority and Ordering Rules

Attention priority must use the owning source record priority:

- Approval priority for approval attention.
- Execution priority for execution attention.
- Work Item priority for blocked-work attention.

Priority order:

Critical > High > Medium > Low.

For equal priority, order:

1. Explicit human-intervention execution.
2. Current failed execution.
3. Blocked Work Item.
4. Routine pending approval.
5. Source creation time, oldest first.
6. Stable tie-breaker using source type and source record ID.

Missing or invalid priority must be displayed as Unspecified in a separate review group. It must not be assigned an inferred priority or omitted.

Missing or invalid timestamps must not be invented. Use the stable source-type/source-record-ID fallback order.

Each attention item must explain itself using the recorded priority and a concrete attention reason.

Sprint 015 must not add AI ranking, financial scoring, inferred urgency, priority mutation, autonomous prioritization, or business-performance judgments.

## Task 2 Implementation Contract

Task 2 must implement the smallest shared read-only attention derivation needed for Business Manager and Command Center integration.

Task 2 must document and preserve:

- Source stores and verified fields.
- Business ownership resolution paths and conflict behavior.
- Attention qualification predicates.
- Stable signal identity and duplicate rules.
- Sorting and counting semantics.
- Absent/deleted records and invalid legacy data behavior.
- Navigation targets using existing routes.
- The smallest future change required to open a specific approval/detail item when current routes support only broader pages.
- How Business Manager and Command Center consume the same derived results.
- A bounded approach that avoids scanning unrelated history or arbitrary recursive graphs.
- Existing Command Center behavior outside the scoped integration.

Task 2 must not create a workflow engine, graph engine, notification engine, rules engine, AI ranking model, financial scoring model, or persisted derived-summary system.

## Navigation Contract

Attention items should route to existing detail pages whenever possible:

- Business detail: `/businesses/:businessId`.
- Project detail: `/projects/:projectId`.
- Work Item detail: `/work-items/:workItemId`.
- Execution Queue detail: `/execution-queue/:queueItemId`.
- Execution detail: `/executions/:executionId`.
- Approval Queue: `/approval`.

If a current route cannot open an exact record, Task 2 may route to the existing nearest owning surface and document the smallest future route/detail change needed. It must not create a duplicate approval or execution detail system.

## Acceptance Criteria for Sprint 015 Attention Foundation

Validation must use at least two businesses and confirm:

- Attention separates correctly by business.
- Counts and ordering are consistent between Business Manager and Command Center.
- Explicit missing ownership and conflicting ownership are visible.
- One linked approval decision is counted once.
- Separate approval IDs remain separate decisions.
- Independent failure/intervention/blocked-work signals do not disappear because they share a source chain.
- Resolved source conditions leave the current attention list.
- Historical failures do not create false current alerts.
- Current failures on existing execution paths are represented correctly.
- Navigation reaches the exact record when existing routes support it.
- Paused and archived business attention remains discoverable.
- Unspecified priorities and invalid timestamps are handled visibly and predictably.
- Source changes update both views without persisted duplicate summaries.
- Restart behavior does not create derived duplicates.

## Explicit Non-Goals

Sprint 015 Task 1 and the Task 2 foundation do not authorize:

- Autonomy.
- Automatic retries.
- Provider changes.
- Execution Core redesign.
- Scheduler.
- Orchestrator.
- Publishing.
- External integrations.
- Financial scoring.
- Business performance inference.
- New business types.
- Unrelated UI redesign.
- AI ranking.
- Priority mutation.
- Attention Store.
- Portfolio Store.
- Notification Store.
- Workflow/rules/graph engine.
- Duplicate approval, execution, project, work item, or business systems.

## Architecture Freeze

Sprint 015 Task 1 architecture freeze: PASS.

The architecture is implementation-ready for Sprint 015 Task 2 after Task 1 repository closeout.

## Current Handoff

Current Task: Sprint 015 Task 1 - Multi-Business Management Architecture Definition.

Task 1 Status: DOCUMENTATION COMPLETE / ARCHITECTURE FROZEN / REPOSITORY CLOSEOUT PENDING.

Next Required Action: Perform Sprint 015 Task 1 repository closeout, then begin Sprint 015 Task 2 - Shared Attention Summary Foundation implementation.
