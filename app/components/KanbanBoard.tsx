"use client";
import React, { useState, useEffect } from 'react';
import { api } from '../../src/lib/api';

type Task = {
  id: string;
  title: string;
  description: string;
  status?: string;
};

type Column = {
  id: string;
  title: string;
  tasks: Task[];
};

export default function KanbanBoard() {
  const [columns, setColumns] = useState<Column[]>([
    { id: 'backlog', title: 'Backlog', tasks: [] },
    { id: 'in_progress', title: 'Em Progresso', tasks: [] },
    { id: 'review', title: 'Revisão', tasks: [] },
    { id: 'done', title: 'Concluído', tasks: [] },
  ]);

  const [draggedTask, setDraggedTask] = useState<{ taskId: string; fromColumn: string } | null>(null);

  const loadSessions = async () => {
    try {
      // Get sessions and cron jobs to filter valid ones
      const [sessionsResult, cronResult] = await Promise.all([
        (api as any).getSessions?.(20).catch(() => null),
        (api as any).getCronJobs?.().catch(() => null)
      ]);
      
      // Get enabled cron job IDs
      let activeCronIds: string[] = [];
      if (cronResult && typeof cronResult === 'object') {
        const jobs = cronResult.jobs || [];
        activeCronIds = jobs.filter((j: any) => j.enabled).map((j: any) => j.id);
      }
      
      // Handle different response structures
      let sessions: any[] = [];
      if (Array.isArray(sessionsResult)) {
        sessions = sessionsResult;
      } else if (sessionsResult && typeof sessionsResult === 'object') {
        sessions = sessionsResult.sessions || sessionsResult.data || [];
      }
      
      // Filter: only show active cron jobs or recent sessions
      sessions = sessions.filter((s: any) => {
        const key = s.key || '';
        if (key.includes('cron:')) {
          const cronId = key.split('cron:').pop() || '';
          return activeCronIds.includes(cronId); // Only show enabled crons
        }
        return true; // Show all regular sessions
      });
      
      const now = Date.now();
      const backlog: Task[] = [];
      const inProgress: Task[] = [];
      const review: Task[] = [];
      const done: Task[] = [];

      sessions.forEach((s: any) => {
        const key = s.key || '';
        const updatedAt = s.updatedAt || 0;
        const age = now - updatedAt;
        
        const task: Task = {
          id: s.sessionId || key,
          title: s.displayName || s.label || key,
          description: `Tokens: ${s.totalTokens || 0} | Modelo: ${s.model || 'N/A'}`,
          status: age < 60000 ? 'trabalhando' : 'inativo',
        };

        // Categorize based on session type and activity
        if (key.includes('cron:')) {
          // Cron jobs = active tasks → Em Progresso
          inProgress.push(task);
        } else if (age < 60000) {
          // Less than 1 minute = currently working
          inProgress.push(task);
        } else if (age < 300000) {
          // Less than 5 minutes = recently active
          inProgress.push(task);
        } else if (age < 3600000) {
          // Less than 1 hour = review
          review.push(task);
        } else {
          // Older = done
          done.push(task);
        }
      });

      setColumns([
        { id: 'backlog', title: 'Backlog', tasks: backlog.length ? backlog : [{ id: '1', title: 'Aguardando', description: 'Novas tarefas aparecerão aqui' }] },
        { id: 'in_progress', title: 'Em Progresso', tasks: inProgress },
        { id: 'review', title: 'Revisão', tasks: review },
        { id: 'done', title: 'Concluído', tasks: done },
      ]);
    } catch (err) {
      console.error('Kanban load error:', err);
    }
  };

  // Load on mount and refresh every 10 seconds
  useEffect(() => {
    loadSessions();
    
    const interval = setInterval(() => {
      loadSessions();
    }, 10000); // Auto-refresh every 10s
    
    return () => clearInterval(interval);
  }, []);

  const handleDragStart = (e: React.DragEvent, taskId: string, columnId: string) => {
    setDraggedTask({ taskId, fromColumn: columnId });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, toColumnId: string) => {
    e.preventDefault();
    if (!draggedTask) return;

    const { taskId, fromColumn } = draggedTask;
    if (fromColumn === toColumnId) return;

    setColumns((prev) => {
      const newCols = prev.map((col) => {
        if (col.id === fromColumn) {
          return { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) };
        }
        if (col.id === toColumnId) {
          const task = prev.find((c) => c.id === fromColumn)?.tasks.find((t) => t.id === taskId);
          return task ? { ...col, tasks: [...col.tasks, task] } : col;
        }
        return col;
      });
      return newCols;
    });

    setDraggedTask(null);
  };

  return (
    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: 8 }}>
      {columns.map((col) => (
        <div
          key={col.id}
          style={{
            minWidth: 180,
            background: '#1a1a2e',
            borderRadius: 8,
            padding: 12,
            border: '1px solid #2a2a3e',
          }}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, col.id)}
        >
          <div style={{ fontWeight: 'bold', marginBottom: 12, color: '#88f' }}>
            {col.title} ({col.tasks.length})
          </div>
          {col.tasks.map((task) => (
            <div
              key={task.id}
              draggable
              onDragStart={(e) => handleDragStart(e, task.id, col.id)}
              style={{
                background: '#2a2a3e',
                padding: 10,
                borderRadius: 6,
                marginBottom: 8,
                cursor: 'grab',
                border: '1px solid #3a3a5e',
              }}
            >
              <div style={{ fontWeight: 500, fontSize: 13 }}>{task.title}</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{task.description}</div>
              {task.status === 'trabalhando' && (
                <div style={{ fontSize: 10, color: '#4f4', marginTop: 4 }}>● Trabalhando</div>
              )}
            </div>
          ))}
          {col.tasks.length === 0 && (
            <div style={{ color: '#666', fontSize: 12, textAlign: 'center', padding: 20 }}>
              Nenhuma tarefa
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
