# Changelog

## 0.1.0-alpha - 2026-06-24

### Added

- Electron desktop application shell
- React, Vite, TypeScript, and Tailwind frontend
- Dashboard with revenue, cost, profit, CEO report, sprint, and approval widgets
- CEO, Money, Development, Memory, Roadmap, and Settings pages
- Local persistence for operating data, approvals, settings, and memory
- Cross-platform Electron Builder configuration
- Production Windows packaging with NSIS installer and portable executable
- Desktop and Start Menu shortcuts for installed builds
- Branded application, executable, installer, and taskbar icon
- Windows application metadata for AI Operator OS
- Dedicated installer and portable release scripts
- Reusable dark-mode chart component system powered by Recharts
- Initial local chart metrics for revenue, profit, expenses, portfolio, and approval activity
- Responsive revenue and approval charts on the Dashboard
- Responsive revenue, profit, business portfolio, and expense charts on the Money page
- Unified typed local operating store for revenue, expenses, approvals, projects, tasks, sprint progress, and memory
- Real-time Dashboard and Money calculations from persisted local records
- Metric-driven CEO report and local storage health status
- Manual entry workflows for revenue, expenses, projects, tasks, approvals, and memory
- Optional sample dataset available only through an explicit Settings action
- Empty-by-default operating state with no automatically loaded financial demo data
- Fixed stale Windows release artifacts that still contained the pre-local-store dashboard
- Added a prominent zero-data Dashboard state with direct revenue and expense entry actions
- Added cross-window localStorage synchronization for real-time operating updates
- Verified Dashboard and Money share the same persisted operating store and derived metrics
- Completed AO-001: functional local-first Money Department
- Added revenue and expense categories, business assignment, and notes
- Added revenue and expense editing and deletion with immediate metric recalculation
- Added separate revenue and expense history tables
- Added revenue-today, monthly revenue, monthly expenses, profit, and profit-margin accounting summaries
- Added expense trend reporting alongside revenue, profit, business, and category charts
- Added backward-compatible migration for financial records created before the accounting schema
- Completed AO-002: local-first CEO Daily Briefing Engine
- Added typed daily briefings generated from Money, approvals, sprint tasks, memory, and storage health
- Added live briefing drafts that react to operating-data changes
- Added explicit daily briefing regeneration with locally persisted snapshots and timestamps
- Added CEO-style priorities, risks, recommendations, metrics, and executive signal
- Added truthful empty-state briefing language for missing financial, approval, and sprint data
- Added runtime briefing validation without introducing a new test dependency
- Completed AO-003: local-first Business Memory Engine
- Added dedicated core memory types, store, engine, search, and tag modules
- Added backward migration from both previous local memory formats
- Added complete memory CRUD with pinning, archiving, relationships, and metadata
- Added full-text search plus type, tag, archived, and sorting filters
- Added Business Memory Dashboard widget for decisions, pinned knowledge, sprint notes, and ideas
- Added recent important memory to CEO Daily Briefings
- Adopted AO issue naming for AO-001 through AO-006
- Project bootstrap generator
- Core folder structure
- Foundation documentation
- Roadmap, memory, and development standards
