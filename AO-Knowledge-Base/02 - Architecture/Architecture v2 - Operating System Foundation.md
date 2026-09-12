# Architecture v2 - Operating System Foundation

Status: Active  
Version: 2.0  
Owner: Jake Allen  
Last Updated: 2026-09-12
Scope: Operating System Foundation with approved extensions through Sprint 017 Task 1

## Sprint 017 Architecture Extension - Automation-First Content Production

Sprint 017 introduces one outcome-first content-production workflow in which one requested video is one visible job. The first typed format is Reddit Stories using reusable prerecorded footage, but format rules remain separate from shared writing, narration, caption, footage, rendering, state, preview, and review capabilities.

The architecture adds one necessary runtime domain: `ContentProductionJobStore`. It owns only CEO job input, orchestration state, append-only attempts, rendered-result references, and recoverable errors. Its local-first metadata key is `ai-operator-os-content-production-jobs-v1`. Media bytes remain on the local filesystem. This store does not replace or duplicate Project, Production Blueprint, Work Item, Execution Core, Provider, Approval, or Money ownership.

Execution Core remains authoritative for AI execution lifecycle and results. Capability Resolver and Provider Manager remain authoritative for provider selection. Approval Queue remains authoritative for result decisions and decision history. Electron main owns native file dialogs, validated local process invocation, temporary media, final output paths, and protected preview access. Existing Project Store data and the Sprint 016 short-form profile remain preserved historical/advanced architecture and are not migrated into the job store.

The first `ContentFormatModule` is `reddit-stories`. The small typed module contract owns input validation, defaults, provider instructions, strict result parsing, and format render/caption rules. It requests a provider-independent JSON object with non-empty `hookText`, `narrationText`, and `ctaText`. Malformed output preserves the raw Execution Result and fails the attempt without fabricated content, partial output, or automatic retry.

Script work follows `Content Production Job -> Execution Core -> Capability Resolver -> Provider Manager -> Provider -> Execution Result`. The renderer must not call providers directly, and Local Ollama is a validation provider rather than product architecture.

Windows narration uses a narrow adapter implemented by a fixed Electron-main PowerShell helper over installed `System.Speech.Synthesis.SpeechSynthesizer` voices. `SpeakProgress.AudioPosition` supplies word timing. Word timings are grouped deterministically into phrase captions, and hook/captions/CTA are rendered as ASS subtitle events.

Media rendering uses one pinned FFmpeg runtime invoked by Electron main with argument arrays and `shell: false`. The shared render plan loops source footage as needed, scales and crops to 1080x1920 at 30 fps, adds narration, burns ASS captions, and emits H.264/AAC MP4 with `yuv420p` and fast-start metadata. The FFmpeg binary and fixed TTS helper must be unpacked from ASAR and verified in a Windows portable or installer build.

Preload exposes only typed content-production operations. Electron main validates sender, schemas, bounds, IDs, extensions, and canonical paths. No generic filesystem, command, shell, or process bridge is allowed. Final output is restricted to an `AI Operator OS/Generated` directory beneath the operating-system Videos directory and preview is restricted to that root.

Job operational state is limited to Draft, Running, Ready for Review, and Failed. CEO decision state is derived from the linked Approval Queue record rather than duplicated. Attempts and result versions are append-only. Startup converts abandoned Running attempts to visible interrupted failures; retry and revision require a manual CEO action and create new attempts. Approve performs no publication. Needs Revision requires feedback. Reject preserves history and performs no automatic action.

No Media Store, Render Store, Prompt Store, general plugin framework, second execution engine, second provider system, second approval system, scheduler, worker queue, automatic retry, automatic revision, AI-generated footage, publication, external platform integration, or legacy-data deletion is authorized by Sprint 017 Task 1.

## Sprint 016 Architecture Extension - Shared Short-Form Operating Capability

Sprint 016 extends the existing Project-owned Creative Production Engine from a YouTube-first planning/package workflow into a shared short-form operating workflow that can produce one real finished video and record manual owned-page publication and performance evidence.

