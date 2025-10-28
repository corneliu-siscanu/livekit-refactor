import { voice } from '@livekit/agents';
import * as cartesia from '@livekit/agents-plugin-cartesia';
import * as deepgram from '@livekit/agents-plugin-deepgram';
import * as google from '@livekit/agents-plugin-google';
import * as livekitPlugin from '@livekit/agents-plugin-livekit';
import type * as silero from '@livekit/agents-plugin-silero';

import type { AgentRuntimeConfig } from '../config/configTypes.js';
import type { RagService } from '../services/ragService.js';
import type { TelephonyService } from '../services/telephonyService.js';
import { buildTools } from '../tools/index.js';
import { Assistant } from './assistant.js';

type SessionFactoryOptions = {
  ctx: import('@livekit/agents').JobContext;
  config: AgentRuntimeConfig;
  ragService: RagService;
  telephonyService: TelephonyService;
  llmModel: string;
  ttsModel: string;
};

export async function createAgentSession({
  ctx,
  config,
  ragService,
  telephonyService,
  llmModel,
  ttsModel,
}: SessionFactoryOptions) {
  const vad = ctx.proc.userData.vad as silero.VAD;
  const session = new voice.AgentSession({
    stt: new deepgram.STT({
      model: 'nova-3',
      language: config.identity.defaultLanguage || 'en',
    }),
    llm: new google.LLM({
      model: llmModel,
      temperature: 0.6,
      maxOutputTokens: 512,
    }),
    tts: new cartesia.TTS({
      model: ttsModel,
      voice: config.identity.voice,
      language: config.identity.defaultLanguage || 'en',
    }),
    turnDetection: new livekitPlugin.turnDetector.MultilingualModel(),
    vad,
  });

  telephonyService.updateProfiles(config.telephonyProfiles);
  const assistant = new Assistant(config, ragService);
  assistant.setTools(buildTools({ config, telephonyService }));

  await session.start({ agent: assistant, room: ctx.room });

  return { session, assistant };
}
