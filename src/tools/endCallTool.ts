import { llm } from '@livekit/agents';
import { z } from 'zod';

import type { voice } from '@livekit/agents';

import { getJobContext } from '@livekit/agents';

interface SessionData {
  roomService: {
    deleteRoom(roomName: string): Promise<void>;
  };
}

export function createEndCallTool() {
  return llm.tool({
    description:
      'End the phone call when the conversation has naturally concluded. Use this when the user says goodbye, indicates they are done, or the conversation has reached its natural end.',
    parameters: z.object({
      reason: z.string().describe('Brief reason why the call is ending (e.g., "User said goodbye", "Task completed")'),
    }),
    execute: async ({ reason }, { ctx }) => {
      console.log(`Ending call: ${reason}`);
      const jobCtx = getJobContext();
      const room = jobCtx.room;
      const sessionData = ctx.userData as SessionData;
      console.log('Call details:', {
        roomName: room.name,
        participantCount: room.remoteParticipants.size,
        reason,
      });

      ctx.session.generateReply({
        instructions: 'Say goodbye to the user and end the call.',
      });

      await ctx.waitForPlayout();
      try {
        await sessionData.roomService.deleteRoom(room.name);
        console.log(`Room ${room.name} deleted successfully.`);
      } catch (error) {
        console.error(`Failed to delete room ${room.name}:`, error);
        await room.disconnect();
      }
      return {
        success: true,
        reason,
        message: 'Call ended successfully',
      };
    },
  });
}
