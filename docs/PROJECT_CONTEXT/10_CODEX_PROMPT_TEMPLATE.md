# Codex Prompt Template

Use this prompt style for future development tasks.

```text
You are the lead software engineer for AI Operator OS.

Repository:
LOCAL AI-Operator-OS

Before implementing:
- Read docs/PROJECT_CONTEXT/00_START_HERE.md.
- Read docs/PROJECT_CONTEXT/01_CURRENT_STATUS.md.
- Read docs/PROJECT_CONTEXT/02_NEXT_MILESTONE.md.
- Confirm the active route/component/store before changing code.
- Search for existing implementation before adding anything new.
- Verify packaged build before debugging missing UI.
- Never assume. Verify.

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
- Stop after milestone completion.
- Wait for CEO review.
```

## Before Implementing Checklist

- [ ] Active route verified in `app/src/App.tsx`.
- [ ] Active component path confirmed.
- [ ] Existing implementation searched with repository search.
- [ ] Store/persistence pattern identified.
- [ ] Scope confirmed as feature, debug, documentation, or polish.
- [ ] Packaged-build verification need identified.

## Prompting Notes

Prefer precise issue names like `AO-006.5`.

State whether the task is:

- Feature implementation
- Debug only
- Documentation only
- UI polish only
- Packaged app verification

For debug-only tasks, explicitly say: "Do not modify code."

For milestone work, explicitly say: "Stop after this milestone and wait for review."

