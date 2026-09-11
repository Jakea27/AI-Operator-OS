# Sprint 016 - Shared Short-Form Operating Capability

Status: ACTIVE - TASK 2 IMPLEMENTATION CHECKPOINT VERIFIED; PRODUCTION BUILD AND CEO QA PENDING  
Owner: Jake Allen  
Last Updated: 2026-09-11

## Sprint Mission

Enable AI Operator OS to take one real short-form content idea through research, AI-assisted development, manual production, QA, CEO approval, and a finished reusable short-form asset, then manually publish it to one AO-owned page and record its initial performance in AO.

## Required Finish Line

Sprint 016 is complete only when one real short-form video has been produced through the AO workflow, approved by the CEO as a finished asset, manually published to one AO-owned TikTok, YouTube Shorts, or Instagram Reels page, and its publication and initial performance are persisted in AO.

Mock publication records do not satisfy the mission.

## Operating Principle

Every Sprint 016 implementation decision must serve the real operating finish line. Sprint 016 must not become an isolated generalized-infrastructure sprint.

Short-form production is a shared Creative Department capability:

Idea / research -> script -> assets -> production -> QA -> CEO approval -> finished short-form asset.

The finished asset is reusable by downstream workflows. Owned-content workflows may publish and measure it. Future B2B workflows may reference it for client review or delivery. The shared production model must not depend on a B2B customer, client engagement, invoice, payment, social account, or publishing method.

## Approved Platform Direction

Short-form content is the primary content direction.

The shared capability must be able to represent TikTok, YouTube Shorts, and Instagram Reels without separate production engines.

Sprint 016 requires one real pilot on one AO-owned page and does not require publishing to all three platforms.

## Architecture Reuse and Proposed Ownership

Task 1 must inspect and verify these proposed boundaries before implementation:

- Business Store owns the AO-operated content Business.
- Project Store owns the Short-Form Business Asset, Project-owned Knowledge Workspace, Creative Brief, Creative Concepts, Production Blueprint, source-asset and finished-video references, finished Creative Asset Packages, manual publication records, and manually entered performance snapshots.
- Work Item Store owns Work Items and specialized Work Orders.
- Execution Core owns execution lifecycle, provider runs, results, failures, timing, cost, and lineage.
- Provider Manager owns provider selection and the existing approved provider execution path.
- Approval Queue owns CEO approval decisions and decision history.
- Money Department remains the authority for financial truth; Sprint 016 does not automate revenue.
- External social platforms remain the source of truth for publication and platform performance.

The preferred persistence direction is the existing Project Store extension pattern and existing Project Store persistence key. No Content Store, Publication Store, Analytics Store, Asset Store, or new persistence key is authorized unless Task 1 proves the existing owner cannot safely support the required records and the CEO approves the change.

## Task Breakdown

### Task 1 - Architecture Definition and Freeze

Status: COMPLETE - REPOSITORY VERIFIED.

Objective: Inspect the current implementation and freeze the smallest architecture capable of reaching the Sprint 016 finish line.

Task 1 must define and verify the short-form asset schema; platform representation; Production Blueprint and deliverables; source-asset and finished-video reference model; production and QA states; finished-asset definition and version preservation; final CEO approval gate; manual publication record; initial manual performance snapshot; ownership, persistence, lineage, normalization, and duplicate protection; compatibility with existing YouTube Video records; and separation between shared production and downstream owned-content or future B2B workflows.

Task 1 is documentation and architecture work only. Application implementation is not authorized until Task 1 architecture review, architecture freeze, documentation closeout, commit, push, and repository verification pass.

## Task 1 Architecture Definition and Freeze

### Repository Inspection Result

PASS.

Task 1 inspected the implemented Project Store, Business Asset model, Knowledge Workspace, Creative Brief, Creative Concepts, Production Blueprint, Creative Asset Packages, Work Item / Work Order system, Execution Request Builder, Execution Core, Provider path, Approval Queue, Creative Cost Visibility, and Project Detail workflow.

The current implementation already provides reusable research context, briefs, AI concept development, provider-independent text generation, revision history, CEO review, approval history, package versioning, execution lineage, and local-first persistence. The missing layer is a short-form-specific extension from production instructions into a real finished-video record, manual publication evidence, and manual performance evidence.

### Architecture Review

PASS with bounded compatibility requirements.

