# Architecture

Version: 0.1.0-alpha
Last Updated: 2026-06-26

## Operating Model

GitHub = Brain
ChatGPT Project = Office
Codex = Developer
Jake = CEO

## System Structure

AI Operator OS is local-first. The first version runs while the owner's computer is on. Future cloud workers are allowed only when ROI is positive.

The desktop application uses one Electron + React + Vite + TypeScript + Tailwind codebase under `app/`.

## Core Application Layers

- `app/src/services` — shared operating services such as the CEO Daily Briefing Engine.
- `app/src/core` — domain engines with independent types, persistence, and business rules.
- `app/src/features` — feature UI that consumes core engines.
- `app/pages` — top-level department pages that have not yet migrated into feature modules.
- `app/components` — shared application shell and general UI.

## Persistence Architecture

All persistence is localStorage-based and local-first.

- Operating records use `app/src/services/operatingStore.ts`.
- Money domain logic uses `app/src/core/money` as a reusable layer over the operating store.
- Business memory uses `app/src/core/memory/memoryStore.ts`.
- Daily briefing snapshots are stored in the operating store.
- Business Memory has a dedicated store to prevent duplicate memory ownership.

## Money Store Architecture

AO-006.1 defines the shared Money foundation under `app/src/core/money`:

- `moneyTypes.ts` — typed revenue items, cost items, cost schedule, and money metrics.
- `moneyCalculations.ts` — reusable calculations for revenue today, current-month revenue, current-month costs, monthly recurring costs, one-time costs, profit, and profit margin.
- `moneyStore.ts` — React-facing store adapter that reads and writes through `operatingStore.ts`.
- `index.ts` — public Money API.

The Money foundation intentionally does not create a second localStorage document. Revenue and expense records remain in the existing operating store so Dashboard, Money, Briefing, Operators, and Approval integrations keep one shared source of truth. Expense records now carry a cost type of one-time or monthly recurring; older records are migrated safely to one-time costs unless already marked recurring.

## Business Memory Architecture

AO-003 defines Business Memory under `app/src/core/memory`:

- `memoryTypes.ts` — complete memory schema and supported types.
- `memoryStore.ts` — local persistence, migration, and CRUD.
- `memoryEngine.ts` — recent, pinned, sprint, idea, and important-memory selectors.
- `memorySearch.ts` — full-text search, filters, and sorting.
- `memoryTags.ts` — tag normalization and collection.
- `index.ts` — public memory API.

The Memory feature UI lives under `app/src/features/memory`. Dashboard and CEO Briefing consume the same core memory API.

AO-003.1 adds schema normalization for older local records, category and pin-state filtering, four explicit sort modes, and a relationship-aware detail view. Memory edits preserve `createdAt` while every mutation refreshes `updatedAt`; deletion also removes the deleted ID from surviving memory relationships.

Dashboard selectors provide pinned business rules, recent decisions, recent ideas, and latest sprint notes. The CEO Briefing selector returns active pinned decisions and business rules, the three most recent important memories, and open ideas. Both integrations use the core memory API without duplicating persistence or domain logic.

AO-003.2 adds `memoryTemplates.ts` for reusable structured capture and expands `memorySearch.ts` with `queryBusinessMemory`, the AI-facing local knowledge retrieval API. Presentation remains under the existing Memory feature: type colors are centralized in `memoryPresentation.ts`, while `MemoryMarkdown.tsx` safely renders locally stored Markdown with GitHub Flavored Markdown tables.

Relationship IDs remain part of the canonical `MemoryEntry` schema. The editor selects existing records, the detail view resolves IDs through the current store, and deletion removes stale references. No second memory store or route exists.

## AI Operator Framework Architecture

AO-004.1 defines specialized AI Operators under `app/src/core/operators` without adding chat behavior or external AI APIs:

- `operatorTypes.ts` — shared operator, status, task, recommendation, memory-access, event, and context models.
- `operatorRegistry.ts` — initial CTO, CFO, CMO, COO, and Research operator definitions.
- `operatorEngine.ts` — framework entry points for building operator snapshots from shared local context.
- `operator.ts` — operator hydration and detail snapshot composition.
- `operatorMemory.ts` — Business Memory access through the existing memory search API.
- `operatorTasks.ts` — task queue selectors and deterministic system task derivation.
- `operatorEvents.ts` — local operator event projection.
- `operatorStore.ts` — localStorage-backed workspace task and recommendation persistence.
- `index.ts` — public operator API.

The Operators UI lives under `app/src/features/operators` and is routed through the existing shell at `/operators`. It consumes the operating store, Money metrics, Business Memory, daily briefing snapshots, projects, tasks, and approvals as one shared business context. Operators are not isolated assistants; they are reusable specialized roles that read the same local OS state and remain subject to CEO approval rules.

AI reasoning is intentionally deferred. AO-004.1 establishes the local framework, models, task queues, status display, recommendation history, and shared-context UI.

