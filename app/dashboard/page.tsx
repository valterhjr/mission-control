"use client";

import React, { useEffect, useState } from "react";
import { api } from "../../src/lib/api";
import AgentCard from "../components/AgentCard";
import KanbanBoard from "../components/KanbanBoard";
import LogTimeline from "../components/LogTimeline";
import ConfigEditor from "../components/ConfigEditor";

type Agent = {
  name: string;
  id: string;
  status: string;
  lastActivity?: string;
  type?: string;
};

type Stats = {
  total: number;
  online: number;
  crons: number;
};

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({ total: 0, online: 0, crons: 0 });

  useEffect(() => {
    setLoading(true);
    setError(null);
    const now = new Date().toLocaleString("pt-BR");
    setLogs([`${now} — Iniciando busca...`]);

    (async () => {
      try {
        const [result, cronResult] = await Promise.all([
          (api as Record<string, Function>).getSessions?.(20),
          (api as Record<string, Function>).getCronJobs?.().catch(() => null),
        ]);

        let sessions: Record<string, unknown>[] = [];
        if (Array.isArray(result)) {
          sessions = result;
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

        const mapped: Agent[] = sessions.map((s) => {
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

        const onlineCount = mapped.filter((a) => a.status === "Online").length;

        setAgents(mapped);
        setStats({
          total: mapped.length,
          online: onlineCount,
          crons: cronCount,
        });
        setLogs((prev) => [
          `${new Date().toLocaleString("pt-BR")} — ${sessions.length} sessões carregadas`,
          ...prev,
        ]);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Erro ao carregar dados";
        setError(message);
        setLogs((prev) => [
          `${new Date().toLocaleString("pt-BR")} — Erro: ${message}`,
          ...prev,
        ]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const statCards = [
    {
      label: "Total Agentes",
      value: stats.total,
      color: "var(--mc-accent)",
    },
    {
      label: "Online",
      value: stats.online,
      color: "var(--mc-online)",
    },
    {
      label: "Cron Jobs",
      value: stats.crons,
      color: "var(--mc-warning)",
    },
  ];

  return (
    <div className="mc-dashboard">
      {/* ── Header ── */}
      <header className="mc-dashboard-header mc-animate-in">
        <h1 className="mc-dashboard-title">Painel de Controle</h1>
      </header>

      {/* ── Error ── */}
      {error && (
        <div className="mc-alert mc-alert-error mc-animate-in">{error}</div>
      )}

      {/* ── Stats ── */}
      <section className="mc-dashboard-stats mc-animate-in mc-stagger-1">
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

      {/* ── Grid: Agents + Config in a 2/3 + 1/3 layout ── */}
      <section className="mc-dashboard-grid mc-animate-in mc-stagger-2">
        <div className="mc-card-static mc-dashboard-section">
          <h2 className="mc-section-title">Meus Agentes</h2>
          {loading ? (
            <div className="mc-dashboard-skeleton-grid">
              {[1, 2, 3].map((n) => (
                <div key={n} className="mc-skeleton" style={{ height: 100 }} />
              ))}
            </div>
          ) : agents.length === 0 ? (
            <p className="mc-empty">Nenhum agente encontrado</p>
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
                />
              ))}
            </div>
          )}
        </div>

        <div className="mc-card-static mc-dashboard-section">
          <h2 className="mc-section-title">Configurações</h2>
          <ConfigEditor />
        </div>
      </section>

      {/* ── Grid: Kanban + Logs ── */}
      <section className="mc-dashboard-grid mc-animate-in mc-stagger-3">
        <div className="mc-card-static mc-dashboard-section mc-dashboard-section-wide">
          <h2 className="mc-section-title">Kanban</h2>
          <KanbanBoard />
        </div>

        <div className="mc-card-static mc-dashboard-section">
          <h2 className="mc-section-title">
            Logs
            <span className="mc-dot mc-dot-online" style={{ marginLeft: 8 }} />
          </h2>
          <LogTimeline logs={logs} />
        </div>
      </section>

      <style>{`
        .mc-dashboard {
          padding: var(--mc-space-lg) var(--mc-space-xl);
          max-width: 1400px;
        }

        .mc-dashboard-header {
          margin-bottom: var(--mc-space-lg);
        }

        .mc-dashboard-title {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.03em;
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
          .mc-dashboard-grid {
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
