"use client";

import React, { useState } from 'react';
import { api } from '../../src/lib/api';
import { t } from "../../src/lib/i18n";

type ToolResult = { ok: boolean; result?: unknown; error?: string };

export default function ToolsPanel() {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, ToolResult>>({});
  const [query, setQuery] = useState('');

  const runTool = async (tool: string, args: Record<string, unknown> = {}) => {
    const key = `${tool}-${Date.now()}`;
    setLoading(prev => ({ ...prev, [key]: true }));

    try {
      const res = await api.invokeTool(tool, args);
      setResults(prev => ({ ...prev, [key]: { ok: true, result: res } }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setResults(prev => ({ ...prev, [key]: { ok: false, error: msg } }));
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleSearch = () => {
    if (query) {
      runTool('web_search', { query });
      setQuery('');
    }
  };

  const clearResults = () => setResults({});

  return (
    <div className="mc-tools-panel">
      <div className="mc-tools-grid">
        {/* Status */}
        <button
          className="mc-tool-btn"
          onClick={() => runTool('session_status')}
          disabled={Object.values(loading).some(v => v)}
        >
          📊 {t("Status")}
        </button>

        {/* Sessions */}
        <button
          className="mc-tool-btn"
          onClick={() => runTool('sessions_list', { limit: 10 })}
          disabled={Object.values(loading).some(v => v)}
        >
          👥 {t("Sessões")}
        </button>

        {/* Web Search */}
        <div className="mc-tool-input-group">
          <label className="sr-only" htmlFor="tool-search-input">{t("Pesquisa Tática")}</label>
          <input
            id="tool-search-input"
            type="text"
            className="mc-input"
            placeholder={t("Pesquisar web...")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            aria-label={t("Pesquisar na web")}
          />
          <button
            className="mc-tool-btn mc-tool-search"
            onClick={handleSearch}
            disabled={!query || Object.values(loading).some(v => v)}
            aria-label={t("Buscar")}
          >
            🔍
          </button>
        </div>
      </div>

      <div className="mc-tools-results">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span className="mono" style={{ fontSize: 10 }}>{t("Resultados")}</span>
          <button className="mc-btn mc-btn-secondary mc-btn-sm" onClick={clearResults}>{t("Limpar")}</button>
        </div>

        {Object.entries(results).length === 0 && (
          <div className="mc-empty" style={{ padding: 12 }}>{t("Nenhum resultado")}</div>
        )}

        {Object.entries(results).map(([key, res]) => (
          <details key={key} className={`mc-tool-result ${res.ok ? 'mc-tool-ok' : 'mc-tool-err'}`} open>
            <summary>{key.split('-')[0].toUpperCase()}</summary>
            <pre className="mono mc-tool-output">{JSON.stringify(res.result || res.error, null, 2)}</pre>
          </details>
        ))}
      </div>

      <style jsx>{`
        .mc-tools-panel {
          display: flex;
          flex-direction: column;
          gap: var(--mc-space-sm);
        }
        .mc-tools-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 8px;
        }
        .mc-tool-btn {
          padding: 10px;
          border: 1px solid var(--mc-border);
          background: var(--mc-bg-surface);
          border-radius: 2px;
          font-size: 12px;
          cursor: pointer;
          transition: all var(--mc-duration-fast);
        }
        .mc-tool-btn:hover:not(:disabled) {
          border-color: var(--mc-accent);
          background: var(--mc-accent-glow);
        }
        .mc-tool-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .mc-tool-input-group {
          display: flex;
          gap: 4px;
        }
        .mc-tool-input-group input {
          flex: 1;
          font-size: 12px;
        }
        .mc-tool-search {
          min-width: 40px;
        }
        .mc-tools-results {
          max-height: 240px;
          overflow-y: auto;
          border: 1px solid var(--mc-border);
          border-radius: 2px;
          padding: 8px;
          background: var(--mc-bg-deep);
        }
        .mc-tool-result {
          margin-bottom: 8px;
        }
        .mc-tool-result summary {
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          padding: 4px;
          border-bottom: 1px solid var(--mc-border);
        }
        .mc-tool-ok summary { color: var(--mc-online); }
        .mc-tool-err summary { color: var(--mc-offline); }
        .mc-tool-output {
          font-size: 10px;
          max-height: 150px;
          overflow-y: auto;
          padding: 8px;
          margin: 0;
          white-space: pre-wrap;
          word-break: break-all;
        }
        .mc-btn-sm {
          padding: 2px 6px;
          font-size: 10px;
        }
        .mc-empty {
          color: var(--mc-text-muted);
          font-size: 11px;
          text-align: center;
        }
        @media (max-width: 640px) {
          .mc-tools-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}