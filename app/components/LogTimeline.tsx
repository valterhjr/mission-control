"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../../src/lib/api";

type Props = {}; // Standalone now

export default function LogTimeline() {
  const [logs, setLogs] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getLogs(100, search || undefined);
      const logText = typeof result === "string" ? result : 
        Array.isArray(result?.content) ? result.content[0]?.text || "" : 
        result?.content || "No logs";
      
      const lines = logText.split("\n").filter(Boolean).slice(-50); // Last 50
      setLogs(lines);
    } catch (err) {
      console.error("Logs fetch error:", err);
      setLogs(["Erro ao carregar logs: " + (err as Error)?.message]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000); // Poll 3s
    return () => clearInterval(interval);
  }, [fetchLogs]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const isError = (log: string) => /error|fail|warn/i.test(log);

  return (
    <div className="mc-log-timeline">
      <div className="mc-log-search">
        <input
          type="text"
          className="mc-input mono"
          placeholder="Filtrar logs (error, warn...)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="mc-btn mc-btn-secondary" onClick={fetchLogs} disabled={loading}>
          {loading ? "🔄" : "Atualizar"}
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="mc-log-empty">Aguardando logs...</div>
      ) : (
        logs.map((log, i) => (
          <div 
            key={i} 
            className={`mc-log-entry mc-animate-in ${isError(log) ? "mc-log-error" : ""}`} 
            style={{ animationDelay: `${i * 20}ms` }}
          >
            <span className={`mc-log-bullet ${isError(log) ? "mc-log-bullet-error" : ""}`} />
            <span className="mono mc-log-text">{log}</span>
          </div>
        ))
      )}

      <style>{`
        .mc-log-timeline {
          max-height: 320px;
          overflow-y: auto;
          padding: 8px 0;
        }

        .mc-log-search {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--mc-border);
        }

        .mc-log-search input {
          flex: 1;
          font-size: 12px;
        }

        .mc-log-empty {
          text-align: center;
          padding: 32px;
          color: var(--mc-text-muted);
          font-size: 13px;
        }

        .mc-log-entry {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 6px 12px;
          border-left: 2px solid var(--mc-border);
          margin-left: 8px;
          transition: background var(--mc-duration-fast) var(--mc-ease-out);
        }

        .mc-log-entry:hover {
          background: var(--mc-bg-hover);
        }

        .mc-log-entry.mc-log-error {
          border-left-color: var(--mc-offline);
        }

        .mc-log-entry:last-child {
          border-left-color: var(--mc-accent);
        }

        .mc-log-bullet {
          width: 6px;
          height: 6px;
          background: var(--mc-border-strong);
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 6px;
        }

        .mc-log-entry.mc-log-error .mc-log-bullet {
          background: var(--mc-offline);
        }

        .mc-log-entry:last-child .mc-log-bullet {
          background: var(--mc-accent);
        }

        .mc-log-text {
          font-size: 12px;
          color: var(--mc-text-secondary);
          line-height: 1.5;
          word-break: break-word;
        }

        .mc-log-entry.mc-log-error .mc-log-text {
          color: var(--mc-offline);
        }
      `}</style>
    </div>
  );
}
