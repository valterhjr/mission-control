"use client";

import React, { useState } from "react";
import { api } from "../../src/lib/api";

export default function ConfigEditor() {
  const [config, setConfig] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadConfig = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const result = await (api as Record<string, Function>).getConfig?.();
      const text =
        typeof result === "string" ? result : JSON.stringify(result, null, 2);
      setConfig(text);
      setStatus({ type: "success", text: "Configuração carregada" });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar";
      setStatus({ type: "error", text: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mc-config">
      <div className="mc-config-actions">
        <button
          className="mc-btn mc-btn-secondary"
          onClick={loadConfig}
          disabled={loading}
        >
          {loading ? "Carregando..." : "Carregar Config"}
        </button>
      </div>

      {status && (
        <div className={`mc-alert ${status.type === "success" ? "mc-alert-success" : "mc-alert-error"}`}>
          {status.text}
        </div>
      )}

      {config && (
        <textarea
          className="mc-input mc-config-textarea mono"
          value={config}
          onChange={(e) => setConfig(e.target.value)}
          rows={10}
          spellCheck={false}
        />
      )}

      <style>{`
        .mc-config {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .mc-config-actions {
          display: flex;
          gap: 8px;
        }

        .mc-config-textarea {
          resize: vertical;
          min-height: 120px;
          font-size: 12px;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
}
