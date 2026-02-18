"use client";

import React, { useState, useEffect } from "react";
import { api } from "../../src/lib/api";

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

const EMPTY_FORM: Partial<Agent> = {
  name: "",
  function: "chat",
  model: "openrouter/auto",
  workspace: "/root/.openclaw/workspace",
  apiKeys: "",
  skills: "",
  heartbeat: 60,
  active: true,
};

export default function AgentesPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [form, setForm] = useState<Partial<Agent>>(EMPTY_FORM);

  useEffect(() => {
    loadAgents();
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const modelList = await (
        api as Record<string, Function>
      ).getModels?.();
      if (Array.isArray(modelList) && modelList.length > 0) {
        setModels(modelList);
      }
    } catch {
      /* silent */
    }
  };

  const loadAgents = async () => {
    setLoading(true);
    try {
      const [sessionsResult, cronResult] = await Promise.all([
        (api as Record<string, Function>).getSessions?.(50).catch(() => null),
        (api as Record<string, Function>).getCronJobs?.().catch(() => null),
      ]);

      let activeCronIds: string[] = [];
      if (cronResult && typeof cronResult === "object") {
        const c = cronResult as Record<string, unknown>;
        const jobs = Array.isArray(c.jobs) ? c.jobs : [];
        activeCronIds = jobs
          .filter((j: Record<string, unknown>) => j.enabled)
          .map((j: Record<string, unknown>) => j.id as string);
      }

      let sessions: Record<string, unknown>[] = [];
      if (Array.isArray(sessionsResult)) {
        sessions = sessionsResult;
      } else if (sessionsResult && typeof sessionsResult === "object") {
        const s = sessionsResult as Record<string, unknown>;
        sessions = (
          Array.isArray(s.sessions)
            ? s.sessions
            : Array.isArray(s.data)
              ? s.data
              : []
        ) as Record<string, unknown>[];
      }

      sessions = sessions.filter((s) => {
        const keyStr = (s.key as string) || "";
        if (keyStr.includes("cron:")) {
          const cronId = keyStr.split("cron:").pop() || "";
          return activeCronIds.includes(cronId);
        }
        const updatedAt = (s.updatedAt as number) || 0;
        return Date.now() - updatedAt < 24 * 60 * 60 * 1000;
      });

      const mapped: Agent[] = sessions.map((s) => {
        const keyStr = (s.key as string) || "";
        const isCron = keyStr.includes("cron:");
        let cronId = "";
        if (isCron) {
          cronId = keyStr.split("cron:").pop() || "";
        }
        const isActive = isCron
          ? activeCronIds.includes(cronId)
          : !!(
            (s.updatedAt as number) &&
            Date.now() - (s.updatedAt as number) < 120000
          );

        return {
          id: (s.sessionId as string) || keyStr,
          name:
            (s.displayName as string) ||
            (s.label as string) ||
            keyStr ||
            "Agente",
          function: (s.channel as string) || (isCron ? "cron" : "chat"),
          model: (s.model as string) || "openrouter/auto",
          workspace: "/root/.openclaw/workspace",
          apiKeys: "",
          skills: "",
          heartbeat: 60,
          active: isActive,
        };
      });

      setAgents(mapped);
    } catch {
      /* silent */
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setMessage({ type: "success", text: "Agente salvo com sucesso!" });

      if (!selectedAgent?.id) {
        const newAgent: Agent = {
          id: `agent:${Date.now()}`,
          name: form.name || "Novo Agente",
          function: form.function || "chat",
          model: form.model || "openrouter/auto",
          workspace: form.workspace || "/root/.openclaw/workspace",
          apiKeys: form.apiKeys || "",
          skills: form.skills || "",
          heartbeat: form.heartbeat || 60,
          active: true,
        };
        setAgents((prev) => [...prev, newAgent]);
      } else {
        setAgents((prev) =>
          prev.map((a) =>
            a.id === selectedAgent.id ? { ...a, ...form } : a
          )
        );
      }
      resetForm();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao salvar";
      setMessage({ type: "error", text: message });
    }
    setSaving(false);
  };

  const resetForm = () => {
    setSelectedAgent(null);
    setForm(EMPTY_FORM);
  };

  const editAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setForm({ ...agent });
  };

  const testConnection = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await (api as Record<string, Function>).getSessionStatus?.();
      setMessage({ type: "success", text: "Conexão OK!" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro";
      setMessage({ type: "error", text: msg });
    }
    setSaving(false);
  };

  const toggleActive = (agent: Agent) => {
    setAgents((prev) =>
      prev.map((a) =>
        a.id === agent.id ? { ...a, active: !a.active } : a
      )
    );
    setMessage({
      type: "success",
      text: `Agente ${agent.active ? "desativado" : "ativado"}`,
    });
  };

  const deleteAgent = async (agent: Agent) => {
    if (!confirm(`Excluir "${agent.name}"?`)) return;
    setSaving(true);
    setMessage(null);
    try {
      const isCron = agent.id.includes("cron:");
      if (isCron) {
        const cronId = agent.id.split("cron:").pop();
        if (cronId) {
          await (api as Record<string, Function>).invokeTool?.(
            "cron",
            { action: "remove", jobId: cronId }
          );
        }
      }
      setAgents((prev) => prev.filter((a) => a.id !== agent.id));
      setMessage({ type: "success", text: "Agente removido" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao excluir";
      setMessage({ type: "error", text: msg });
    }
    setSaving(false);
  };

  return (
    <div className="mc-agentes">
      <header className="mc-agentes-header mc-animate-in">
        <h1 className="mc-agentes-title">Cadastro de Agentes</h1>
      </header>

      <div className="mc-agentes-layout">
        {/* ── Left: Agent List ── */}
        <div className="mc-card-static mc-agentes-list mc-animate-in mc-stagger-1">
          <h2 className="mc-section-title">
            Lista de Agentes
            <span className="mc-agentes-count">{agents.length}</span>
          </h2>

          {loading ? (
            <div className="mc-agentes-skeleton">
              {[1, 2, 3].map((n) => (
                <div key={n} className="mc-skeleton" style={{ height: 72 }} />
              ))}
            </div>
          ) : agents.length === 0 ? (
            <p className="mc-empty">Nenhum agente encontrado</p>
          ) : (
            <div className="mc-agentes-items">
              {agents.map((agent, i) => (
                <div
                  key={agent.id}
                  className={`mc-agentes-item mc-animate-in mc-stagger-${Math.min(i + 1, 6)} ${selectedAgent?.id === agent.id ? "mc-agentes-item-active" : ""
                    }`}
                  onClick={() => editAgent(agent)}
                >
                  <div className="mc-agentes-item-top">
                    <span
                      className={`mc-dot ${agent.active ? "mc-dot-online" : "mc-dot-offline"}`}
                    />
                    <strong className="mc-agentes-item-name">{agent.name}</strong>
                    <span
                      className={`mc-badge ${agent.active ? "mc-badge-online" : "mc-badge-offline"}`}
                    >
                      {agent.active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <div className="mc-agentes-item-meta mono">
                    {agent.id} · {agent.model}
                  </div>
                  <div className="mc-agentes-item-actions">
                    <button
                      className={`mc-btn mc-btn-secondary mc-btn-sm`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleActive(agent);
                      }}
                    >
                      {agent.active ? "Desativar" : "Ativar"}
                    </button>
                    <button
                      className="mc-btn mc-btn-danger mc-btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAgent(agent);
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

        {/* ── Right: Form ── */}
        <div className="mc-card-static mc-agentes-form-wrap mc-animate-in mc-stagger-2">
          <h2 className="mc-section-title">
            {selectedAgent ? "Editar Agente" : "Novo Agente"}
          </h2>

          {message && (
            <div
              className={`mc-alert ${message.type === "success" ? "mc-alert-success" : "mc-alert-error"}`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mc-agentes-form">
            <label className="mc-field">
              <span className="mc-field-label">Nome do Agente</span>
              <input
                className="mc-input"
                type="text"
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>

            <label className="mc-field">
              <span className="mc-field-label">Função</span>
              <select
                className="mc-input"
                value={form.function || "chat"}
                onChange={(e) =>
                  setForm({ ...form, function: e.target.value })
                }
              >
                <option value="chat">Chat</option>
                <option value="automation">Automação</option>
                <option value="monitoring">Monitoramento</option>
                <option value="cron">Cron Job</option>
              </select>
            </label>

            <label className="mc-field">
              <span className="mc-field-label">Modelo</span>
              <select
                className="mc-input"
                value={form.model || "openrouter/auto"}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
              >
                {models.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </label>

            <label className="mc-field">
              <span className="mc-field-label">Workspace</span>
              <input
                className="mc-input"
                type="text"
                value={form.workspace || ""}
                onChange={(e) =>
                  setForm({ ...form, workspace: e.target.value })
                }
              />
            </label>

            <label className="mc-field">
              <span className="mc-field-label">Chaves API</span>
              <input
                className="mc-input"
                type="text"
                value={form.apiKeys || ""}
                onChange={(e) =>
                  setForm({ ...form, apiKeys: e.target.value })
                }
                placeholder="openrouter, brave-search, ..."
              />
            </label>

            <label className="mc-field">
              <span className="mc-field-label">Skills</span>
              <input
                className="mc-input"
                type="text"
                value={form.skills || ""}
                onChange={(e) =>
                  setForm({ ...form, skills: e.target.value })
                }
                placeholder="healthcheck, weather, ..."
              />
            </label>

            <label className="mc-field">
              <span className="mc-field-label">Heartbeat (segundos)</span>
              <input
                className="mc-input"
                type="number"
                value={form.heartbeat || 60}
                onChange={(e) =>
                  setForm({ ...form, heartbeat: parseInt(e.target.value) })
                }
                min={10}
                max={300}
              />
            </label>

            <div className="mc-agentes-form-actions">
              <button
                type="submit"
                className="mc-btn mc-btn-primary"
                disabled={saving}
              >
                {saving
                  ? "Salvando..."
                  : selectedAgent
                    ? "Salvar"
                    : "Criar Agente"}
              </button>
              <button
                type="button"
                className="mc-btn mc-btn-secondary"
                onClick={testConnection}
                disabled={saving}
              >
                Testar Conexão
              </button>
              {selectedAgent && (
                <button
                  type="button"
                  className="mc-btn mc-btn-danger"
                  onClick={resetForm}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* ── Sub-agents ── */}
      <div className="mc-card-static mc-agentes-sub mc-animate-in mc-stagger-3">
        <h2 className="mc-section-title">Sub-agentes</h2>
        <div className="mc-agentes-sub-list">
          {agents
            .filter(
              (a) =>
                a.id.includes(":") &&
                (a.id.includes("subagent") || a.id.includes("cron"))
            )
            .map((agent) => (
              <span key={agent.id} className="mc-badge mc-badge-accent">
                {agent.id}
              </span>
            ))}
          {agents.filter(
            (a) =>
              a.id.includes(":") &&
              (a.id.includes("subagent") || a.id.includes("cron"))
          ).length === 0 && (
              <span className="mc-empty-inline">
                Nenhum sub-agente encontrado
              </span>
            )}
        </div>
      </div>

      <style>{`
        .mc-agentes {
          padding: var(--mc-space-lg) var(--mc-space-xl);
          max-width: 1400px;
        }

        .mc-agentes-header {
          margin-bottom: var(--mc-space-lg);
        }

        .mc-agentes-title {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.03em;
        }

        .mc-agentes-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--mc-space-md);
          margin-bottom: var(--mc-space-lg);
        }

        .mc-agentes-list,
        .mc-agentes-form-wrap {
          padding: var(--mc-space-md);
        }

        .mc-section-title {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: var(--mc-space-md);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .mc-agentes-count {
          font-size: 11px;
          color: var(--mc-text-muted);
          background: var(--mc-bg-elevated);
          padding: 1px 8px;
          border-radius: 2px;
        }

        .mc-agentes-skeleton {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .mc-agentes-items {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 600px;
          overflow-y: auto;
        }

        .mc-agentes-item {
          background: var(--mc-bg-base);
          border: 1px solid var(--mc-border);
          border-radius: 2px;
          padding: 12px;
          cursor: pointer;
          transition: all var(--mc-duration-fast) var(--mc-ease-out);
        }

        .mc-agentes-item:hover {
          border-color: var(--mc-border-strong);
          background: var(--mc-bg-elevated);
        }

        .mc-agentes-item-active {
          border-color: var(--mc-accent) !important;
          background: var(--mc-accent-glow) !important;
        }

        .mc-agentes-item-top {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }

        .mc-agentes-item-name {
          flex: 1;
          font-size: 14px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .mc-agentes-item-meta {
          font-size: 11px;
          color: var(--mc-text-muted);
          margin-bottom: 8px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .mc-agentes-item-actions {
          display: flex;
          gap: 6px;
        }

        .mc-btn-sm {
          padding: 4px 12px;
          font-size: 12px;
        }

        .mc-agentes-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .mc-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .mc-field-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--mc-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .mc-agentes-form-actions {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }

        .mc-agentes-sub {
          padding: var(--mc-space-md);
        }

        .mc-agentes-sub-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .mc-empty {
          color: var(--mc-text-muted);
          text-align: center;
          padding: var(--mc-space-xl);
          font-size: 13px;
        }

        .mc-empty-inline {
          color: var(--mc-text-muted);
          font-size: 12px;
        }

        @media (max-width: 1024px) {
          .mc-agentes-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .mc-agentes {
            padding: var(--mc-space-md);
          }
        }
      `}</style>
    </div>
  );
}
