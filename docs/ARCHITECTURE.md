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
