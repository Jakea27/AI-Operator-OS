# Sprint 015 - Multi-Business Management

Status: COMPLETE - REPOSITORY VERIFIED
Owner: Jake Allen  
Last Updated: 2026-09-11

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

Status: COMPLETE.

Task 1 formalizes the Sprint 015 mission, ownership rules, attention rules, implementation boundary, and architecture freeze for Task 2.

Task 1 does not implement application code.

Task 1 repository closeout is complete. The pushed documentation-only architecture definition/freeze commit was independently verified on `main` and `origin/main`:

- Commit: `12b507ae9cd6b0a18fe14852ea77f2678e5d5ae5`
- Message: `Sprint 015 Task 1 - Architecture Definition and Freeze`
- Scope: documentation only

Task 2 is not started.

## Sprint 015 Task 2 - Shared Attention Summary Foundation

Status: COMPLETE.

Task 2 implements one shared read-only derivation foundation for current multi-business attention. Future Task 3 Business Manager integration and Task 4 Command Center integration must consume the same derived result instead of calculating attention independently.

Task 2 repository closeout is complete. The pushed implementation/documentation commit was independently verified on `main` and `origin/main`:

- Commit: `d66bdd5c8385eb53620a07fd4185e7425a20815e`
- Message: `Sprint 015 Task 2 - Shared Attention Summary Foundation`
- Scope: Task 2 shared derivation foundation plus required continuity documentation

Implementation files:

- `app/src/core/businesses/businessAttention.ts`
- `app/src/core/businesses/index.ts`

Public foundation:

- `buildBusinessAttentionSummary(input)`
- `isPendingCeoApproval(approval)`
- `isExecutionRequiringHumanIntervention(execution)`
- `isCurrentExecutionFailure(execution)`
- `getExecutionLifecycleConsistencyWarning(execution)`

The shared output supports:

- Portfolio-wide ordered attention list.
- Business-level attention summary for each Business record.
- Review groups for unidentified ownership, conflicting ownership, and unspecified priority.
- Attention-item count.
- Contributing source-record count.

### Implemented Attention Signals

Task 2 derives only:

1. Pending CEO Approval.
2. Execution Requires Human Intervention.
3. Current Execution Failure.
4. Blocked Work Item.

Pending CEO Approval uses the current authoritative Approval Queue record. Only approvals with `status === 'Pending'` and `requiresCEOApproval === true` qualify. Cached approval references on execution records do not create or override approval attention.

Execution Requires Human Intervention qualifies when `ExecutionRecord.status === 'Requires Human Intervention'`.

Current Execution Failure qualifies when `ExecutionRecord.status === 'Failed'` or `ExecutionRecord.requestLifecycle.status === 'Failed'`. Historical `execution.failures` entries alone do not create current-failure attention. When the main execution status and request lifecycle disagree, the derived item exposes a `stateConsistencyWarning` instead of silently choosing one state as correct.

Blocked Work Item qualifies when `WorkItemRecord.status === 'Blocked'`. The attention reason states that blocked work needs review and does not claim every blocker requires a CEO decision.

### Implemented Ownership Resolution

Task 2 resolves business ownership with stable references only.

The derivation recognizes:

- `BusinessRecord.id`
- `BusinessRecord.businessId`
- Project business ID/code references.
- Work Item business ID/code and project references.
- Execution Queue business ID/code and source Work Item references.
- Execution business ID/code, project, Work Item, queue, Work Order, and Execution Request references.
- Approval source business, project, work item, execution, queue, and execution-request references.

Business names alone do not resolve ownership.

If reliable stable references resolve to exactly one Business record, ownership is `Resolved`.

If no reliable reference resolves, ownership is `Unidentified`.

If reliable references resolve to more than one Business record, ownership is `Conflict`.

Unidentified and Conflict items remain in the portfolio review output and are excluded from individual business totals.

Paused and archived businesses can own attention items; their lifecycle status is exposed in resolved ownership and business summaries.

