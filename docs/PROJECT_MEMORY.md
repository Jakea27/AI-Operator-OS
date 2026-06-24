# Project Memory

Version: 0.1.0-alpha
Last Updated: 2026-06-24

## Current State

AI Operator OS has a production-capable Electron desktop shell built with React, Vite, TypeScript, and Tailwind. The application includes Dashboard, CEO, Money, Development, Memory, Roadmap, and Settings workspaces.

Dashboard, Money, CEO, Development, Memory, Settings, and the application shell share a typed local operating store in `app/src/services/operatingStore.ts`. Revenue, expenses, approvals, projects, tasks, sprint progress, and memory persist in one localStorage document.

Financial metrics and charts are derived from actual local records. The application starts empty and displays zero values and empty states until the operator adds data. Optional sample records are available only through the clearly labeled **Load sample data** action in Settings.

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

## Next Priorities

1. Add export, backup, and restore for the local operating store.
2. Build the Business Builder workflow.
3. Expand approval history and decision audit trails.
4. Add validation and automated tests for derived metrics.
