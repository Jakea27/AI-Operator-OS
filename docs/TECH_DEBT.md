# Technical Debt

## Purpose

Track intentional technical debt and future refactoring for AI Operator OS.

This document makes deferred engineering work explicit so the project can move quickly without forgetting the cost of earlier tradeoffs.

## Item Format

Every item should include:

- Title
- Description
- Reason Deferred
- Risk
- Estimated Effort
- Related AO Issue

## Architecture

### LocalStorage Persistence Boundary

- Title: LocalStorage Persistence Boundary
- Description: The app currently uses localStorage-backed stores for operating, memory, operator, recommendation, coordinator, and roadmap data.
- Reason Deferred: Local-first speed and simplicity are more important than a heavier storage layer during alpha.
- Risk: Large datasets, backup workflows, and future encryption may become harder if storage boundaries are not formalized.
- Estimated Effort: High
- Related AO Issue: AO-006

### Mixed Page Locations

- Title: Mixed Page Locations
- Description: Some top-level pages live in `app/pages` while newer modules live under `app/src/features`.
- Reason Deferred: Avoided disruptive file moves while building active features.
- Risk: New contributors may need extra context to find active UI files.
- Estimated Effort: Medium
- Related AO Issue: AO-004

## Performance

### Large Bundle Warning

- Title: Large Bundle Warning
- Description: Production builds warn that some chunks are larger than 500 kB.
- Reason Deferred: Feature velocity is higher priority than bundle splitting during alpha.
- Risk: Startup and update performance may degrade as modules grow.
- Estimated Effort: Medium
- Related AO Issue: AO-090

### Long List Rendering

- Title: Long List Rendering
- Description: Memory, roadmap, recommendation, and operator lists are not yet virtualized.
- Reason Deferred: Current local datasets are expected to be small during early development.
- Risk: UI may slow down with large local workspaces.
- Estimated Effort: Medium
- Related AO Issue: AO-090

## Code Quality

### Shared UI Component Extraction

- Title: Shared UI Component Extraction
- Description: Several panels, badges, cards, filters, and empty states use similar styling but are not fully centralized.
- Reason Deferred: Component boundaries are still evolving as departments are built.
- Risk: Visual drift and repeated styling changes.
- Estimated Effort: Medium
- Related AO Issue: AO-090

### Store API Consistency

- Title: Store API Consistency
- Description: Local stores follow similar patterns but are not yet standardized behind one common utility.
- Reason Deferred: Domain-specific stores were faster to build and easier to reason about independently.
- Risk: Future migrations, exports, and backups may require duplicated work.
- Estimated Effort: Medium
- Related AO Issue: AO-006

## Refactoring

### Roadmap Feature Migration

- Title: Roadmap Feature Migration
- Description: The Roadmap page still lives in `app/pages` while its operator backlog pieces live in `app/src/features/roadmap`.
- Reason Deferred: The current route is stable and should not be moved during feature work.
- Risk: Split ownership between page and feature files.
- Estimated Effort: Low
- Related AO Issue: AO-004.5

### Operator Detail Size

- Title: Operator Detail Size
- Description: The operator detail workspace contains many UI sections and local action handlers in one file.
- Reason Deferred: Keeping the workspace in one file simplified rapid AO-004 iteration.
- Risk: Future operator-specific behavior may make the file harder to maintain.
- Estimated Effort: Medium
- Related AO Issue: AO-004

## Testing

### Formal Test Suite

- Title: Formal Test Suite
- Description: The project relies primarily on TypeScript builds and manual workflow verification.
- Reason Deferred: The product surface is changing quickly and does not yet have a stable test harness.
- Risk: Regressions may be caught later than ideal.
- Estimated Effort: High
- Related AO Issue: AO-006

### Store Migration Tests

- Title: Store Migration Tests
- Description: Local store normalization and migration behavior does not yet have dedicated automated tests.
- Reason Deferred: Manual verification has been sufficient during early schema evolution.
- Risk: Legacy local data could break after future schema changes.
- Estimated Effort: Medium
- Related AO Issue: AO-006

## Documentation

### Documentation Index

- Title: Documentation Index
- Description: Documentation exists across several files, but there is no single full index of docs and ownership.
- Reason Deferred: README and Roadmap links are currently enough for active development.
- Risk: Future planning documents may become harder to discover.
- Estimated Effort: Low
- Related AO Issue: AO-090

### Decision Records

- Title: Decision Records
- Description: Architecture decisions are captured in project memory but not yet formalized as dedicated ADR files.
- Reason Deferred: Business Memory is currently the canonical decision store.
- Risk: Major technical decisions may be harder to audit outside the running app.
- Estimated Effort: Medium
- Related AO Issue: AO-003
