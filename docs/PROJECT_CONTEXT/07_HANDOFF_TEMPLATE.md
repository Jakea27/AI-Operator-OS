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

## Final Response Should Include

- Files changed.
- Build result.
- Verification performed.
- Any known follow-up.

