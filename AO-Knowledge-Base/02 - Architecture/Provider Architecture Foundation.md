# Provider Architecture Foundation

Status: Active  
Version: 0.1  
Owner: Jake Allen  
Last Updated: 2026-07-22  
Scope: Sprint 013 Tasks 1-7

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

## Capability Routing

Sprint 013 Task 3 adds the provider-independent Capability Routing layer.

Capability Routing translates a structured capability request into a deterministic, read-only routing recommendation using Provider Manager and stored provider metadata only.

The architectural flow is:

```text
Department / Worker / Operator
↓
Capability Request
↓
Capability Resolver
↓
Provider Manager
↓
Provider Recommendation
```

Capability Request describes what is needed. It may include:

- Request ID.
- Requested provider-independent capability.
- Additional capability requirements.
- Requesting entity type and ID.
- Work Item reference.
- Execution reference.
- Capability Plan reference.
- Input and output modality requirements.
- Minimum context requirement.
- Structured-output and tool-use requirements.
- Local/cloud constraints.
- Privacy requirement.
- Maximum estimated cost.
- Speed and quality priorities.
- Optional CEO-approved preferred-provider constraint.
- Excluded providers.
- Fallback preference.
- Request timestamp and metadata.

Capability Resolver owns:

- Capability request validation.
- Capability requirement normalization.
- Recognized-capability checks.
- Modality validation.
- Cost and policy constraint validation.
- Local/cloud contradiction detection.
- Missing-data detection.
- Normalized Provider Manager request generation.
- Structured routing-result generation.

Provider Manager remains the only provider-domain service that evaluates provider and model metadata and recommends providers.

Capability Routing does not own:

- Provider definitions.
- Provider configuration.
- Provider health.
- Provider persistence.
- Department, manager, worker, operator, workflow, or system records.
- Work Items.
- Execution Queue records.
- Execution Core records.
- Capability Planning decisions.
- Approval decisions.
- Prompt content.
- AI responses.
- Execution logs.
- Execution costs.
- Financial reporting.

## Routing Results

Capability Routing returns structured results.

Successful routed results include:

- Request ID.
- Normalized request.
- Recommended provider reference.
- Recommended model reference where applicable.
- Recommendation score.
- Matched capabilities.
- Provider-state snapshot.
- Fallback candidates.
- Deterministic reasons and warnings.
- Generated timestamp.

Unable-to-route results include deterministic failure codes such as:

- Missing Request ID.
- Missing Requesting Entity.
- Missing Capability.
- Unknown Capability.
- Invalid Timestamp.
- Invalid Cost Constraint.
- Conflicting Runtime Constraints.
- Preferred Provider Excluded.
- Preferred Provider Not Approved.
- No Configured Provider.
- No Enabled Provider.
- No Healthy Provider.
- No Available Provider.
- No Compatible Provider.
- No Compatible Model.
- Missing Capability Support.
- Cost Constraint Failure.
- Local Cloud Constraint Failure.
- Privacy Constraint Failure.
- Fallback Unavailable.
- Human Review Required.

Routing results are read-only planning outputs.

They do not create execution records, mutate Capability Planning, mutate Approval Queue, change provider configuration, or execute work.

## Capability Routing Persistence Decision

Capability Routing is stateless in Sprint 013 Task 3.

No routing store or localStorage key was created because current architecture requires deterministic recommendation output, not durable routing records.

If future workflows need durable routing decisions, a later approved task may create a local-first routing record that references source requests and provider recommendations without duplicating provider, execution, approval, or capability-planning ownership.

## Provider Health and Model Discovery Foundation

Sprint 013 Task 4 adds the provider-health and model-discovery foundation required before local AI integration begins.

This foundation is architecture and local coordination logic only.

It does not connect Ollama, OpenAI, Codex, Claude, Gemini, or any other provider.

It does not perform network requests, execute prompts, execute models, stream responses, start provider processes, store secrets, create execution records, persist routing results, or add autonomous behavior.

## Provider Health Evaluation

Provider Health evaluation normalizes stored or explicitly supplied provider metadata into deterministic health results.

Health evaluation may consider:

