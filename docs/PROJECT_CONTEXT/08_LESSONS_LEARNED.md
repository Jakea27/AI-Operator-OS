# Lessons Learned

## Verify the Active Code Path

Several issues appeared complete in source but were not visible because the wrong component path or stale runtime was inspected. Always confirm the route imports the component being edited.

## Build Info Matters

Settings Build Info exists to distinguish current packaged builds from stale builds. Check the bundle hash before assuming a change failed.

## Packaged Electron Is the Real Release Target

Localhost and Vite preview are useful, but release-sensitive work must be checked in the packaged app.

## Build First, Debug Second

When a visible change appears missing, rebuild and verify the current bundle before chasing phantom UI bugs.

## Small Verified Changes Win

Small changes in the active path are easier to validate than broad rewrites. Make the smallest useful change, build, inspect, and continue.

## Never Assume — Verify

Do not assume a route, component, store, or packaged build is active. Confirm it directly before editing or debugging.

## Trust Existing Architecture

The project already has shared stores, engines, and feature modules. Extend them unless the CEO explicitly approves a replacement.

## Local-First Requires Clear Empty States

The app should not auto-load fake data. Empty states should explain the next useful local action.

## CEO Approval Is a Safety Boundary

Operators can draft, recommend, and queue. Important execution remains blocked by CEO approval.

## Avoid Rebuilding From Scratch

Most features already have a store, service, component, or page. Extend the existing system instead of creating a parallel one.

## Polish Has a Home

Visual and quality-of-life ideas belong in `docs/POLISH_BACKLOG.md` unless the current task is explicitly a polish sprint.