### Implemented Duplicate and Counting Semantics

Stable attention identity is composed from signal type, source type, and authoritative source record ID.

The same explicit Approval ID produces one pending-approval attention item. Separate Approval IDs remain separate decisions. Related execution, request, work item, or queue references may provide context but do not produce duplicate approval attention.

Independent signal types remain independent. A pending approval, human-intervention execution, current execution failure, and blocked Work Item may all remain visible when they represent separate current source conditions in the same record chain.

Attention-item count is the count of derived current attention items. Contributing-source-record count is the count of unique source type/source record pairs that contributed those items.

### Implemented Priority and Ordering Semantics

Priority uses the owning source record priority:

- Approval priority for approval attention.
- Execution priority for execution attention.
- Work Item priority for blocked-work attention.

Known priority order:

Critical > High > Medium > Low.

For equal priority, ordering is:

1. Human intervention.
2. Current execution failure.
3. Blocked Work Item.
4. Pending approval.
5. Valid source creation timestamp, oldest first.
6. Stable source-type/source-record-ID fallback.

Missing or invalid priority is retained as `Unspecified` and included in a visible review group. Missing or invalid timestamps are not invented and use stable fallback ordering.

### Implemented Navigation Semantics

Derived items emit existing routes only:

- Work Items: `/work-items/:workItemId`
- Executions: `/executions/:executionId`
- Approvals: `/approval?approvalId=<approval-id>` when an exact approval ID is available

Task 3 added exact approval opening by having the existing Approval Queue read the `approvalId` query parameter and select the matching approval. No new approval page, approval route family, store, or persistence key was added.

### Automated Verification

Task 2 deterministic verification passed for:

- Two businesses remain separated.
- Each of the four signal types qualifies correctly.
- Non-pending approvals are excluded.
- Approvals that do not require CEO approval are excluded.
- Historical failure records do not create current-failure attention.
- Main execution status and request lifecycle disagreement is exposed.
- Resolved conditions leave current attention output.
- Same approval ID counts once.
- Separate approval IDs remain separate.
- Independent signals sharing a record chain remain present.
- Internal business record IDs and readable business codes resolve correctly.
- Business names alone do not resolve ownership.
- Unknown ownership becomes Unidentified.
- Contradictory stable references become Conflict.
- Conflict/unidentified items stay outside business totals.
- Paused/archived business lifecycle status is preserved.
- Priority and signal ordering are deterministic.
- Unspecified priority is retained in its review group.
- Missing/invalid timestamp uses stable fallback ordering.
- Derived results do not mutate source input.
- Repeated derivation does not create duplicates.

Build verification:

- `npm.cmd run build`: PASS.
- TypeScript: PASS.
- Vite production build: PASS.
- Existing Vite large-chunk warning remains non-blocking.

Task 2 did not add Business Manager UI integration or Command Center UI integration. Task 3 integrates the shared summary into Business Manager, and Task 4 now integrates it into Command Center.

## Sprint 015 Task 3 - Business Manager Integration

Status: COMPLETE - implementation COMPLETE, automated verification PASS, build PASS, documentation COMPLETE, repository closeout COMPLETE.

Task 3 repository closeout is complete. The implementation/documentation commit and separate documentation-only repository closeout commit were pushed to `origin/main` and verified synchronized:

- Implementation/documentation commit: `2300b9443975ac0d02d30b533358ac8aa4e14353`
- Message: `Sprint 015 Task 3 - Business Manager Integration`
- Repository closeout commit: `f9f714af560ca559d655f416d6380358e3e9692f`
- Message: `Sprint 015 Task 3 - Repository Closeout`

Task 3 integrates the completed shared attention foundation into Business Manager only.

Task 3 implementation files:

- `app/src/core/businesses/businessAttention.ts`
- `app/src/features/businesses/pages/BusinessesPage.tsx`
- `app/src/features/businesses/pages/BusinessDetailPage.tsx`
- `app/src/features/businesses/components/BusinessCard.tsx`
- `app/src/features/approval/pages/ApprovalQueuePage.tsx`

