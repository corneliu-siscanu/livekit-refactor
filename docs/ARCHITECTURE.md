# LiveKit Agent Architecture

This document outlines the production-ready file structure and module responsibilities for the LiveKit voice agent. Each directory under `src/` is organized by responsibility, keeping runtime configuration, tooling, services, and agent lifecycle management separated for clarity and testability.

```
src/
  index.ts                  # Entry point bootstrapping the worker CLI
  agent/
    agentDefinition.ts      # Exposes the configured LiveKit agent definition
    assistant.ts            # Agent persona instructions & per-turn behaviors
    sessionFactory.ts       # Builds AgentSession instances based on config
  config/
    configService.ts        # Runtime configuration loader/cached accessor
    configTypes.ts          # Shared configuration type definitions
    providers/
      mockConfigProvider.ts # Mock provider simulating DB-backed profiles
  services/
    ragService.ts           # Knowledge base search integration (RAG)
    metricsService.ts       # Usage metrics helpers
    telephonyService.ts     # SIP transfer helpers + validation
  tools/
    index.ts                # Tool registry that activates based on config
    transferCallTool.ts     # Human transfer tool (enabled per telephony config)
    endCallTool.ts          # Gracefully ends a call + cleans the room
    changeLanguageTool.ts   # Switches session voices/language mid-call
    staticTools.ts          # Example playful tools (color, auto)
  utils/
    logging.ts              # Shared logging helpers
    text.ts                 # Text sanitizers & helpers
```

Key principles:

1. **Per-session configurability** – `ConfigService` fetches fresh runtime settings for each new call so the worker reflects database changes without restarts.
2. **Feature gating** – Tool registration and behavior (knowledge base, telephony) respond to configuration flags and scopes.
3. **Production-ready mocks** – Mock providers simulate database-backed profiles that will power the real system.
4. **Separation of concerns** – LLM instructions, session plumbing, tooling, and side effects (metrics, telephony, RAG) live in isolated modules to aid future maintenance and testing.

This structure keeps the public entry point (`src/index.ts`) small while allowing each subsystem to evolve independently.