- The architecture must extend the existing Project-owned creative model and existing Project Store key `ai-operator-os-projects-v1`.
- Existing `YouTube Video` records, `YouTube Video Blueprint` records, deliverables, packages, Work Orders, executions, reviews, and costs must remain valid and unchanged.
- Current blueprint normalization assumes one global deliverable list. Task 2 must make required deliverables blueprint-type-specific so short-form fields are not injected into legacy YouTube blueprints and legacy deliverables are not removed.
- Current execution instructions contain YouTube-specific language. Task 2 must select instructions by asset/blueprint type while reusing the existing Work Order -> Execution Request -> Execution Core -> Provider Manager path.
- Project Detail is already the active creative operating surface. Sprint 016 must extend that route rather than create a separate Content application.
- No existing module owns reusable social-account records. Sprint 016 therefore records the manual destination handle on each publication event and does not introduce an Account Store or pretend to manage external accounts.

### Frozen Ownership

- Business Store owns the AO-operated content Business and its lifecycle.
- Project Store owns the Short-Form Business Asset, target-platform intent, Project Knowledge, Creative Brief, Creative Concepts, Production Blueprint, production record, file references, QA evidence, finished-asset versions, manual publication records, and manual performance snapshots.
- Work Item Store owns specialized Work Items and Work Orders.
- Execution Core owns provider execution state, raw results, failures, timing, provider/model data, costs, and lineage.
- Approval Queue owns current CEO approval status and decision history. Project-owned finished assets reference approvals but do not replace Approval Queue truth.
- External platforms remain authoritative for whether a post exists and for observed platform metrics.
- Money Department remains authoritative for financial truth. Sprint 016 performance snapshots do not create revenue or financial records.

### Frozen Short-Form Representation

The existing Business Asset model is extended, not replaced:

- Add `Short-Form Video` as a valid `BusinessAssetType`.
- Preserve `YouTube Video` as a valid legacy/current type.
- Add a typed `ShortFormPlatform`: `TikTok`, `YouTube Shorts`, or `Instagram Reels`.
- A Short-Form Business Asset records one or more `targetPlatforms`. The production system remains shared across platforms.
- The existing single `platform` string remains for existing records and display compatibility. It must not be used to infer a missing short-form target silently.
- Empty, duplicated, or invalid target-platform values normalize to a stable deduplicated list of recognized values. Missing targets stay visibly incomplete.

### Frozen Blueprint Contract

Add `Short-Form Video Blueprint` as a valid Production Blueprint type.

Its minimum required deliverables are:

1. Hook.
2. Script.
3. Shot and Visual Plan.
4. On-Screen Text and Audio Plan.
5. Caption, Call to Action, and Platform Metadata.
6. Source Asset Requirements.

Business Asset topic, goal, audience, tone, target length, and target platforms remain inherited context. Research stays in Knowledge Workspace. Brief-specific instructions stay in Creative Brief. Selected concepts stay in Creative Concepts. These values must not be copied into competing Blueprint fields.

Hook and Script may reuse the existing provider-independent Work Order path in Task 2. The remaining deliverables may be completed manually for the first real workflow. Sprint 016 does not require a new provider, generation engine, workflow engine, or AI media generation.

Blueprint deliverable definitions must be selected by blueprint type. Normalization must preserve recognized legacy YouTube deliverables, recognized short-form deliverables, their IDs, content, approvals, review history, and package lineage.

### Frozen Production and File-Reference Contract

Add one optional Project-owned `shortFormProduction` extension container. It is part of the existing Project record and persistence key, not a new store.

Minimum production fields:

- stable production ID;
- production status: `Not Started`, `Ready`, `In Production`, `QA Pending`, `QA Failed`, or `QA Passed`;
- tool/process description;
- production notes;
- blockers or missing components;
- source-asset references;
- finished-asset versions;
- manual publication records;
- manual performance snapshots;
- created and updated timestamps;
- optional metadata consistent with existing extension-container patterns.

A file reference stores metadata only: stable reference ID, kind, label, location type, user-entered local path or external reference, optional media type, rights/restriction state, notes, and recorded timestamp. AO does not copy, upload, render, inspect, delete, or manage the referenced file.

Allowed reference kinds are source asset and finished video. Rights/restriction state is `Unknown`, `Cleared`, or `Restricted`; unknown must remain visible and must not be treated as cleared.

### Frozen QA and Finished-Asset Contract

Each finished asset is an append-preserved `ShortFormFinishedAssetVersion` and acts as the versioned finished-asset package for the real video. It references the approved Creative Asset Package and source production lineage rather than copying approved scripts or execution results.

Minimum finished-asset fields:

- stable finished-asset ID and positive version number;
- finished-video file reference;
- source-asset reference IDs;
- source Creative Asset Package ID and Blueprint reference;
- production completion time and notes;
- required QA checks and QA actor/time;
- final Approval Queue ID;
- creation/update timestamps;
- supersession reference where applicable;
- lineage references needed to reconstruct Project, Blueprint, package, Work Item, Work Order, Execution Request, Execution Result, review, and approval history.

