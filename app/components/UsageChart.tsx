"use client";

import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainerProps
} from 'recharts';

import { api } from '../../src/lib/api';

type SessionData = {
  key: string;
  totalTokens: number;
  model?: string;
  updatedAt?: number;
};

type UsageStats = {
  sessions: SessionData[];
  totalTokensIn: number;
  totalTokensOut: number;
};

export default function UsageChart() {
  const [data, setData] = useState<{ bars: any[], lines: any[] }>({ bars: [], lines: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sessionsRaw = await api.getSessions(20);
        const sessions: SessionData[] = Array.isArray(sessionsRaw) ? sessionsRaw : (sessionsRaw?.sessions || sessionsRaw?.data || []);

        // Bar data: tokens por model
        const modelTokens: Record<string, number> = {};
        const modelCount: Record<string, number> = {};
        let totalIn = 0;
        let totalOut = 0;

        sessions.forEach((s: any) => {
          const model = s.model || 'unknown';
          const tokensIn = s.totalTokens || 0;
          const tokensOut = s.outputTokens || 0;

          modelTokens[model] = (modelTokens[model] || 0) + tokensIn;
          modelCount[model] = (modelCount[model] || 0) + 1;
          totalIn += tokensIn;
          totalOut += tokensOut;
        });

        const barData = Object.entries(modelTokens).map(([model, tokens]) => ({
          model,
          tokens,
          count: modelCount[model],
          density: modelCount[model] > 0 ? tokens / modelCount[model] : 0
        }));

        // Line data: atividade por hora (últimas 24h)
        const now = Date.now();
        const hourData: Record<string, number> = {};
        sessions.forEach((s: any) => {
          if (s.updatedAt) {
            const hour = new Date(s.updatedAt).toISOString().slice(0, 13); // YYYY-MM-DDTHH
            hourData[hour] = (hourData[hour] || 0) + 1;
          }
        });

        const lineData = Object.entries(hourData)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([hour, count]) => ({ hour, sessions: count }));

        setData({ bars: barData.slice(0, 10), lines: lineData.slice(-12) }); // Top 10 models, last 12 hours
      } catch (err) {
        console.error('Chart data error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="mc-chart-skeleton">Carregando gráficos...</div>;
  }

  return (
    <div className="mc-usage-charts">
      <h3 className="mc-section-title">Uso & Atividade</h3>
      
      <div className="mc-chart-row">
        <div className="mc-chart-container">
          <h4>Tokens por Model (Top 10)</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.bars}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="model" angle={-45} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="tokens" fill="#8884d8" name="Tokens In" />
              <Bar dataKey="density" fill="#82ca9d" name="Avg/Session" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mc-chart-container">
          <h4>Sessões por Hora (Últimas 12h)</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.lines}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" angle={-45} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sessions" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <style jsx>{`
        .mc-usage-charts {
          padding: var(--mc-space-md);
        }
        .mc-section-title {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: var(--mc-space-md);
        }
        .mc-chart-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--mc-space-md);
        }
        .mc-chart-container {
          background: var(--mc-bg-surface);
          border: 1px solid var(--mc-border);
          border-radius: 2px;
          padding: var(--mc-space-md);
        }
        .mc-chart-container h4 {
          margin: 0 0 var(--mc-space-sm);
          font-size: 13px;
          color: var(--mc-text-secondary);
        }
        .mc-chart-skeleton {
          padding: var(--mc-space-xl);
          text-align: center;
          color: var(--mc-text-muted);
        }
        @media (max-width: 768px) {
          .mc-chart-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}