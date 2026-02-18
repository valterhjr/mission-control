"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../src/lib/api";

type GatewayStatus = {
  online: boolean;
  sessionCount: number;
  cronCount: number;
};

export default function Home() {
  const [status, setStatus] = useState<GatewayStatus>({
    online: false,
    sessionCount: 0,
    cronCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [sessions, crons] = await Promise.all([
          (api as Record<string, Function>).getSessions?.(10).catch(() => null),
          (api as Record<string, Function>).getCronJobs?.().catch(() => null),
        ]);

        let sessionArr: unknown[] = [];
        if (Array.isArray(sessions)) sessionArr = sessions;
        else if (sessions && typeof sessions === "object") {
          sessionArr =
            (sessions as Record<string, unknown[]>).sessions ??
            (sessions as Record<string, unknown[]>).data ??
            [];
        }

        let cronArr: unknown[] = [];
        if (crons && typeof crons === "object") {
          const c = crons as Record<string, unknown>;
          cronArr = Array.isArray(c.jobs) ? c.jobs : [];
        }

        setStatus({
          online: true,
          sessionCount: sessionArr.length,
          cronCount: cronArr.length,
        });
      } catch {
        setStatus({ online: false, sessionCount: 0, cronCount: 0 });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cards = [
    {
      href: "/dashboard",
      title: "Painel",
      desc: "Monitoramento em tempo real de agentes e tarefas",
      icon: (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="var(--mc-accent)" strokeWidth="1.5">
          <rect x="3" y="3" width="11" height="11" />
          <rect x="18" y="3" width="11" height="11" />
          <rect x="3" y="18" width="11" height="11" />
          <rect x="18" y="18" width="11" height="11" />
        </svg>
      ),
    },
    {
      href: "/agentes",
      title: "Agentes",
      desc: "Cadastro, configuração e gerenciamento de agentes",
      icon: (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="var(--mc-accent)" strokeWidth="1.5">
          <circle cx="16" cy="11" r="6" />
          <path d="M5 28c0-6.08 4.92-11 11-11s11 4.92 11 11" />
        </svg>
      ),
    },
  ];

  return (
    <div className="mc-home">
      {/* ── Hero ── */}
      <header className="mc-home-hero mc-animate-in">
        <h1 className="mc-home-title">
          Mission<span className="mc-home-accent">Control</span>
        </h1>
        <p className="mc-home-subtitle">
          Centro de comando para seus agentes de IA
        </p>

        {/* ── Status Bar ── */}
        <div className="mc-home-status mc-animate-in mc-stagger-1">
          {loading ? (
            <div className="mc-skeleton" style={{ width: 200, height: 20 }} />
          ) : (
            <>
              <span className={`mc-dot ${status.online ? "mc-dot-online" : "mc-dot-offline"}`} />
              <span className="mono" style={{ fontSize: 13 }}>
                Gateway {status.online ? "Online" : "Offline"}
              </span>
              {status.online && (
                <>
                  <span className="mc-home-divider">|</span>
                  <span className="mono" style={{ fontSize: 13 }}>
                    {status.sessionCount} sessões
                  </span>
                  <span className="mc-home-divider">|</span>
                  <span className="mono" style={{ fontSize: 13 }}>
                    {status.cronCount} crons
                  </span>
                </>
              )}
            </>
          )}
        </div>
      </header>

      {/* ── Navigation Cards ── */}
      <section className="mc-home-grid">
        {cards.map((card, i) => (
          <Link
            key={card.href}
            href={card.href}
            className={`mc-home-card mc-animate-in mc-stagger-${i + 2}`}
          >
            <div className="mc-home-card-icon">{card.icon}</div>
            <div>
              <h2 className="mc-home-card-title">{card.title}</h2>
              <p className="mc-home-card-desc">{card.desc}</p>
            </div>
            <svg className="mc-home-card-arrow" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M7 4l6 6-6 6" />
            </svg>
          </Link>
        ))}
      </section>

      <style>{`
        .mc-home {
          padding: var(--mc-space-2xl);
          max-width: 960px;
        }

        .mc-home-hero {
          margin-bottom: var(--mc-space-3xl);
        }

        .mc-home-title {
          font-size: 56px;
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1.1;
          margin-bottom: 12px;
        }

        .mc-home-accent {
          color: var(--mc-accent);
        }

        .mc-home-subtitle {
          font-size: 18px;
          color: var(--mc-text-secondary);
          margin: 0 0 24px;
          max-width: 480px;
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
        }

        .mc-home-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: var(--mc-space-md);
        }

        .mc-home-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 24px;
          background: var(--mc-bg-surface);
          border: 1px solid var(--mc-border);
          border-radius: 2px;
          text-decoration: none;
          color: var(--mc-text-primary);
          transition: all var(--mc-duration-normal) var(--mc-ease-spring);
        }

        .mc-home-card:hover {
          border-color: var(--mc-accent);
          box-shadow: 0 0 24px var(--mc-accent-glow);
          transform: translateY(-2px);
        }

        .mc-home-card:hover .mc-home-card-arrow {
          transform: translateX(4px);
          color: var(--mc-accent);
        }

        .mc-home-card-icon {
          flex-shrink: 0;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--mc-accent-glow);
          border-radius: 2px;
        }

        .mc-home-card-title {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .mc-home-card-desc {
          font-size: 13px;
          color: var(--mc-text-secondary);
          margin: 0;
        }

        .mc-home-card-arrow {
          margin-left: auto;
          flex-shrink: 0;
          color: var(--mc-text-muted);
          transition: all var(--mc-duration-normal) var(--mc-ease-spring);
        }

        @media (max-width: 768px) {
          .mc-home {
            padding: var(--mc-space-lg);
          }
          .mc-home-title {
            font-size: 36px;
          }
          .mc-home-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
