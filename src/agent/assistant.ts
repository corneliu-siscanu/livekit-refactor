import { llm, voice } from '@livekit/agents';

import type { AgentRuntimeConfig } from '../config/configTypes.js';
import type { RagService } from '../services/ragService.js';
import { appendRagContext, buildInstructions } from './utils/assistantHelpers.js';

export class Assistant extends voice.Agent {
  constructor(private readonly config: AgentRuntimeConfig, private readonly ragService: RagService) {
    super({
      instructions: buildInstructions(config),
      tools: {},
    });
  }

  setTools(tools: Record<string, ReturnType<typeof llm.tool>>) {
    this.tools = tools;
  }

  override async onUserTurnCompleted(turnCtx: llm.ChatContext, newMessage: llm.ChatMessage): Promise<void> {
    await appendRagContext(this.config, this.ragService, turnCtx, newMessage);
  }
}