- Provider enabled state.
- Provider status.
- Configuration readiness.
- Stored health status.
- Stored availability.
- Last checked timestamp.
- Last successful check timestamp.
- Response-time metadata.
- Compatible model count.
- Warning codes.
- Failure codes.
- Human-readable summary.
- Health information source.

Normalized provider health states include:

- Unknown.
- Healthy.
- Degraded.
- Unavailable.
- Misconfigured.
- Disabled.
- Error.
- Not Checked.

Provider Health evaluation must not:

- Call a network.
- Start a provider.
- Test credentials.
- Send prompts.
- Execute models.
- Modify Execution Core.
- Trigger autonomous behavior.

## Model Discovery Foundation

Model Discovery accepts provider-independent discovery results supplied by a future provider adapter.

Model Discovery owns:

- Discovery request structures.
- Discovery source metadata.
- Discovered model structures.
- Discovery warning and failure codes.
- Deterministic model normalization.
- Registration planning.

Model Discovery supports:

- Discovered model identifier.
- Display name.
- Model family.
- Model version.
- Context-window metadata.
- Input modalities.
- Output modalities.
- Supported capabilities.
- Tool-use support.
- Structured-output support.
- Local/cloud/hybrid runtime.
- Cost metadata where available.
- Availability.
- Discovery timestamp.
- Warning and failure codes.

Discovery outcomes include:

- Models Discovered.
- No Models Discovered.
- Provider Unavailable.
- Provider Not Configured.
- Discovery Unsupported.
- Invalid Discovery Response.
- Partial Discovery.

## Model Normalization

Model normalization translates provider-independent discovery input into the existing Provider Model input shape.

Normalization:

- Validates required identifiers.
- Normalizes provider-independent capabilities.
- Adds Tool Use and Structured Output capabilities from explicit flags.
- Normalizes input and output modalities.
- Normalizes context-window values.
- Normalizes runtime.
- Normalizes availability.
- Preserves unknown metadata safely.
- Rejects malformed model records deterministically.
- Detects duplicate provider/model combinations.

Normalization does not persist automatically.

## Model Registration Planning

Model Registration Planning produces read-only plans before any persistence occurs.

Registration-plan item statuses include:

- Add.
- Update.
- Unchanged.
- Rejected.

Registration plans report:

- Added count.
- Updated count.
- Unchanged count.
- Rejected count.
- Warning count.
- Failure count.

Persistence may occur only through an explicit call that delegates to the existing Provider Store.

No duplicate model store, health store, provider store, capability registry, routing store, or persistence key was created.

## Recommendation Compatibility

Provider Manager compatibility now accounts for stored health, configuration, availability, and compatible model metadata.

Disabled, misconfigured, unavailable, unhealthy, and model-incompatible providers are not recommendation-compatible.

Capability Resolver continues to delegate provider evaluation to Provider Manager and remains compatible with normalized model and health metadata.

## Ollama Local Provider Adapter

Sprint 013 Task 5 adds the first real local provider adapter: Ollama.

Ollama is implemented as an adapter behind the existing Provider Manager, Provider Store, provider-health metadata, and model-discovery coordinator.

The Ollama adapter owns:

- Local Ollama endpoint validation.
- Local-only endpoint safety checks.
- Live health checking against Ollama's local `/api/version` endpoint.
- Live installed-model discovery against Ollama's local `/api/tags` endpoint.
- Ollama response normalization.
- Ollama error and warning normalization.
- Conservative model capability mapping.
- Explicit Ollama provider creation support.
- Explicit model-registration planning and application through existing provider-domain services.

The Ollama adapter does not own:

- Provider Manager recommendations.
- Provider persistence.
- Model persistence.
- Department, manager, operator, worker, workflow, Work Item, Execution Queue, or Execution Core ownership.
- Prompt content.
- AI responses.
- Execution records.
- Approval decisions.
- Capability Planning decisions.
- Autonomous execution.

## Ollama Endpoint Rules

Sprint 013 Task 5 supports configurable local Ollama endpoints.

The default endpoint is:

```text
http://127.0.0.1:11434
```

Endpoint metadata is stored only as non-secret provider configuration metadata.

The adapter rejects malformed endpoints and non-local endpoints by default.

