# Session Checklist

Use this one-page workflow at the start and end of every AI Operator OS development session.

## Start Session

- [ ] Read `docs/PROJECT_CONTEXT/00_START_HERE.md`.
- [ ] Read `docs/PROJECT_CONTEXT/01_CURRENT_STATUS.md`.
- [ ] Read `docs/PROJECT_CONTEXT/02_NEXT_MILESTONE.md`.
- [ ] Read `docs/PROJECT_CONTEXT/05_DEVELOPMENT_PLAYBOOK.md`.
- [ ] Read `docs/PROJECT_CONTEXT/06_COMMON_PITFALLS.md`.

## Before Editing

- [ ] Locate the active route in `app/src/App.tsx`.
- [ ] Confirm the active page/component/store.
- [ ] Search for existing implementation.
- [ ] Confirm the requested milestone scope.
- [ ] Avoid duplicate pages, routes, stores, or persistence systems.

## Implement

- [ ] Implement only the requested milestone.
- [ ] Preserve local-first architecture.
- [ ] Preserve CEO approval workflow.
- [ ] Put cosmetic-only future work in `docs/POLISH_BACKLOG.md`.

## Verify

- [ ] Run `npm run build` from `app/`.
- [ ] Run `npm run dist` when desktop behavior changes.
- [ ] Launch `app/release/win-unpacked/AI Operator OS.exe` when packaged behavior matters.
- [ ] Verify Settings → Build Info.
- [ ] Confirm the requested behavior in the correct runtime.

## Closeout

- [ ] Update required documentation.
- [ ] Summarize files changed.
- [ ] Summarize build/package verification.
- [ ] List future recommendations separately.
- [ ] Stop and wait for CEO review.

