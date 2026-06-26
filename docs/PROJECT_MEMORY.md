# Project Memory

Version: 0.1.0-alpha
Last Updated: 2026-06-26

## Current State

AI Operator OS has a production-capable Electron desktop shell built with React, Vite, TypeScript, and Tailwind. The application includes Dashboard, CEO, Money, Development, Memory, Operators, Roadmap, and Settings workspaces.

Dashboard, Money, CEO, Development, Settings, and the application shell share a typed local operating store in `app/src/services/operatingStore.ts`. Revenue, expenses, approvals, projects, tasks, sprint progress, and briefing snapshots persist there.

Financial metrics and charts are derived from actual local records. The application starts empty and displays zero values and empty states until the operator adds data. Optional sample records are available only through the clearly labeled **Load sample data** action in Settings.

AO-001 established the Money Department as the accounting source of truth. Revenue and expense records include amount, date, category, business, notes, and created/updated timestamps. Both record types support add, edit, and delete operations. Existing records using the earlier `description` schema are normalized to the current notes-based schema when loaded.

Money calculates revenue today, current-month revenue, current-month expenses, profit, and profit margin. Its revenue, expense, profit, business, and category charts use the same records. Dashboard financial widgets call the same `calculateMetrics` function, so accounting edits immediately affect the command center.

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

The Dashboard route (`/`) and Money route (`/money`) both import `useOperatingStore` from `app/src/services/operatingStore.ts`. Their charts are calculated through `app/src/data/operatingMetrics.ts`. The router continues to use the existing pages under `app/pages`; there is only one `app/src` tree.

Important release note: source and `app/dist` can be newer than an installed Windows build. After operating-store changes, `npm run dist` must be run before testing the installer or portable executable. Development (`http://localhost`) and packaged Electron (`file://`) also have separate localStorage origins, so records entered in one environment do not automatically appear in the other.

## Active Sprint

Sprint 0.1 - Foundation and Desktop Command Center

## Current Rules

- GitHub is the brain.
- ChatGPT Project is the office.
- Codex is the developer.
- Jake is the CEO.
- One permanent codebase.
- Manual approval first.
- Keep fixed costs below $30/month until revenue.
- Business data stays local-first.
- CEO approval remains required for consequential actions.
- Shared visualization components live under `app/src/components/charts`.
- Core business memory logic lives under `app/src/core/memory`.
- Core AI Operator framework logic lives under `app/src/core/operators`.
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
- Operators are framework objects only; AI reasoning and external model/API calls are intentionally not implemented yet.

## Next Priorities

1. AO-004.2 Operator reasoning planner.
2. AO-005 Approval Queue.
3. AO-006 Automation Engine.
4. Add export, backup, and restore for operating and memory stores.