Task 3 consumes the existing `buildBusinessAttentionSummary(input)` result using current data from:

- Business Store.
- Project Store.
- Work Item Store.
- Execution Queue.
- Execution Core.
- Approval Queue.

Business Manager does not reproduce signal qualification, ownership resolution, ordering, counting, or duplicate logic. It displays the shared derived result.

### Overview Behavior

Business Manager overview now displays:

- Portfolio attention-item count.
- Contributing-source-record count, clearly distinct from attention-item count.
- Attention state for each business.
- Per-business attention count.
- Highest recorded priority where attention exists.
- Business lifecycle status, including Paused and Archived.
- Existing route to Business Detail.
- Review sections for unidentified ownership, conflicting ownership, and unspecified priority.

Unidentified and conflicting ownership items remain outside individual business totals.

### Business Detail Behavior

Business Detail now displays the selected business's already ordered shared attention items, including:

- Signal type.
- Concrete attention reason.
- Recorded priority or Unspecified.
- Source type and readable source identifier.
- Ownership warning where present.
- State-consistency warning where present.
- Existing navigation target for the source record.

When a business has no derived attention, Business Detail displays `No tracked attention items` and explicitly clarifies that this does not prove the business is healthy, profitable, complete, or low risk.

### Exact Approval Opening

Task 3 adds the smallest compatible exact-approval opening behavior by preserving the existing Approval Queue route and adding an approval ID query parameter:

`/approval?approvalId=<approval-id>`

The existing Approval Queue reads `approvalId` from the query string and selects the corresponding Approval Queue record when it still exists.

No new approval page, route family, store, or persistence key was added.

### Verification

Task 3 deterministic verification passed for:

- Business counts matching shared derived summaries.
- Shared ordering preserved.
- Conflict and unidentified items remaining outside business totals.
- Paused businesses remaining discoverable.
- Unspecified priority review group visibility.
- Approval navigation emitting the exact-selection query parameter.

Build verification:

- `npm.cmd run build`: PASS.
- TypeScript: PASS.
- Vite production build: PASS.
- Existing Vite large-chunk warning remains non-blocking.

Task 3 did not modify Command Center attention UI; that integration is implemented by Task 4.

## Sprint 015 Task 4 - Command Center Integration and Consistent Priority Ordering

Status: COMPLETE - implementation COMPLETE, automated verification PASS, build PASS, documentation COMPLETE, repository closeout COMPLETE.

Task 4 implementation/documentation commit:

`c9800726b93698d1490102b6a4d8e39dc71e2ea9`

Task 4 push status:

PUSHED to `origin/main` and verified synchronized.

Task 4 integrates the completed Task 2 shared attention result into the existing Command Center in `app/pages/Dashboard.tsx`.

The Command Center now consumes `buildBusinessAttentionSummary(input)` using current records from the existing Business Store, Project Store, Work Item Store, Execution Queue, Execution Core, and Approval Queue. It does not reproduce signal qualification, ownership resolution, counting, deduplication, or ordering logic.

### Command Center Behavior

The new narrow multi-business attention surface displays:

- Total current attention-item count.
- Unique contributing-source-record count.
- Businesses with resolved current attention, including lifecycle status and per-business count.
- The first six items from the already ordered shared portfolio result.
- Signal type, concrete reason, recorded priority or Unspecified, source type, readable source identifier, resolved business/lifecycle or unresolved ownership state, and available ownership/state-consistency warnings.
- Each shared item's existing `navigationTarget.route`.
- The displayed-item count relative to the total and a route to Business Manager for the complete portfolio view.

If no shared attention exists, the Command Center states `No tracked business attention items` and clarifies that this does not prove every business is healthy, profitable, complete, or low risk.

### Consistent Ordering and Duplicate Removal

Task 4 preserves the exact `portfolioItems` order emitted by the shared derivation. The limited Command Center list uses `portfolioItems.slice(0, 6)` and does not independently sort, infer severity, or mutate source priority.

