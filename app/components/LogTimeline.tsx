"use client";

import React, { useEffect, useRef } from "react";

type Props = {
  logs: string[];
};

export default function LogTimeline({ logs }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="mc-log-timeline" ref={containerRef}>
      {logs.length === 0 ? (
        <div className="mc-log-empty">Aguardando logs...</div>
      ) : (
        logs.map((log, i) => (
          <div key={i} className="mc-log-entry mc-animate-in" style={{ animationDelay: `${i * 30}ms` }}>
            <span className="mc-log-bullet" />
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

        .mc-log-entry:last-child .mc-log-bullet {
          background: var(--mc-accent);
        }

        .mc-log-text {
          font-size: 12px;
          color: var(--mc-text-secondary);
          line-height: 1.5;
          word-break: break-word;
        }
      `}</style>
    </div>
  );
}