The authoritative Sprint 016 Task 1 schema, gates, normalization rules, duplicate rules, compatibility requirements, and Task 2 boundary are frozen in `AO-Knowledge-Base/07 - Sprint Summaries/Sprint 016 - Shared Short-Form Operating Capability.md`.

The architecture reuses:

- Business Store for the AO-operated content Business.
- Project Store and `ai-operator-os-projects-v1` for Short-Form Business Asset context, target platforms, Blueprint, short-form production, file-reference metadata, QA evidence, finished-asset versions, manual publication records, and manual performance snapshots.
- Work Item Store for Work Items and Work Orders.
- Execution Core and Provider Manager for provider-independent text work, results, cost, and lineage.
- Approval Queue for final CEO approval status and decision history.
- External platforms for publication and performance truth.
- Money Department for financial truth.

No Content Store, Asset Store, Publication Store, Analytics Store, Account Store, new persistence key, social connector, automated publisher, analytics ingester, B2B customer model, trading capability, scheduler, workflow engine, or autonomous behavior is authorized.

Short-form production is platform-shared. `TikTok`, `YouTube Shorts`, and `Instagram Reels` are typed targets inside one production capability, not separate production engines. The Project-owned production path ends at a version-preserved, QA-complete, CEO-approved finished asset. Manual owned-page publication and manual performance snapshots are downstream evidence and do not redefine the production asset.

Existing YouTube records remain compatible. Blueprint deliverable sets and execution instructions must be selected by asset/blueprint type rather than applying a new global short-form schema to legacy records. Approval never implies publication, a publication record never performs an external action, and a file reference never grants filesystem access.

## Sprint 015 Architecture Extension - Multi-Business Attention

Sprint 015 extends the existing operating-system foundation by adding a read-only multi-business attention layer across existing records.

This extension does not change source ownership:

- Business Store owns Business records, lifecycle status, readable business codes, business health labels, and business priority.
- Project Store owns Project records and project/business relationships.
- Work Item Store owns Work Items, Work Orders, blocked-work status, and work priority.
- Execution Queue owns existing queue records where still used.
- Execution Core owns execution lifecycle, failures, human-intervention state, attempts, timing, provider/model metadata, cost records, results, and Work Order / Execution Request lineage.
- Approval Queue owns current approval status, approval decisions, review records, and decision history.

Sprint 015 attention summaries are read-only derived view models. They must not become a new store, new persistence key, notification system, workflow engine, graph engine, rules engine, or duplicate approval/execution/project/work/business system.

The first attention signals are pending CEO approvals, executions currently requiring human intervention, current failed executions, and Work Items currently Blocked. Historical failures alone are not current attention. Current Approval Queue status is authoritative over cached approval references on other records.

Business ownership must resolve through stable IDs and linked records, not business names alone. Missing ownership and contradictory ownership are visible data-quality conditions and must not be silently repaired or reassigned by the attention layer.

Priority uses owning source-record priority and sorts Critical, High, Medium, Low. Same-priority ties sort human intervention, current failure, blocked work, routine pending approval, then oldest source creation time, then stable source-type/source-ID fallback. Missing or invalid priority remains visible as Unspecified rather than being inferred.

Sprint 015 Task 2 implements this foundation as a pure derivation module exported from `app/src/core/businesses`. The module accepts existing source records as inputs and returns derived portfolio items, business summaries, ownership review groups, and priority review groups without mutating or persisting records.

Task 2 current-failure semantics are explicit: `ExecutionRecord.status === 'Failed'` is current failure; `ExecutionRecord.requestLifecycle.status === 'Failed'` is also surfaced as current failure/context inconsistency when present; historical `execution.failures` entries alone are not current attention. When Execution Core status and Execution Request lifecycle conflict, the derived attention item exposes a state-consistency warning.

## 1. Overview

Architecture v2 documents the operating system foundation that exists after Sprints 001 through 008.

AI Operator OS is a local-first business operating system for helping one CEO create, organize, review, and eventually execute work across a portfolio of businesses. The current system is not an execution engine. It is a structured operating foundation that turns ideas into businesses, businesses into organized departments, departments into accountable work ownership, work into queue records, and risky queue records into approval-controlled decisions.

