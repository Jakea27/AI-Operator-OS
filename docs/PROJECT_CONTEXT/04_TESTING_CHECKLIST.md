# Testing Checklist

Use this checklist before reporting a milestone complete.

## Basic Build

- [ ] Run `npm install` if dependencies changed.
- [ ] Run `npm run build` from `app/`.
- [ ] Fix all TypeScript and build errors.

## Packaged Build

For release-impacting UI, Electron, routing, sidebar, or build-info changes:

- [ ] Run `npm run dist` from `app/`.
- [ ] Launch `app/release/win-unpacked/AI Operator OS.exe`.
- [ ] Open Settings.
- [ ] Confirm Build Info shows the latest bundle/hash.
- [ ] Verify the requested feature in the packaged app, not only localhost.

## Navigation

- [ ] Sidebar item exists if required.
- [ ] Route opens the expected active page.
- [ ] Active sidebar state works.
- [ ] No duplicate route/page was created.

## Local-First Persistence

- [ ] Data writes to the existing local store.
- [ ] Refresh/restart preserves records.
- [ ] No duplicate persistence system was added.
- [ ] Empty state appears when no data exists.
- [ ] Sample/demo data is clearly manual and never auto-loaded.

## CEO Approval Workflow

- [ ] Consequential recommendations go through Approval Queue.
- [ ] Approved work does not execute automatically.
- [ ] Decision history persists.
- [ ] Terminal states hide duplicate decision buttons.

## Documentation

- [ ] Update `CHANGELOG.md` if functionality changed.
- [ ] Update `docs/PROJECT_MEMORY.md` for major milestones or fixes.
- [ ] Update `docs/ROADMAP.md` if milestone status changed.
- [ ] Put cosmetic-only future work in `docs/POLISH_BACKLOG.md`.