Allowed local endpoint targets include localhost, loopback addresses, and documented private/local network addresses. The adapter does not expose arbitrary URL fetching and does not store credentials, API keys, tokens, passwords, or secrets.

## Ollama Health Checks

Ollama health checks are narrow availability checks.

They may contact only the configured local Ollama endpoint and must not execute a model or send a prompt.

Health results normalize into existing Provider Health statuses:

- Healthy.
- Degraded.
- Unavailable.
- Misconfigured.
- Disabled.
- Unknown.

Health checks record latency metadata and deterministic error outcomes such as invalid endpoint, non-local endpoint rejected, connection refused, timeout, provider unavailable, invalid response, and unsupported version metadata.

## Ollama Model Discovery

Ollama model discovery retrieves locally installed model metadata from the configured local Ollama endpoint.

Discovery normalizes:

- Model identifier.
- Display name.
- Family and version metadata where available.
- Parameter or size metadata where available.
- Local runtime.
- Discovery timestamp.
- Partial metadata warnings.

Discovery does not automatically persist models.

Discovery produces a registration plan first. Persistence requires an explicit registration-plan application through the existing Provider Store.

## Ollama Capability Mapping

Ollama model capabilities are mapped conservatively.

The adapter may infer text generation, coding, reasoning, or embeddings only from available local model metadata and model-name evidence.

The adapter must not claim image analysis, tool use, structured output, or other specialized capabilities without evidence.

Unknown capability support remains unknown.

Capabilities remain provider-independent. Ollama is an implementation detail behind Provider Manager.

## Ollama Boundaries

Sprint 013 Task 5 does not:

- Connect cloud providers.
- Execute prompts.
- Execute models.
- Route workers to live AI.
- Add a chat interface.
- Add streaming completion UI.
- Add background polling.
- Start or install Ollama.
- Store secrets.
- Add autonomous behavior.
- Change Execution Core ownership.

Execution Core remains provider-independent.

Departments, managers, squads, operators, workers, workflows, and execution records request capabilities. They do not select Ollama directly.

## Ollama Behavioral QA Baseline

Sprint 013 Task 5 CEO QA verified the local Ollama foundation on Windows.

Verified baseline:

- Ollama installed successfully on Windows.
- Ollama version 0.32.1 was verified.
- The local Ollama service responded successfully.
- `qwen2.5:7b` downloaded successfully.
- The installed model appeared in `ollama list`.
- The local model loaded and returned a valid response.

This behavioral verification confirms the adapter foundation can communicate with a real local Ollama runtime.

It does not change the architecture boundary: Task 5 does not add AI Operator OS prompt execution, worker AI execution, cloud provider integration, autonomous execution, or external provider calls.

Ollama missing/offline remains a safely handled supported state.

## Local Prompt Execution Foundation

Sprint 013 Task 6 adds the first provider-independent prompt execution foundation.

The execution path is:

```text
Provider Prompt Execution Input
↓
Provider Manager
↓
Provider execution adapter contract
↓
Ollama adapter
↓
Local Ollama
↓
Local model
↓
Structured Provider Prompt Execution Result
```

Provider prompt execution structures support:

- Capability request.
- Prompt.
- Optional system prompt.
- Temperature.
- Maximum token request.
- Structured-response option.
- Metadata.
- Provider summary.
- Model summary.
- Latency.
- Token usage where available.
- Warnings.
- Failures.
- Timestamps.

## Provider Execution Ownership

Provider Manager coordinates provider prompt execution.

Provider Manager may:

- Receive a provider-independent prompt execution request.
- Use existing provider recommendation metadata.
- Select a provider and model from stored metadata.
- Dispatch to the matching provider execution adapter.
- Return a structured provider execution result.

Provider Manager must not:

- Bypass capability or provider metadata.
- Hardcode departments or workers to a provider.
- Persist execution records.
- Own Work Items, Execution Queue, Execution Core, Capability Planning, or Approval Queue records.
- Create autonomous execution.

## Ollama Prompt Execution

The Ollama adapter supports non-streaming local prompt execution through the configured local Ollama endpoint.

Sprint 013 Task 6 uses Ollama's local `/api/generate` endpoint.

Supported inputs:

- Plain text prompt.
- Optional system prompt composition.
- Temperature.
- Maximum token request.

