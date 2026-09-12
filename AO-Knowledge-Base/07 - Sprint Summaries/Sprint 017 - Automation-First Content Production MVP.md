# Sprint 017 - Automation-First Content Production MVP

Status: ACTIVE - TASK 1 AUTHORIZED - NOT STARTED  
Owner: Jake Allen  
Activated: 2026-09-12  
Timebox: Four development days

## Mission

Produce the first AO workflow that performs the practical content-production work instead of requiring the CEO to operate internal records and an external editor.

## Finish Line

Sprint 017 passes only when the CEO can provide a topic or source story, requirements, and reusable prerecorded footage and AO returns a previewable Reddit-story-style vertical MP4 containing generated script, generated narration, synchronized captions, appropriate hook/CTA text, and automatically timed footage.

Normal production must not require Clipchamp or another external editor.

## Product Experience

One requested video is one visible job.

Minimum CEO flow:

1. Select the Reddit Stories format.
2. Enter the topic, source story, or requirements.
3. Select reusable prerecorded footage and optional voice, duration, or style preferences.
4. Start generation.
5. Preview the finished draft.
6. Approve, Revise, or Reject.

Internal production records, queues, Work Items, packages, references, and QA details must not require CEO input during normal production.

## Shared Capability Direction

The production engine must separate shared capabilities from format-specific rules.

Shared capabilities:

- script generation;
- TTS generation;
- caption timing;
- footage preparation;
- media rendering;
- job state and failure reporting;
- result preview and review.

Reddit Stories supplies its own input requirements, story structure, caption style, hook/CTA rules, and rendering defaults. Later content formats must be able to reuse the shared capabilities.

## Task 1 - Architecture Definition and Freeze

Status: AUTHORIZED - NOT STARTED.

Inspect the current Electron/React application, provider path, storage boundaries, process boundary, Windows packaging, and available local media tooling.

Freeze:

- the smallest new CEO workflow;
- format-module contract;
- job and result state;
- script-provider path;
- TTS implementation;
- caption synchronization method;
- FFmpeg or equivalent rendering boundary;
- secure Electron main/renderer IPC;
- local file selection and output handling;
- error recovery;
- legacy UI isolation;
- testing and packaging strategy.

Task 1 is documentation and architecture work. Application implementation begins only after the architecture freeze passes.

## Task 2 - Automated Editor Engine

Status: NOT STARTED.

Implement script, narration, caption timing, footage preparation, and vertical MP4 rendering behind one job-level interface.

## Task 3 - Simple Content UI

Status: NOT STARTED.

Implement the minimum Create, progress, preview, and Approve/Revise/Reject experience. Legacy operational forms must not enter the normal workflow.

## Task 4 - Windows Integration and CEO QA

Status: NOT STARTED.

Verify real generation on the CEO's Windows computer using reusable prerecorded footage. Test multiple topics, revisions, failures, persistence, application restart, and produced MP4 playback.

## Acceptance Criteria

1. One video is one visible job.
2. Topic/source story and requirements are sufficient creative input.
3. Prerecorded footage can be selected and reused.
4. Script generation is automatic.
5. TTS generation is automatic.
6. Captions are synchronized automatically.
7. Footage is cropped, trimmed, looped, and duration-matched automatically.
8. A playable vertical MP4 is rendered automatically.
9. The finished draft is previewable in AO.
10. Approve, Revise, and Reject are available at the result level.
11. A revision does not require rebuilding records manually.
12. Normal production requires no external video editor.
13. Internal records do not require repetitive CEO input.
14. Existing application data is not deleted.
15. No external publication occurs.
16. Production build, desktop launch, persistence, failure handling, and restart verification pass.

## Explicitly Out of Scope

- AI-generated background footage;
- automated posting, scheduling, or analytics ingestion;
- multiple finished content formats;
- broad B2B features;
- legacy-data deletion;
- provider marketplace expansion;
- unrelated department, opportunity, memory, or queue development;
- manual production bureaucracy in the new primary workflow.

## Next Required Action

Complete Task 1 repository inspection and architecture freeze from the synchronized local worktree.
