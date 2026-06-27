# AI Operator OS — Start Here

This folder is the permanent handoff system for AI Operator OS. Any future ChatGPT or Codex session should read this file first before changing the repository.

## What AI Operator OS Is

AI Operator OS is a local-first desktop operating system for running an AI-powered business. It is designed to help one CEO coordinate money, memory, roadmap, operators, approvals, and future automation while keeping consequential decisions under human control.

The desktop application lives in `app/` and uses Electron, React, Vite, TypeScript, and Tailwind CSS.

## First Reading Order

1. `docs/PROJECT_CONTEXT/00_START_HERE.md`
2. `docs/PROJECT_CONTEXT/01_CURRENT_STATUS.md`
3. `docs/PROJECT_CONTEXT/02_NEXT_MILESTONE.md`
4. `docs/PROJECT_CONTEXT/03_BUILD_WORKFLOW.md`
5. `docs/PROJECT_CONTEXT/04_TESTING_CHECKLIST.md`
6. `docs/PROJECT_MEMORY.md`
7. `docs/ROADMAP.md`
8. `docs/ARCHITECTURE.md`

## Non-Negotiable Rules

- One permanent codebase.
- Use the existing `app/` directory.
- Do not create duplicate pages, stores, routes, or persistence systems.
- Keep the architecture local-first.
- Preserve CEO approval workflow.
- Operators may analyze, recommend, draft, and queue work only.
- No external AI APIs until explicitly authorized.
- GitHub repository is the source of truth.
- Codex writes to the local repository.
- GitHub Desktop is used for review, commit, and push.
- Functionality and business value come before cosmetic polish.
- Cosmetic polish belongs in `docs/POLISH_BACKLOG.md`.
- Packaged app must be verified with Build Info before assuming a change failed.

## Current Source Layout

- Active router: `app/src/App.tsx`
- Active shell/sidebar: `app/components/AppShell.tsx`
- Active pages: `app/pages`
- Feature modules: `app/src/features`
- Core domain logic: `app/src/core`
- Shared services: `app/src/services`
- Documentation: `docs`

## How to Continue

Before implementing any milestone:

1. Confirm the active files used by the router.
2. Search for existing stores/components before adding anything new.
3. Make the smallest direct change in the active code path.
4. Run `npm run build` from `app/`.
5. For packaged verification, run `npm run dist` and launch `app/release/win-unpacked/AI Operator OS.exe`.
6. Check Settings → Build Info to confirm the running build hash matches the latest build.

