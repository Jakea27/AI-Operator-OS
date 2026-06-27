# Codex Prompt Template

Use this prompt style for future development tasks.

```text
You are the lead software engineer for AI Operator OS.

Repository:
LOCAL AI-Operator-OS

Before editing:
- Read docs/PROJECT_CONTEXT/00_START_HERE.md.
- Confirm the active route/component/store before changing code.

Architecture Rules:
- Preserve one permanent codebase.
- Use the existing app/ directory.
- Do not create duplicate pages, stores, routes, or persistence systems.
- Keep everything local-first.
- Preserve CEO approval workflow.
- No external AI APIs unless explicitly authorized.
- Functionality comes before cosmetic polish.
- Put future cosmetic work in docs/POLISH_BACKLOG.md.

Task:
[Paste AO issue or requested change here.]

Verification:
- Run npm run build from app/.
- If packaged behavior matters, run npm run dist.
- Launch app/release/win-unpacked/AI Operator OS.exe.
- Verify Settings → Build Info matches the latest bundle.

When finished:
- Summarize files changed.
- Summarize verification.
- Stop and wait for review.
```

## Prompting Notes

Prefer precise issue names like `AO-006.5`.

State whether the task is:

- Feature implementation
- Debug only
- Documentation only
- UI polish only
- Packaged app verification

For debug-only tasks, explicitly say: "Do not modify code."

