# Project Memory

Version: 0.1.0-alpha
Last Updated: 2026-06-27

## Current State

AI Operator OS has a production-capable Electron desktop shell built with React, Vite, TypeScript, and Tailwind. The application includes Dashboard, CEO, Money, Development, Memory, Operators, Roadmap, and Settings workspaces.

Dashboard, Money, CEO, Development, Settings, and the application shell share a typed local operating store in `app/src/services/operatingStore.ts`. Revenue, expenses, approvals, projects, tasks, sprint progress, and briefing snapshots persist there.

Financial metrics and charts are derived from actual local records. The application starts empty and displays zero values and empty states until the operator adds data. Optional sample records are available only through the clearly labeled **Load sample data** action in Settings.

AO-001 established the Money Department as the accounting source of truth. Revenue records include amount, date, category, business, notes, and created/updated timestamps. Expense records include those same fields plus a cost type for one-time or monthly recurring costs. Both record types support add, edit, and delete operations. Existing records using the earlier `description` schema are normalized to the current notes-based schema when loaded.

AO-006.1 adds the shared Money Store Foundation under `app/src/core/money`. It wraps the existing local operating store instead of creating a second persistence system, exposes typed revenue and cost items, normalizes monthly recurring vs one-time costs, and calculates revenue today, current-month revenue, current-month costs, recurring costs, one-time costs, profit, and profit margin. Dashboard and Money financial summaries now read through this shared money layer, so accounting edits immediately affect the command center.

AO-006.2 expands the active Money page into a local-first financial dashboard. The page now shows monthly revenue, monthly expenses, monthly profit, profit margin, cost overview, expense category breakdown, recent financial activity, and a financial health card. Health status is deterministic: Healthy means positive profit and margin of at least 30%, Stable means positive profit below 30%, and Warning means zero or negative profit. The reusable calculations live in `app/src/core/money/moneyCalculations.ts` and no duplicate money store or page was created.

AO-006.3 adds budgeting and recurring cost management to the same Money Department. Monthly budgets are persisted in the existing operating store as `moneyBudgets`, keyed by expense category. The Money core calculates budget spent, remaining budget, percent used, Healthy/Watch/Over Budget status, total monthly budget, total spent, remaining budget, and recurring monthly cost total. Recurring costs are derived from expense records marked as monthly recurring, with a deterministic next billing date based on the original expense date.

AO-002 added the local-first CEO Daily Briefing Engine at `app/src/services/briefing/briefingEngine.ts`. It produces a typed `DailyBriefing` from Money records, pending approvals, sprint tasks, important memory entries, workspace identity, and local storage health. The engine is deterministic and uses no external AI service.

Dashboard and CEO show a live briefing draft that changes whenever the underlying operating data changes. The **Run daily briefing** action saves the current briefing snapshot and generation time into the existing operating store. If records change afterward, the UI shows the updated live draft and marks the persisted snapshot as needing refresh.

AO-003 created the permanent Business Memory Engine under `app/src/core/memory`. Memory is stored in its own local-first document and no longer uses the general operating store. The engine supports decisions, business rules, sprint history, issues, knowledge, SOPs, meeting notes, ideas, bugs, release notes, architecture decisions, and research.

Memory entries include type, category, tags, summary, details, author, issue/sprint relationships, related memories, pin state, archive state, and audit timestamps. The feature UI under `app/src/features/memory` provides CRUD, full-text search, type/tag filters, newest/oldest/pinned sorting, and separate archived views. Existing memory records are migrated automatically.

AO-003.1 upgraded this foundation into a structured Business Knowledge System. The Memory workspace now filters by type, category, tag, pin state, and archive state; pinned entries remain first; and each memory has a full detail view with created/updated timestamps and navigable relationships. Existing stored records are normalized automatically with safe defaults for newly required metadata.

The Dashboard Business Memory widget now presents pinned business rules, recent decisions, recent ideas, and latest sprint notes. Daily Briefings include active pinned decisions and business rules, the three most recent important memories, and current open ideas.

The structured category set is Development, Finance, Marketing, Operations, AI, Product, Research, Sales, Automation, and Strategy. Existing simple entries preserve their title and available created date; context becomes summary, a single legacy tag becomes a tags array, and missing type/category values default to Knowledge and Development.

AO-003.2 finalizes Business Memory as the Business Knowledge System. Memory cards use type-specific visual signals, pinned records move immediately to the top, and the editor includes reusable templates plus existing-memory relationship selection. Details remain raw Markdown in local storage and render as formatted headings, lists, emphasis, code, quotes, links, and tables in the detail view.

The core memory API now exports `queryBusinessMemory`, a reusable local query function for future AI Operators. It supports text, type, category, tags, issue, sprint, related-memory IDs, pinned state, archived state, and result limits. Dashboard memory intelligence now includes pinned rules, the latest decision, architecture note, sprint note, idea, and active/pinned/archived/idea/decision health counts.

AO-003.2.1 polished the active Memory workspace before AO-004. Memory type badges now use a consistent palette, tags read as GitHub-style labels, cards always expose related issue and sprint context, empty states explain the next useful action, deletion uses an AI Operator OS confirmation modal instead of the browser dialog, and Business Rules have a dedicated panel plus one-click filter path.

