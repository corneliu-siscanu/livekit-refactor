import type { AgentRuntimeConfig } from './configTypes.js';

export interface ConfigProvider {
  loadConfig(): Promise<AgentRuntimeConfig>;
}

export class ConfigService {
  private cachedConfig: AgentRuntimeConfig | null = null;

  constructor(private readonly provider: ConfigProvider) {}

  /**
   * Fetches the latest runtime configuration from the provider.
   * Call this at the start of each session to capture fresh settings.
   */
  async loadConfig(): Promise<AgentRuntimeConfig> {
    this.cachedConfig = await this.provider.loadConfig();
    return this.cachedConfig;
  }

  getCachedConfig(): AgentRuntimeConfig {
    if (!this.cachedConfig) {
      throw new Error('ConfigService has not loaded a configuration yet');
    }

    return this.cachedConfig;
  }
}
