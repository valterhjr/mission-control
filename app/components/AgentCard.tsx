import React from 'react'

type Props = {
  name: string
  id: string
  status: string
  lastActivity?: string
}

export default function AgentCard({ name, id, status, lastActivity }: Props) {
  const isOnline = status === 'Online'
  
  return (
    <div style={{
      border: '1px solid #2a2a3e',
      padding: 12,
      borderRadius: 8,
      background: isOnline ? '#1a2a1a' : '#1a1a2e'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: isOnline ? '#4f4' : '#f44',
          animation: isOnline ? 'pulse 2s infinite' : 'none'
        }} />
        <strong>{name}</strong>
      </div>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>ID: {id}</div>
      <div style={{ fontSize: 12, color: '#888' }}>Última atividade: {lastActivity || '-'}</div>
    </div>
  )
}