The system now has enough structure to support future execution-layer planning, but execution must remain separate from planning, queueing, and approval until Sprint 009+ architecture is explicitly defined.

## 2. Current System Hierarchy

The current operating hierarchy is:

```text
Opportunity
↓
Business
↓
Company Structure
↓
Department
↓
Manager
↓
Operator
↓
Project
↓
Work Item
↓
Execution Queue
↓
Approval Queue
```

Each layer should preserve the context of the layers above it. Lower layers may reference upstream records, but they should not duplicate ownership or replace the responsibility of another module.

## 3. Completed Layers

### Sprint 001 - Opportunity Pipeline

Opportunities are the front door for future businesses. They capture potential business ideas, lifecycle stage, scorecard placeholders, tags, timeline context, and CEO review actions.

### Sprint 002 - Business Manager

Businesses represent active or intended operating entities. Approved opportunities can be converted into businesses, and source opportunity references are preserved.

### Sprint 003 - Company Structure

Company Structure gives every business an organizational foundation. Businesses can own departments, use templates, and preserve department relationships locally.

### Sprint 003 Task 2 - Department Managers

Departments can have managers. Managers are local organizational records that coordinate department ownership, priorities, health, and notes.

### Sprint 004 - Workforce Operators

Operators are workforce records assigned to businesses, departments, and managers. They are not AI agents and do not execute work autonomously.

### Sprint 005 - Project Layer

Projects organize business initiatives. Projects belong to businesses and can reference department and manager ownership. Projects are containers, not execution engines.

### Sprint 006 - Work Item Layer

Work Items define executable units of work. They belong to projects and can reference business, department, manager, and operator context.

### Sprint 007 - Execution Queue

Execution Queue records are created from Work Items. They prepare work for future execution workflows but do not execute work, call AI, schedule work, or trigger automation.

### Sprint 008 - Approval Queue Integration

Approval Queue reads Execution Queue records that require approval and surfaces them for CEO review. Existing approval decision actions remain local-first and non-executing.

## 4. Core Data Flow

The intended data flow is:

1. A potential business begins as an Opportunity.
2. A qualified Opportunity can become a Business.
3. A Business owns a Company Structure.
4. Company Structure contains Departments.
5. Departments are coordinated by Managers.
6. Operators belong to Departments and can be supervised by Managers.
7. Projects organize business initiatives.
8. Work Items define executable units inside Projects.
9. Execution Queue records prepare Work Items for future execution.
10. Approval Queue controls whether risky or approval-required work may proceed.

Approval decisions do not currently execute work. They record human decision state and preserve audit context for future execution-layer development.

## 5. Module Responsibilities

### Opportunity

Capture, organize, and review possible future businesses before they become active businesses.

### Business

Represent an active or intended business inside the portfolio and preserve source opportunity traceability.

### Company Structure

Define the organizational foundation each business inherits, including department templates and assigned departments.

### Department

Own a major business function such as Research, Development, Marketing, Finance, Operations, or Sales.

### Manager

Coordinate department ownership, health, focus, priorities, and future work queues.

### Operator

Represent a specialized workforce role assigned to a department and manager. Operators perform work in the operating model, but the current software implementation stores operator records only.

### Project

Organize business initiatives. Projects group future Work Items and provide executive progress context.

### Work Item

Define a specific executable unit of work. Work Items do not execute themselves.

### Work Order

Sprint 014 introduces Work Order as a business-language concept for requested work. Work Order should reuse or extend the existing Work Item architecture as a specialized Work Item profile and business-language view, not as a duplicate work-management system.

A Work Order may reference Business Asset, Knowledge Workspace, Production Blueprint, and specific Blueprint deliverables. It should preserve references instead of copying authoritative Project or Blueprint data.

If a separate Work Order record is ever proposed, it must be justified as reference-only before implementation and must not duplicate Project, Work Item, Execution Queue, Execution Core, Capability Planning, or Approval ownership.

### Creative Brief

Sprint 014 Task 10 defines Creative Brief as upstream production context for the Creative Production Engine.

