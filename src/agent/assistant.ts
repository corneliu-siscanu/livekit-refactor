import { llm, voice } from '@livekit/agents';

import type { AgentRuntimeConfig } from '../config/configTypes.js';
import type { RagService } from '../services/ragService.js';
import { cleanText } from '../utils/text.js';

function hasTransferOptions(config: AgentRuntimeConfig): boolean {
  return config.telephonyProfiles.some((profile) =>
    profile.destinations.some((destination) => destination.number || destination.name || destination.department),
  );
}

function buildCompanySummary(config: AgentRuntimeConfig): string {
  const { scopes, company, identity } = config;
  const details: string[] = [];

  const agentName = cleanText(identity.agentName) || 'the agent';
  details.push(`You are ${agentName}.`);

  if (scopes.companyOverview) {
    const companyName = cleanText(company.companyName);
    const description = cleanText(company.companyDescription);
    if (companyName) {
      details.push(`You represent ${companyName}.`);
    }
    if (description) {
      details.push(description);
    }
  }

  if (scopes.services && company.companyServices.length) {
    details.push(`Services: ${company.companyServices.join(', ')}.`);
  }

  if (scopes.locations && company.locations.length) {
    const locationSummaries = company.locations
      .map((location) => {
        const name = cleanText(location.name);
        const address = cleanText(location.address);
        const phone = cleanText(location.phone);
        const parts = [name, address, phone].filter(Boolean);
        return parts.join(' — ');
      })
      .filter(Boolean);

    if (locationSummaries.length) {
      details.push(`Locations: ${locationSummaries.join(' | ')}.`);
    }
  }

  if (scopes.businessHours) {
    const hoursEntries = Object.entries(company.businessHours)
      .map(([day, schedule]) => `${day}: ${schedule}`)
      .filter(Boolean);

    if (hoursEntries.length) {
      details.push(`Business hours: ${hoursEntries.join(' | ')}.`);
    }

    if (company.holidayDates.length) {
      details.push(`Observed holidays: ${company.holidayDates.join(', ')}.`);
    }
  }

  return details.join(' ');
}

function buildInstructions(config: AgentRuntimeConfig): string {
  const instructions: string[] = [
    "Follow the caller's requests with professionalism and stay within company policy.",
    'Use tools only when necessary and always summarize findings back to the caller.',
    buildCompanySummary(config),
  ];

  if (!config.scopes.knowledgeBase) {
    instructions.push('Knowledge base access is currently disabled. Rely on provided settings and escalate when needed.');
  } else {
    instructions.push('After each caller message you may receive relevant knowledge base context—review it and incorporate helpful details.');
  }

  if (!hasTransferOptions(config)) {
    instructions.push('Call transfers are unavailable. Offer to take a message instead.');
  } else {
    instructions.push('You can transfer callers to humans when appropriate.');
  }

  return instructions.filter((line) => line && line.trim()).join('\n');
}

export class Assistant extends voice.Agent {
  constructor(private readonly config: AgentRuntimeConfig, private readonly ragService: RagService) {
    super({
      instructions: buildInstructions(config),
      tools: {},
    });
  }

  setTools(tools: Record<string, ReturnType<typeof llm.tool>>) {
    this.tools = tools;
  }

  override async onUserTurnCompleted(turnCtx: llm.ChatContext, newMessage: llm.ChatMessage): Promise<void> {
    if (!this.config.scopes.knowledgeBase) {
      return;
    }

    const query = newMessage.textContent || '';
    if (!query.trim()) {
      return;
    }

    try {
      const { hits } = await this.ragService.search(query);
      if (hits.length === 0) {
        return;
      }

      const ragContent = hits.map((h) => h.text.trim()).filter(Boolean).join('\n\n');
      if (!ragContent) {
        return;
      }

      turnCtx.addMessage({
        role: 'assistant',
        content: `Additional information from the knowledge base. If irrelevant, ignore this. Otherwise use it as context: ${ragContent}`,
      });
    } catch (error) {
      console.error('❌ RAG lookup error in onUserTurnCompleted:', error);
    }
  }
}
