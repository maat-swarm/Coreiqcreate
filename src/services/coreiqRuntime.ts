import { SolutionBlueprint } from '../types';

export interface CoreIQAnalysisResponse {
  intent: 'website' | 'automation' | 'app' | 'agent' | 'voice' | 'tools' | 'custom';
  title: string;
  summary: string;
  recommendedBlueprint: SolutionBlueprint;
  suggestedCapabilities: string[];
  suggestedNextSteps: string[];
  interactiveQuestions: string[];
  responseMessage: string;
}

export interface ICoreIQRuntime {
  analyzeIntent(prompt: string, history?: { role: string; content: string }[]): Promise<CoreIQAnalysisResponse>;
  processQuery(prompt: string, config?: any): Promise<{ assistantMessage: string; blueprint?: SolutionBlueprint }>;
}

const API_BASE = import.meta.env.VITE_API_URL || '';

function parseResponse(text: string, prompt: string): CoreIQAnalysisResponse {
  const lower = prompt.toLowerCase();
  let intent: CoreIQAnalysisResponse['intent'] = 'custom';
  if (lower.includes('website') || lower.includes('web') || lower.includes('landing')) intent = 'website';
  else if (lower.includes('automate') || lower.includes('workflow')) intent = 'automation';
  else if (lower.includes('agent') || lower.includes('support') || lower.includes('chat')) intent = 'agent';
  else if (lower.includes('app') || lower.includes('software') || lower.includes('mobile')) intent = 'app';
  else if (lower.includes('voice') || lower.includes('call') || lower.includes('phone')) intent = 'voice';

  const lines = text.split('\n').filter(l => l.trim());
  const title = lines[0]?.replace(/^#+\s*/, '').slice(0, 80) || 'CoreIQ Analysis';
  const summary = lines.slice(1, 4).join(' ').slice(0, 400) || text.slice(0, 400);

  return {
    intent,
    title,
    summary,
    responseMessage: text,
    recommendedBlueprint: {
      title: 'CoreIQ Recommended Architecture',
      description: summary,
      suggestedStack: ['React', 'TypeScript', 'Node.js', 'Supabase'],
      capabilities: ['AI Integration', 'Automation', 'Analytics', 'API Layer'],
      estimatedTimeline: '2 - 5 Days',
      recommendedType: intent === 'custom' ? 'custom' : intent as any,
    },
    suggestedCapabilities: ['AI Agents', 'Automation', 'Apps'],
    suggestedNextSteps: [
      'Define your primary objective and target users',
      'Review the recommended architecture above',
      'Connect with CoreIQ to begin building',
    ],
    interactiveQuestions: [
      'What is the single most important outcome you need?',
      'What is your timeline and budget range?',
    ],
  };
}

class RemoteCoreIQRuntime implements ICoreIQRuntime {
  private history: { role: string; content: string }[] = [];

  async analyzeIntent(prompt: string): Promise<CoreIQAnalysisResponse> {
    try {
      const res = await fetch(`${API_BASE}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt, history: this.history }),
      });

      if (!res.ok) {
        let errMessage = `API error ${res.status}`;
        try {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const errData = await res.json();
            errMessage = errData.error || errData.message || errMessage;
          }
        } catch {
          // ignore parsing error on non-ok responses
        }
        throw new Error(errMessage);
      }

      let assistantMessage = '';
      const contentType = res.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        const data = await res.json();
        assistantMessage = data.assistantMessage || '';
      } else {
        const rawText = await res.text();
        if (rawText && !rawText.trim().startsWith('<')) {
          assistantMessage = rawText;
        } else {
          assistantMessage = `CoreIQ received your request: "${prompt}". We are preparing the architecture recommendations for you.`;
        }
      }

  
    // ##BRIEF## handler — parse handoff block, create task, notify Desmond
    const briefMatch = assistantMessage.match(/##BRIEF##([\s\S]*?)##END##/);
    if (briefMatch) {
      try {
        const brief = JSON.parse(briefMatch[1].trim());
        // Strip the block from the client-facing message
        assistantMessage = assistantMessage.replace(/##BRIEF##[\s\S]*?##END##/, '').trim();

        // 1. Create task in CoreIQ Command
        fetch(`${API_BASE}/api/v1/tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'ciq_live_c1a94e231553048a8dc3d7653a9315e73ab18c90b757823e'
          },
          body: JSON.stringify({
            title: `New Lead: ${brief.client_name || 'Unknown'} — ${brief.company || 'Unknown Company'}`,
            client_name: brief.client_name || '',
            client_contact: brief.contact || '',
            client_message: JSON.stringify(brief),
            intent_type: brief.priority || 'P2'
          })
        }).catch(e => console.error('Task creation failed:', e));

        // 2. Notify Desmond via NTFY
        fetch('https://ntfy.sh/maat-atlas-wake', {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: `CoreIQ Lead: ${brief.client_name || 'Unknown'} | ${brief.company || ''} | ${brief.priority} | ${brief.problem?.slice(0, 80) || ''}`
        }).catch(e => console.error('NTFY failed:', e));

      } catch (e) {
        console.error('Brief parse error:', e);
      }
    }

    this.history.push({ role: 'user', content: prompt });
      this.history.push({ role: 'assistant', content: assistantMessage });
      if (this.history.length > 12) this.history = this.history.slice(-12);

      return parseResponse(assistantMessage, prompt);

    } catch (err) {
      console.error('CoreIQ runtime error:', err);
      // Graceful fallback message
      return {
        intent: 'custom',
        title: 'CoreIQ is warming up',
        summary: 'The AI engine is initialising. This can take up to 30 seconds on first load as the server wakes. Please try again in a moment.',
        responseMessage: 'Server is starting up. Please retry in 30 seconds.',
        recommendedBlueprint: {
          title: 'Connecting to CoreIQ Engine',
          description: 'The CoreIQ AI backend is starting. Free tier servers sleep after inactivity.',
          suggestedStack: [],
          capabilities: [],
          estimatedTimeline: 'Ready shortly',
          recommendedType: 'custom',
        },
        suggestedCapabilities: [],
        suggestedNextSteps: ['Wait 30 seconds and try again'],
        interactiveQuestions: [],
      };
    }
  }

  async processQuery(prompt: string, _config?: any): Promise<{ assistantMessage: string; blueprint?: SolutionBlueprint }> {
    const result = await this.analyzeIntent(prompt);
    return {
      assistantMessage: result.responseMessage,
      blueprint: result.recommendedBlueprint,
    };
  }
}

export const coreIQRuntime: ICoreIQRuntime = new RemoteCoreIQRuntime();
