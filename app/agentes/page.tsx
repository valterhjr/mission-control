"use client";

import React, { useState, useEffect } from "react";
import { api } from "../../src/lib/api";
import { t } from "../../src/lib/i18n";
import { AGENT_ONLINE_MS } from "../../src/lib/constants";

type Agent = {
  id: string;
  name: string;
  function: string;
  model: string;
  workerVersion: string;
  status: string;
  online: boolean;
};

type ApiType = Record<string, (...args: unknown[]) => Promise<unknown>>;

export default function AgentesPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    document.title = t("Gerenciar Agentes — Mission Control");
  }, []);

  const loadAgents = async () => {
    setLoading(true);
    try {
      const config = (await (api as ApiType).getOpenClawConfig?.()) as { agents?: Record<string, unknown>[] };
      const sessionsRaw = await (api as ApiType).getSessions?.(50);
      const sessions = (Array.isArray(sessionsRaw) ? sessionsRaw : ((sessionsRaw as Record<string, unknown[]>)?.sessions || (sessionsRaw as Record<string, unknown[]>)?.data || [])) as Record<string, unknown>[];

      const agentMap = new Map<string, Record<string, unknown>>();
      sessions.forEach(s => {
        const key = s.key as string || "";
        const parts = key.split(":");
        if (parts.length >= 2) agentMap.set(parts[1], s);
      });

      if (config?.agents) {
        const mapped = config.agents.map((ca: Record<string, unknown>) => {
          const s = agentMap.get(ca.id as string);
          return {
            id: ca.id as string,
            name: (ca.name as string) || (ca.id as string),
            function: (ca.function as string) || "General",
            model: (ca.model as string) || "unknown",
            workerVersion: (ca.workerVersion as string) || "1.0.0",
            status: s && (s.updatedAt as number) && (Date.now() - (s.updatedAt as number) < AGENT_ONLINE_MS) ? "Online" : "Offline",
            online: !!(s && (s.updatedAt as number) && Date.now() - (s.updatedAt as number) < AGENT_ONLINE_MS)
          };
        });
        setAgents(mapped);
      }
    } catch (err) {
      console.error("Failed to load agents", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  return (
    <div className="mc-agentes">
      <title>{t("Gerenciar Agentes — Mission Control")}</title>

      {toast && (
        <div className="mc-alert mc-alert-info" style={{ position: 'fixed', top: 16, right: 16, zIndex: 1000, minWidth: 260 }}>
          {toast}
        </div>
      )}

      <header className="mc-agentes-header mc-animate-in">
        <h1 className="mc-agentes-title">{t("Gerenciar Agentes")}</h1>
        <button
          className="mc-btn mc-btn-primary"
          onClick={() => showToast(t("Funcionalidade em desenvolvimento"))}
          onKeyDown={(e) => { if (e.key === 'Enter') showToast(t("Funcionalidade em desenvolvimento")); }}
        >
          + {t("Novo Agente")}
        </button>
      </header>

      <section className="mc-agentes-content">
        <h2 className="mc-section-title">{t("Lista de Operadores Ativos")}</h2>

        {loading ? (
          <div className="mc-skeleton-list">
            {[1, 2, 3, 4].map(n => <div key={n} className="mc-skeleton" style={{ height: 60, marginBottom: 12 }} />)}
          </div>
        ) : agents.length === 0 ? (
          <div className="mc-empty">{t("Nenhum agente configurado.")}</div>
        ) : (
          <div className="mc-agent-table-wrap">
            <table className="mc-agent-table">
              <thead>
                <tr>
                  <th>{t("Nome")}</th>
                  <th>{t("Função")}</th>
                  <th>{t("Modelo")}</th>
                  <th>{t("Versão")}</th>
                  <th>{t("Status")}</th>
                  <th>{t("Ações")}</th>
                </tr>
              </thead>
              <tbody>
                {agents.map(agent => (
                  <tr key={agent.id} className="mc-agent-row">
                    <td>
                      <div className="mc-agent-name-cell">
                        <span className={`mc-dot ${agent.online ? 'mc-dot-online' : 'mc-dot-offline'}`} />
                        {agent.name}
                      </div>
                    </td>
                    <td className="mono" style={{ fontSize: 12 }}>{agent.function}</td>
                    <td className="mono" style={{ fontSize: 12 }}>{agent.model}</td>
                    <td className="mono" style={{ fontSize: 12 }}>v{agent.workerVersion}</td>
                    <td>
                      <span className={`mc-badge ${agent.online ? 'mc-badge-online' : 'mc-badge-offline'}`}>
                        {t(agent.status)}
                      </span>
                    </td>
                    <td>
                      <button
                        className="mc-btn mc-btn-secondary mc-btn-sm"
                        onClick={() => showToast(t("Edição em desenvolvimento"))}
                      >
                        {t("Editar")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mc-agentes-info" style={{ marginTop: 40 }}>
        <h2 className="mc-section-title">{t("Informações de Operação")}</h2>
        <p style={{ fontSize: 14, color: 'var(--mc-text-secondary)', maxWidth: 600 }}>
          {t("Os agentes são os motores principais do OpenClaw. Cada agente pode ser configurado com modelos específicos e funções customizadas para atender diferentes fluxos de trabalho.")}
        </p>
        <ul style={{ fontSize: 14, color: 'var(--mc-text-secondary)', marginTop: 16 }}>
          <li>{t("Modelos suportados: GPT-4, Claude 3.5, Gemini 1.5 Pro")}</li>
          <li>{t("Latência média de sincronização: < 2000ms")}</li>
          <li>{t("Disponibilidade global do gateway: 99.9%")}</li>
        </ul>
      </section>

      <footer className="mc-dashboard-footer" style={{ marginTop: 40, opacity: 0.5, fontSize: 11 }}>
        <p>© {new Date().getFullYear()} OpenClaw — {t("Escrito por")} OpenClaw Team.</p>
      </footer>

      <style>{`
        .mc-agentes {
          padding: var(--mc-space-lg) var(--mc-space-xl);
          max-width: 1200px;
        }

        .mc-agentes-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--mc-space-xl);
        }

        .mc-agentes-title {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .mc-section-title {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: var(--mc-space-md);
          color: var(--mc-text-primary);
        }

        .mc-agent-table-wrap {
          background: var(--mc-bg-surface);
          border: 1px solid var(--mc-border);
          border-radius: 2px;
          overflow: hidden;
        }

        .mc-agent-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .mc-agent-table th {
          padding: 12px 16px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--mc-text-muted);
          background: var(--mc-bg-deep);
          border-bottom: 1px solid var(--mc-border);
        }

        .mc-agent-table td {
          padding: 16px;
          border-bottom: 1px solid var(--mc-border);
          font-size: 14px;
        }

        .mc-agent-row:hover {
          background: var(--mc-bg-hover);
        }

        .mc-agent-name-cell {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
        }

        .mc-badge {
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .mc-badge-online {
          background: var(--mc-online-glow);
          color: var(--mc-online);
        }

        .mc-badge-offline {
          background: rgba(255, 255, 255, 0.05);
          color: var(--mc-text-muted);
        }

        .mc-btn-sm {
          padding: 4px 10px;
          font-size: 12px;
        }

        @media (max-width: 768px) {
          .mc-agentes-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          .mc-agent-table th:nth-child(3),
          .mc-agent-table td:nth-child(3),
          .mc-agent-table th:nth-child(4),
          .mc-agent-table td:nth-child(4) {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