A Creative Brief converts a Business Asset / business idea into clear production context before Production Blueprint deliverables, Work Orders, Execution Requests, AI execution, CEO review, revision, approval, and Creative Asset Packaging.

Task 10 reuses existing architecture. Project Store owns the optional Creative Brief profile on the existing Project record as `creativeBrief?: CreativeBriefProfile`.

Existing Project persistence remains `ai-operator-os-projects-v1`. No Creative Brief Store and no new persistence key are authorized.

Production Blueprint does not own the Creative Brief. Knowledge Workspace does not own the Creative Brief. Creative Brief composes production context from existing authoritative systems.

Creative Brief must not duplicate Business Asset topic, goal/objective, target audience, tone, target length, platform, asset type, Project name/description, Project/Business/Department references, Production Blueprint deliverable definitions, or Knowledge Workspace entry content.

Approved Creative Brief-specific fields are enabled, briefId, status Draft/Ready, selectedKnowledgeEntryIds, offerContext, keyMessage, callToAction, constraints, requiredInclusions, prohibitedContent, platformInstructions, assetInstructions, createdAt, updatedAt, and metadata only where consistent with existing Project Store extension-container patterns.

Business Asset context is inherited. Editing authoritative Business Asset fields updates Business Asset, not Creative Brief duplicates. Task 10 does not introduce brief-specific overrides.

Creative Brief references Knowledge Workspace entries by selectedKnowledgeEntryIds only. Knowledge Workspace content is not copied into the Creative Brief.

Task 10 does not create a Creative Brief versioning engine. It uses createdAt and updatedAt only.

Creative Brief does not execute AI work, create Work Orders automatically, create Production Blueprints automatically, publish, upload, trigger external integrations, bypass CEO review, or introduce autonomy.

No Creative Brief Store, duplicate Project Store, new persistence key, workflow engine, scheduler, orchestrator, execution engine, approval system, provider system, trust engine, learning engine, capability unlocking system, or external publishing system is authorized by this concept.

### Creative Concept / Topic Development

Sprint 014 Task 11 defines Creative Concept / Topic Development as reusable AI-assisted ideation for the Creative Production Engine.

Generated topic/concept candidates are Project / Business Asset creative planning records owned by the existing Project Store. The approved conceptual model is `creativeConcepts?: CreativeConcept[]` or an equivalent Project-owned typed record collection.

Creative Concepts are derived from Business Asset authoritative context, Creative Brief-specific production direction, selected Knowledge Workspace references, and Project context. They must not duplicate Business Asset fields, Creative Brief fields, Knowledge Workspace content, Production Blueprint deliverable definitions, or execution records as competing sources of truth.

Task 11 must reuse the existing execution path:

```text
Work Item / Work Order
↓
Execution Request
↓
Execution Core
↓
Capability Resolver
↓
Provider Manager
↓
Provider execution
↓
Execution Result
```

Provider output may be parsed into Project-owned Creative Concept records only after a successful provider-independent execution result. Malformed output should preserve the raw Execution Result and record a clear failure/warning without creating invalid concept records or retrying automatically.

Creative Concept selection is a planning decision only. It does not create a Production Blueprint, mutate Blueprint deliverables, generate titles/hooks/scripts, create downstream Work Orders, execute AI again, publish, upload, or trigger external actions.

No Topic Store, Idea Store, Prompt Store, Generation Store, Context Store, new persistence key, new execution engine, new provider system, duplicate Approval Queue, scheduler, orchestrator, automatic regeneration, automatic ranking, autonomy, trust scoring, capability unlocking, learning engine, Task 9 package/export change, or Task 10 Creative Brief UI redesign is authorized by this concept.

### Creative Cost Visibility

Sprint 014 Task 12 defines Creative Cost Visibility as read-only Project-level visibility into creative-production execution cost, timing, provider/model usage, Work Order breakdowns, revision execution, and topic-development execution.

Execution Core remains the owner of execution records, execution attempts, estimated execution cost, actual execution cost, Cost Records, provider/model execution metadata, timing, lifecycle, success/failure, and Work Order / Execution Request lineage.

Money Department remains the owner of business financial records, budgets, operating commitments, financial reporting, and financial truth outside execution-specific usage records.

