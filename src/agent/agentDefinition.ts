import {
  type JobContext,
  type JobProcess,
  defineAgent,
} from '@livekit/agents';
import * as silero from '@livekit/agents-plugin-silero';

import { ConfigService } from '../config/configService.js';
import { MockConfigProvider } from '../config/providers/mockConfigProvider.js';
import { attachMetrics } from '../services/metricsService.js';
import { RagService } from '../services/ragService.js';
import { TelephonyService } from '../services/telephonyService.js';
import { createAgentSession } from './sessionFactory.js';

const LLM_MODEL: string = String(process.env.LLM_MODEL ?? 'gemini-2.5-flash-lite');
const TTS_MODEL: string = String(process.env.TTS_MODEL ?? 'sonic-2');
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const RAG_EMBED_PROVIDER = process.env.RAG_EMBED_PROVIDER || 'gemini';
const RAG_HITS_K = Number(process.env.RAG_HITS_K || '3');

type AgentUserData = {
  configService: ConfigService;
  vad: silero.VAD;
};

function getConfigService(proc: JobProcess): ConfigService {
  const userData = proc.userData as Partial<AgentUserData>;
  if (!userData.configService) {
    throw new Error('ConfigService not initialized in prewarm');
  }
  return userData.configService;
}

export const agentDefinition = defineAgent({
  prewarm: async (proc: JobProcess) => {
    console.log('🔄 Prewarming agent...');
    const provider = new MockConfigProvider();
    const configService = new ConfigService(provider);
    const vad = await silero.VAD.load();

    proc.userData.configService = configService;
    proc.userData.vad = vad;

    console.log('✅ Agent is ready!');
  },
  entry: async (ctx: JobContext) => {
    console.log('🚀 Starting agent session...');
    const configService = getConfigService(ctx.proc);
    const ragService = new RagService(BACKEND_URL, RAG_EMBED_PROVIDER, RAG_HITS_K);
    const runtimeConfig = await configService.loadConfig();
    const telephonyService = new TelephonyService(runtimeConfig.telephonyProfiles);

    const { session } = await createAgentSession({
      ctx,
      config: runtimeConfig,
      ragService,
      telephonyService,
      llmModel: LLM_MODEL,
      ttsModel: TTS_MODEL,
    });

    const metricsShutdown = attachMetrics({
      session,
      companyName: runtimeConfig.company.companyName,
      workerId: ctx.workerId,
      roomName: ctx.room?.name,
    });
    ctx.addShutdownCallback(metricsShutdown);

    await ctx.connect();

    const greetingInstructions = runtimeConfig.scopes.companyOverview
      ? `Greet the caller on behalf of ${runtimeConfig.company.companyName} and offer assistance.`
      : 'Greet the caller and offer assistance.';
    const handle = session.generateReply({ instructions: greetingInstructions });
    await handle.waitForPlayout();
  },
});

export default agentDefinition;
