"use client";

import React, { useState } from "react";
import { api } from "../../src/lib/api";
import { t } from "../../src/lib/i18n";

type ApiType = Record<string, (...args: unknown[]) => Promise<unknown>>;

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
      const result = await (api as ApiType).getConfig?.();
      const text =
        typeof result === "string" ? result : JSON.stringify(result, null, 2);
      setConfig(text);
      setStatus({ type: "success", text: t("Configuração carregada") });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t("Erro ao carregar");
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
          onKeyDown={(e) => { if (e.key === 'Enter') loadConfig(); }}
          disabled={loading}
        >
          {loading ? t("Carregando...") : t("Carregar Config")}
        </button>
      </div>

      {status && (
        <div className={`mc-alert ${status.type === "success" ? "mc-alert-success" : "mc-alert-error"}`}>
          {status.text}
        </div>
      )}

      {config && (
        <div className="mc-config-field">
          <label className="mc-label" htmlFor="config-textarea">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6, verticalAlign: 'middle' }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            {t("Configuração do Sistema (JSON)")}
          </label>
          <textarea
            id="config-textarea"
            className="mc-input mc-config-textarea mono"
            value={config}
            onChange={(e) => setConfig(e.target.value)}
            rows={10}
            spellCheck={false}
            aria-label={t("Editor de Configuração")}
          />
        </div>
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
