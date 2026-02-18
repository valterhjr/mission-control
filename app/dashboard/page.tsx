"use client";
import React, { useEffect, useState } from 'react';
import { api } from '../../src/lib/api';
import AgentCard from '../components/AgentCard';
import KanbanBoard from '../components/KanbanBoard';
import LogTimeline from '../components/LogTimeline';
import ConfigEditor from '../components/ConfigEditor';

type Agent = { name: string; id: string; status: string; lastActivity?: string };

export default function Dashboard(){
  const [agents, setAgents] = useState<Agent[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real data from gateway
  useEffect(()=>{
    setLoading(true);
    setError(null);
    setLogs([`${new Date().toLocaleString('pt-BR')} - Iniciando busca...`]);
    
    (async()=>{
      try {
        console.log('[Dashboard] Calling API...');
        const result = await (api as any).getSessions?.(20);
        console.log('[Dashboard] Result:', result);
        
        // Handle different response structures
        let sessions: any[] = [];
        
        if (Array.isArray(result)) {
          sessions = result;
        } else if (result && typeof result === 'object') {
          // Maybe sessions is in result.sessions
          sessions = result.sessions || result.data || [];
        }
        
        console.log('[Dashboard] Sessions:', sessions);
        
        if (sessions.length > 0) {
          const mapped: Agent[] = sessions.map((s: any) => ({
            name: s.displayName || s.label || s.key || 'Agente',
            id: s.sessionId || s.key || '',
            status: (s.updatedAt && (Date.now() - s.updatedAt < 120000)) ? 'Online' : 'Offline',
            lastActivity: s.updatedAt ? new Date(s.updatedAt).toLocaleString('pt-BR') : ''
          }));
          setAgents(mapped);
          setLogs(prev => [`${new Date().toLocaleString('pt-BR')} - ${sessions.length} sessões carregadas`, ...prev]);
        } else {
          setAgents([]);
          setLogs(prev => [`${new Date().toLocaleString('pt-BR')} - Nenhuma sessão encontrada`, ...prev]);
        }
      } catch (err: any) {
        console.error('[Dashboard] Error:', err);
        setError(err.message || 'Erro ao carregar dados');
        setLogs(prev => [`${new Date().toLocaleString('pt-BR')} - Erro: ${err.message}`, ...prev]);
      } finally {
        setLoading(false);
      }
    })();
  },[]);

  return (
    <div className="p-6" style={{padding: 20}}>
      <h1 style={{color:'#fff', marginBottom:20}}>Painel de Controle</h1>
      
      {error && (
        <div style={{background:'#3a1a1a', border:'1px solid #f55', padding:12, borderRadius:8, marginBottom:20}}>
          Erro: {error}
        </div>
      )}

      <section style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:20}}>
        <div style={{border:'1px solid #2a2a3e', borderRadius:8, padding:12}}>
          <h2>Meus Agentes</h2>
          {loading ? (
            <p>Carregando...</p>
          ) : agents.length === 0 ? (
            <p>Nenhum agente encontrado</p>
          ) : (
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:12}}>
              {agents.map((a,i)=> (
                <AgentCard key={i} name={a.name} id={a.id} status={a.status} lastActivity={a.lastActivity} />
              ))}
            </div>
          )}
        </div>
        <div style={{border:'1px solid #2a2a3e', borderRadius:8, padding:12}}>
          <h2>Configurações</h2>
          <ConfigEditor />
        </div>
      </section>
      <section style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:20, marginTop:20}}>
        <div style={{border:'1px solid #2a2a3e', borderRadius:8, padding:12}}>
          <h2>Kanban</h2>
          <KanbanBoard />
        </div>
        <div style={{border:'1px solid #2a2a3e', borderRadius:8, padding:12}}>
          <h2>Logs em Tempo Real</h2>
          <LogTimeline logs={logs} />
        </div>
      </section>
    </div>
  );
}
