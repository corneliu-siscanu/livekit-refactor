import { WorkerOptions, cli } from '@livekit/agents';
import { fileURLToPath } from 'node:url';

cli.runApp(
  new WorkerOptions({
    agent: fileURLToPath(new URL('./agent/agentDefinition.js', import.meta.url)),
    agentName: 'sic-agent',
  }),
);
