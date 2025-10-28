import { metrics, voice } from '@livekit/agents';

type SessionUsageSummary = ReturnType<metrics.UsageCollector['getSummary']>;

type MetricsSetupOptions = {
  session: voice.AgentSession;
  companyName: string;
  workerId: string;
  roomName?: string;
};

export function attachMetrics({ session, companyName, workerId, roomName }: MetricsSetupOptions) {
  const usageCollector = new metrics.UsageCollector();
  const detailedMetrics: any[] = [];

  session.on(voice.AgentSessionEventTypes.MetricsCollected, (ev) => {
    metrics.logMetrics(ev.metrics);
    usageCollector.collect(ev.metrics);
    detailedMetrics.push(ev.metrics);
  });

  return async () => {
    const summary: SessionUsageSummary = usageCollector.getSummary();
    console.log(`📊 Usage: ${JSON.stringify(summary)}`);
    const timings = detailedMetrics.map((m) => {
      const { type, duration, ttft, ttfb, tokens_per_second, end_of_utterance_delay } = m;
      return {
        type,
        duration,
        ttft,
        ttfb,
        tokens_per_second,
        end_of_utterance_delay,
      };
    });
    console.log('⏱️ Detailed timings:', timings);
  };
}