AO-004.1 created the foundational AI Operator Framework under `app/src/core/operators`. The framework defines shared operator models, status, approval levels, tools, memory access, task queues, recommendation history, events, and shared-context snapshots. It ships with five initial operators: CTO, CFO, CMO, COO, and Research.

The Operators workspace lives under `app/src/features/operators` and is routed through the existing app shell at `/operators`. It shows all five operators, status, current task, last recommendation, open detail views, task queues, tool access, and relevant Business Memory context. This is not a chat system and does not perform AI reasoning yet; it is a reusable local-first framework that consumes existing Money, Memory, Briefing, project/task, and approval data.

AO-004.1 integration fix: the active sidebar is `app/components/AppShell.tsx`, and the active router is `app/src/App.tsx`. Operators is intentionally rendered after Roadmap in the main navigation and before the bottom Settings link. If the installed Windows app does not show Operators, the installed `resources/app.asar` is stale and must be refreshed from a new build/package.

AO-004.2 expands Operators from summary cards into routed department-head workspaces. `/operators/:operatorId` opens a dedicated workspace for CTO, CFO, CMO, COO, or Research. Each workspace shows identity, role, mission, status, approval level, current task, local task queue, recommendation history, shared context counts, operator history, and an actions panel.

Operator workspace state is persisted locally in `app/src/core/operators/operatorStore.ts`. Tasks and recommendations are local drafts only; they do not execute automatically and do not call external AI APIs. The CTO workspace is the most complete example: it can run deterministic architecture analysis, generate a local architecture recommendation, add operator tasks, and save an important note into Business Memory.

AO-004.2.1 polished the routed operator workspaces. Each operator now has a permanent icon, standardized status badge, always-visible Mission card, Current Objective card, executive statistics row, structured recommendation cards, and chronological activity timeline. Recommendation records now carry confidence and risk-level metadata while remaining deterministic local drafts.

AO-004.3 added the internal Executive Coordinator at `app/src/core/operators/executiveCoordinator.ts`. The coordinator is not a visible operator and is not shown as a sidebar item or operator card. It receives local requests, classifies request type, selects the best operator or operators, creates local operator tasks, records routing history, generates a deterministic summary, and queues risky requests into the existing approval workflow.

The Operators page now includes a small Route to operator panel and Coordinator Activity feed. Routed requests persist locally, and coordinator-created tasks appear in the same operator workspaces as other local operator tasks. No external AI APIs are used.

AO-004.4 transformed the CTO workspace into a structured executive advisor. The CTO Recommendation Engine lives under `app/src/core/operators/recommendations` with dedicated recommendation types, deterministic generation, and local persistence. CTO recommendations include title, summary, reasoning, business value, effort, dependencies, risk, confidence, supporting evidence, recommended next action, approval requirement, status, created/updated timestamps, and history.

The CTO workspace can generate structured recommendations from local context only. If the Executive Coordinator exists and there is no dedicated Approval Queue workspace, the deterministic engine recommends building AO-005 Approval Queue. CTO recommendation buttons function locally: approve, reject, add to roadmap backlog, convert to AO issue draft, and save to Business Memory. No chatbot or free-form conversation UI was added.

AO-004.5 integrates CTO recommendations with the active Roadmap module. The Roadmap page keeps the existing strategic timeline and adds an Operator Backlog beneath it. Backlog items persist through `app/src/core/roadmap/roadmapStore.ts` and include title, description, source operator, priority, status, related issue, and created/updated timestamps. The CTO Recommendation Engine Add to Roadmap action now creates canonical roadmap backlog items rather than duplicating work in the development task store.

The Operator Backlog supports search by title/description, filters by operator, priority, and status, sorting by newest/oldest/priority, status changes to planned/in-progress/complete, and archive. Dashboard reads the same roadmap store and shows the current active roadmap backlog count.

AO-005.1 creates the Approval Queue framework as a dedicated department. The active router now includes `/approval`, and the active sidebar shows Approval Queue between Operators and Settings. The feature lives under `app/src/features/approval` with local approval types, a localStorage-backed store, filter utilities, summary cards, read-only approval cards, and an executive empty state.

The Approval Queue model includes title, description, submittedBy, operator, department, relatedIssue, recommendationId, priority, effort, risk, status, requiresCEOApproval, created, and updated. Statuses are Pending, Approved, Rejected, Deferred, and Archived. AO-005.1 intentionally does not add approval decision buttons or approval decision logic; it only creates the infrastructure and review UI. CTO recommendation approval submissions and risky Executive Coordinator routes now create pending approval records in the shared approval queue store.

AO-005.2 upgrades the Approval Queue into the CEO Approval Workflow. Approval records now include submittedAt, decidedAt, decision, decisionNote, businessValue, supportingEvidence, recommendedNextAction, and decisionHistory. Supported statuses are Draft, Pending, Approved, Rejected, Changes Requested, Deferred, and Archived. Decision history items store action, actor, note, and createdAt.