Mandatory QA checks cover: finished-video reference present; selected platform target; portrait/vertical orientation or recorded exception; duration reviewed; video playback reviewed; audio reviewed; on-screen text reviewed; caption/call to action reviewed; required production components present; source rights/restrictions reviewed; and platform suitability reviewed.

A finished asset qualifies as CEO approved only when all mandatory QA checks pass, the finished-video reference exists, and the linked current Approval Queue decision is `Approved`. Approval Queue status is authoritative. A cached approval label must not override it.

After final CEO approval, material changes require a new finished-asset version and a new final approval. Prior versions, QA evidence, file references, approvals, and lineage are not overwritten or deleted. Repeated saves update the same draft version by stable ID and must not create duplicates.

### Frozen Final Approval Gate

Final finished-video approval is separate from approval of Hook, Script, or other planning deliverables.

The existing Approval Queue is extended only with optional stable source references needed to open the exact finished asset and version. No duplicate approval workflow is authorized.

Creating or approving the final review must not publish, upload, schedule, execute another provider call, or change external state.

### Frozen Manual Publication Contract

A `ShortFormPublicationRecord` belongs to the Project-owned short-form production container and references exactly one finished-asset version.

Minimum fields:

- stable publication ID;
- finished-asset ID/version reference;
- platform;
- AO-owned page name or handle as a manual destination label;
- status: `Planned`, `Published`, `Failed`, or `Removed`;
- optional planned time;
- actual publication time;
- published URL or external post ID;
- publishing actor;
- notes or failure/blocker information;
- created and updated timestamps.

`Published` requires a currently CEO-approved finished asset, an actual publication time, and a non-empty published URL or external post ID. The action remains manual. Approval never implies publication.

A repeated save updates the same publication ID. If a platform post ID or normalized URL is already linked to another publication record, the duplicate must be blocked or surfaced for correction rather than counted twice.

### Frozen Manual Performance Contract

A `ShortFormPerformanceSnapshot` references one publication record.

Minimum fields:

- stable snapshot ID and publication ID;
- manual observation time;
- views, likes, comments, and shares;
- optional followers gained, clicks, leads, and conversions;
- CEO notes;
- source `Manual`;
- created and updated timestamps.

Each metric is a non-negative number or explicit unknown. Unknown and observed zero are distinct. Blank input normalizes to unknown, never zero. Repeated saves update the same snapshot ID; a new observation creates a new append-preserved snapshot. Platform data remains external truth.

Sprint 016 records no revenue, profitability, attribution model, automated analytics, or cross-platform ranking.

### Shared Capability Boundary

The production path ends at a reusable CEO-approved finished asset. It has no customer, client, engagement, invoice, or payment dependency.

Owned-content operation may reference that asset through manual publication and performance records. Future B2B service operation may reference the same finished asset through future client review/delivery records. Neither downstream workflow owns or rewrites the shared production record.

### Duplicate, Normalization, and Safety Rules

- All relationships use stable IDs; names, handles, labels, URLs, and file paths are not ownership keys.
- Runtime normalization must validate every new enum, array, metric, ID reference, and timestamp without mutating input records.
- Existing records missing Sprint 016 fields remain valid.
- New optional containers must default safely and must not erase unknown future fields within approved metadata containers.
- Creation actions must be explicit and idempotent by stable record ID.
- No approval creates execution or publication.
- No publication record performs publication.
- No performance snapshot fetches platform data.
- No file reference grants filesystem access.
- No derived summary becomes persisted truth.

### Task 2 Bounded Implementation Contract

Task 2 may implement only:

- Short-Form Video and the three platform values;
- blueprint-type-specific deliverables and normalization;
- the Project-owned short-form production container and its safe defaults;
- Short-Form Business Asset and Production Blueprint creation/editing inside the existing Project experience;
- manual completion of required production-plan deliverables;
- Hook/Script AI-assisted drafting through the existing Work Order, Execution Request, Execution Core, Provider Manager, review, revision, approval, package, and cost path;
- compatibility and deterministic verification required for the foundation.

Task 2 must not implement finished-video QA/final approval, publication/performance records, B2B data, social integrations, automation, scheduling, analytics ingestion, trading, new stores, new persistence keys, or unrelated UI refactoring.

### Architecture Freeze Result

PASS.

Sprint 016 Task 1 architecture is FROZEN. Documentation commit `21b94d5152ae67f7fc2db66245774af880662fb8` is pushed and repository verified. Task 2 implementation commit `1866448d8365c91f402e99eb8aa65786ab0b2618` is pushed and repository verified; its production build and CEO QA remain pending.