Project Store remains the owner of Project records, Business Asset context, and Project relationships.

Task 12 owns no authoritative cost records. It may provide only read-only derived aggregation, read-only view logic, and Project-level Creative Cost visibility.

Task 12 does not authorize a CreativeCostStore, ProductionCostStore, UsageCostStore, ProviderCostStore, CostLedger, AnalyticsStore, duplicate Money records, duplicate execution cost records, new persistence key, new ledger, or persisted derived summaries.

Task 12 must distinguish Actual Recorded Execution Cost, Estimated Execution Cost, No Cost Recorded / Unknown, and Local Provider Direct Cost. Local provider direct $0.00 cost must not be presented as true total cost, total business cost, or complete operating cost.

Task 12 aggregation should follow stable references:

```text
Project / Business Asset
â†“
Work Item / Work Order
â†“
Execution Request
â†“
Execution Record
â†“
Cost Records / Result / Provider / Timing
```

Task 12 must not use loose name/string matching when stable IDs exist.

The preferred UI surface is a narrow read-only Creative Cost summary inside existing Project Detail / Business Asset context. No new top-level route, Creative Cost Dashboard, analytics module, or separate reporting application is authorized.

Task 12 must not write or mutate Execution Records, Cost Records, Provider records, Money records, Work Orders, Execution Requests, or Project financial records.

Task 12 remains generic to creative asset type. It must not hardcode cost architecture around YouTube, scripts, thumbnails, topic concepts, or any specific platform.

### Creative Asset Package

Sprint 014 Task 9 introduces Creative Asset Package as the export-ready snapshot of final CEO-approved Creative Production Engine deliverables.

Creative Asset Packages should be owned by the existing Project Store as Project / Business Asset artifacts. Production Blueprint owns package composition and deliverable references. Deliverables own final approved content. Execution Core, Work Item Store, Execution Requests, and Approval Queue remain authoritative for their own histories and should be referenced rather than copied as competing sources of truth.

Creative Asset Packages must remain local-first, versioned, and reconstructable. Package creation prepares approved work for real-world use; it does not publish, upload, schedule, send, trigger external platform actions, execute providers, or bypass CEO approval.

No Creative Asset Package Store, Export Store, publishing system, workflow engine, execution engine, duplicate Project Store, duplicate Production Blueprint Store, duplicate Approval Queue, or duplicate Provider architecture is authorized by this concept.

### Execution Queue

Prepare Work Items for future execution. Queue records preserve source context, priority, execution type, approval requirement, and status.

### Approval Queue

Control whether consequential work may proceed. Approval Queue records CEO decisions and preserves decision history.

## 6. Ownership Rules

- Opportunities may create Businesses, but they do not own business operations after conversion.
- Businesses own Company Structure and Projects.
- Company Structure belongs to a Business.
- Departments belong to a Business through Company Structure.
- Managers coordinate Departments.
- Operators belong to Departments and may be assigned to Managers.
- Projects belong to Businesses.
- Work Items belong to Projects.
- Work Orders should be represented through the existing Work Item architecture unless explicitly justified as reference-only.
- Creative Brief belongs to the existing Project Store as an optional Project profile.
- Creative Briefs should avoid duplicating Business Asset, Project, Blueprint, or Knowledge Workspace data when a stable reference is enough.
- Creative Brief may reference Knowledge Workspace entries by ID; Knowledge Workspace remains the owner of knowledge content.
- Creative Concepts belong to the existing Project Store as Project / Business Asset creative planning records.
- Creative Concepts should reference Project, Business Asset, Creative Brief, selected Knowledge entries, Work Order, Execution Request, Execution Record, Execution Result, and provider/capability metadata where available instead of copying source records.
- Creative Concept selection must not move Production Blueprint, Execution Core, Provider Manager, or Approval Queue ownership.
- Creative Cost Visibility is read-only derived aggregation. Execution Core owns execution-specific costs and attempts; Money Department owns financial truth; Project Store owns Project and Business Asset context.
- Creative Cost Visibility must not create a cost store, financial ledger, duplicate Money record, duplicate execution cost record, new persistence key, or persisted derived summary.
- Creative Asset Packages belong to Projects / Business Assets and should be represented through the existing Project Store and Production Blueprint architecture.
- Creative Asset Packages may snapshot approved deliverable content, but source execution, review, revision, Work Order, and Execution Request history must remain referenced to their authoritative owners.
- Execution Queue records originate from Work Items.
- Approval Queue records may originate from Execution Queue records that require approval.
- No module should duplicate another module's source data when a stable reference is enough.
- Cross-links should preserve traceability without creating competing sources of truth.

