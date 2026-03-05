"use client";

import React, { useState } from 'react';
import { api } from '../../src/lib/api';

type ToolResult = { ok: boolean; result?: any; error?: string };

export default function ToolsPanel() {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, ToolResult>>({});
  const [query, setQuery] = useState('');

  const runTool = async (tool: string, args: any = {}) => {
    const key = `${tool}-${Date.now()}`;
    setLoading({ ...loading, [key]: true });
    setResults({ ...results, [key]: { ok: false } });

    try {
      const res = await api.invokeTool(tool, args);
      setResults({ ...results, [key]: { ok: true, result: res } });
    } catch (err: any) {
      setResults({ ...results, [key]: { ok: false, error: err.message } });
    } finally {
      setLoading({ ...loading, [key]: false });
    }
  };

  const clearResults = () => setResults({});

  return (
    <div className="mc-tools-panel">
      <h3 className="mc-section-title">Tools Rápidas</h3>

      <div className="mc-tools-grid">
        {/* Status */}
        <button 
          className="mc-tool-btn" 
          onClick={() => runTool('session_status')}
          disabled={loading.session_status}
        >
          📊 Status
        </button>

        {/* Sessions */}
        <button 
          className="mc-tool-btn" 
          onClick={() => runTool('sessions_list', { limit: 10 })}
          disabled={loading.sessions_list}
        >
          👥 Sessões
        </button>

        {/* Subagents */}
        <button 
          className="mc-tool-btn" 
          onClick={() => runTool('subagents', { action: 'list' })}
          disabled={loading.subagents}
        >
          🐛 Sub-Agents
        </button>

        {/* Web Search */}
        <div className="mc-tool-input-group">
          <input
            type="text"
            className="mc-input"
            placeholder="Pesquisar web..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            className="mc-tool-btn mc-tool-search"
            onClick={() => {
              if (query) runTool('web_search', { query });
              setQuery('');
            }}
            disabled={!query || loading.web_search}
          >
            🔍
          </button>
        </div>

        {/* Spawn Subagent */}
        <div className="mc-tool-input-group">
          <input
            type="text"
            className="mc-input"
            placeholder="Task pro sub-agent..."
            onKeyPress={(e) => e.key === 'Enter' && runTool('sessions_spawn', { task: e.currentTarget.value, runtime: 'subagent' })}
          />
        </div>
      </div>

      <div className="mc-tools-results">
        <button className="mc-btn mc-btn-secondary mc-btn-sm" onClick={clearResults}>Limpar</button>
        {Object.entries(results).map(([key, res]) => (
          <details key={key} className={`mc-tool-result ${res.ok ? 'mc-tool-ok' : 'mc-tool-err'}`}>
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
          max-height: 200px;
          overflow-y: auto;
          border: 1px solid var(--mc-border);
          border-radius: 2px;
          padding: 8px;
        }
        .mc-tool-result {
          margin-bottom: 8px;
        }
        .mc-tool-result summary {
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          padding: 4px;
        }
        .mc-tool-ok summary { color: var(--mc-online); }
        .mc-tool-err summary { color: var(--mc-offline); }
        .mc-tool-output {
          font-size: 11px;
          max-height: 120px;
          overflow-y: auto;
          background: var(--mc-bg-deep);
          padding: 8px;
          border-radius: 2px;
          margin-top: 4px;
        }
        .mc-btn-sm {
          padding: 4px 8px;
          font-size: 11px;
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