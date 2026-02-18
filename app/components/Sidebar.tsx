"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const NAV_ITEMS = [
    {
        href: "/",
        label: "Início",
        icon: (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 10L10 3l7 7v7a1 1 0 01-1 1h-4v-5H8v5H4a1 1 0 01-1-1v-7z" />
            </svg>
        ),
    },
    {
        href: "/dashboard",
        label: "Painel",
        icon: (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="2" width="7" height="7" />
                <rect x="11" y="2" width="7" height="7" />
                <rect x="2" y="11" width="7" height="7" />
                <rect x="11" y="11" width="7" height="7" />
            </svg>
        ),
    },
    {
        href: "/agentes",
        label: "Agentes",
        icon: (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="10" cy="7" r="4" />
                <path d="M3 18c0-3.87 3.13-7 7-7s7 3.13 7 7" />
            </svg>
        ),
    },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="mc-sidebar">
            {/* ── Brand ── */}
            <div className="mc-sidebar-brand">
                <div className="mc-sidebar-logo">
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                        <rect width="28" height="28" rx="2" fill="var(--mc-accent)" />
                        <path
                            d="M8 14l4-6 4 6-4 6-4-6z"
                            fill="#fff"
                            opacity="0.9"
                        />
                        <path
                            d="M14 8l4 6-4 6"
                            stroke="#fff"
                            strokeWidth="1.5"
                            fill="none"
                            opacity="0.5"
                        />
                    </svg>
                </div>
                <div className="mc-sidebar-brandtext">
                    <span className="mc-sidebar-title">Mission Control</span>
                    <span className="mc-sidebar-subtitle">OpenClaw</span>
                </div>
            </div>

            {/* ── Navigation ── */}
            <nav className="mc-sidebar-nav">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`mc-sidebar-link ${isActive ? "mc-sidebar-link-active" : ""}`}
                        >
                            <span className="mc-sidebar-icon">{item.icon}</span>
                            <span>{item.label}</span>
                            {isActive && <span className="mc-sidebar-indicator" />}
                        </Link>
                    );
                })}
            </nav>

            {/* ── Footer ── */}
            <div className="mc-sidebar-footer">
                <div className="mc-sidebar-status">
                    <span className="mc-dot mc-dot-online" />
                    <span className="mono" style={{ fontSize: 11 }}>
                        Gateway Online
                    </span>
                </div>
            </div>

            <style>{`
        .mc-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          width: var(--mc-sidebar-width);
          height: 100vh;
          background: var(--mc-bg-base);
          border-right: 1px solid var(--mc-border);
          display: flex;
          flex-direction: column;
          z-index: 50;
          animation: mc-slide-in-left var(--mc-duration-slow) var(--mc-ease-out) both;
        }

        .mc-sidebar-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 20px 16px;
          border-bottom: 1px solid var(--mc-border);
        }

        .mc-sidebar-logo {
          flex-shrink: 0;
        }

        .mc-sidebar-brandtext {
          display: flex;
          flex-direction: column;
        }

        .mc-sidebar-title {
          font-weight: 700;
          font-size: 15px;
          letter-spacing: -0.02em;
          color: var(--mc-text-primary);
        }

        .mc-sidebar-subtitle {
          font-size: 11px;
          color: var(--mc-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .mc-sidebar-nav {
          flex: 1;
          padding: 12px 8px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .mc-sidebar-link {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 2px;
          color: var(--mc-text-secondary);
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          transition: all var(--mc-duration-fast) var(--mc-ease-out);
        }

        .mc-sidebar-link:hover {
          background: var(--mc-bg-hover);
          color: var(--mc-text-primary);
        }

        .mc-sidebar-link-active {
          background: var(--mc-accent-glow);
          color: var(--mc-accent) !important;
        }

        .mc-sidebar-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        .mc-sidebar-indicator {
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 20px;
          background: var(--mc-accent);
          border-radius: 2px 0 0 2px;
        }

        .mc-sidebar-footer {
          padding: 16px 20px;
          border-top: 1px solid var(--mc-border);
        }

        .mc-sidebar-status {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--mc-text-muted);
        }

        .mc-shell {
          display: flex;
          min-height: 100vh;
        }

        .mc-main {
          flex: 1;
          margin-left: var(--mc-sidebar-width);
          min-height: 100vh;
          overflow-x: hidden;
        }

        @media (max-width: 768px) {
          .mc-sidebar {
            width: var(--mc-sidebar-collapsed);
          }
          .mc-sidebar-brandtext,
          .mc-sidebar-link span:not(.mc-sidebar-icon) {
            display: none;
          }
          .mc-main {
            margin-left: var(--mc-sidebar-collapsed);
          }
        }
      `}</style>
        </aside>
    );
}
