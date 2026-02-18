// Server-side OpenClaw Gateway Client
// Faz POST para {GATEWAY_URL}/tools/invoke com Bearer token
// Unwrap do envelope { ok, result: { content, details } }

export type ContentPart = {
  type: string;
  text?: string;
  name?: string;
  arguments?: any;
};

export type GatewayEnvelope = {
  ok: boolean;
  result?: {
    content?: ContentPart[] | string;
    details?: any;
  };
  error?: string;
};

/**
 * Extrai dados úteis do envelope do gateway.
 * content pode ser string OU array de partes tipadas.
 */
export function unwrapContent(envelope: GatewayEnvelope): any {
  if (!envelope.ok) {
    throw new Error(envelope.error ?? 'Gateway call failed');
  }
  const content = envelope.result?.content;
  if (!content) return envelope.result;

  // Se for string, tenta parsear como JSON
  if (typeof content === 'string') {
    try { return JSON.parse(content); } catch { return content; }
  }

  // Se for array, extrai texto e tenta parsear
  if (Array.isArray(content)) {
    const textParts = content.filter((p) => p.type === 'text' && p.text);
    if (textParts.length === 1) {
      try { return JSON.parse(textParts[0].text!); } catch { return textParts[0].text; }
    }
    return content;
  }

  return content;
}

/**
 * Converte timestamp epoch ms para Date
 */
export function fromEpochMs(ms: number): Date {
  return new Date(ms);
}

/**
 * Formata timestamp epoch ms para string legível pt-BR
 */
export function formatEpochMs(ms: number): string {
  return new Date(ms).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

/**
 * Cliente server-side para o Gateway OpenClaw
 */
export class OpenClawClient {
  private gatewayUrl: string;
  private token: string;

  constructor() {
    this.gatewayUrl = process.env.GATEWAY_URL || '';
    this.token = process.env.GATEWAY_TOKEN || '';
    if (!this.gatewayUrl || !this.token) {
      throw new Error('GATEWAY_URL e GATEWAY_TOKEN devem estar configurados em .env.local');
    }
  }

  async invoke(tool: string, args: Record<string, any> = {}): Promise<any> {
    const url = `${this.gatewayUrl.replace(/\/$/, '')}/tools/invoke`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({ tool, args }),
    });

    if (!res.ok) {
      throw new Error(`Gateway HTTP ${res.status}: ${res.statusText}`);
    }

    const envelope: GatewayEnvelope = await res.json() as GatewayEnvelope;
    return unwrapContent(envelope);
  }

  // Atalhos para ferramentas comuns
  async sessionsList(limit = 10) {
    return this.invoke('sessions_list', { limit });
  }

  async sessionHistory(sessionKey: string, limit = 50) {
    return this.invoke('sessions_history', { sessionKey, limit });
  }

  async cronList() {
    return this.invoke('cron', { action: 'list' });
  }

  async configGet() {
    return this.invoke('gateway', { action: 'config.get' });
  }

  async configApply(raw: string) {
    return this.invoke('gateway', { action: 'config.apply', raw });
  }

  async gatewayRestart(reason?: string) {
    return this.invoke('gateway', { action: 'restart', reason });
  }

  async sessionStatus() {
    return this.invoke('session_status', {});
  }

  async webSearch(query: string) {
    return this.invoke('web_search', { query });
  }
}

export function getClient(): OpenClawClient {
  return new OpenClawClient();
}
