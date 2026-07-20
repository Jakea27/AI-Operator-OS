# Provider Architecture Foundation

Status: Active  
Version: 0.1  
Owner: Jake Allen  
Last Updated: 2026-07-20  
Scope: Sprint 013 Task 1

## Purpose

The Provider Architecture Foundation defines how AI Operator OS will represent future AI providers without connecting to any provider yet.

Task 1 creates architecture and data ownership only. It does not send prompts, call providers, perform network health checks, execute models, route work to providers, or add autonomous behavior.

## Architecture Principle

Execution Infrastructure remains separate from AI intelligence.

Providers are replaceable implementation details. AI Operator OS owns the workflow, execution infrastructure, approvals, and business context. Future providers supply capabilities behind approved boundaries.

## Ownership

Provider domain owns:

- Provider definitions.
- Provider configuration metadata.
- Model definitions.
- Provider capability advertisement.
- Provider health state.
- Provider availability.
- Provider-level selection preferences.
- Provider-level usage summaries or references.

Provider domain does not own:

- Work definitions.
- Queue state.
- Approval decisions.
- Capability planning decisions.
- Execution lifecycle.
- Execution attempts.
- Attempt-level logs.
- Attempt-level cost records.
- Financial reporting.
- Department ownership.
- Autonomous business decisions.

Existing owners remain unchanged:

- Work Items own work definitions.
- Execution Queue owns queue state.
- Capability Planning owns capability requirements and readiness.
- Approval Queue owns approval decisions.
- Execution Core owns execution records and attempts.
- Money owns financial reporting.
- Command Center owns executive visibility and navigation only.

## Provider Records

Provider records support:

- Provider ID.
- Provider name.
- Provider type.
- Provider status.
- Provider source.
- Provider description.
- Enabled/disabled state.
- Local/cloud/hybrid classification.
- Supported capabilities.
- Created and updated timestamps.

Provider types support local, cloud, hybrid, and custom architecture.

Provider statuses support unconfigured, configured, unavailable, available, degraded, disabled, and error states.

## Capabilities

Capabilities are provider-independent.

Initial capability definitions include:

- Text Generation.
- Coding.
- Reasoning.
- Vision.
- Image Generation.
- Embeddings.
- Transcription.
- Speech Generation.
- Tool Use.
- Long Context.
- Structured Output.

Capabilities do not permanently belong to a department, worker, operator, provider, or model. A provider or model may advertise support for capabilities.

## Model Records

Model records support future model metadata including:

- Model ID.
- Provider reference.
- Display name.
- Model name.
- Enabled state.
- Local/cloud/hybrid runtime.
- Supported capabilities.
- Context limits.
- Input/output support.
- Cost metadata.
- Speed/performance metadata.
- Availability.
- Health.
- Created and updated timestamps.

Task 1 does not insert unverified real-world prices or specifications.

## Configuration Records

Configuration records store safe setup metadata only.

They may include:

- Endpoint.
- API-key-required state.
- Configured state.
- Local host information.
- Environment variable reference.
- Connection timeout.
- Preferred model.
- Configuration validation state.

Configuration records must not store real API keys, plaintext secrets, credentials, tokens, or passwords.

## Health Records

Health records support future health metadata including:

- Health status.
- Last checked timestamp.
- Response time.
- Last successful check.
- Last error.
- Consecutive failures.
- Availability.

Task 1 does not perform network health checks.

## Usage and Cost Structures

Provider usage summaries support:

- Request counts.
- Input/output units.
- Estimated cost.
- Actual cost.
- Currency.
- Time range.
- Provider reference.
- Model reference.
- Execution reference.

These are provider-level summaries or references only.

Execution Core remains the owner of attempt-level execution records and execution cost records.

Money remains the owner of financial reporting.

## Selection Policies

Selection-policy structures support future Provider Manager decisions without implementing selection behavior.

They may describe:

- Capability requirements.
- Provider priority.
- Maximum cost.
- Local-only preference.
- Cloud allowed.
- Privacy requirement.
- Speed priority.
- Quality priority.
- Fallback allowed.
- Preferred provider.
- Excluded providers.

Task 1 does not implement a Provider Manager selection algorithm.

## Persistence

The provider domain uses the established local-first store pattern:

- TypeScript types.
- Typed local store.
- `useSyncExternalStore`.
- Module-owned localStorage key.
- Safe empty initialization.
- Malformed-storage fallback.
- Normalize-on-read behavior.
- Duplicate protection for provider, model, and policy creation.
- Immutable updates.

The provider store starts empty. It does not create fake configured providers and does not imply any provider is installed or connected.

## Safety Rules

Provider Architecture Foundation must not:

- Connect OpenAI, Ollama, Anthropic, Google, Codex, or any provider.
- Call provider APIs.
- Store secrets.
- Detect local models.
- Download models.
- Execute prompts.
- Handle AI responses.
- Select providers.
- Route workers to providers.
- Add autonomous behavior.
- Change Execution Core ownership.

## Future Direction

Future Sprint 013 tasks may add Provider Manager, provider registration workflows, local/cloud provider integration, provider health checks, capability discovery, provider selection, prompt execution, response handling, and usage metrics only when explicitly approved.

## Provider Manager

Sprint 013 Task 2 adds the Provider Manager as the central provider coordination service.

Provider Manager responsibilities:

- Register providers.
- Unregister providers.
- Enable providers.
- Disable providers.
- Look up provider records.
- Evaluate provider health from stored health metadata only.
- Evaluate provider availability from stored provider and health metadata only.
- Look up providers and models by provider-independent capability.
- Validate provider records.
- Check provider compatibility against capability and business-rule requirements.
- Produce deterministic, read-only provider recommendations.

Provider Manager recommendation logic may consider:

- Requested capabilities.
- Provider priority.
- Provider status.
- Enabled state.
- Configured state.
- Stored availability.
- Stored health.
- Local/cloud preference.
- Preferred provider metadata.
- Excluded provider metadata.
- Fallback eligibility.
- Business-rule policy metadata.

Provider Manager must not:

- Contact providers.
- Send prompts.
- Execute models.
- Run health-check network requests.
- Store credentials.
- Route workers to providers.
- Mutate Execution Core lifecycle or execution records.
- Make autonomous decisions.

Task 2 recommendations are inspection and planning outputs only. They do not select or execute a provider for real work.
