import { llm } from '@livekit/agents';
import * as cartesia from '@livekit/agents-plugin-cartesia';
import { z } from 'zod';

const languageConfig: Record<string, { code: string; voice: string }> = {
  english: { code: 'en', voice: '9626c31c-bec5-4cca-baa8-f8ba9e84c8bc' },
  italian: { code: 'it', voice: 'b7bcd33d-57c7-4e2b-8131-6ea63d63cb60' },
  spanish: { code: 'es', voice: 'c6f8d5b0-7d41-409f-92be-61f7a707dc4b' },
};

export function createChangeLanguageTool() {
  return llm.tool({
    description: `Change the language you are speaking in to the specified language. Use this when the user requests to speak in a different language, e.g., "Can we speak in Italian?". After this, use the new language for every interaction.`,
    parameters: z.object({
      language: z.string().describe('The target language to switch to (e.g., "Italian", "English")'),
    }),
    execute: async ({ language }, { ctx }) => {
      console.log(`Changing language to: ${language}`);
      const config = languageConfig[language.toLowerCase()] ?? languageConfig.english;
      ctx.session.tts = new cartesia.TTS({
        model: 'sonic-2',
        voice: config.voice,
        language: config.code,
      });
      return `Switching to ${language} now.`;
    },
  });
}
