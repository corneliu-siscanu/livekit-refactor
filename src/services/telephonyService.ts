import { getJobContext } from '@livekit/agents';
import { SipClient } from 'livekit-server-sdk';

import type { TelephonyProfile } from '../config/configTypes.js';

export type TransferTarget = {
  number?: string;
  name?: string;
  department?: string;
};

export class TelephonyService {
  private profiles: TelephonyProfile[];
  private readonly sipClient?: SipClient;

  constructor(profiles: TelephonyProfile[], sipClient?: SipClient) {
    this.profiles = profiles;
    this.sipClient = sipClient ?? TelephonyService.createSipClientFromEnv();
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

  private static createSipClientFromEnv(): SipClient | undefined {
    const url = process.env.LIVEKIT_URL;
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!url || !apiKey || !apiSecret) {
      console.warn(
        '⚠️  TelephonyService: LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET are not fully defined. Provide them or supply a custom SipClient.',
      );
      return undefined;
    }

    return new SipClient(url, apiKey, apiSecret);
  }

  async transfer(target: TransferTarget) {
    if (!this.sipClient) {
      throw new Error('TelephonyService has no SIP client configured. Provide credentials or inject a custom client.');
    }

    const destination = this.resolveDestination(target);
    if (!destination) {
      throw new Error('No valid transfer destination found');
    }

    const jobCtx = getJobContext();
    const participant = await jobCtx.waitForParticipant();

    await this.sipClient.transferSipParticipant(jobCtx.room.name, participant.identity, destination, {
      playDialtone: true,
    });

    return destination;
  }
}
