// Client-side helper: chama /api/tools/invoke (server-side proxy)
export async function invokeTool(tool: string, args: Record<string, any> = {}): Promise<any> {
  const res = await fetch('/api/tools/invoke', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool, args }),
  });
  
  const data = await res.json();
  
  if (!data.ok) {
    throw new Error(data.details || 'Erro na API');
  }

  // Unwrap: content pode ser string JSON ou array de parts
  const result = data.result;
  if (!result) return result;
  
  const content = result.content;
  if (!content) return result;

  // Handle array of parts
  if (Array.isArray(content)) {
    for (const part of content) {
      if (part?.type === 'text' && part?.text) {
        try {
          return JSON.parse(part.text);
        } catch {
          return part.text;
        }
      }
    }
    return content;
  }

  // Handle string
  if (typeof content === 'string') {
    try { return JSON.parse(content); } catch { return content; }
  }

  return content;
}

export const api = {
  invokeTool,
  getSessions: (limit = 20) => invokeTool('sessions_list', { limit }),
  getSessionHistory: (sessionKey: string, limit = 50) =>
    invokeTool('sessions_history', { sessionKey, limit }),
  getCronJobs: () => invokeTool('cron', { action: 'list' }),
  getConfig: () => invokeTool('gateway', { action: 'config.get' }),
  restartGateway: (reason?: string) =>
    invokeTool('gateway', { action: 'restart', reason }),
  getSessionStatus: () => invokeTool('session_status', {}),
  
  // Models - returns list of available models from config
  getModels: async (): Promise<string[]> => {
    // These are loaded from the OpenClaw config
    return [
      'openrouter/auto',
      'openrouter/minimax/minimax-m2.5',
      'openrouter/moonshotai/kimi-k2.5',
      'modal/zai-org/GLM-5-FP8',
      'openrouter/openai/gpt-5-nano',
      'openrouter/openai/gpt-4o-mini',
      'openrouter/stepfun/step-3.5-flash:free',
      'openrouter/arcee-ai/trinity-large-preview:free',
      'openrouter/google/gemini-2.5-flash-lite',
    ];
  },
};
