"use client";

import React, { useState, useEffect } from "react";
import { api } from "../../src/lib/api";

type Task = {
  id: string;
  title: string;
  description: string;
  status?: string;
};

type Column = {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
};

const COLUMN_CONFIGS: { id: string; title: string; color: string }[] = [
  { id: "backlog", title: "Backlog", color: "var(--mc-text-muted)" },
  { id: "in_progress", title: "Em Progresso", color: "var(--mc-accent)" },
  { id: "review", title: "Revisão", color: "var(--mc-warning)" },
  { id: "done", title: "Concluído", color: "var(--mc-online)" },
];

export default function KanbanBoard() {
  const [columns, setColumns] = useState<Column[]>(
    COLUMN_CONFIGS.map((c) => ({ ...c, tasks: [] }))
  );
  const [draggedTask, setDraggedTask] = useState<{
    taskId: string;
    fromColumn: string;
  } | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const loadSessions = async () => {
    try {
      const [sessionsResult, cronResult] = await Promise.all([
        (api as Record<string, Function>).getSessions?.(20).catch(() => null),
        (api as Record<string, Function>).getCronJobs?.().catch(() => null),
      ]);

      let activeCronIds: string[] = [];
      if (cronResult && typeof cronResult === "object") {
        const c = cronResult as Record<string, unknown>;
        const jobs = Array.isArray(c.jobs) ? c.jobs : [];
        activeCronIds = jobs
          .filter((j: Record<string, unknown>) => j.enabled)
          .map((j: Record<string, unknown>) => j.id as string);
      }

      let sessions: Record<string, unknown>[] = [];
      if (Array.isArray(sessionsResult)) {
        sessions = sessionsResult;
      } else if (sessionsResult && typeof sessionsResult === "object") {
        const s = sessionsResult as Record<string, unknown>;
        sessions = (
          Array.isArray(s.sessions) ? s.sessions : Array.isArray(s.data) ? s.data : []
        ) as Record<string, unknown>[];
      }

      sessions = sessions.filter((s) => {
        const key = (s.key as string) || "";
        if (key.includes("cron:")) {
          const cronId = key.split("cron:").pop() || "";
          return activeCronIds.includes(cronId);
        }
        return true;
      });

      const now = Date.now();
      const backlog: Task[] = [];
      const inProgress: Task[] = [];
      const review: Task[] = [];
      const done: Task[] = [];

      sessions.forEach((s) => {
        const key = (s.key as string) || "";
        const updatedAt = (s.updatedAt as number) || 0;
        const age = now - updatedAt;

        const task: Task = {
          id: (s.sessionId as string) || key,
          title: (s.displayName as string) || (s.label as string) || key,
          description: `${(s.totalTokens as number) || 0} tokens · ${(s.model as string) || "N/A"}`,
          status: age < 60000 ? "trabalhando" : "inativo",
        };

        if (key.includes("cron:") || age < 300000) {
          inProgress.push(task);
        } else if (age < 3600000) {
          review.push(task);
        } else {
          done.push(task);
        }
      });

      if (inProgress.length === 0 && review.length === 0 && done.length === 0) {
        backlog.push({
          id: "placeholder",
          title: "Nenhuma tarefa",
          description: "Tarefas aparecerão aqui automaticamente",
        });
      }

      setColumns([
        { ...COLUMN_CONFIGS[0], tasks: backlog },
        { ...COLUMN_CONFIGS[1], tasks: inProgress },
        { ...COLUMN_CONFIGS[2], tasks: review },
        { ...COLUMN_CONFIGS[3], tasks: done },
      ]);
    } catch (err) {
      console.error("Kanban load error:", err);
    }
  };

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDragStart = (
    e: React.DragEvent,
    taskId: string,
    columnId: string
  ) => {
    setDraggedTask({ taskId, fromColumn: columnId });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, toColumnId: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (!draggedTask) return;

    const { taskId, fromColumn } = draggedTask;
    if (fromColumn === toColumnId) return;

    setColumns((prev) =>
      prev.map((col) => {
        if (col.id === fromColumn) {
          return { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) };
        }
        if (col.id === toColumnId) {
          const task = prev
            .find((c) => c.id === fromColumn)
            ?.tasks.find((t) => t.id === taskId);
          return task ? { ...col, tasks: [...col.tasks, task] } : col;
        }
        return col;
      })
    );
    setDraggedTask(null);
  };

  return (
    <div className="mc-kanban">
      {columns.map((col) => (
        <div
          key={col.id}
          className={`mc-kanban-col ${dragOverColumn === col.id ? "mc-kanban-col-dragover" : ""}`}
          onDragOver={(e) => handleDragOver(e, col.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, col.id)}
        >
          <div className="mc-kanban-col-header">
            <span
              className="mc-kanban-dot"
              style={{ background: col.color }}
            />
            <span className="mc-kanban-col-title">{col.title}</span>
            <span className="mc-kanban-count">{col.tasks.length}</span>
          </div>

          <div className="mc-kanban-tasks">
            {col.tasks.map((task, i) => (
              <div
                key={task.id}
                draggable={task.id !== "placeholder"}
                onDragStart={(e) => handleDragStart(e, task.id, col.id)}
                className={`mc-kanban-task mc-animate-in mc-stagger-${Math.min(i + 1, 6)}`}
              >
                <div className="mc-kanban-task-title">{task.title}</div>
                <div className="mc-kanban-task-desc mono">{task.description}</div>
                {task.status === "trabalhando" && (
                  <span className="mc-badge mc-badge-online" style={{ marginTop: 6 }}>
                    <span className="mc-dot mc-dot-online" style={{ width: 6, height: 6 }} />
                    Ativo
                  </span>
                )}
              </div>
            ))}

            {col.tasks.length === 0 && (
              <div className="mc-kanban-empty">Vazio</div>
            )}
          </div>
        </div>
      ))}

      <style>{`
        .mc-kanban {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          min-height: 300px;
        }

        .mc-kanban-col {
          background: var(--mc-bg-base);
          border: 1px solid var(--mc-border);
          border-radius: 2px;
          padding: 12px;
          transition: border-color var(--mc-duration-fast);
          display: flex;
          flex-direction: column;
        }

        .mc-kanban-col-dragover {
          border-color: var(--mc-accent);
          background: var(--mc-accent-glow);
        }

        .mc-kanban-col-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--mc-border);
        }

        .mc-kanban-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .mc-kanban-col-title {
          font-weight: 600;
          font-size: 13px;
          flex: 1;
        }

        .mc-kanban-count {
          font-size: 11px;
          color: var(--mc-text-muted);
          background: var(--mc-bg-elevated);
          padding: 1px 8px;
          border-radius: 2px;
        }

        .mc-kanban-tasks {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .mc-kanban-task {
          background: var(--mc-bg-surface);
          border: 1px solid var(--mc-border);
          border-radius: 2px;
          padding: 10px 12px;
          cursor: grab;
          transition: all var(--mc-duration-fast) var(--mc-ease-spring);
        }

        .mc-kanban-task:hover {
          border-color: var(--mc-border-strong);
          transform: translateY(-1px);
          box-shadow: var(--mc-shadow-sm);
        }

        .mc-kanban-task:active {
          cursor: grabbing;
          transform: scale(0.98);
        }

        .mc-kanban-task-title {
          font-weight: 600;
          font-size: 13px;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .mc-kanban-task-desc {
          font-size: 11px;
          color: var(--mc-text-muted);
        }

        .mc-kanban-empty {
          text-align: center;
          padding: 24px;
          color: var(--mc-text-muted);
          font-size: 12px;
          border: 1px dashed var(--mc-border);
          border-radius: 2px;
        }

        @media (max-width: 1024px) {
          .mc-kanban {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .mc-kanban {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