## 7. Local-First Persistence Rules

- AI Operator OS remains local-first until cloud capability has clear positive ROI.
- Local data should use the existing local-first persistence pattern.
- Stores should remain domain-specific and reusable.
- New domains should not create duplicate persistence systems.
- Record IDs should remain stable, readable, and domain-specific.
- Existing localStorage keys should be preserved unless a migration is intentionally scoped.
- Record shape changes must safely migrate existing local data.
- Shared stores should be read by dependent modules instead of copying data.
- Persistence changes must be verified after app restart.

## 8. Navigation and Routing Rules

- User-facing modules must be connected to the active router and active sidebar before they are considered complete.
- Do not create duplicate pages, duplicate route systems, or disconnected feature folders.
- Navigation should follow the operating hierarchy where practical:
  - Opportunities
  - Businesses
  - Company Structure
  - Operators
  - Projects
  - Work Items
  - Execution Queue
  - Approval Queue
- Detail pages should use stable record IDs.
- Source and downstream records should be linked where useful, such as Opportunity to Business, Business to Project, Work Item to Execution Queue, and Execution Queue to Approval Queue.
- The running application must be verified from the active source launch path before assuming a feature is missing.

### Future Experience Layer

The future AI Operator OS Experience Layer is a presentation layer only.

It may eventually support view modes, navigation priority, themes, typography settings, layout presets, dashboard presets, interface density, and AI presentation style. These settings may change visibility, navigation priority, wording, and visual presentation.

They must not change system truth, business logic, approval rules, provider selection, execution behavior, persistence ownership, routing ownership, or source data.

Simple View, Standard View, and Full View must all use the same underlying codebase, stores, components, routes, workflows, and data sources. They must not become separate applications, separate product versions, duplicate pages, duplicate stores, or isolated sources of truth.

## 9. Approval and Human-Control Rules

- Jake is the CEO and final approver.
- Every risky action must require approval.
- Human approval is required for:
  - Money-impacting actions
  - Public communication
  - Client impact
  - Deletion
  - Pricing
  - Contracts
  - External services
- Approval Queue controls whether work may proceed.
- Approval records decision state; approval does not currently execute work.
- No AI execution should be built before approval architecture is stable.
- No important action should execute automatically without clear CEO approval.
- The CEO approval workflow must be preserved across all future modules.

## 10. What Modules Must NOT Do

- Opportunities must not execute work.
- Businesses must not become task or execution engines.
- Company Structure must not execute department work.
- Managers must not become autonomous actors without future approval architecture.
- Operators must not be treated as AI agents in the current implementation.
- Projects must not execute work; they organize initiatives.
- Work Items must not execute work; they define executable units.
- Execution Queue must not execute work; it prepares work.
- Approval Queue must not execute work; it controls decisions.
- No module may bypass approval for risky actions.
- No module may create duplicate stores, duplicate routes, or duplicate sources of truth.
- No module may add APIs, databases, cloud sync, paid services, AI execution, background jobs, messaging, or automation unless explicitly scoped and approved.

## 11. Sprint 009+ Architecture Direction

Sprint 009+ should plan the execution layer carefully before any execution engine is built.

The Execution Engine must not be built before Sprint 009 planning is complete.

Future planning should define:

- What an execution engine is allowed to do.
- What it is forbidden to do.
- How approved work moves from Approval Queue back to Execution Queue.
- How execution attempts are logged.
- How failures, rollbacks, and human intervention are handled.
- Which actions are manual, draft-only, review-only, future AI, or future automation.
- Which actions require approval before creation, before execution, or before publication.
- How money, external services, public communication, and client impact remain protected.

