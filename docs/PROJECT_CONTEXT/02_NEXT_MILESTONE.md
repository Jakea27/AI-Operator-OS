# Next Milestone

## Current Track

AI Operator OS is moving from foundation departments toward automation infrastructure.

## Likely Next Work

The next major milestone is AO-006 Automation Engine, unless the CEO reprioritizes.

Recommended next slices:

1. Define local automation types and safety rules.
2. Create an automation queue/store.
3. Require CEO approval before consequential automation execution.
4. Add deterministic local automation drafts only.
5. Add execution history without external API calls.

## Guardrails

- Do not build a chatbot.
- Do not connect paid services.
- Do not add external AI APIs yet.
- Do not execute money-impacting or external actions automatically.
- All important actions must remain reviewable by the CEO.
- Reuse Approval Queue for decision control.
- Reuse Operators and Executive Coordinator for routing and recommendations.

## Current Supporting Systems

- Money Department can track revenue, costs, budgets, and recurring costs.
- CEO Daily Briefing summarizes current local state.
- Business Memory stores durable knowledge.
- Operators can analyze, draft, recommend, and queue tasks.
- Executive Coordinator routes requests to operators.
- Approval Queue records CEO decisions.
- Roadmap accepts operator recommendations as backlog items.

## Definition of Ready for New Work

Before coding:

- Confirm active files via `app/src/App.tsx`.
- Search for existing store/service patterns.
- Read `docs/PROJECT_CONTEXT/05_DEVELOPMENT_PLAYBOOK.md`.
- Check `docs/ROADMAP.md` for milestone wording.
- Check `docs/POLISH_BACKLOG.md` before doing cosmetic-only changes.

