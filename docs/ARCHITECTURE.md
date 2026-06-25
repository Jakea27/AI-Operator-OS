# Architecture

Version: 0.1.0-alpha
Last Updated: 2026-06-25

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
- Business memory uses `app/src/core/memory/memoryStore.ts`.
- Daily briefing snapshots are stored in the operating store.
- Business Memory has a dedicated store to prevent duplicate memory ownership.

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
