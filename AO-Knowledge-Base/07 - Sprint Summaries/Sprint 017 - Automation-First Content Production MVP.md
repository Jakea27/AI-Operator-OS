# Sprint 017 - Automation-First Content Production MVP

Status: ACTIVE - TASK 2 IMPLEMENTATION COMPLETE - AUTOMATED VERIFICATION PASS - REPOSITORY CLOSEOUT PENDING
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

Status: COMPLETE - ARCHITECTURE FREEZE PASS - REPOSITORY VERIFIED - APPLICATION IMPLEMENTATION NOT PERFORMED.

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

### Current-Application Inspection

- The current Electron shell uses context isolation and a preload bridge, but it has no media IPC, file-dialog, child-process, or protected media-preview boundary.
- The current renderer exposes legacy operating-system routes and a record-heavy Project Detail workflow. It has no one-job content-production route.
- Project Store owns Business Asset, Knowledge Workspace, Creative Brief, Creative Concepts, Production Blueprint, and prior short-form metadata under `ai-operator-os-projects-v1`.
- Execution Core already routes provider-independent text work through Capability Resolver and Provider Manager and records execution/result history.
- Approval Queue already owns CEO decisions and append-preserved review history.
- The Windows environment provides installed `System.Speech` voices and word-position events suitable for local narration timing. FFmpeg is not supplied by the current application and is not available as an assumed system dependency.

### Frozen CEO Workflow

The new primary workflow is one focused Create Content surface:

1. Select the Reddit Stories format.
2. Enter a topic or source story and requirements.
3. Select prerecorded footage and optional voice, target duration, and style settings.
4. Start one visible content-production job.
5. Observe concise stage progress: Writing, Narrating, Rendering, or Failed.
6. Preview the generated vertical MP4.
7. Approve, request a revision with written instructions, or reject the result.

The normal workflow does not require the CEO to create or edit Projects, Blueprints, packages, Work Items, Execution Requests, QA records, or provider records. Existing routes and persisted data remain available as legacy/advanced surfaces and are not deleted or migrated.

### Frozen Ownership and Persistence

- A new `ContentProductionJobStore` owns only CEO job input, orchestration state, append-only attempts, output-result references, and recoverable errors.
- One new local-first metadata key, `ai-operator-os-content-production-jobs-v1`, is authorized because a visible automated media job is a new runtime domain and is not a Project, Blueprint, Work Item, provider execution, or approval decision.
- The new key stores metadata and references only. Footage, narration, captions, temporary files, and rendered MP4 bytes remain on the local filesystem.
- Execution Core owns AI execution lifecycle and raw/structured provider results. Capability Resolver and Provider Manager retain provider selection ownership.
- Approval Queue owns Approve, Needs Revision, Reject, written decision feedback, and decision history.
- Electron main owns filesystem dialogs, local process execution, temporary media, output paths, and protected preview access.
- Project Store and the Sprint 016 `shortFormProduction` profile remain preserved historical/advanced architecture; neither becomes the new job engine.
- No Media Store, Render Store, Prompt Store, filesystem database, duplicate provider system, duplicate execution engine, or duplicate approval system is authorized.

### Frozen Job, Attempt, and Result Model

`ContentProductionJob` contains:

- `jobId`, `formatId`, `input`, `runState`, `currentStage`, `attempts`, `results`, `activeAttemptId`, `currentResultId`, `createdAt`, and `updatedAt`;
- `formatId` is typed and begins with `reddit-stories`;
- `input` snapshots the topic/source story, requirements, selected-footage reference, and optional duration, voice, and style choices;
- `runState` is limited to `Draft`, `Running`, `Ready for Review`, and `Failed`;
- CEO decision state is derived from the linked Approval Queue record and is not duplicated as a second authority in the job.

Each manual start or revision creates an append-only attempt with its own ID, number, stage, timestamps, Execution Record/result references, structured script, media metadata, and error when applicable. Each successful render creates an append-only result version with a unique result ID, source-attempt reference, safe relative output filename, duration, dimensions, creation timestamp, and approval reference. Earlier attempts, outputs, execution history, and review decisions are never silently overwritten.

On application startup, a persisted `Running` attempt is normalized to an interrupted failure that can be retried manually. Retry or revision always creates a new attempt. No automatic retry, automatic revision, scheduler, queue worker, or background continuation after application exit is authorized.

### Frozen Format Module

A small typed `ContentFormatModule` contract separates format rules from shared production capabilities. It owns input validation, defaults, provider instructions, strict provider-result parsing, and render-plan/caption rules. This is a typed module contract, not a plugin framework.

