# Lessons Learned

## Verify the Active Code Path

Several issues appeared complete in source but were not visible because the wrong component path or stale runtime was inspected. Always confirm the route imports the component being edited.

## Build Info Matters

Settings Build Info exists to distinguish current packaged builds from stale builds. Check the bundle hash before assuming a change failed.

## Packaged Electron Is the Real Release Target

Localhost and Vite preview are useful, but release-sensitive work must be checked in the packaged app.

## Local-First Requires Clear Empty States

The app should not auto-load fake data. Empty states should explain the next useful local action.

## CEO Approval Is a Safety Boundary

Operators can draft, recommend, and queue. Important execution remains blocked by CEO approval.

## Avoid Rebuilding From Scratch

Most features already have a store, service, component, or page. Extend the existing system instead of creating a parallel one.

## Polish Has a Home

Visual and quality-of-life ideas belong in `docs/POLISH_BACKLOG.md` unless the current task is explicitly a polish sprint.

