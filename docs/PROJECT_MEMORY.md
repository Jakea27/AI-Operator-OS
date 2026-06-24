# Project Memory

Version: 0.1.0-alpha
Last Updated: 2026-06-24

## Current State

AI Operator OS has a production-capable Electron desktop shell built with React, Vite, TypeScript, and Tailwind. The application includes Dashboard, CEO, Money, Development, Memory, Roadmap, and Settings workspaces.

Dashboard and Money use a reusable Recharts component system with responsive, dark-mode charts. Business metrics remain local mock data in `app/src/data/mockBusinessMetrics.ts` until a future local data layer replaces them.

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
- Chart data is currently mocked and must not be treated as live financial reporting.

## Next Priorities

1. Connect charts to the future local business metrics store.
2. Build the Business Builder workflow.
3. Expand approval history and decision audit trails.
4. Add automated chart and desktop UI tests.