### Task 2 - Short-Form Production Foundation

Status: IMPLEMENTATION COMPLETE - REMOTE TYPECHECK AND DETERMINISTIC QA PASS - IMPLEMENTATION COMMIT PUSHED AND VERIFIED; PRODUCTION BUILD, CEO QA, AND TASK CLOSEOUT PENDING.

Objective: Extend the existing Creative Production Engine with a reusable Short-Form Video capability.

Minimum production context includes idea/topic, research and Knowledge references, audience, platform target, concept, hook, script, shot/scene plan, on-screen text, visual or B-roll instructions, audio or voice instructions, caption and call to action, hashtags or platform metadata, and source-asset requirements/references.

Task 2 must reuse existing Business Asset, Creative Brief, Knowledge Workspace, Creative Concepts, Production Blueprint, Work Item, Execution Request, Execution Core, Provider Manager, review, revision, package, and cost-visibility architecture.

Finish condition: AO can prepare and manage a complete short-form production plan through its existing internal workflow without customer or B2B dependencies.

#### Task 2 Implementation Result

- Added one shared `Short-Form Video` Business Asset type with typed TikTok, YouTube Shorts, and Instagram Reels targets.
- Added blueprint-type-specific normalization and the frozen Short-Form deliverables while preserving the legacy YouTube six-deliverable blueprint.
- Added the Project-owned short-form production foundation under the existing `ai-operator-os-projects-v1` persistence boundary.
- Added Project creation/detail controls for platform targets, production-plan deliverables, planning readiness, and the bounded Not Started/Ready foundation state.
- Reused the existing provider-independent Work Order path for Hook and Script. Manual production-plan deliverables do not create unsupported Work Orders.
- Added Short-Form-aware prompt instructions and correlation metadata without changing Execution Core, Provider Manager, Approval Queue, package, revision, or cost ownership.
- Full 199-file TypeScript program check: PASS with zero diagnostics.
- Deterministic normalization/readiness checks: PASS for platform validation/deduplication, invalid-status fallback, incomplete-plan Ready downgrade, complete-plan Ready preservation, existing persistence-key use, and legacy YouTube compatibility.
- Implementation commit: `1866448d8365c91f402e99eb8aa65786ab0b2618`; pushed to `origin/main` and verified.
- Production build: PENDING because this connected GitHub-only environment does not provide a repository checkout for `npm.cmd run build`; no build PASS is claimed.
- CEO QA and Task 2 repository closeout: PENDING. Task 3 is not authorized.

### Task 3 - Manual Production, QA, and Finished Asset

Status: NOT STARTED.

Objective: Manage the transition from approved production instructions to a real finished short-form video created with manual or external tools.

Minimum production record includes production status, source-asset references, tool/process used, finished-video reference, production notes, completion timestamp, and blockers or missing components.

Minimum QA covers finished-video reference, platform, orientation/aspect ratio, duration, video/audio review, on-screen text, caption/call to action, source rights or restrictions where applicable, platform suitability, and completion of required production components.

Final CEO approval must apply to the finished asset, not only its script. Mandatory production and QA information must gate final approval. Revisions and prior asset versions must remain reconstructable.

Finish condition: AO contains one real, QA-complete, CEO-approved, version-preserved finished short-form asset.

### Task 4 - Owned-Page Manual Publication and Performance Recording

Status: NOT STARTED.

Objective: Prove the finished asset through one real manual publication to one AO-owned page.

The publication record must minimally contain the finished-asset/package reference, platform, page name or handle, publication status, planned time if used, actual publication time, published URL or external post ID, publishing actor, and notes/failure/blocker information.

The initial performance snapshot must minimally contain observation time, views, likes, comments, shares, and CEO notes; followers gained, clicks, leads, or conversions are recorded when applicable.

Publication remains manual. AO must not imply approval caused publication. Published status requires actual publication evidence. Performance is manually entered from observed platform data. Observed zero and unknown remain distinct. Repeated saves must not create duplicate publication records or snapshots.

Finish condition: the approved asset is genuinely published and its publication and initial observed performance persist in AO.

### Task 5 - Integration QA, CEO QA, Documentation, and Repository Closeout

Status: NOT STARTED.

Objective: Verify the complete real workflow and close Sprint 016 only after its finish line is satisfied.

Required verified flow:

Idea / research -> short-form production -> AI-assisted draft -> manual production -> QA -> CEO approval -> finished asset -> manual publication -> initial performance snapshot.

