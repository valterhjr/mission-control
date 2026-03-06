"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { t } from "../../src/lib/i18n";

export default function LoginPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    document.title = "Acesso — Mission Control";
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (res.ok) {
        router.refresh();
        router.push("/");
      } else {
        setError(true);
        setCode("");
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": t("Acesso ao Mission Control"),
    "description": t("Página de autenticação segura para o gateway Mission Control."),
    "author": { "@type": "Organization", "name": "OpenClaw" }
  };

  return (
    <div className="mc-login-shell">
      <title>{t("Acesso — Mission Control")}</title>
      <meta name="description" content={t("Acesso restrito ao Gateway do Mission Control")} />
      <meta name="author" content="OpenClaw" />
      <meta property="og:title" content={t("Acesso — Mission Control")} />
      <meta property="og:description" content={t("Acesso restrito ao Gateway do Mission Control")} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="mc-login-card mc-animate-in">
        <header className="mc-login-header">
          <h2 className="sr-only">{t("Sistema de Autenticação")}</h2>
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="2" fill="var(--mc-accent)" />
            <path d="M8 14l4-6 4 6-4 6-4-6z" fill="#fff" opacity="0.9" />
            <path
              d="M14 8l4 6-4 6"
              stroke="#fff"
              strokeWidth="1.5"
              fill="none"
              opacity="0.5"
            />
          </svg>
          <h1 className="mc-login-title">
            Mission<span style={{ color: "var(--mc-accent)" }}>Control</span>
          </h1>
          <p className="mc-login-subtitle">SECURE ACCESS GATEWAY</p>
        </header>

        <form onSubmit={handleLogin} className="mc-login-form">
          <div className={`mc-login-input-wrap ${error ? "mc-error" : ""}`}>
            <label className="mc-label" style={{ textAlign: 'left' }} htmlFor="access-code-input">{t("Código de Acesso:")}</label>
            <input
              id="access-code-input"
              type="password"
              className="mc-login-input mono"
              placeholder="ACCESS CODE //"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError(false);
              }}
              disabled={loading}
              autoFocus
              aria-label="Código de Acesso"
            />
            {loading && <div className="mc-login-spinner" />}
          </div>

          <button
            type="submit"
            className="mc-btn mc-btn-primary mc-login-btn"
            disabled={loading || !code}
          >
            {loading ? "AUTHENTICATING..." : "GRANT ACCESS"}
          </button>
        </form>

        <div className="mc-login-footer">
          <h2 className="sr-only">{t("Sessão e Terminal")}</h2>
          <span className="mono" style={{ fontSize: 10, color: "var(--mc-text-muted)" }}>
            ID: {Math.random().toString(36).substring(7).toUpperCase()}
          </span>
          <span className="mc-dot mc-dot-online" />
        </div>
      </div>

      <style>{`
        .mc-login-shell {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at center, var(--mc-bg-base) 0%, var(--mc-bg-deep) 100%);
        }

        .mc-login-card {
          width: 100%;
          max-width: 360px;
          padding: 40px;
          background: var(--mc-bg-surface);
          border: 1px solid var(--mc-border);
          border-radius: 2px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
          text-align: center;
        }

        .mc-login-title {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin: 16px 0 4px;
        }

        .mc-login-subtitle {
          font-size: 11px;
          color: var(--mc-text-muted);
          letter-spacing: 0.15em;
          margin-bottom: 32px;
        }

        .mc-login-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .mc-login-input-wrap {
          position: relative;
        }

        .mc-login-input {
          width: 100%;
          padding: 14px;
          background: var(--mc-bg-deep);
          border: 1px solid var(--mc-border);
          color: var(--mc-text-primary);
          text-align: center;
          font-size: 14px;
          letter-spacing: 0.1em;
          outline: none;
          transition: all 0.2s ease;
        }

        .mc-login-input:focus {
          border-color: var(--mc-accent);
          box-shadow: 0 0 0 2px var(--mc-accent-glow);
        }

        .mc-error .mc-login-input {
          border-color: var(--mc-offline);
          color: var(--mc-offline);
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }

        .mc-login-btn {
          width: 100%;
          padding: 14px;
          letter-spacing: 0.05em;
        }

        .mc-login-footer {
          margin-top: 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          opacity: 0.6;
        }

        .mc-login-spinner {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          border: 2px solid var(--mc-border);
          border-top-color: var(--mc-accent);
          border-radius: 50%;
          animation: mc-spin 0.8s linear infinite;
        }

        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}</style>
    </div>
  );
}