AO-004.2 adds routed operator workspaces under `/operators/:operatorId`. The workspaces continue to use the same operator registry and shared context instead of creating a second operator system. Operator task queues and recommendation histories are local-first drafts persisted through `operatorStore.ts`. Workspace actions are deterministic placeholders: run local analysis, generate a local recommendation, add an operator task, and save a note to Business Memory. No action executes externally without CEO approval.

AO-004.2.1 keeps the same architecture and upgrades presentation/state metadata only. Operator status display is standardized as Working, Idle, Waiting, Analyzing, Needs Context, and Blocked. Operator presentation metadata such as permanent icons and status colors lives in `app/src/features/operators/operatorPresentation.ts`. Recommendation records include confidence and risk level for future approval and reasoning workflows.

AO-004.3 adds the internal Executive Coordinator service:

- `executiveCoordinator.ts` — deterministic request classification, operator selection, task creation, coordinator history persistence, and local coordination summaries.

The Executive Coordinator is not an operator and does not appear in navigation. It writes local coordinator history and creates ordinary operator tasks through the existing operator store. Risky routed requests are sent to the existing approval queue rather than executed. The coordinator uses rules only; no external AI APIs or autonomous execution are connected.

AO-004.4 adds the CTO Recommendation Engine under `app/src/core/operators/recommendations`:

- `recommendationTypes.ts` — structured CTO recommendation schema and supported recommendation types.
- `recommendationEngine.ts` — deterministic CTO analysis from Business Memory, Money, CEO Briefing, Development, Roadmap, and Operator Tasks.
- `recommendationStore.ts` — localStorage-backed CTO recommendation persistence and status history.

The CTO engine is not a chatbot and does not accept free-form conversation. It produces structured executive recommendations and exposes local-only actions in the CTO workspace. Approval, rejection, roadmap backlog conversion, AO issue draft conversion, and save-to-memory actions mutate local stores only and preserve the CEO approval workflow.

AO-004.5 adds the local Roadmap core under `app/src/core/roadmap`:

- `roadmapTypes.ts` — executable roadmap item schema, operators, priorities, statuses, filters, and sort modes.
- `roadmapStore.ts` — localStorage-backed operator backlog persistence, status updates, archive behavior, and search/filter helpers.

The existing strategic Roadmap page remains the only Roadmap route. Operator backlog UI lives under `app/src/features/roadmap` and is rendered beneath the strategic timeline. CTO recommendations now create canonical roadmap items through the roadmap store instead of writing duplicate data into development tasks. Dashboard reads the same roadmap store for its backlog count.

## Approval Queue Architecture

AO-005.1 establishes the Approval Queue framework under `app/src/features/approval`:

- `types/approvalTypes.ts` — approval schema, status, priority, effort, risk, operator, and filter models.
- `store/approvalStore.ts` — localStorage-backed approval queue persistence and shared read API.
- `utils/approvalFilters.ts` — search, status, operator, priority, and date sorting helpers.
- `components/` — summary cards, filter bar, read-only approval cards, and executive empty state.
- `pages/ApprovalQueuePage.tsx` — the dedicated Approval Queue department page.

The Approval Queue is routed at `/approval` and appears in the active sidebar between Operators and Settings. AO-005.1 is infrastructure only: it displays approval requests but intentionally does not add approval decision buttons or execution behavior. CTO recommendation submissions and risky Executive Coordinator routes can create pending approval records in the shared local queue.

AO-005.2 turns the Approval Queue into a functional CEO decision workflow without adding automation execution. Approval records support Draft, Pending, Approved, Rejected, Changes Requested, Deferred, and Archived states. Decisions are recorded locally with actor, note, timestamp, and decision history. Approval cards expose CEO-only actions for approve, reject, request changes, defer, and archive; approved items explicitly remain non-executing until a later automation milestone.

Linked CTO recommendations can be submitted for CEO approval from the CTO workspace. The shared approval queue stores the approval record and the CTO recommendation history records the submission. CEO decisions on linked approvals update the CTO recommendation status/history where possible.

AO-005.3 expands Approval Queue visibility across the OS without adding new decision logic. Dashboard, Operators, operator workspaces, coordinator context, and roadmap cards read from the same Approval Store. Approval insights are centralized in `app/src/features/approval/utils/approvalInsights.ts` so counts and latest-decision labels stay consistent across surfaces.

Operator shared context now accepts approval summary data for pending approvals, total approvals, and approvals by operator. Roadmap items can store optional recommendation and approval references so items created from approved recommendations can display approval status and source approval metadata without blocking roadmap execution.

## AO Issue Naming

All new implementation issues use the `AO-###` format:

- AO-001 Money Department
- AO-002 CEO Daily Briefing
- AO-003 Business Memory Engine
- AO-004 AI Operator Framework
- AO-005 Approval Queue
- AO-006 Automation Engine

## Main Departments

- CEO
- Development
- Money
- Research
- Sales
- Delivery
- Analytics
- Memory
- Approval Queue
- Settings

## Approval Architecture

AI may research, draft, analyze, and prepare work. High-impact actions wait in the Approval Queue before execution.

High-impact actions include:

- Sending outreach
- Spending money
- Changing pricing
- Signing contracts
- Deleting data
- Connecting new services
- Sending client deliverables
