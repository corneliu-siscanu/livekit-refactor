import { llm } from '@livekit/agents';
import { z } from 'zod';

import type { TelephonyService, TransferTarget } from '../services/telephonyService.js';

export function createTransferCallTool(telephonyService: TelephonyService) {
  return llm.tool({
    description: `Transfer the call to a human agent. Use this when the user requests to speak to a human.`,
    parameters: z.object({
      number: z.string().optional().describe('The number to transfer the call to (e.g. "365", "312").'),
      name: z.string().optional().describe('The name of the person to transfer the call to (e.g. "Mark", "Luke").'),
      department: z
        .string()
        .optional()
        .describe('The department to transfer the call to (e.g. "sales", "support").'),
    }),
    execute: async ({ number, name, department }, { ctx }) => {
      const target: TransferTarget = { number, name, department };
      console.log('🔁 Attempting transfer with target:', target);
      try {
        const destination = await telephonyService.transfer(target);
        console.log(`Transferring call to ${destination}`);
        return 'Transferring you now. Goodbye!';
      } catch (error) {
        console.error('Transfer failed:', error);
        return 'I was unable to transfer your call. Let me try to assist you instead.';
      }
    },
  });
}