The next architecture layer should strengthen human control before increasing automation.

## 12. Key Lessons Learned from Sprints 001-008

- Build the hierarchy in small verified layers.
- A feature is not complete until it is connected to the active router and sidebar.
- Local-first persistence must be tested after restart, not only during the current session.
- Stable IDs and source references make cross-module traceability possible.
- Duplicate stores and disconnected pages create avoidable QA failures.
- Planning records, queue records, approval records, and execution records must remain separate.
- Approval should come before execution.
- The system should remain understandable as it grows.
- Architecture comes before UI, but active UI integration must still be verified.
- The development launcher and packaged build verification help prevent stale-build confusion.

## 13. Architecture Constitution

1. GitHub is the source of truth.
2. Jake is CEO and final approver.
3. ChatGPT Project acts as CTO and product architect.
4. Codex acts as developer.
5. AI Operator OS remains local-first until cloud has positive ROI.
6. Architecture comes before UI.
7. Every module must have one clear responsibility.
8. No duplicate persistence systems are allowed.
9. No duplicate modules, routes, or disconnected implementations are allowed.
10. Managers coordinate work.
11. Operators perform work.
12. Projects organize work.
13. Work Items define executable units.
14. Execution Queue prepares work.
15. Approval Queue controls whether work may proceed.
16. Every risky action must require human approval.
17. Money, public communication, client impact, deletion, pricing, contracts, and external services require human approval.
18. No AI execution may be introduced before approval architecture is stable.
19. The Execution Engine must not be built before Sprint 009 planning is complete.
20. The system must stay organized, understandable, and scalable as it grows.
21. Automation is earned. Automation is never assumed. Every workflow must mature through Manual, Assisted, Semi-Automatic, and Fully Automatic stages, and each stage must be validated before advancing to the next. The system must always support manual operation even after automation exists.
22. Infrastructure comes before execution. Before any Operator can perform work, the OS must identify required AI providers, external tools, permissions, integrations, and estimated operating cost. The CEO must explicitly approve this infrastructure before it becomes available.
23. AI providers are replaceable. AI providers are implementation details, not architecture. The operating system owns the workflow, and Operators may use OpenAI today, Claude tomorrow, Gemini next year, or local models later without changing business architecture. The OS must never depend on a single AI vendor.
24. Operators request capabilities. Operators do not permanently own tools. They request capabilities from the platform, such as browser access, search APIs, email, CRM, GitHub, or hosting. Capabilities are approved, installed, and managed centrally.
25. Human authority is absolute. The CEO always retains final authority. The OS may recommend, prepare, and automate approved workflows, but it may never redefine business intent without human approval.
26. Architecture and user experience are separate concerns. Internal architecture may be complex, but user experience must remain simple. Developer interfaces may expose every module, while CEO interfaces should expose business workflows rather than implementation details. Complexity should exist internally, not in daily operation.
27. Build foundations before intelligence. Execution architecture must exist before AI execution. Approval workflows must exist before autonomous work. Data ownership must exist before memory. Business structure must exist before operators begin autonomous work. The OS is built from stable foundations upward.
28. Separate infrastructure from intelligence. Execution Infrastructure must never depend on a specific AI provider. AO-012 proves deterministic end-to-end execution without AI providers; AO-013 adds AI Provider Integration after that foundation is stable.
29. Departments never choose providers. Departments and workers request capabilities. Provider Manager selects providers based on capability, cost, speed, availability, and business rules.
30. Provider independence is permanent. AI Operator OS must never become tied to one AI vendor. Local models, OpenAI, Codex, Claude, Gemini, and future providers are interchangeable resources behind the operating system's workflow.
31. Experience is separate from system truth. Future customization may change presentation, visibility, navigation priority, density, layout, theme, typography, or wording, but it must not change business logic, approval rules, provider selection, execution behavior, persistence ownership, or authoritative data.
32. One interface architecture serves all views. Simple, Standard, and Full views must share one codebase, one routing system, shared components, shared stores, and the same source of truth. They must not become duplicate applications or duplicate modules.
