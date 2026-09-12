# Project Index

## Purpose

This document defines the exact required reading order for every AI operator before beginning work on AI Operator OS.

The Knowledge Base is the continuity layer. It exists so each operator starts from documented project truth instead of relying on conversation memory.

## Continuity System Version

1.1

## Required Reading Order

Every AI operator must read the following source documents in this exact order.

1. `AO-Knowledge-Base/99 - PROJECT_INDEX.md`
2. `AO-Knowledge-Base/README.md`
3. `AO-Knowledge-Base/MASTER_PLAN.md`
4. `AO-Knowledge-Base/00 - Vision/AI Operator OS Philosophy.md`
5. `AO-Knowledge-Base/02 - Architecture/Architecture v2 - Operating System Foundation.md`
6. `AO-Knowledge-Base/10 - Standards/README.md`
7. `AO-Knowledge-Base/10 - Standards/Automation Standards.md`
8. `AO-Knowledge-Base/10 - Standards/Business Standards.md`
9. `AO-Knowledge-Base/10 - Standards/Coding Standards.md`
10. `AO-Knowledge-Base/10 - Standards/Department Standards.md`
11. `AO-Knowledge-Base/10 - Standards/Documentation Standards.md`
12. `AO-Knowledge-Base/10 - Standards/UI Standards.md`
13. `AO-Knowledge-Base/10 - Standards/Workflow Standards.md`
14. `AO-Knowledge-Base/98 - ACTIVE_PROJECT_STATE.md`
15. `AO-Knowledge-Base/DEVELOPMENT_STATE.md`
16. `AO-Knowledge-Base/CURRENT_CONTEXT.md`
17. `AO-Knowledge-Base/07 - Sprint Summaries/Sprint 016 - Shared Short-Form Operating Capability.md`
18. `AO-Knowledge-Base/OPERATOR_STARTUP_REPORT_TEMPLATE.md`

## Active Sprint 016 Handoff

Sprint 016 - Shared Short-Form Operating Capability is ACTIVE. Tasks 1, 2, and 3 are COMPLETE - REPOSITORY VERIFIED. Task 3 final application checkpoint is `8e2f8c2a022cc6f8fa3eeae98b55377234d3f753`; production build, real 44.97-second 1080p 9:16 finished asset, 11/11 mandatory QA, separate final CEO approval, approved-version locking, and restart persistence all passed. Task 4 - Owned-Page Manual Publication and Performance Recording is AUTHORIZED - NOT STARTED and is the next required action. Publication remains manual and requires real external evidence. Keep the Sprint 016 summary in the required reading order. Active Project State remains authoritative for checkpoint metadata.



## Startup Source Priority

1. Primary Source:
   Read the authoritative individual documents directly from the GitHub repository using the exact required paths in this Project Index.

2. Fallback Source:
   If direct repository access is unavailable, use:
   `AO-Knowledge-Base/AI_OPERATOR_STARTUP_BUNDLE.md`

3. Failure Rule:
   If neither the authoritative GitHub documents nor the generated Startup Bundle can be accessed, stop immediately.

4. Authority Rule:
   The individual AO Knowledge Base source documents remain authoritative. The Startup Bundle is a generated transport artifact and must not be edited directly.

5. Conflict Rule:
   If the Startup Bundle conflicts with the source documents, stop and report the inconsistency. Do not choose one silently.

## Operator Startup Procedure

1. Read all required documents in the exact order listed above.
2. Confirm current sprint.
3. Confirm remaining phases.
4. Confirm next required action.
5. Verify repository checkpoint consistency.
6. Verify no sprint is currently awaiting QA or closeout.
7. Only then begin implementation.

## Repository Checkpoint Verification

Repository verification uses the `Repository Checkpoint` documented in `AO-Knowledge-Base/98 - ACTIVE_PROJECT_STATE.md`.

The checkpoint is the last verified repository state after implementation and documentation synchronization. It is not required to equal the commit that contains a regenerated Startup Bundle.

This prevents a documentation synchronization commit from invalidating itself simply because committing the bundle changes Git history.

Startup verification must confirm:

- Branch is `main`.
- Origin is the official GitHub repository.
- Local repository is synchronized with `origin/main`.
- Working tree status matches the current documented workflow state.
- Startup Bundle validation is `VALID`.
- Active Project State contains the current sprint, phase, next action, and repository checkpoint.

Startup verification must not fail only because the Startup Bundle was committed after generation. If the repository is clean and synchronized beyond the documented checkpoint, the checkpoint remains valid unless another continuity document records a conflicting project state.

## Operator Verification Gate

Every AI operator must verify the following before making recommendations, writing code, planning work, or beginning implementation.

### Project State

- Current Version
- Current Milestone
- Current Sprint
- Sprint Status
- Current Objective
- Next Required Action
- Blocking Issues
- Recent Philosophy Additions
- Documentation Consistency
- Repository Checkpoint
- Repository Synchronization

### Previous Sprint

- Implementation completed
- QA completed
- Documentation completed
- Git commit created
- Repository pushed
- Working tree clean
- Sprint closeout completed

## Verification Rule

If any required item cannot be verified from documentation, the operator must stop and report exactly what is missing or inconsistent.

## Rule

If the current conversation conflicts with the documented project state, pause and resolve the documentation discrepancy before implementation.
