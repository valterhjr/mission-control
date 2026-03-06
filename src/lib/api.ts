// Client-side helper: chama /api/tools/invoke (server-side proxy)
export async function invokeTool(tool: string, args: Record<string, unknown> = {}): Promise<unknown> {
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

  // Real logs from OpenClaw
  getLogs: async (lines = 50, filter = '') => {
    const params = new URLSearchParams({ lines: lines.toString() });
    if (filter) params.append('filter', filter);
    const res = await fetch(`/api/logs?${params}`);
    const data = await res.json();
    return data.logs || [];
  },

  // OpenClaw config - reads agents and models from openclaw.json
  getOpenClawConfig: async () => {
    const res = await fetch('/api/config');
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Failed to load config');
    return data;
  },

  // Models - fetched from OpenClaw config
  getModels: async (): Promise<string[]> => {
    try {
      const config = await api.getOpenClawConfig();
      if (Array.isArray(config.models) && config.models.length > 0) {
        return config.models;
      }
    } catch { /* fall through */ }
    return ['openrouter/auto'];
  },
};
