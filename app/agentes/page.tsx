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
  workspace?: string;
  agentDir?: string;
};

type FormData = {
  id: string;
  name: string;
  model: string;
  workspace: string;
  agentDir: string;
};

type ApiType = Record<string, (...args: unknown[]) => Promise<unknown>>;

export default function AgentesPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; title: string; desc?: string } | null>(null);
  const [modal, setModal] = useState<{ mode: 'new' | 'edit'; form: FormData } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Agent | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = (title: string, type: 'success' | 'error' | 'info' = 'info', desc?: string) => {
    setToast({ type, title, desc });
    setTimeout(() => setToast(null), 4000);
  };

  const openNew = () => setModal({
    mode: 'new',
    form: { id: '', name: '', model: '', workspace: '', agentDir: '' },
  });

  const openEdit = (agent: Agent) => setModal({
    mode: 'edit',
    form: {
      id: agent.id,
      name: agent.name,
      model: agent.model,
      workspace: agent.workspace ?? '',
      agentDir: agent.agentDir ?? '',
    },
  });

  const updateForm = (field: keyof FormData, value: string) =>
    setModal(m => m ? { ...m, form: { ...m.form, [field]: value } } : null);

  const saveAgent = async () => {
    if (!modal) return;
    if (!modal.form.id.trim()) { showToast(t('ID é obrigatório'), 'error'); return; }
    setSaving(true);
    try {
      const method = modal.mode === 'new' ? 'POST' : 'PATCH';
      const res = await fetch('/api/config', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modal.form),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || t('Erro ao salvar'));
      showToast(modal.mode === 'new' ? t('Agente criado com sucesso') : t('Agente atualizado com sucesso'), 'success');
      setModal(null);
      loadAgents();
    } catch (err) {
      showToast(t('Erro ao salvar'), 'error', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const deleteAgent = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/config?id=${encodeURIComponent(deleteConfirm.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || t('Erro ao excluir'));

      if (data.failed?.length) {
        const failedPaths = data.failed.map((f: { path: string }) => f.path).join(', ');
        showToast(t('Agente excluído com avisos'), 'error', `${t('Não foi possível remover')}: ${failedPaths}`);
      } else {
        const deletedCount = data.deleted?.length ?? 0;
        showToast(t('Agente excluído com sucesso'), 'success', deletedCount > 0 ? `${deletedCount} ${t('diretório(s) removido(s)')}` : undefined);
      }

      setDeleteConfirm(null);
      loadAgents();
    } catch (err) {
      showToast(t('Erro ao excluir agente'), 'error', (err as Error).message);
    } finally {
      setDeleting(false);
    }
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
            workspace: (ca.workspace as string) || "",
            agentDir: (ca.agentDir as string) || "",
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
        <div className={`mc-toast mc-toast-${toast.type}`} role="status" aria-live="polite">
          <span className="mc-toast-icon">
            {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}
          </span>
          <div className="mc-toast-body">
            <span className="mc-toast-title">{toast.title}</span>
            {toast.desc && <span className="mc-toast-desc">{toast.desc}</span>}
          </div>
        </div>
      )}

      {modal && (
        <div className="mc-modal-overlay" onClick={() => setModal(null)}>
          <div className="mc-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="mc-modal-header">
              <h2 className="mc-modal-title">
                {modal.mode === 'new' ? t('Novo Agente') : t('Editar Agente')}
              </h2>
              <button className="mc-modal-close" onClick={() => setModal(null)} aria-label={t('Fechar')}>✕</button>
            </div>

            <div className="mc-modal-body">
              <div className="mc-form-field">
                <label className="mc-label" htmlFor="field-id">ID *</label>
                <input
                  id="field-id"
                  className="mc-input mono"
                  value={modal.form.id}
                  onChange={e => updateForm('id', e.target.value)}
                  placeholder="meu-agente"
                  readOnly={modal.mode === 'edit'}
                  disabled={modal.mode === 'edit'}
                />
              </div>
              <div className="mc-form-field">
                <label className="mc-label" htmlFor="field-name">{t('Nome')}</label>
                <input
                  id="field-name"
                  className="mc-input"
                  value={modal.form.name}
                  onChange={e => updateForm('name', e.target.value)}
                  placeholder={t('Nome de exibição')}
                />
              </div>
              <div className="mc-form-field">
                <label className="mc-label" htmlFor="field-model">{t('Modelo')}</label>
                <input
                  id="field-model"
                  className="mc-input mono"
                  value={modal.form.model}
                  onChange={e => updateForm('model', e.target.value)}
                  placeholder="claude-sonnet-4-6"
                />
              </div>
              <div className="mc-form-field">
                <label className="mc-label" htmlFor="field-workspace">Workspace</label>
                <input
                  id="field-workspace"
                  className="mc-input mono"
                  value={modal.form.workspace}
                  onChange={e => updateForm('workspace', e.target.value)}
                  placeholder="/caminho/do/workspace"
                />
              </div>
              <div className="mc-form-field">
                <label className="mc-label" htmlFor="field-agentdir">Agent Dir</label>
                <input
                  id="field-agentdir"
                  className="mc-input mono"
                  value={modal.form.agentDir}
                  onChange={e => updateForm('agentDir', e.target.value)}
                  placeholder="/caminho/do/agente"
                />
              </div>
            </div>

            <div className="mc-modal-footer">
              <button className="mc-btn mc-btn-secondary" onClick={() => setModal(null)} disabled={saving}>
                {t('Cancelar')}
              </button>
              <button className="mc-btn mc-btn-primary" onClick={saveAgent} disabled={saving}>
                {saving ? t('Salvando...') : t('Salvar')}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="mc-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="mc-modal mc-modal-danger" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="mc-modal-header">
              <h2 className="mc-modal-title">{t('Confirmar Exclusão')}</h2>
              <button className="mc-modal-close" onClick={() => setDeleteConfirm(null)} aria-label={t('Fechar')}>✕</button>
            </div>

            <div className="mc-modal-body">
              <p style={{ fontSize: 14, color: 'var(--mc-text-secondary)' }}>
                {t('Você está prestes a excluir permanentemente o agente')}:
              </p>
              <div className="mc-delete-agent-name">
                <span className="mc-dot mc-dot-offline" />
                <strong>{deleteConfirm.name}</strong>
                <span className="mono" style={{ fontSize: 11, color: 'var(--mc-text-muted)' }}>({deleteConfirm.id})</span>
              </div>

              {(deleteConfirm.agentDir || deleteConfirm.workspace) && (
                <div className="mc-delete-paths">
                  <p className="mc-label" style={{ marginBottom: 8 }}>{t('Arquivos e pastas que serão excluídos')}:</p>
                  {deleteConfirm.agentDir && (
                    <div className="mc-delete-path mono">
                      <span className="mc-delete-path-icon">🗂</span>
                      {deleteConfirm.agentDir}
                    </div>
                  )}
                  {deleteConfirm.workspace && (
                    <div className="mc-delete-path mono">
                      <span className="mc-delete-path-icon">📁</span>
                      {deleteConfirm.workspace}
                    </div>
                  )}
                </div>
              )}

              <div className="mc-alert mc-alert-error" style={{ marginTop: 8, fontSize: 12 }}>
                ⚠ {t('Esta ação é irreversível. Os arquivos físicos serão deletados permanentemente.')}
              </div>
            </div>

            <div className="mc-modal-footer">
              <button className="mc-btn mc-btn-secondary" onClick={() => setDeleteConfirm(null)} disabled={deleting}>
                {t('Cancelar')}
              </button>
              <button className="mc-btn mc-btn-danger" onClick={deleteAgent} disabled={deleting}>
                {deleting ? t('Excluindo...') : t('Excluir Permanentemente')}
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="mc-agentes-header mc-animate-in">
        <h1 className="mc-agentes-title">{t("Gerenciar Agentes")}</h1>
        <button
          className="mc-btn mc-btn-primary"
          onClick={openNew}
          onKeyDown={(e) => { if (e.key === 'Enter') openNew(); }}
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
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="mc-btn mc-btn-secondary mc-btn-sm"
                          onClick={() => openEdit(agent)}
                        >
                          {t("Editar")}
                        </button>
                        <button
                          className="mc-btn mc-btn-danger mc-btn-sm"
                          onClick={() => setDeleteConfirm(agent)}
                        >
                          {t("Excluir")}
                        </button>
                      </div>
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

        .mc-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.65);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999;
        }

        .mc-modal {
          background: var(--mc-bg-surface);
          border: 1px solid var(--mc-border);
          border-radius: 4px;
          width: 100%;
          max-width: 480px;
          max-height: 90vh;
          overflow-y: auto;
          margin: 16px;
        }

        .mc-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid var(--mc-border);
        }

        .mc-modal-title {
          font-size: 16px;
          font-weight: 700;
        }

        .mc-modal-close {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--mc-text-muted);
          font-size: 16px;
          padding: 4px 8px;
          line-height: 1;
        }

        .mc-modal-close:hover {
          color: var(--mc-text-primary);
        }

        .mc-modal-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .mc-form-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .mc-label {
          font-size: 11px;
          font-weight: 700;
          color: var(--mc-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .mc-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding: 16px 20px;
          border-top: 1px solid var(--mc-border);
        }

        input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .mc-btn-danger {
          background: transparent;
          border: 1px solid var(--mc-offline);
          color: var(--mc-offline);
        }

        .mc-btn-danger:hover:not(:disabled) {
          background: rgba(255, 80, 80, 0.1);
        }

        .mc-btn-danger:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .mc-modal-danger .mc-modal-header {
          border-left: 3px solid var(--mc-offline);
        }

        .mc-delete-agent-name {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: var(--mc-bg-deep);
          border: 1px solid var(--mc-border);
          border-radius: 2px;
          font-size: 14px;
        }

        .mc-delete-paths {
          padding: 12px 16px;
          background: var(--mc-bg-deep);
          border: 1px solid var(--mc-border);
          border-radius: 2px;
        }

        .mc-delete-path {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--mc-text-secondary);
          padding: 4px 0;
        }

        .mc-delete-path-icon {
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}
