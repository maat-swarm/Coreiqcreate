import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const AGENT_DIR = join(process.cwd(), 'coreiq-agent');

function readDoc(filename: string): string {
  const filepath = join(AGENT_DIR, filename);
  if (!existsSync(filepath)) return '';
  return readFileSync(filepath, 'utf8');
}

export function buildSystemPrompt(): string {
  const brain = readDoc('BRAIN.md');
  const knowledge = readDoc('KNOWLEDGE.md');
  const routing = readDoc('ROUTING.md');

  return `${brain}

---

${knowledge}

---

${routing}`;
}
