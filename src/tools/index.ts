import { llm } from '@livekit/agents';

import type { AgentRuntimeConfig } from '../config/configTypes.js';
import type { TelephonyService } from '../services/telephonyService.js';
import { createChangeLanguageTool } from './changeLanguageTool.js';
import { createEndCallTool } from './endCallTool.js';
import { createTransferCallTool } from './transferCallTool.js';
import { autoTool, colorTool } from './staticTools.js';

type ToolRecord = Record<string, ReturnType<typeof llm.tool>>;

type ToolFactoryOptions = {
  config: AgentRuntimeConfig;
  telephonyService: TelephonyService;
};

export function buildTools({ config, telephonyService }: ToolFactoryOptions): ToolRecord {
  const tools: ToolRecord = {
    colorTool,
    autoTool,
    change_language: createChangeLanguageTool(),
    end_call: createEndCallTool(),
  };

  const hasTransferDestinations = config.telephonyProfiles.some((profile) =>
    profile.destinations.some((destination) => destination.number || destination.name || destination.department),
  );

  if (hasTransferDestinations) {
    tools.transferCall = createTransferCallTool(telephonyService);
  }

  return tools;
}
