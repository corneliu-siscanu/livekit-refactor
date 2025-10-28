import dotenv from 'dotenv';

import type { AgentRuntimeConfig } from '../configTypes.js';
import type { ConfigProvider } from '../configService.js';

dotenv.config({ path: '.env.local' });

type MockConfigOverrides = Partial<AgentRuntimeConfig>;

const DEFAULT_RUNTIME_CONFIG: AgentRuntimeConfig = {
  identity: {
    agentName: process.env.AGENT_PERSONA_NAME || 'Receptionist',
    defaultLanguage: process.env.LANGUAGE || 'en',
    voice: process.env.TTS_VOICE || '9626c31c-bec5-4cca-baa8-f8ba9e84c8bc',
  },
  company: {
    companyName: process.env.COMPANY_NAME || 'The Company',
    companyDescription:
      process.env.COMPANY_DESCRIPTION ||
      'We provide outstanding customer support. If you need specific help, let me know and I will route you to the right team.',
    companyServices: ['Customer Support', 'Consulting', 'Onboarding'],
    locations: [
      {
        name: 'Headquarters',
        address: '123 Market Street, Suite 500, San Francisco, CA',
        phone: '+1 202-555-0100',
      },
      {
        name: 'European Office',
        address: '45 High Street, London, UK',
      },
    ],
    businessHours: {
      monday: '09:00-18:00',
      tuesday: '09:00-18:00',
      wednesday: '09:00-18:00',
      thursday: '09:00-18:00',
      friday: '09:00-17:00',
      saturday: 'Closed',
      sunday: 'Closed',
    },
    holidayDates: ['2025-01-01', '2025-12-25'],
  },
  scopes: {
    companyOverview: true,
    services: true,
    locations: true,
    businessHours: true,
    knowledgeBase: true,
    faq: true,
  },
  telephonyProfiles: [
    {
      label: 'Main Reception',
      e164: '+12025550100',
      transferPreference: 'announced',
      transferMethods: ['sip', 'pstn'],
      destinations: [
        { number: '365', name: 'Mark Spencer', department: 'Sales', description: 'Direct sales representative' },
        { number: '312', name: 'Luke Harris', department: 'Support', description: 'Tier 2 support specialist' },
        { department: 'Billing', description: 'Billing escalation queue' },
      ],
    },
    {
      label: 'After Hours',
      e164: '+12025550999',
      transferPreference: 'blind',
      transferMethods: ['sip'],
      destinations: [
        { department: 'On Call Engineer', description: 'Escalate urgent incidents' },
      ],
    },
  ],
  safety: {
    maxTurnsTotal: 30,
    maxConsecutiveFailures: 3,
    silenceTimeoutMs: 12000,
  },
};

export class MockConfigProvider implements ConfigProvider {
  constructor(private readonly overrides: MockConfigOverrides = {}) {}

  async loadConfig(): Promise<AgentRuntimeConfig> {
    return {
      ...DEFAULT_RUNTIME_CONFIG,
      ...this.overrides,
      identity: {
        ...DEFAULT_RUNTIME_CONFIG.identity,
        ...this.overrides.identity,
      },
      company: {
        ...DEFAULT_RUNTIME_CONFIG.company,
        ...this.overrides.company,
        companyServices: this.overrides.company?.companyServices ?? DEFAULT_RUNTIME_CONFIG.company.companyServices,
        locations: this.overrides.company?.locations ?? DEFAULT_RUNTIME_CONFIG.company.locations,
        businessHours: this.overrides.company?.businessHours ?? DEFAULT_RUNTIME_CONFIG.company.businessHours,
        holidayDates: this.overrides.company?.holidayDates ?? DEFAULT_RUNTIME_CONFIG.company.holidayDates,
      },
      scopes: {
        ...DEFAULT_RUNTIME_CONFIG.scopes,
        ...this.overrides.scopes,
      },
      telephonyProfiles: this.overrides.telephonyProfiles ?? DEFAULT_RUNTIME_CONFIG.telephonyProfiles,
      safety: {
        ...DEFAULT_RUNTIME_CONFIG.safety,
        ...this.overrides.safety,
      },
    };
  }
}
