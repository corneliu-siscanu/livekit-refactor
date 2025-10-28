import type { z } from 'zod';

export type ISO639_1 = string;
export type ISODateString = string;

export type AgentIdentity = {
  agentName: string;
  defaultLanguage: ISO639_1;
  voice: string;
};

export type CompanyProfile = {
  companyName: string;
  companyDescription: string;
  companyServices: string[];
  locations: Array<{
    name: string;
    address: string;
    phone?: string;
  }>;
  businessHours: Record<string, string>;
  holidayDates: ISODateString[];
};

export type KnowledgeScopeFlags = {
  companyOverview: boolean;
  services: boolean;
  locations: boolean;
  businessHours: boolean;
  knowledgeBase: boolean;
  faq: boolean;
};

export type TelephonyTransferPreference = 'announced' | 'blind';
export type TelephonyMethod = 'sip' | 'pstn' | 'voip' | string;

export type TelephonyProfile = {
  label: string;
  e164: string;
  transferPreference: TelephonyTransferPreference;
  transferMethods: TelephonyMethod[];
  destinations: Array<{
    number?: string;
    name?: string;
    department?: string;
    description?: string;
  }>;
};

export type SafetyLimits = {
  maxTurnsTotal: number;
  maxConsecutiveFailures: number;
  silenceTimeoutMs: number;
};

export type AgentRuntimeConfig = {
  identity: AgentIdentity;
  company: CompanyProfile;
  scopes: KnowledgeScopeFlags;
  telephonyProfiles: TelephonyProfile[];
  safety: SafetyLimits;
};

export type ConfigSchema<T extends z.ZodTypeAny> = z.infer<T>;