The Approval Queue page now supports CEO actions: Approve, Reject, Request Changes, Defer, and Archive. These actions update local status and decision history only; approved work does not execute automatically. The detail panel shows full recommendation context, business value, risk, effort, supporting evidence, recommended next action, linked recommendation, related issue, and full decision history. Archived approvals are hidden from the default view but remain available through filters.

The CTO workspace now includes Submit for CEO Approval on structured recommendation cards. Submitting creates a Pending approval linked by recommendationId, records a CTO recommendation history item, and displays linked approval status plus last CEO decision. Dashboard and Operators summary cards now read approval counts from the shared approval queue store.

AO-005.2.1 cleans up recommendation approval state display. CTO recommendation cards now derive Last CEO Decision from the linked approval status and decision timestamp instead of relying only on a custom decision note. Approved shows “Approved by CEO,” Rejected shows “Rejected by CEO,” Changes Requested shows “Changes requested by CEO,” Deferred shows “Deferred by CEO,” Archived shows “Archived,” and Pending shows “Waiting on CEO decision.”

Submitted, pending, and terminal approval states hide duplicate Submit for CEO Approval, Approve, and Reject controls. Draft recommendations can still be submitted for CEO approval. Approval Queue decisions for Changes Requested, Deferred, and Archived now sync back into CTO recommendation status/history so the Approval Queue and CTO workspace remain aligned after reload.

AO-005.3 integrates approval visibility across the command center. Dashboard now shows shared Approval Store metrics for pending approvals, approved today, rejected today, deferred approvals, latest approval decision, and waiting-on-CEO count. It also shows a CEO decisions waiting alert with an Open Approval Queue button when pending approvals exist.

Operators page cards now show pending approvals, approved recommendations, rejected recommendations, last CEO decision, and whether the operator needs CEO attention. Operator workspaces include an Approval Context section with pending/approved/rejected/deferred counts, latest CEO decision, and approval history for that operator. CTO recommendation cards show approval status, last CEO decision, linked approval ID, and status-specific guidance.

Roadmap items created from recommendations can now carry recommendationId, sourceApprovalId, approvalStatus, and approvedAt metadata. Roadmap cards display approval status, approved date, and source approval reference when those values are available.

The Dashboard route (`/`) and Money route (`/money`) both import `useOperatingStore` from `app/src/services/operatingStore.ts`. Their charts are calculated through `app/src/data/operatingMetrics.ts`. The router continues to use the existing pages under `app/pages`; there is only one `app/src` tree.

Important release note: source and `app/dist` can be newer than an installed Windows build. After operating-store changes, `npm run dist` must be run before testing the installer or portable executable. Development (`http://localhost`) and packaged Electron (`file://`) also have separate localStorage origins, so records entered in one environment do not automatically appear in the other.

Documentation handoff note: `docs/PROJECT_CONTEXT/` is now the permanent project context system for future ChatGPT/Codex sessions. New sessions should read `docs/PROJECT_CONTEXT/00_START_HERE.md` first, then use the current status, next milestone, build workflow, testing checklist, development playbook, common pitfalls, handoff template, lessons learned, project metrics, and Codex prompt template in that folder. This system records the one-codebase rule, local-first architecture, CEO approval workflow, GitHub Desktop review flow, Build Info verification requirement, and the rule that cosmetic polish belongs in `docs/POLISH_BACKLOG.md`.

## Active Sprint

Sprint 0.1 - Foundation and Desktop Command Center

## Current Rules

- GitHub is the brain.
- ChatGPT Project is the office.
- Codex is the developer.
- Jake is the CEO.
- Future sessions read `docs/PROJECT_CONTEXT/00_START_HERE.md` first.
- One permanent codebase.
- Manual approval first.
- Keep fixed costs below $30/month until revenue.
- Business data stays local-first.
- CEO approval remains required for consequential actions.
- Shared visualization components live under `app/src/components/charts`.
- Core business memory logic lives under `app/src/core/memory`.
- Core AI Operator framework logic lives under `app/src/core/operators`.
- Core roadmap backlog logic lives under `app/src/core/roadmap`.
- Core approval queue feature logic lives under `app/src/features/approval`.
- New work uses the AO issue naming format.

## Known Constraints

- No direct automatic GitHub push from ChatGPT chat.
- Local-first during early build.
- AI drafts before it executes.
- LocalStorage is the current persistence layer and is not yet backed up or encrypted.
- Financial reporting reflects manually entered local records only.
- Development and packaged builds maintain separate localStorage datasets.
- Daily briefings are deterministic local summaries, not AI-generated analysis.
- Business memory is local-only and currently has no encrypted backup.
- Operators can analyze, recommend, draft, persist local tasks/recommendations, and save notes to Business Memory. External model/API calls and automatic execution are intentionally not implemented yet.
- Approval decisions are local CEO decisions only. Approved items do not execute automatically until a later automation milestone.
- Approval visibility surfaces read from the shared Approval Store; no duplicate approval stores exist.

## Next Priorities

1. AO-005 Approval Queue.
2. AO-006 Automation Engine.
3. Add export, backup, and restore for operating and memory stores.
