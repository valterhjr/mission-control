"use client";

import React, { useEffect, useState } from "react";
import { api } from "../src/lib/api";
import { t } from "../src/lib/i18n";
import AgentCard from "../src/components/AgentCard";
import KanbanBoard from "../src/components/KanbanBoard";
import LogTimeline from "../src/components/LogTimeline";
import ConfigEditor from "../src/components/ConfigEditor";
import ToolsPanel from "../src/components/ToolsPanel";

type Agent = {
  name: string;
  id: string;
  status: string;
  lastActivity?: string;
  type?: string;
  model?: string;
};

type ApiType = Record<string, (...args: unknown[]) => Promise<unknown>>;

export default function Home() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ total: number; online: number; crons: number; backendOnline: boolean; sessionsCount: number }>({
    total: 0,
    online: 0,
    crons: 0,
    backendOnline: false,
    sessionsCount: 0,
  });

  useEffect(() => {
    document.title = t("Mission Control — OpenClaw");
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const [result, cronResult, configResult] = (await Promise.all([
          (api as ApiType).getSessions?.(20),
          (api as ApiType).getCronJobs?.().catch(() => null),
          (api as ApiType).getOpenClawConfig?.().catch(() => null),
        ])) as [unknown, unknown, Record<string, unknown> | null];

        if (!mounted) return;

        let sessions: Record<string, unknown>[] = [];
        if (Array.isArray(result)) {
          sessions = result as Record<string, unknown>[];
        } else if (result && typeof result === "object") {
          const r = result as Record<string, unknown>;
          sessions = (
            Array.isArray(r.sessions) ? r.sessions : Array.isArray(r.data) ? r.data : []
          ) as Record<string, unknown>[];
        }

        let cronCount = 0;
        if (cronResult && typeof cronResult === "object") {
          const c = cronResult as Record<string, unknown>;
          const jobs = Array.isArray(c.jobs) ? c.jobs : [];
          cronCount = jobs.length;
        }

        const sessionByAgentId = new Map<string, Record<string, unknown>>();
        sessions.forEach((s) => {
          const key = (s.key as string) || "";
          const parts = key.split(":");
          if (parts.length >= 2) {
            sessionByAgentId.set(parts[1], s);
          }
        });

        let mapped: Agent[];

        if (configResult?.agents && Array.isArray(configResult.agents)) {
          mapped = configResult.agents.map((ca: Record<string, string>) => {
            const session = sessionByAgentId.get(ca.id);
            const updatedAt = session ? (session.updatedAt as number) || 0 : 0;
            const isOnline = updatedAt > 0 && Date.now() - updatedAt < 120000;
            const key = session ? (session.key as string) || "" : "";
            const isCron = key.includes("cron:") || !!ca.hasHeartbeat;

            return {
              name: ca.name || ca.id,
              id: session ? (session.sessionId as string) || ca.id : ca.id,
              status: isOnline ? "Online" : "Offline",
              lastActivity: updatedAt
                ? new Date(updatedAt).toLocaleString("pt-BR")
                : "",
              type: isCron ? "cron" : (session?.channel as string) || "agent",
              model: ca.model || "",
            };
          });
        } else {
          mapped = sessions.map((s) => {
            const key = (s.key as string) || "";
            const updatedAt = (s.updatedAt as number) || 0;
            const isOnline = updatedAt > 0 && Date.now() - updatedAt < 120000;
            const isCron = key.includes("cron:");

            return {
              name: (s.displayName as string) || (s.label as string) || key || "Agente",
              id: (s.sessionId as string) || key || "",
              status: isOnline ? "Online" : "Offline",
              lastActivity: updatedAt
                ? new Date(updatedAt).toLocaleString("pt-BR")
                : "",
              type: isCron ? "cron" : (s.channel as string) || "chat",
            };
          });
        }

        const onlineCount = mapped.filter((a) => a.status === "Online").length;

        setAgents(mapped);
        setStats({
          total: mapped.length,
          online: onlineCount,
          crons: cronCount,
          backendOnline: true,
          sessionsCount: sessions.length,
        });
      } catch (err: unknown) {
        if (mounted) {
          const message = err instanceof Error ? err.message : t("Erro ao carregar dados");
          setError(message);
          setStats(prev => ({ ...prev, backendOnline: false }));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const statCards = [
    {
      label: t("Total Agentes"),
      value: stats.total,
      color: "var(--mc-accent)",
    },
    {
      label: t("Online"),
      value: stats.online,
      color: "var(--mc-online)",
    },
    {
      label: t("Cron Jobs"),
      value: stats.crons,
      color: "var(--mc-warning)",
    },
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Mission Control",
    "applicationCategory": "Dashboard",
    "operatingSystem": "Web",
    "author": {
      "@type": "Organization",
      "name": "OpenClaw"
    },
    "description": "Centro de comando tático para orquestração de agentes de inteligência artificial.",
    "softwareVersion": "1.2.0"
  };

  return (
    <div className="mc-dashboard" aria-label={t("Painel de Controle de Operações")}>
      <title>{t("Painel de Controle — Mission Control")}</title>
      <meta name="description" content={t("Acompanhe o status e a atividade de seus agentes em tempo real")} />
      <meta name="author" content="OpenClaw" />
      <meta property="og:title" content={t("Painel de Controle — Mission Control")} />
      <meta property="og:description" content={t("Acompanhe o status e a atividade de seus agentes em tempo real")} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* ── Header ── */}
      <header className="mc-dashboard-header mc-animate-in">
        <h1 className="mc-dashboard-title">
          {t("Mission")}<span style={{ color: "var(--mc-accent)" }}>{t("Control")}</span>
        </h1>
        <p className="mc-dashboard-subtitle" style={{ fontSize: 13, color: 'var(--mc-text-muted)', marginTop: 4 }}>
          {t("Centro de comando para seus agentes de IA")}
        </p>

        {/* ── Status Bar ── */}
        <div className="mc-home-status mc-animate-in mc-stagger-1" style={{ marginTop: 16 }}>
          {loading ? (
            <div className="mc-skeleton" style={{ width: 200, height: 20 }} />
          ) : (
            <>
              <span className={`mc-dot ${stats.backendOnline ? "mc-dot-online" : "mc-dot-offline"}`} />
              <span className="mono" style={{ fontSize: 13 }}>
                Gateway {stats.backendOnline ? "Online" : "Offline"}
              </span>
              {stats.backendOnline && (
                <>
                  <span className="mc-home-divider" style={{ color: 'var(--mc-text-muted)', fontSize: 12, margin: '0 10px' }}>|</span>
                  <span className="mono" style={{ fontSize: 13 }}>
                    {stats.sessionsCount} sessões
                  </span>
                  <span className="mc-home-divider" style={{ color: 'var(--mc-text-muted)', fontSize: 12, margin: '0 10px' }}>|</span>
                  <span className="mono" style={{ fontSize: 13 }}>
                    {stats.crons} crons
                  </span>
                </>
              )}
            </>
          )}
        </div>
      </header>

      {/* ── Error ── */}
      {error && (
        <div className="mc-alert mc-alert-error mc-animate-in">{error}</div>
      )}

      {/* ── Stats ── */}
      <section className="mc-dashboard-stats mc-animate-in mc-stagger-1">
        <h2 className="sr-only">{t("Estatísticas de Resumo")}</h2>
        {statCards.map((stat) => (
          <div key={stat.label} className="mc-stat-card mc-card-static">
            <div className="mc-stat-value mono" style={{ color: stat.color }}>
              {loading ? (
                <div className="mc-skeleton" style={{ width: 40, height: 28 }} />
              ) : (
                stat.value
              )}
            </div>
            <div className="mc-stat-label">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* ── Grid: Agents + Config ── */}
      <section className="mc-dashboard-grid mc-animate-in mc-stagger-2">
        <div className="mc-card-static mc-dashboard-section">
          <h2 className="mc-section-title">{t("Meus Agentes")}</h2>
          {loading ? (
            <div className="mc-dashboard-skeleton-grid">
              {[1, 2, 3].map((n) => (
                <div key={n} className="mc-skeleton" style={{ height: 100 }} />
              ))}
            </div>
          ) : agents.length === 0 ? (
            <p className="mc-empty">{t("Nenhum agente encontrado")}</p>
          ) : (
            <div className="mc-dashboard-agents-grid">
              {agents.map((a) => (
                <AgentCard
                  key={a.id}
                  name={a.name}
                  id={a.id}
                  status={a.status}
                  lastActivity={a.lastActivity}
                  type={a.type}
                  model={a.model}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mc-grid-cols-2">
          <div className="mc-card-static mc-dashboard-section">
            <h2 className="mc-section-title">{t("Configurações")}</h2>
            <ConfigEditor />
          </div>
          <div className="mc-card-static mc-dashboard-section" style={{ marginTop: 'var(--mc-space-md)' }}>
            <h2 className="mc-section-title">{t("Ferramentas Rápidas")}</h2>
            <ToolsPanel />
          </div>
        </div>
      </section>

      {/* ── Grid: Kanban + Logs + Charts ── */}
      <section className="mc-dashboard-grid mc-animate-in mc-stagger-3">
        <div className="mc-card-static mc-dashboard-section mc-dashboard-section-wide">
          <h2 className="mc-section-title">{t("Fluxo de Trabalho (Kanban)")}</h2>
          <KanbanBoard />
        </div>

        <div className="mc-dashboard-grid mc-subgrid">
          <div className="mc-card-static mc-dashboard-section" style={{ gridColumn: '1 / -1' }}>
            <h2 className="mc-section-title">
              {t("Linha do Tempo de Logs")}
              <span className="mc-dot mc-dot-online" style={{ marginLeft: 8 }} />
            </h2>
            <LogTimeline />
          </div>
        </div>
      </section>

      <footer className="mc-dashboard-footer" style={{ marginTop: 40, opacity: 0.5, fontSize: 11, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p>© 2025 OpenClaw — {t("Escrito por")} OpenClaw Team. {t("Atualizado em")} 06/03/2026.</p>
        <div className="mc-security-badge mono" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--mc-online)' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          SSL SECURE GATEWAY
        </div>
      </footer>

      <style>{`
        .mc-dashboard {
          padding: var(--mc-space-lg) var(--mc-space-xl);
        }
        
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          border: 0;
        }

        .mc-dashboard-header {
          margin-bottom: var(--mc-space-lg);
        }

        .mc-dashboard-title {
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1.1;
        }

        .mc-dashboard-subtitle {
          font-size: 16px;
          color: var(--mc-text-secondary);
        }
        
        .mc-home-status {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          background: var(--mc-bg-surface);
          border: 1px solid var(--mc-border);
          border-radius: 2px;
          width: fit-content;
        }

        .mc-home-divider {
          color: var(--mc-text-muted);
          font-size: 12px;
          margin: 0 10px;
        }

        .mc-dashboard-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--mc-space-md);
          margin-bottom: var(--mc-space-lg);
        }

        .mc-stat-card {
          padding: 20px;
        }

        .mc-stat-value {
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 4px;
        }

        .mc-stat-label {
          font-size: 12px;
          color: var(--mc-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .mc-dashboard-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: var(--mc-space-md);
          margin-bottom: var(--mc-space-lg);
        }

        .mc-subgrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--mc-space-md);
        }

        .mc-dashboard-section {
          padding: var(--mc-space-md);
        }

        .mc-dashboard-section-wide {
          grid-column: 1 / -1;
        }

        .mc-section-title {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: var(--mc-space-md);
          display: flex;
          align-items: center;
        }

        .mc-dashboard-agents-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 12px;
        }

        .mc-dashboard-skeleton-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 12px;
        }

        .mc-empty {
          color: var(--mc-text-muted);
          text-align: center;
          padding: var(--mc-space-xl);
          font-size: 13px;
        }

        @media (max-width: 1024px) {
          .mc-dashboard-grid, .mc-subgrid {
            grid-template-columns: 1fr;
          }
          .mc-dashboard-stats {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 640px) {
          .mc-dashboard {
            padding: var(--mc-space-md);
          }
          .mc-dashboard-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
