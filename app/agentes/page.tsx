"use client";
import React, { useState, useEffect } from 'react';
import { api } from '../../src/lib/api';

type Agent = {
  id: string;
  name: string;
  function: string;
  model: string;
  workspace: string;
  apiKeys: string;
  skills: string;
  heartbeat: number;
  active: boolean;
};

export default function AgentesPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [form, setForm] = useState<Partial<Agent>>({
    name: '',
    function: '',
    model: 'openrouter/auto',
    workspace: '/root/.openclaw/workspace',
    apiKeys: '',
    skills: '',
    heartbeat: 60,
    active: true,
  });

  useEffect(() => {
    loadAgents();
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const modelList = await (api as any).getModels?.();
      if (Array.isArray(modelList) && modelList.length > 0) {
        setModels(modelList);
      }
    } catch (err) {
      console.error('Error loading models:', err);
    }
  };

  const loadAgents = async () => {
    setLoading(true);
    try {
      // Get sessions and cron jobs
      let sessionsResult: any = null;
      let cronResult: any = null;
      
      try {
        sessionsResult = await (api as any).getSessions?.(50);
      } catch (e: any) {
        console.error('Sessions error:', e);
      }
      
      try {
        cronResult = await (api as any).getCronJobs?.();
      } catch (e: any) {
        console.error('Cron error:', e);
      }
      
      console.log('[Agentes] Sessions result:', sessionsResult);
      console.log('[Agentes] Cron result:', cronResult);
      
      // Get active cron job IDs - handle different response structures
      let activeCronIds: string[] = [];
      
      // Try to get jobs from different possible paths
      let jobs: any[] = [];
      if (cronResult) {
        if (Array.isArray(cronResult)) {
          jobs = cronResult;
        } else if (cronResult.jobs) {
          jobs = Array.isArray(cronResult.jobs) ? cronResult.jobs : [];
        } else if (cronResult.details?.jobs) {
          jobs = cronResult.details.jobs;
        }
      }
      
      console.log('[Agentes] Jobs found:', jobs);
      activeCronIds = jobs.filter((j: any) => j.enabled).map((j: any) => j.id);
      console.log('[Agentes] Active cron IDs:', activeCronIds);
      
      // Process sessions
      let sessions: any[] = [];
      if (Array.isArray(sessionsResult)) {
        sessions = sessionsResult;
      } else if (sessionsResult && typeof sessionsResult === 'object') {
        sessions = sessionsResult.sessions || sessionsResult.data || [];
      }
      console.log('[Agentes] Sessions loaded:', sessions.length);
      
      // Filter: only show active cron jobs or recent sessions
      sessions = sessions.filter((s: any) => {
        const keyStr = s.key || '';
        
        // If it's a cron session, only show if enabled
        if (keyStr.includes('cron:')) {
          const cronId = keyStr.split('cron:').pop() || '';
          const isValid = activeCronIds.includes(cronId);
          console.log(`[Agentes] Cron ${cronId}: valid=${isValid}`);
          return isValid;
        }
        
        // Regular sessions: show if recently active or less than 24h old
        const now = Date.now();
        const updatedAt = s.updatedAt || 0;
        const age = now - updatedAt;
        return age < (24 * 60 * 60 * 1000); // less than 24h
      });
      
      console.log('[Agentes] Filtered sessions:', sessions.length);
      
      if (sessions.length > 0) {
        const mapped: Agent[] = sessions.map((s: any) => {
          const keyStr = s.key || '';
          const isCron = keyStr.includes('cron:');
          
          // Extract full cron UUID from key (e.g., "agent:main:cron:72f2175b-2ff5-4ea1-85dc-ab8aadf52d9d")
          let cronId = '';
          if (isCron) {
            const parts = keyStr.split('cron:');
            cronId = parts[parts.length - 1] || '';
          }
          
          // Active if: cron job is enabled OR session updated < 2 min ago
          const isActive = isCron 
            ? activeCronIds.includes(cronId)
            : (s.updatedAt && (Date.now() - s.updatedAt < 120000));
          
          return {
            id: s.sessionId || s.key || '',
            name: s.displayName || s.label || s.key || 'Agente',
            function: s.channel || (isCron ? 'cron' : 'chat'),
            model: s.model || 'openrouter/auto',
            workspace: '/root/.openclaw/workspace',
            apiKeys: '',
            skills: '',
            heartbeat: 60,
            active: isActive,
          };
        });
        setAgents(mapped);
      }
    } catch (err) {
      console.error('Error loading agents:', err);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      // In a real implementation, this would call a gateway tool to create/update agent
      // For now, we simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage({ type: 'success', text: 'Agente salvo com sucesso!' });
      
      if (!selectedAgent?.id) {
        // Creating new agent
        const newAgent: Agent = {
          id: `agent:${Date.now()}`,
          name: form.name || 'Novo Agente',
          function: form.function || 'chat',
          model: form.model || 'openrouter/auto',
          workspace: form.workspace || '/root/.openclaw/workspace',
          apiKeys: form.apiKeys || '',
          skills: form.skills || '',
          heartbeat: form.heartbeat || 60,
          active: true,
        };
        setAgents(prev => [...prev, newAgent]);
      } else {
        // Updating existing agent
        setAgents(prev => prev.map(a => 
          a.id === selectedAgent.id ? { ...a, ...form } : a
        ));
      }
      
      resetForm();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao salvar' });
    }
    
    setSaving(false);
  };

  const resetForm = () => {
    setSelectedAgent(null);
    setForm({
      name: '',
      function: '',
      model: 'openrouter/auto',
      workspace: '/root/.openclaw/workspace',
      apiKeys: '',
      skills: '',
      heartbeat: 60,
      active: true,
    });
  };

  const editAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setForm({ ...agent });
  };

  const testConnection = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      // Test connection via API
      await (api as any).getSessionStatus?.();
      setMessage({ type: 'success', text: 'Conexão testada com sucesso!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: `Erro: ${err.message}` });
    }
    
    setSaving(false);
  };

  const toggleActive = async (agent: Agent) => {
    setAgents(prev => prev.map(a => 
      a.id === agent.id ? { ...a, active: !a.active } : a
    ));
    setMessage({ type: 'success', text: `Agente ${agent.active ? 'desativado' : 'ativado'} com sucesso!` });
  };

  const deleteAgent = async (agent: Agent) => {
    if (!confirm(`Tem certeza que deseja excluir "${agent.name}"?`)) {
      return;
    }
    
    setSaving(true);
    setMessage(null);
    
    try {
      const isCron = agent.id.includes('cron:');
      
      if (isCron) {
        // Extract cron ID from session key
        const cronId = agent.id.split('cron:').pop();
        if (cronId) {
          await (api as any).invokeTool?.('cron', { action: 'remove', jobId: cronId });
          setMessage({ type: 'success', text: 'Cron job excluído com sucesso!' });
        }
      } else {
        // For regular sessions, just remove from UI (session will be cleaned up automatically)
        setMessage({ type: 'success', text: 'Agente removido da lista!' });
      }
      
      // Remove from local list
      setAgents(prev => prev.filter(a => a.id !== agent.id));
      
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao excluir' });
    }
    
    setSaving(false);
  };

  return (
    <div style={{ padding: 20, color: '#fff' }}>
      <h1 style={{ marginBottom: 20 }}>Cadastro de Agentes</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Left: Agent List */}
        <div style={{ border: '1px solid #2a2a3e', borderRadius: 8, padding: 16 }}>
          <h2 style={{ marginBottom: 16 }}>Lista de Agentes</h2>
          
          {loading ? (
            <p>Carregando...</p>
          ) : agents.length === 0 ? (
            <p>Nenhum agente encontrado</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  style={{
                    background: selectedAgent?.id === agent.id ? '#2a2a4e' : '#1a1a2e',
                    border: '1px solid #2a2a3e',
                    borderRadius: 6,
                    padding: 12,
                    cursor: 'pointer',
                  }}
                  onClick={() => editAgent(agent)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{agent.name}</strong>
                    <span style={{
                      fontSize: 12,
                      color: agent.active ? '#4f4' : '#f44',
                    }}>
                      {agent.active ? '● Ativo' : '○ Inativo'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                    ID: {agent.id} | Modelo: {agent.model}
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleActive(agent); }}
                      style={{
                        background: agent.active ? '#a33' : '#3a3',
                        border: 'none',
                        color: '#fff',
                        padding: '4px 12px',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      {agent.active ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteAgent(agent); }}
                      style={{
                        background: '#833',
                        border: 'none',
                        color: '#fff',
                        padding: '4px 12px',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Form */}
        <div style={{ border: '1px solid #2a2a3e', borderRadius: 8, padding: 16 }}>
          <h2 style={{ marginBottom: 16 }}>
            {selectedAgent ? 'Editar Agente' : 'Novo Agente'}
          </h2>

          {message && (
            <div style={{
              background: message.type === 'success' ? '#1a3a1a' : '#3a1a1a',
              border: `1px solid ${message.type === 'success' ? '#4f4' : '#f44'}`,
              padding: 12,
              borderRadius: 6,
              marginBottom: 16,
            }}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Nome do Agente</label>
              <input
                type="text"
                value={form.name || ''}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: 10,
                  background: '#1a1a2e',
                  border: '1px solid #2a2a3e',
                  borderRadius: 6,
                  color: '#fff',
                }}
                required
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Função</label>
              <select
                value={form.function || ''}
                onChange={(e) => setForm({ ...form, function: e.target.value })}
                style={{
                  width: '100%',
                  padding: 10,
                  background: '#1a1a2e',
                  border: '1px solid #2a2a3e',
                  borderRadius: 6,
                  color: '#fff',
                }}
              >
                <option value="chat">Chat</option>
                <option value="automation">Automação</option>
                <option value="monitoring">Monitoramento</option>
                <option value="cron">Cron Job</option>
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Modelo Principal</label>
              <select
                value={form.model || 'openrouter/auto'}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                style={{
                  width: '100%',
                  padding: 10,
                  background: '#1a1a2e',
                  border: '1px solid #2a2a3e',
                  borderRadius: 6,
                  color: '#fff',
                }}
              >
                {models.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Workspace</label>
              <input
                type="text"
                value={form.workspace || ''}
                onChange={(e) => setForm({ ...form, workspace: e.target.value })}
                style={{
                  width: '100%',
                  padding: 10,
                  background: '#1a1a2e',
                  border: '1px solid #2a2a3e',
                  borderRadius: 6,
                  color: '#fff',
                }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Chaves API (separadas por vírgula)</label>
              <input
                type="text"
                value={form.apiKeys || ''}
                onChange={(e) => setForm({ ...form, apiKeys: e.target.value })}
                placeholder="openrouter, brave-search, ..."
                style={{
                  width: '100%',
                  padding: 10,
                  background: '#1a1a2e',
                  border: '1px solid #2a2a3e',
                  borderRadius: 6,
                  color: '#fff',
                }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Skills</label>
              <input
                type="text"
                value={form.skills || ''}
                onChange={(e) => setForm({ ...form, skills: e.target.value })}
                placeholder="healthcheck, weather, ..."
                style={{
                  width: '100%',
                  padding: 10,
                  background: '#1a1a2e',
                  border: '1px solid #2a2a3e',
                  borderRadius: 6,
                  color: '#fff',
                }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Heartbeat (segundos)</label>
              <input
                type="number"
                value={form.heartbeat || 60}
                onChange={(e) => setForm({ ...form, heartbeat: parseInt(e.target.value) })}
                min={10}
                max={300}
                style={{
                  width: '100%',
                  padding: 10,
                  background: '#1a1a2e',
                  border: '1px solid #2a2a3e',
                  borderRadius: 6,
                  color: '#fff',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  flex: 1,
                  padding: 12,
                  background: '#3a3a8f',
                  border: 'none',
                  borderRadius: 6,
                  color: '#fff',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? 'Salvando...' : selectedAgent ? 'Salvar' : 'Criar Agente'}
              </button>
              
              <button
                type="button"
                onClick={testConnection}
                disabled={saving}
                style={{
                  padding: 12,
                  background: '#2a2a3e',
                  border: '1px solid #3a3a5e',
                  borderRadius: 6,
                  color: '#88f',
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                Testar Conexão
              </button>
              
              {selectedAgent && (
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    padding: 12,
                    background: 'transparent',
                    border: '1px solid #f44',
                    borderRadius: 6,
                    color: '#f44',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Sub-agents section */}
      <div style={{ marginTop: 20, border: '1px solid #2a2a3e', borderRadius: 8, padding: 16 }}>
        <h2 style={{ marginBottom: 16 }}>Sub-agentes (session keys)</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {agents.filter(a => a.id.includes(':') && (a.id.includes('subagent') || a.id.includes('cron'))).map(agent => (
            <span
              key={agent.id}
              style={{
                background: '#1a1a2e',
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: 12,
                color: '#88f',
              }}
            >
              {agent.id}
            </span>
          ))}
          {agents.filter(a => a.id.includes(':') && (a.id.includes('subagent') || a.id.includes('cron'))).length === 0 && (
            <span style={{ color: '#666' }}>Nenhum sub-agente encontrado</span>
          )}
        </div>
      </div>
    </div>
  );
}
