import { getJobContext } from '@livekit/agents';
import * as livekitPlugin from '@livekit/agents-plugin-livekit';

import type { TelephonyProfile } from '../config/configTypes.js';

export type TransferTarget = {
  number?: string;
  name?: string;
  department?: string;
};

export class TelephonyService {
  private profiles: TelephonyProfile[];

  constructor(profiles: TelephonyProfile[]) {
    this.profiles = profiles;
  }

  updateProfiles(profiles: TelephonyProfile[]) {
    this.profiles = profiles;
  }

  getProfiles() {
    return this.profiles;
  }

  private resolveDestination(target: TransferTarget): string | null {
    for (const profile of this.profiles) {
      for (const destination of profile.destinations) {
        const numberMatch = target.number && destination.number === target.number;
        const nameMatch = target.name && destination.name?.toLowerCase() === target.name.toLowerCase();
        const deptMatch =
          target.department && destination.department?.toLowerCase() === target.department.toLowerCase();
        if (numberMatch || nameMatch || deptMatch) {
          if (destination.number) {
            return `tel:${destination.number}`;
          }
        }
      }
    }

    if (target.number) {
      return `tel:${target.number}`;
    }

    const defaultProfile = this.profiles[0];
    const firstDestination = defaultProfile?.destinations.find((d) => d.number);
    return firstDestination?.number ? `tel:${firstDestination.number}` : null;
  }

  async transfer(target: TransferTarget) {
    const destination = this.resolveDestination(target);
    if (!destination) {
      throw new Error('No valid transfer destination found');
    }

    const sipClient = new livekitPlugin.SipClient(
      process.env.LIVEKIT_URL,
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
    );

    const jobCtx = getJobContext();
    const participant = await jobCtx.waitForParticipant();

    await sipClient.transferSipParticipant(jobCtx.room.name, participant.identity, destination, {
      playDialtone: true,
    });

    return destination;
  }
}
