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
- Completed Issue #001: functional local-first Money Department
- Added revenue and expense categories, business assignment, and notes
- Added revenue and expense editing and deletion with immediate metric recalculation
- Added separate revenue and expense history tables
- Added revenue-today, monthly revenue, monthly expenses, profit, and profit-margin accounting summaries
- Added expense trend reporting alongside revenue, profit, business, and category charts
- Added backward-compatible migration for financial records created before the accounting schema
- Project bootstrap generator
- Core folder structure
- Foundation documentation
- Roadmap, memory, and development standards
