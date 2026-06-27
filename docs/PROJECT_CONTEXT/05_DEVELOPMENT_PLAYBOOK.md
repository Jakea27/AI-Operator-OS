# Development Playbook

## Working Style

Codex writes directly to the local repository. GitHub Desktop is used by the human CEO for review, commit, and push.

## Before Editing

1. Inspect the active route in `app/src/App.tsx`.
2. Confirm the active component path.
3. Search for existing services/stores/components.
4. Avoid creating duplicate systems.
5. Understand whether the request is feature work, debug work, documentation, or polish.

## Implementation Rules

- Extend existing code paths.
- Keep state local-first.
- Reuse existing stores.
- Keep domain logic in `app/src/core` or `app/src/services`.
- Keep feature UI in `app/src/features` when a feature module already exists.
- Keep legacy active pages under `app/pages` when those pages are what the router imports.
- Do not move files unless necessary.
- Do not change unrelated behavior.

## Verification Rules

- Always run `npm run build` after code changes.
- Run `npm run dist` when the task involves packaged behavior or desktop verification.
- Use Settings → Build Info to verify the packaged app is current.
- If the UI does not change, inspect the actual rendered path before assuming the source is wrong.

## Documentation Rules

- Keep active roadmap focused.
- Move future ideas to `docs/FUTURE_IDEAS.md`.
- Move polish-only items to `docs/POLISH_BACKLOG.md`.
- Record meaningful architecture and milestone changes in `docs/PROJECT_MEMORY.md`.

## Communication Rules

When handing off:

- State files changed.
- State build result.
- State what was verified.
- Mention if packaged verification was not performed and why.

