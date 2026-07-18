# Roadmap

Version: 0.1.0-alpha
Last Updated: 2026-07-18

## Start Here for Future Sessions

Future ChatGPT/Codex sessions should read `docs/PROJECT_CONTEXT/00_START_HERE.md` before using this roadmap. The Project Context folder contains the active handoff system, build workflow, testing checklist, current status, and common pitfalls.

## Sprint 0.1 - Foundation

Goal: Build the foundation of the OS before building revenue automation.

### Deliverables

- [x] GitHub repository
- [x] ChatGPT Project
- [x] Bootstrap Generator
- [x] Dashboard
- [x] CEO Department
- [x] Development Department
- [x] Settings
- [x] Memory
- [x] Roadmap UI
- [x] Approval Queue
- [x] Cost Tracker
- [x] Local business metric charts
- [x] Shared local operating data store
- [x] Manual revenue and expense entry
- [x] Manual project, task, approval, and memory entry
- [x] Metrics-driven CEO report
- [x] Money Department revenue CRUD
- [x] Money Department expense CRUD
- [x] Revenue and expense categories
- [x] Business-level financial attribution
- [x] Revenue, expense, profit, business, and category charts
- [x] CEO Daily Briefing Engine
- [x] Persisted daily briefing snapshots
- [x] Briefing priorities, risks, and recommendations
## AO Issue Roadmap

## Strategic Milestone Roadmap

### AO-012 — Execution Infrastructure

Purpose: prove AI Operator OS can execute work end-to-end without AI providers.

Includes:

- Worker Framework
- Worker Registration
- Job Queue
- Execution Engine
- Capability Manager
- Provider Interface framework only
- Approval Pipeline
- Execution Logging
- Tool Execution for deterministic non-AI tools
- End-to-end execution workflow

Workers may execute deterministic tools only. AO-012 does not include AI providers, model execution, autonomous AI behavior, or provider-specific intelligence.

### AO-013 — AI Provider Integration

Purpose: teach AI Operator OS how to use AI providers without tying the architecture to any single vendor.

Includes:

- Provider Manager
- Provider registration
- Capability discovery
- Provider health
- Provider selection
- Provider abstraction layer
- Local AI support through Ollama, local model detection, and model management
- Cloud AI support for OpenAI, future Codex integration, Claude-ready architecture, Gemini-ready architecture, and future providers
- Worker integration where workers request capabilities, Provider Manager selects providers, workers receive responses, workers log execution, and workers return results
- CEO visibility for Provider Dashboard, Installed Providers, Available Models, Provider Health, Usage Metrics, and Local vs Cloud usage

### AO-014+ — Revenue, Integrations, and Scaling

After execution infrastructure and provider integration are stable, the roadmap proceeds into early revenue foundations, multi-business management, B2B revenue systems, external integrations, autonomous departments, and long-term scaling.

## Legacy AO Issue Roadmap

- [x] AO-001 Money Department
- [x] AO-002 CEO Daily Briefing
- [x] AO-003 Business Memory Engine
- [x] AO-003.1 Structured Business Knowledge System
  - [x] Structured metadata, migration, relationships, archive/pin controls, search, filters, and executive integrations
- [x] AO-003.2 Business Knowledge System Finalization
  - [x] Type colors, Markdown details, quick templates, relationship editing, AI search API, and memory-health Dashboard intelligence
- [x] AO-003.2.1 Business Knowledge System Polish Sprint
  - [x] Consistent type colors, label-style tags, contextual empty states, custom confirmation modal, and dedicated Business Rules access
- [x] AO-004.1 AI Operator Framework Foundation
  - [x] Shared operator models, registry, task queues, memory access, status, recommendations, events, and Operators workspace
- [x] AO-004.2 Operator Workspace
  - [x] Routed operator workspaces, persistent local task queues, recommendations, shared context panels, and CTO deterministic architecture actions
- [x] AO-004.2.1 Operator Workspace Polish
  - [x] Mission/current objective cards, standardized statuses, operator icons, executive stats, recommendation detail cards, and activity timeline
- [x] AO-004.3 Executive Coordinator
  - [x] Internal deterministic routing service, local routing history, operator task creation, approval-queue handoff, and Coordinator Activity UI
- [x] AO-004.4 CTO Recommendation Engine
  - [x] Structured deterministic CTO recommendations, local persistence, history, detail view, and local action buttons
- [x] AO-004.5 Roadmap Integration
  - [x] CTO recommendation backlog conversion, local roadmap store, Operator Backlog UI, search, filters, status persistence, archive, and Dashboard backlog count
- [ ] AO-005 Approval Queue
  - [x] AO-005.1 Approval Queue Framework: dedicated route, sidebar entry, local store, summary cards, filters, read-only cards, and executive empty state
  - [x] AO-005.2 CEO Approval Workflow: submit recommendation, approve, reject, request changes, defer, archive, detail view, and decision history
  - [x] AO-005.3 Dashboard & Operator Approval Integration: Dashboard metrics, operator approval context, workspace approval history, coordinator context, and roadmap approval references
  - [ ] Approval execution handoff
- [ ] AO-006 Automation Engine
  - [x] AO-006.1 Money Store Foundation: shared local-first money types, store adapter, cost schedule tracking, reusable calculations, and Dashboard/Money integration
  - [x] AO-006.2 Money Department Dashboard: monthly summary cards, cost overview, expense category breakdown, recent activity, and financial health status
  - [x] AO-006.3 Budgeting & Recurring Cost Management: persisted category budgets, progress/status tracking, recurring cost manager, and monthly budget summary
- [ ] AO-007 Automation Core
  - [x] AO-007.1 Automation Core Foundation: local automation model, store, lifecycle, history, safety rules, deterministic engine helpers, and no-execution boundary
  - [ ] Future automation UI and approval handoff
  - [ ] Future workflow drafts for dropshipping, YouTube/TikTok, content operations, product research, store operations, and business operations
- [ ] AO-090 UX & Visual Polish
  - [ ] Complete deferred visual, UX, desktop, and quality-of-life improvements tracked in `docs/POLISH_BACKLOG.md`

## Sprint 0.2 - Business Builder

- [ ] New Business wizard
- [ ] Business profile templates
- [ ] Department generator
- [ ] Prompt generator
- [ ] Local data export, backup, and restore
- [ ] Operating record validation and audit history

## Sprint 0.3 - Research Department

- [ ] Opportunity Finder
- [ ] Competitor Research
- [ ] Offer Builder

## Sprint 0.4 - Sales Department

- [ ] Lead tracker
- [ ] Outreach drafts
- [ ] CRM
- [ ] Follow-up queue

## Sprint 1.0 - First Revenue

Goal: Use AI Operator OS to help land the first paying client.

## Deferred Polish

Non-critical UI, UX, desktop, visual consistency, performance, and theme improvements are tracked in `docs/POLISH_BACKLOG.md`.

Core architecture, functionality, and business value take priority until a dedicated polish milestone begins.

## Planning Documents

- `docs/PROJECT_CONTEXT/00_START_HERE.md` is the first-read handoff for future ChatGPT/Codex sessions.
- `docs/FUTURE_IDEAS.md` tracks ideas that are intentionally not on the active roadmap.
- `docs/TECH_DEBT.md` tracks intentional technical debt, future refactoring, and deferred engineering work.
- `docs/POLISH_BACKLOG.md` tracks non-critical visual, UX, desktop, and quality-of-life improvements reserved for AO-090.
