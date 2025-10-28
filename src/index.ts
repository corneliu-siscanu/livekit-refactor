import { WorkerOptions, cli } from '@livekit/agents';
import dotenv from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ENV_FILES = ['.env.local', '.env'];

for (const envFile of ENV_FILES) {
  const envPath = resolve(process.cwd(), envFile);
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

cli.runApp(
  new WorkerOptions({
    agent: fileURLToPath(new URL('./agent/agentDefinition.js', import.meta.url)),
    agentName: 'sic-agent',
  }),
);