Task 5 includes automated integration QA, production build verification, real CEO QA, restart and persistence verification, documentation synchronization, Startup Bundle regeneration and validation, commit/push verification, clean repository verification, and Sprint mission evaluation.

## Sprint Acceptance Criteria

Sprint 016 passes only if:

1. Short-Form Video is a shared reusable capability.
2. TikTok, YouTube Shorts, and Instagram Reels are representable without separate production engines.
3. One platform and one AO-owned page are selected for the real pilot.
4. One real idea enters the workflow with research or Knowledge context.
5. At least one approved provider execution contributes a real draft.
6. Required production instructions are completed.
7. A real finished-video reference is recorded.
8. Mandatory QA passes before final approval.
9. The CEO approves the finished asset.
10. Approval, revision, execution, and asset history remain reconstructable.
11. A version-preserved finished asset package is created.
12. The shared asset has no customer or B2B dependency.
13. The CEO manually publishes it to the selected AO-owned page.
14. AO records the actual publication time and URL or external post ID.
15. AO records an initial manually observed performance snapshot.
16. Unknown metrics remain distinct from observed zero.
17. Stable Business, Project, Work Item, Execution, Approval, asset, publication, and performance relationships are preserved.
18. Reload and full application restart preserve the workflow without duplication.
19. No external action occurs automatically.
20. TypeScript, production build, documentation consistency, Startup Bundle validation, commit, push, synchronization, and clean repository verification pass.

## Automated QA Requirements

Automated verification must cover existing YouTube compatibility; platform normalization; production/QA approval gates; approved-asset publication gate; required publication evidence; performance values; unknown-versus-zero semantics; duplicate protection; revision and asset-version preservation; source immutability; stable relationships and lineage; persistence; absence of B2B dependencies; absence of social APIs, automated publishing, analytics ingestion, trading, scheduling, or background execution; TypeScript; and production build.

Temporary QA fixtures must be removed before Task 5 repository closeout.

## CEO QA Requirements

Jake must manually verify one real AO-owned content Business and Short-Form Video Project from idea and research through Creative Brief, concept, approved provider execution, production plan, real manually produced video, recorded references, QA, CEO approval, finished package, manual publication, publication evidence, initial performance observation, full application restart, persistence, relationships, and absence of duplication.

Automated QA cannot substitute for the real publication or CEO approval.

## Explicitly Out of Scope

Sprint 016 does not authorize:

- B2B customers, contacts, leads, deals, proposals, quotes, engagements, client review, client delivery, invoices, payment requests, or payment collection.
- Automated social authentication, upload, publishing, scheduling, platform API integration, analytics ingestion, or performance ingestion.
- Broad connector, MCP, credential-vault, or external-action infrastructure.
- Trading, market data, Robinhood, portfolios, orders, or positions.
- AI video, image, voice, music, or automated editing/rendering.
- Cloud media storage or a file-management system.
- Multi-page management, recurring content calendar, or publication scheduler.
- Automated learning, ranking, next-content generation, or performance-based autonomous decisions.
- Background workers, automatic retries, autonomous departments, trust scoring, or capability unlocking.
- New financial, customer, publication, analytics, or content stores without a Task 1 stop-and-review decision.
- Publication to all three platforms.
- Revenue, view, follower, or conversion targets as acceptance criteria.
- Unrelated module redesign.

## Activation State

- CEO Concept Approval: PASS - Jake approved the revised roadmap direction and Sprint 016 concept.
- CEO Sprint Plan Approval: PASS - Jake approved the scope, five tasks, acceptance criteria, QA requirements, and exclusions.
- Documentation Activation: COMPLETE.
- Activation Commit: `eeddfdb47cc5528434da7b6cdc1d86a76c66ad94`.
- Activation Repository Verification: COMPLETE - PASS.
- Task 1 Documentation Commit: `21b94d5152ae67f7fc2db66245774af880662fb8`.
- Task 1 Repository Verification: COMPLETE - PASS.
- Startup Bundle: VALID.
- Application Implementation: Task 2 COMPLETE and pushed; production build and CEO QA pending.
- Task 1: COMPLETE - REPOSITORY VERIFIED.
- Current Authorized Task: Task 2 - Short-Form Production Foundation.
- Task 2 Status: IMPLEMENTATION COMPLETE - IMPLEMENTATION COMMIT VERIFIED; PRODUCTION BUILD, CEO QA, AND TASK CLOSEOUT PENDING.
- Task 2 Implementation Commit: `1866448d8365c91f402e99eb8aa65786ab0b2618`.
- Next Required Action: run `npm.cmd run build` from a synchronized local app checkout, then complete bounded Task 2 CEO QA and repository closeout. Do not begin Task 3.
