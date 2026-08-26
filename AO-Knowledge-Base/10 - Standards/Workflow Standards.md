# Workflow Standards

Status: Draft  
Version: 0.1  
Owner: Jake Allen  
Last Updated: 2026-06-29

## Purpose

This file will define standards for workflows inside AI Operator OS.

Workflow standards should keep work structured, trackable, reviewable, and reusable.

## Initial Direction

- Work should flow through structured records, not random chat messages.
- Workflows should have clear ownership, status, and next action.
- Important work should connect to decisions, approvals, roadmap items, memory, or business records.
- Workflows should reduce CEO workload rather than create more review burden.
- Workflow complexity should increase only when it creates immediate value.

## Remote Development / Batched CEO QA Policy

When the CEO is away from the development computer and cannot perform manual Electron/UI QA, a controlled remote-development workflow may be used.

A subsequent task may proceed while an earlier task has CEO QA pending only when all of the following are true:

1. Implementation of the earlier task is complete.
2. All available automated verification has passed.
3. Build validation has passed.
4. No known implementation blocker exists.
5. CEO QA remains explicitly recorded as pending.
6. The earlier task is not marked complete or closed.
7. The subsequent task does not depend on unverified behavior from the pending task.
8. Architecture dependency has been explicitly evaluated.
9. Pending CEO QA tasks remain individually tracked.
10. No manual or visual verification is falsely represented as pass.

Dependent implementation must wait when it relies on unverified behavior.

The maximum remote CEO-QA backlog is five tasks. If five tasks are awaiting CEO QA, do not begin implementation of another task until CEO QA reduces the backlog.

When the CEO returns to the development computer:

- Perform manual CEO QA for each pending task.
- Record PASS or FAIL individually.
- Fix failures before closeout.
- Perform persistence and restart verification where required.
- Complete documentation closeout.
- Perform repository verification.
- Commit and push according to the normal project process.

This policy changes QA timing only.

It does not weaken:

- CEO approval authority.
- QA requirements.
- Architecture verification.
- Build requirements.
- Persistence verification.
- Documentation requirements.
- Task closeout requirements.
- Prove Before Autonomy.

## Future Evolution

This file should eventually include workflow templates, status rules, handoff rules, review cadence, and automation-readiness criteria.
