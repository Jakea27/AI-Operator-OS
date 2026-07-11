# Current Context

## Purpose

This document provides operational continuity for future AI operators.

It should allow a brand-new AI operator to understand the project within five minutes.

## Current Focus

The current focus is Sprint 011 - Continuity System v1.1.

Sprint 010 has been completed and officially closed. Sprint 011 is active and currently in Task 5 - Repository State Normalization.

## Last Completed Sprint

Sprint 010 - CEO Experience and UI/UX Redesign.

## Major Decisions Made Recently

- The Dashboard is now treated as the CEO Command Center.
- The Command Center should answer: "What requires my attention right now?"
- Summary cards are used for navigation.
- Buttons are reserved for actions that create or change data.
- The sidebar is grouped by executive workflow area.
- Sprint implementation must not begin until the prior sprint is formally closed.
- Documentation is authoritative over conversation memory.

## Current Development Priorities

- Preserve the operating system foundation created through Sprints 001-010.
- Keep the CEO experience simple while allowing internal architecture to remain structured.
- Continue improving workflow clarity without duplicating stores, routes, or modules.
- Keep all new work local-first until cloud or external services have clear positive ROI.
- Remove ambiguous continuity references so every future AI operator can complete startup from exact source paths.
- Keep the generated Startup Bundle as a fallback transport artifact, not the authoritative source.
- Maintain repository metadata only in Active Project State.

## Known Risks

- Starting new sprint work before closeout can create state confusion.
- Relying on conversation memory instead of documentation can cause duplicate work.
- UI polish can accidentally expand into architecture changes if scope is not controlled.
- Future AI or automation work must not bypass capability planning or approval architecture.

## Future Planned Work

- Sprint 011 awaits CEO review and clean-room startup validation after Task 5 repository-state normalization.
- Future execution-layer work must follow Architecture v2 and the approval-first operating model.
- Any future AI provider integration must remain replaceable and capability-based.

## User Workflow Preferences

- Codex writes directly to the local repository.
- GitHub Desktop is used for review, commit visibility, and push.
- Development verification should use the current source launcher.
- Packaged app verification should use Build Info before assuming source changes failed.
- The user prefers milestone-based implementation with clear QA and closeout.

## Important Design Philosophies Added Recently

- Reduce Thinking, Not Clicks.
- Dashboard tells the CEO what matters. Modules let the CEO work on it.
- The Command Center exists to reduce executive cognitive load.
- The operating system manages information. The CEO manages decisions.
- Automation is earned.
- Infrastructure comes before intelligence.
- AI providers are replaceable.