The first `reddit-stories` module requests exactly one provider-independent JSON object containing non-empty `hookText`, `narrationText`, and `ctaText`. It owns Reddit-story structure, hook/CTA rules, caption defaults, and rendering defaults. Shared writing execution, TTS, caption timing, footage preparation, rendering, job state, preview, and review code must contain no Reddit-specific wording.

Malformed or incomplete provider output fails the Writing stage. The raw Execution Result remains preserved by Execution Core, no script content is fabricated, no partial media result is created, and no automatic retry occurs.

### Frozen Provider and Execution Path

Script work must reuse:

```text
Content Production Job
-> Execution Core
-> Capability Resolver
-> Provider Manager
-> Selected Provider
-> Execution Result
```

Task 2 may add the narrow content-script request shape and source job/attempt references required by Execution Core, but it must share the existing provider-execution internals rather than call a provider from the renderer or create another AI-generation service. The capability remains provider-independent Text Generation. Local Ollama is the present validation provider, not the architecture.

The new CEO workflow must not manufacture the former set of visible Project, Blueprint, package, or Work Item records. Any internal execution record required for audit lineage is created automatically and remains hidden from normal production.

### Frozen Windows TTS and Caption Method

- The Windows MVP uses installed `System.Speech.Synthesis.SpeechSynthesizer` voices behind a narrow narration adapter.
- Electron main invokes a fixed, application-owned PowerShell helper with validated arguments; arbitrary renderer-provided commands or shell strings are prohibited.
- The helper writes WAV narration plus JSON word timings obtained from `SpeakProgress.AudioPosition`. Voice, rate, and volume inputs are bounded to supported values.
- The media worker derives final WAV duration from the WAV data and deterministically groups word timings into readable phrase captions.
- Hook, phrase captions, and CTA become timed ASS subtitle events with format-owned styles. Caption text is escaped as subtitle data, never executed as a command.
- TTS failure or unusable timing fails the Narrating stage and preserves the attempt for diagnosis.

This is the smallest local Windows implementation for the four-day MVP. The narration adapter boundary permits a later authorized TTS provider without changing the job or format contracts.

### Frozen FFmpeg and Filesystem Boundary

- Task 2 may add one pinned FFmpeg runtime dependency because FFmpeg is not an available system prerequisite. No separate media-management subsystem is authorized.
- Electron main launches FFmpeg directly with an argument array and `shell: false`.
- The render plan loops footage when necessary, scales and center-crops it to 1080x1920, targets 30 fps, burns the ASS subtitle track, adds narration audio, ends at narration duration, and emits H.264/AAC MP4 with `yuv420p` and fast-start metadata.
- Source footage is selected through a native main-process file dialog. Canonical paths and approved media extensions are revalidated before every use.
- Per-attempt intermediate files live under the application temporary directory and are cleaned after success or failure.
- Final output is written under the operating system Videos directory in an `AI Operator OS/Generated` folder. Persisted results contain a safe relative filename and metadata, not arbitrary filesystem authority.
- Preview after restart uses a main-owned protected media protocol restricted to that output root. The renderer never receives generic filesystem or process access.
- Packaged builds must unpack the FFmpeg binary and fixed TTS helper from ASAR and resolve their development and packaged paths deterministically.

### Frozen Electron IPC Contract

Preload exposes only typed content-production operations required for footage selection, production start/cancellation on app shutdown, progress subscription, protected preview resolution, and reveal-in-folder. Electron main validates sender, payload schema, string lengths, job/attempt IDs, extensions, and canonical paths. No generic `readFile`, `writeFile`, `exec`, shell, or unrestricted path bridge is authorized.

The renderer owns visible metadata state; Electron main owns privileged media work. Progress events identify the originating job and attempt so stale events cannot update a newer attempt.

### Frozen Review and Revision Behavior

Each rendered result has at most one Approval Queue item, deduplicated by result ID. Approve makes that immutable result the accepted version but performs no publication or external action. Needs Revision requires written feedback and leaves the prior result and decision history intact. A separate CEO action starts a new attempt and result version using the feedback. Reject preserves the result and decision history and performs no automatic work.

### Frozen Verification and Packaging Strategy

Task 2 deterministic verification must cover job transitions, strict script parsing, format isolation, caption grouping/timing, FFmpeg argument construction, canonical path protection, append-only attempts/results, startup interruption recovery, approval deduplication, and absence of automatic retries or publication.

A safe generated media fixture must exercise real local System.Speech narration and bundled FFmpeg rendering without writing production records. TypeScript and Vite production build must pass. Windows package verification must include a portable or installer build proving that the unpacked FFmpeg binary and TTS helper execute outside ASAR. Task 4 must then verify real CEO footage, multiple prompts, revisions, failures, persistence, restart, protected preview, and playable MP4 output.

