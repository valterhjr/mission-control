import React from "react";

type Props = {
  name: string;
  id: string;
  status: string;
  lastActivity?: string;
  type?: string;
};

export default function AgentCard({
  name,
  id,
  status,
  lastActivity,
  type = "chat",
}: Props) {
  const isOnline = status === "Online";

  const typeLabel: Record<string, string> = {
    chat: "CHAT",
    cron: "CRON",
    automation: "AUTO",
    monitoring: "MON",
  };

  return (
    <div className="mc-agent-card">
      <div className="mc-agent-card-header">
        <span className={`mc-dot ${isOnline ? "mc-dot-online" : "mc-dot-offline"}`} />
        <strong className="mc-agent-card-name">{name}</strong>
        <span className={`mc-badge ${isOnline ? "mc-badge-online" : "mc-badge-offline"}`}>
          {isOnline ? "Online" : "Offline"}
        </span>
      </div>

      <div className="mc-agent-card-meta">
        <span className="mc-badge mc-badge-accent">{typeLabel[type] ?? "AGENT"}</span>
      </div>

      <div className="mc-agent-card-footer">
        <span className="mono mc-agent-card-id">{id}</span>
        {lastActivity && (
          <span className="mc-agent-card-time">{lastActivity}</span>
        )}
      </div>

      <style>{`
        .mc-agent-card {
          background: var(--mc-bg-surface);
          border: 1px solid var(--mc-border);
          border-radius: 2px;
          padding: 16px;
          transition: all var(--mc-duration-normal) var(--mc-ease-spring);
        }

        .mc-agent-card:hover {
          border-color: var(--mc-border-strong);
          box-shadow: var(--mc-shadow-md);
          transform: translateY(-2px);
        }

        .mc-agent-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }

        .mc-agent-card-name {
          flex: 1;
          font-size: 14px;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .mc-agent-card-meta {
          margin-bottom: 12px;
        }

        .mc-agent-card-footer {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .mc-agent-card-id {
          font-size: 11px;
          color: var(--mc-text-muted);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .mc-agent-card-time {
          font-size: 11px;
          color: var(--mc-text-muted);
        }
      `}</style>
    </div>
  );
}