Legacy CEO Required Actions and Alerts representations of Pending CEO Approval, Execution Requires Human Intervention, Current Execution Failure, and Blocked Work Item were removed from those attention surfaces. The shared derivation is authoritative for those four signals. Capability readiness, queue, audit, cost, timing, roadmap, money, recent activity, and other unrelated Command Center summaries remain intact.

The existing Dashboard's general execution-risk count now uses `isCurrentExecutionFailure`. Historical `execution.failures` entries alone no longer represent a current Sprint 015 failure condition there.

### Verification

Deterministic verification passed for:

- Two-business separation and matching shared portfolio/business counts.
- Exact shared priority and equal-priority signal ordering.
- Historical failures alone producing no current attention.
- Unidentified and conflicting ownership remaining outside business totals.
- Unspecified priority remaining visible.
- Paused and archived business lifecycle labels remaining discoverable.
- Exact Work Item, Execution, and Approval navigation targets.
- Repeated pure derivation producing no persisted duplicates.
- Source-state changes updating derived results.
- No duplicate legacy representations of the four shared signals in CEO Required Actions or Alerts.

Build verification:

- `npm.cmd run build`: PASS.
- TypeScript: PASS.
- Vite production build: PASS.
- Existing Vite large-chunk warning remains non-blocking.

Task 4 adds no Attention Store, Portfolio Store, Notification Store, persistence key, AI ranking, inferred urgency, financial scoring, source-priority mutation, ownership repair, automation, scheduling, retry, orchestration, or unrelated Command Center redesign. Final integration and CEO QA remain Task 5 work.

## Sprint 015 Task 5 - Integration QA, CEO QA, documentation, and repository closeout

Status: COMPLETE - AUTOMATED QA PASS / BUILD PASS / CEO QA PASS / DOCUMENTATION COMPLETE / REPOSITORY CLOSEOUT COMPLETE.

Task 5 Gate 1 verified the complete Sprint 015 integration from existing source stores through `buildBusinessAttentionSummary(input)`, Business Manager, Business Detail, Command Center, and existing source-record navigation.

Deterministic integration QA passed for:

- Two-business separation using stable ownership references.
- Shared attention-item count, contributing-source-record count, per-business totals, qualification, ownership, ordering, and navigation semantics.
- All four authorized signals: Pending CEO Approval, Execution Requires Human Intervention, Current Execution Failure, and Blocked Work Item.
- Current-state qualification, resolved-condition removal, historical-failure exclusion, approval-ID deduplication, separate approval decisions, and independent signals sharing a source record.
- Unidentified and conflicting ownership outside business totals, distinguishable missing/conflicting warnings, business names not establishing ownership, and paused/archived lifecycle visibility.
- Critical, High, Medium, Low, and Unspecified ordering plus equal-priority signal/time/stable-ID ordering.
- Exact Work Item, Execution, and Approval navigation, Approval Queue exact selection support, Business Detail routes, and Command Center navigation to Business Manager.
- Pure repeated derivation with no persisted duplicates.
- Business Manager and Command Center source inspection confirming both consume the same shared derivation without independent attention sorting.

One narrow presentation defect was found and fixed in `app/src/features/businesses/pages/BusinessesPage.tsx`: the portfolio review explanation previously implied that every review item stayed outside business totals. The corrected copy states that unidentified/conflicting ownership remains outside business totals while resolved unspecified-priority items remain counted and are also shown for priority review. No derivation, ownership, counting, persistence, or navigation logic changed.

Manual CEO QA then found a lifecycle mismatch on legacy Business record `BIZ-QA-T6`: read-only surfaces displayed persisted status `Active`, while the Lifecycle Control `<select>` visually fell back to `Building` because `Active` is not a current `BusinessStatus` option. The root cause was missing runtime validation in `normalizeBusiness()`.

