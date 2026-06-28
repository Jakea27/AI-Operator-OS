# Next Milestone

## Current Milestone

AO-007.1 — Automation Core Foundation

AI Operator OS is moving from foundation departments toward safe local automation infrastructure. AO-007.1 creates the first reusable automation layer without executing consequential actions automatically.

## Objective

Build a local-first Automation Core that can draft, queue, classify, and track automation work while preserving CEO approval as the execution boundary.

The Automation Engine should support future workflows from Money, Operators, Roadmap, Memory, and Approval Queue, but this milestone should remain deterministic and local-only.

## Success Criteria

- Automation concepts are modeled with clear TypeScript types.
- Automation records persist locally.
- Automation tasks can be queued or drafted without external APIs.
- Consequential automation requires CEO approval before execution.
- The system records automation history and status.
- Existing Dashboard, Operators, Approval Queue, Roadmap, Money, and Memory behavior remains intact.
- No chatbot or free-form assistant interface is introduced.

## Expected Files or Modules to Modify

Likely areas:

- `app/src/core/automation/`
- `app/src/features/automation/` if a visible workspace is approved
- `app/src/core/operators/` for operator-created automation drafts
- `app/src/features/approval/` for approval handoff if needed
- `app/src/core/roadmap/` only if automation items become roadmap/backlog items
- `docs/PROJECT_MEMORY.md`
- `docs/ROADMAP.md`
- `CHANGELOG.md`

Exact files should be confirmed by searching the repository before coding.

## Files That Should Not Change Without Explicit Need

- Electron builder configuration
- Existing Money store behavior
- Existing Approval Queue decision logic
- Existing Business Memory migration logic
- Existing Roadmap store shape unless integration requires it
- Packaged release artifacts unless the task explicitly requires `npm run dist`
- Cosmetic-only UI files unless the milestone includes UI

## Guardrails

- Do not build a chatbot.
- Do not connect paid services.
- Do not add external AI APIs yet.
- Do not execute money-impacting or external actions automatically.
- All important actions must remain reviewable by the CEO.
- Reuse Approval Queue for decision control.
- Reuse Operators and Executive Coordinator for routing and recommendations.
- Reuse existing local persistence patterns.

## Current Supporting Systems

- Money Department can track revenue, costs, budgets, and recurring costs.
- CEO Daily Briefing summarizes current local state.
- Business Memory stores durable knowledge.
- Operators can analyze, draft, recommend, and queue tasks.
- Executive Coordinator routes requests to operators.
- Approval Queue records CEO decisions.
- Roadmap accepts operator recommendations as backlog items.

## Definition of Done

- New automation logic exists in the expected active code path.
- Automation data persists locally.
- No duplicate stores, pages, or route systems are created.
- CEO approval workflow remains preserved.
- Empty states are clear if no automation data exists.
- Documentation is updated for the milestone.
- `npm run build` succeeds.
- `npm run dist` succeeds if desktop packaging or packaged behavior changes.

## Next Likely Slice After AO-007.1

AO-007.2 can add a small verification UI or coordinator/operator integration if the CEO approves. Full dropshipping, YouTube/TikTok, content, store, scheduling, and external workflow execution remain future milestones.

## Required Verification Steps

From `app/`:

1. Run `npm run build`.
2. If the milestone changes desktop behavior, run `npm run dist`.
3. Launch `app/release/win-unpacked/AI Operator OS.exe`.
4. Open Settings and confirm Build Info shows the latest bundle hash.
5. Verify the milestone in the packaged app when packaged behavior matters.
6. Confirm no existing workspaces regressed.

## Definition of Ready for New Work

Before coding:

- Confirm active files via `app/src/App.tsx`.
- Search for existing store/service patterns.
- Read `docs/PROJECT_CONTEXT/05_DEVELOPMENT_PLAYBOOK.md`.
- Check `docs/ROADMAP.md` for milestone wording.
- Check `docs/POLISH_BACKLOG.md` before doing cosmetic-only changes.
