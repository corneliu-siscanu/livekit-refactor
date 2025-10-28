# Project structure overview

This document explains how the LiveKit Agent project is organized, what each directory or file contains, and why the layout supports fast iteration and long-term scalability.

## Directory map

```
src/
  index.ts
  agent/
    agentDefinition.ts
    assistant.ts
    sessionFactory.ts
    utils/
      assistantHelpers.ts
  config/
    configService.ts
    configTypes.ts
    providers/
      mockConfigProvider.ts
  services/
    metricsService.ts
    ragService.ts
    telephonyService.ts
  tools/
    changeLanguageTool.ts
    endCallTool.ts
    index.ts
    staticTools.ts
    transferCallTool.ts
  utils/
    logging.ts
    text.ts
```

## Module-by-module details

### `src/index.ts`
* **`cli.runApp`** wires the project into the LiveKit worker runtime. It instantiates `WorkerOptions` with the compiled agent definition and registers the worker name. Keeping this file slim means alternate bootstraps or test harnesses can re-use the rest of the code without modification.

### `src/agent`
* **`agentDefinition.ts`** exports the `agentDefinition` created via `defineAgent`.
  * `prewarm` seeds the worker with a `ConfigService` and a Silero voice activity detector so later sessions skip heavy initialization.
  * `entry` retrieves the cached services, loads the latest runtime configuration, builds an assistant session, and registers metric shutdown hooks. Helper `getConfigService` ensures `prewarm` ran successfully.
* **`assistant.ts`** defines the `Assistant` class that extends `voice.Agent`.
  * The constructor builds system instructions with `buildInstructions` and records configuration/services for later use.
  * `setTools` lets the session factory inject the active tool registry.
  * `onUserTurnCompleted` appends Retrieval-Augmented Generation (RAG) snippets via `appendRagContext` before the model replies.
* **`sessionFactory.ts`** provides `createAgentSession` which composes the runtime dependencies:
  * Instantiates speech-to-text (`deepgram.STT`), large language model (`google.LLM`), text-to-speech (`cartesia.TTS`), multilingual turn detection, and the Silero VAD.
  * Syncs telephony profiles, builds the assistant, attaches tools, starts the LiveKit session, and returns `{ session, assistant }` for downstream use.
* **`utils/assistantHelpers.ts`** groups instruction helpers:
  * `hasTransferOptions` checks whether any telephony profile exposes a transfer destination.
  * `buildCompanySummary` and `buildInstructions` assemble the persona prompt based on configuration scopes.
  * `appendRagContext` fetches knowledge-base hits with `RagService.search` and pushes the results into the chat context when available.

### `src/config`
* **`configTypes.ts`** centralizes TypeScript types for agent identity, company profile, feature scopes, telephony, and safety limits. Every module imports these definitions, ensuring consistent schemas.
* **`configService.ts`** wraps a pluggable `ConfigProvider`.
  * `loadConfig` fetches the latest runtime configuration and caches it.
  * `getCachedConfig` retrieves the cached snapshot, enforcing that `loadConfig` was called first.
* **`providers/mockConfigProvider.ts`** offers `MockConfigProvider`, the default provider for local development.
  * `DEFAULT_RUNTIME_CONFIG` captures a realistic sample configuration.
  * The class constructor accepts overrides, merges them with defaults, and exposes `loadConfig` to satisfy the `ConfigProvider` interface. Loading `.env.local` via `dotenv` allows environment-specific tweaks without code changes.

### `src/services`
* **`metricsService.ts`** exports `attachMetrics`.
  * Instantiates a `metrics.UsageCollector`, subscribes to session metric events, logs granular payloads, and returns a shutdown callback that prints aggregated usage statistics.
* **`ragService.ts`** defines `RagService` with a single `search` method that posts queries to the backend RAG endpoint, validates responses, and returns ranked knowledge hits.
* **`telephonyService.ts`** encapsulates phone integrations.
  * Stores and updates telephony profiles, resolves transfer targets into SIP URIs, and lazily builds a `SipClient` from environment variables if one is not provided.
  * `transfer` waits for the active participant, requests the SIP transfer, and returns the target destination, guarding against missing configuration.

### `src/tools`
* **`index.ts`** exposes `buildTools`, assembling the callable tool registry. It always registers static utilities (`colorTool`, `autoTool`) and session tools (`change_language`, `end_call`). It conditionally adds `transferCall` when telephony profiles include at least one transfer destination.
* **`changeLanguageTool.ts`** exports `createChangeLanguageTool`, which swaps the session’s TTS engine to the requested language and voice profile.
* **`endCallTool.ts`** exports `createEndCallTool`, prompting a polite goodbye, waiting for playback, and invoking the injected `roomService.deleteRoom` helper to clean up resources.
* **`transferCallTool.ts`** exports `createTransferCallTool`, delegating to `TelephonyService.transfer` and returning user-friendly status messages.
* **`staticTools.ts`** defines two sample constant tools, `colorTool` and `autoTool`, that demonstrate simple LLM tool bindings.

### `src/utils`
* **`logging.ts`** houses `logSection`, a tiny helper that prints titled log groupings.
* **`text.ts`** exports `cleanText`, a normalization utility that trims optional strings before they feed into prompts.

## Why this structure scales

1. **Clear separation of concerns** – Each directory focuses on a single responsibility (agent orchestration, configuration, services, tools, utilities), so contributors can navigate directly to the relevant layer without cross-cutting edits.
2. **Composable runtime** – Services and tools are injected where needed, making it easy to swap providers (e.g., different RAG backends or telephony clients) while leaving agent logic untouched.
3. **Environment flexibility** – Centralized configuration providers mean production, staging, and local environments can ship different settings simply by swapping provider implementations or overrides.
4. **Testability and observability** – By isolating side-effectful code in `services/` and maintaining reusable helpers in `utils/`, the core agent workflow remains deterministic and straightforward to mock during tests.
5. **Future-proof extensibility** – Adding new tools, services, or instruction helpers means introducing files alongside existing peers, keeping the codebase discoverable as the product surface grows.