Unsupported in Task 6:

- Streaming.
- Chat UI.
- Worker AI execution.
- Department AI execution.
- Autonomous jobs.
- Cloud providers.
- OpenAI.
- Claude.
- Gemini.
- Codex.
- External APIs.

Execution Core remains provider-independent and does not import Ollama.

Workers do not call Ollama directly.

## Local Prompt Execution QA Baseline

Sprint 013 Task 6 internal QA verified the first real AI Operator OS provider execution path.

Smoke test:

```text
Provider Manager
↓
Ollama adapter
↓
Local Ollama
↓
qwen2.5:7b
↓
SUCCESS
```

The prompt was:

```text
Respond only with the word SUCCESS.
```

Result:

- Provider selected: Ollama.
- Model selected: qwen2.5:7b.
- Response received: SUCCESS.
- Structured provider result returned.
- No cloud provider was connected.
- No worker AI execution was added.
- No autonomous execution was added.

Sprint 013 Task 6 CEO QA later confirmed this milestone as the first real AI execution completed through AI Operator OS.

The verified milestone preserves these permanent boundaries:

- Execution Core remained provider-independent.
- Provider Manager selected the provider.
- Provider-independent execution contract was validated.
- Local Ollama adapter executed successfully.
- qwen2.5:7b executed successfully.
- Structured provider execution result was returned.
- No cloud providers were connected.
- No autonomous execution was added.
- No worker AI was added.
- No streaming was added.
- No duplicate stores were introduced.

## Provider Dashboard Foundation

Sprint 013 Task 7 adds the first CEO-facing provider management interface.

The Provider Dashboard owns provider visibility only. It does not own provider records, model records, health records, provider recommendations, provider execution, worker execution, capability routing, or approval decisions.

Provider Dashboard reads from:

- Existing Provider Store.
- Existing Provider Manager.
- Existing Ollama adapter metadata actions.
- Existing Model Discovery Coordinator registration plans.

Provider Dashboard displays:

- Provider overview metrics.
- Provider runtime and status.
- Provider enabled/disabled state.
- Provider health and availability metadata.
- Provider configuration metadata.
- Registered model metadata.
- Provider validation issues.
- Provider recommendation metadata.
- Provider usage and cost summaries.
- Local Ollama endpoint and model visibility where a local Ollama provider exists.

Provider Dashboard may trigger only explicit user actions:

- Add the built-in local Ollama provider record.
- Enable or disable a provider record.
- Run a local Ollama health check.
- Discover local Ollama models.
- Apply a reviewed model-registration plan.

These actions must not run in the background and must not execute prompts.

## Provider Dashboard Boundaries

Provider Dashboard must not:

- Create duplicate Provider Stores.
- Create duplicate model, health, routing, or usage stores.
- Add cloud provider integrations.
- Add provider credentials or secret storage.
- Display plaintext secrets.
- Execute prompts.
- Execute models.
- Add worker AI execution.
- Add department AI behavior.
- Add autonomous behavior.
- Add a chat UI.
- Modify Execution Core ownership.
- Bypass Provider Manager for provider recommendations.

Provider Dashboard is a management and visibility layer. Provider Manager remains the central provider coordination service.

## Provider Dashboard QA Baseline

Sprint 013 Task 7 CEO QA verified the Provider Dashboard Foundation.

Verified behavior:

- Provider Dashboard route and navigation are operational.
- Provider Detail route is operational.
- Ollama appears as an authoritative Provider Store record.
- Provider status shows Available, Healthy, Configured, and Enabled.
- Health check action works.
- Model discovery works.
- qwen2.5:7b appears in registered model metadata.
- Provider data persists after application restart.
- Model metadata persists after application restart.
- No duplicate provider records were created.
- No prompt execution occurs from the Provider Dashboard.
- No chat UI exists.
- No cloud provider was connected.
- No secrets are displayed or stored.
- Existing local Ollama prompt execution remains functional.

Non-blocking observation:

- qwen2.5:7b currently displays Disabled / Available / Not Checked model metadata in the Provider Detail UI.
- This did not block Task 6 local prompt execution or Task 7 provider persistence QA.
- Treat model-level enablement/status clarification as future polish unless authoritative architecture assigns it to a future task.
