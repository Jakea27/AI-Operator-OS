# Architecture v2 - Operating System Foundation

Status: Active  
Version: 2.0  
Owner: Jake Allen  
Last Updated: 2026-07-09  
Scope: Post Sprint 008

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