### Architecture Freeze Result

PASS. The architecture is the smallest design that can automate the promised product outcome while preserving existing data and reusing provider execution and CEO review ownership. Task 1 changed documentation only. Architecture/documentation commit `304ad17486df539b7efa20b2b360e3a624b22ab3` is pushed and verified on `origin/main`. Task 2 application implementation is authorized but remains not started.

## Task 2 - Automated Editor Engine

Status: IMPLEMENTATION COMPLETE - AUTOMATED VERIFICATION PASS - BUILD/PACKAGE PASS - REPOSITORY CLOSEOUT PENDING.

Implement script, narration, caption timing, footage preparation, and vertical MP4 rendering behind one job-level interface.

### Implementation Summary

- Added typed Content Production Job, input, attempt, result, media, error, bridge, and format contracts.
- Added the local-first Content Production Job Store under the frozen `ai-operator-os-content-production-jobs-v1` key.
- Job normalization preserves valid records and converts abandoned Running attempts into visible interrupted failures requiring manual retry.
- Attempts and rendered results are append-only. Manual retry and written-instruction revision create new attempts; prior execution/result history is not overwritten.
- Added the `reddit-stories` format module with bounded input validation, provider-independent instructions, and strict JSON parsing for exactly `hookText`, `narrationText`, and `ctaText`.
- Added a narrow content-script entry point inside existing Execution Core. It creates internal execution lineage automatically and routes Text Generation through existing Capability Resolver, Provider Manager, and provider adapters without creating Project, Blueprint, Work Item, or Work Order records.
- Added Windows `System.Speech` narration through a fixed application-owned PowerShell helper. `SpeakProgress.AudioPosition` supplies word timing; the helper accepts validated configuration files rather than arbitrary shell commands.
- Added deterministic phrase grouping and ASS hook/caption/CTA subtitle generation.
- Added pinned `ffmpeg-static` 5.3.0 runtime support. Rendering loops source footage, scales and center-crops to 1080x1920, trims to narration duration, burns ASS subtitles, adds narration, and emits 30 fps H.264/AAC MP4 with `yuv420p` and fast-start metadata.
- Added typed preload IPC for footage selection, installed-voice listing, media build, cancellation, protected preview URL, reveal-in-folder, and job/attempt-scoped progress.
- Electron main validates sender origin, IDs, input extensions, canonical paths, output filenames, and protected directories. It launches fixed processes with argument arrays and `shell: false`, prevents duplicate builds for one attempt, cancels active child processes at shutdown, removes intermediates, and removes partial outputs after failure.
- Final media is written beneath the operating-system Videos directory at `AI Operator OS/Generated`; persisted job records contain safe relative output references and metadata rather than media bytes.
- Electron packaging unpacks only the fixed TTS helper and pinned FFmpeg runtime required for execution outside ASAR.

### Automated Verification

- JavaScript syntax checks: PASS for Electron main, preload, and media worker.
- TypeScript: PASS with `tsc --noEmit`.
- Deterministic state verification: PASS for persistence, input snapshots, append-only attempts/results, version incrementing, manual-failure behavior, interruption recovery, storage-unavailable resilience, and internal execution deduplication.
- Structured parser verification: PASS for valid and fenced JSON; malformed JSON, surrounding prose, missing fields, and extra fields are rejected without content fabrication.
- Caption verification: PASS for deterministic phrase grouping and monotonic timing.
- Local media integration: PASS using temporary generated footage, real Windows `System.Speech` narration/word timing, ASS subtitles, and pinned FFmpeg output. The verified MP4 was 1080x1920 H.264/AAC and all temporary fixtures were removed.
- Provider integration: PASS through Execution Core -> Capability Resolver -> Provider Manager -> Ollama -> `qwen2.5:7b` -> structured Execution Result. The final verification completed in 401 ms.
- Production build: PASS; TypeScript and Vite transformed 2,601 modules in 5.57 seconds. Existing large-chunk warning remains non-blocking.
- Windows unpacked package: PASS. FFmpeg and the System.Speech helper executed from `app.asar.unpacked`, required Electron engine files were present in `app.asar`, and the packaged desktop executable launched and shut down successfully with an isolated temporary profile.
- Scope verification: PASS. No Task 3 route/UI, publication, upload, AI-generated footage, automatic retry, automatic revision, scheduler, unrelated system, or legacy-data mutation was added.
- Task 3 remains NOT STARTED.

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

Complete Task 2 repository closeout, then begin Task 3 - Simple Content UI against the verified engine. Do not expand Task 3 into engine redesign or publishing.
