# Handoff Template

Use this template when starting a new ChatGPT/Codex session.

## Project

AI Operator OS

## Repository

Local repository:

```text
C:\Users\hotsh\Documents\AI-Operator-OS\AI-Operator-OS
```

## Read First

Start with:

```text
docs/PROJECT_CONTEXT/00_START_HERE.md
```

Then read:

```text
docs/PROJECT_CONTEXT/01_CURRENT_STATUS.md
docs/PROJECT_CONTEXT/02_NEXT_MILESTONE.md
docs/PROJECT_CONTEXT/03_BUILD_WORKFLOW.md
docs/PROJECT_MEMORY.md
docs/ROADMAP.md
```

## Current Objective

Paste the active AO issue or task here.

## Before Coding Checklist

- [ ] Read `docs/PROJECT_CONTEXT/00_START_HERE.md`.
- [ ] Read `docs/PROJECT_CONTEXT/01_CURRENT_STATUS.md`.
- [ ] Read `docs/PROJECT_CONTEXT/02_NEXT_MILESTONE.md`.
- [ ] Confirm the active route/component/store.
- [ ] Search for existing implementation before adding new code.
- [ ] Confirm whether the task is feature, debug, documentation, or polish.
- [ ] If it is debug-only, do not modify code.

## Non-Negotiable Rules

- One permanent codebase.
- Use existing `app/`.
- Do not create duplicate pages, routes, stores, or persistence systems.
- Preserve local-first architecture.
- Preserve CEO approval workflow.
- No external AI APIs unless explicitly authorized.
- Codex modifies the local repository.
- GitHub Desktop is used for review, commit, and push.

## Verification Required

- Run `npm run build`.
- If packaged behavior matters, run `npm run dist`.
- Launch `app/release/win-unpacked/AI Operator OS.exe`.
- Check Settings → Build Info.

## Verification Summary

Record after work:

- Build command run:
- Build result:
- Dist command run:
- Packaged app launched:
- Build Info hash verified:
- Screenshots or notes:

## Known Risks

- Stale packaged builds can make completed source changes appear missing.
- Development and packaged Electron have separate localStorage data.
- Duplicate stores/pages can silently disconnect features from the active UI.
- Scope creep can delay core operating-system milestones.

## Milestone Closeout Checklist

- [ ] Requested work is complete.
- [ ] No duplicate architecture was added.
- [ ] Documentation is updated where required.
- [ ] `npm run build` passed.
- [ ] `npm run dist` passed if packaged behavior changed.
- [ ] Settings → Build Info verified if packaged app was launched.
- [ ] Stop and wait for CEO review.

## Final Response Should Include

- Files changed.
- Build result.
- Verification performed.
- Any known follow-up.