The Business Store boundary now normalizes legacy `Active` to the current lifecycle equivalent `Operating`, preserves every current `BusinessStatus` unchanged, and retains `Building` as the safe default for missing or unrecognized runtime values. The normalization does not mutate source input or change Business IDs, relationships, activity, attention ownership, counts, source records, stores, persistence keys, or lifecycle definitions.

Deterministic post-fix verification passed for legacy, current, missing, and unrecognized statuses; dropdown membership; source-input immutability; repeated normalization; and unchanged Business attention ownership/counts. All Business and Command Center surfaces consume the same normalized Business Store record after load or restart.

Build verification after the fix:

- `npm.cmd run build`: PASS.
- TypeScript: PASS.
- Vite production build: PASS.
- Existing Vite large-chunk warning remains non-blocking.

Jake reported manual CEO QA lifecycle retest PASS. Final repository closeout is COMPLETE.

Read-only architecture remains preserved. No Attention Store, Portfolio Store, Notification Store, new persistence key, persisted derived summary, source-priority mutation, ownership repair, AI ranking, financial scoring, automation, scheduling, retry, or orchestration was added.

## Final CEO QA and Mission Evaluation

Jake explicitly reported manual CEO QA PASS on 2026-09-11.

- Command Center displayed 2 attention items, 2 contributing source records, and 1 business with resolved attention. Business Manager matched 2/2; four Business records remained visible.
- QA Business - Sprint 014 Task 6 / BIZ-QA-T6 displayed 2 attention items. Business Detail showed the same two ordered execution-attention items.
- Exact execution navigation opened EXE-QA-T6-001. Execution Prepared and Execution Request lifecycle Failed matched the attention warning.
- A zero-attention Business displayed No tracked attention items, without claiming health, profitability, completion, or low risk.
- Initial QA found legacy Active versus Building mismatch. The normalization fix maps Active to Operating. Manual retest confirmed Operating in Business Lifecycle, Current Attention, Lifecycle Control, and Command Center, including the dropdown selection.
- Full application restart preserved Operating, the 2/2/1 counts, ordering, sources, relationships, and absence of duplicates.
- Edge cases unavailable in the local manual profile remain covered by completed deterministic automated integration QA, including multiple businesses, ownership review, priorities, and signal combinations. These are not claimed as manually exercised.

Sprint 015 Mission: SATISFIED against its documented acceptance criteria. Shared read-only attention enables consistent qualification, ownership, counts, ordering, warnings, and exact navigation; automated coverage verifies the broader matrix and manual QA verifies available records and restart. No additional implementation is required.

Documentation COMPLETE. Repository closeout COMPLETE after the documentation closeout commit was pushed and verified synchronized. Checkpoint evidence is maintained in Active Project State.

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

Current Task: None - Sprint 015 complete; Post-Sprint 015 Planning / Sprint 016 Definition.

Task 1 Status: COMPLETE - documentation COMPLETE, architecture review PASS, architecture freeze PASS, repository closeout COMPLETE.

Task 2 Status: COMPLETE - implementation COMPLETE, automated verification PASS, build PASS, documentation COMPLETE, repository closeout COMPLETE.

Task 3 Status: COMPLETE - implementation COMPLETE, automated verification PASS, build PASS, documentation COMPLETE, repository closeout COMPLETE.

Task 3 implementation/documentation commit:

`2300b9443975ac0d02d30b533358ac8aa4e14353`

Task 3 push status:

PUSHED to `origin/main` and verified synchronized.

Task 4 Status: COMPLETE - implementation COMPLETE, automated verification PASS, build PASS, documentation COMPLETE, repository closeout COMPLETE.

Task 4 implementation/documentation commit:

`c9800726b93698d1490102b6a4d8e39dc71e2ea9`

Task 4 push status:

PUSHED to `origin/main` and verified synchronized.

Task 5 Status: COMPLETE - automated QA PASS, build PASS, CEO QA PASS, documentation COMPLETE, repository closeout COMPLETE.

Next Required Action: Define Sprint 016 scope and its first task from the authoritative roadmap.
