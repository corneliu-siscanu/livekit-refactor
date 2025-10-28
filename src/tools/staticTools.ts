import { llm } from '@livekit/agents';
import { z } from 'zod';

export const colorTool = llm.tool({
  description: `Return the agent's favorite color when asked.`,
  parameters: z.object({
    query: z.string().describe('The question from the user'),
  }),
  execute: async ({ query }) => {
    console.log(`\n🔧 Tool executing: colorTool("${query}")`);
    return 'Replies simply with the color green.';
  },
});

export const autoTool = llm.tool({
  description: `Return the agent's favorite car when asked.`,
  parameters: z.object({
    query: z.string().describe('The question from the user'),
  }),
  execute: async ({ query }) => {
    console.log(`\n🔧 Tool executing: autoTool("${query}")`);
    return 'Replies simply with the car Mercedes.';
  },
});
