# Project Memory

Version: 0.1.0-alpha
Last Updated: 2026-06-24

## Current State

AI Operator OS has a production-capable Electron desktop shell built with React, Vite, TypeScript, and Tailwind. The application includes Dashboard, CEO, Money, Development, Memory, Roadmap, and Settings workspaces.

Dashboard, Money, CEO, Development, Memory, Settings, and the application shell share a typed local operating store in `app/src/services/operatingStore.ts`. Revenue, expenses, approvals, projects, tasks, sprint progress, and memory persist in one localStorage document.

Financial metrics and charts are derived from actual local records. The application starts empty and displays zero values and empty states until the operator adds data. Optional sample records are available only through the clearly labeled **Load sample data** action in Settings.

Issue #001 established the Money Department as the accounting source of truth. Revenue and expense records include amount, date, category, business, notes, and created/updated timestamps. Both record types support add, edit, and delete operations. Existing records using the earlier `description` schema are normalized to the current notes-based schema when loaded.

Money calculates revenue today, current-month revenue, current-month expenses, profit, and profit margin. Its revenue, expense, profit, business, and category charts use the same records. Dashboard financial widgets call the same `calculateMetrics` function, so accounting edits immediately affect the command center.

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

## Known Constraints

- No direct automatic GitHub push from ChatGPT chat.
- Local-first during early build.
- AI drafts before it executes.
- LocalStorage is the current persistence layer and is not yet backed up or encrypted.
- Financial reporting reflects manually entered local records only.
- Development and packaged builds maintain separate localStorage datasets.

## Next Priorities

1. Add export, backup, and restore for the local operating store.
2. Add accounting filters, CSV export, and reconciliation tools.
3. Build the Business Builder workflow.
4. Add validation and automated tests for derived metrics.
