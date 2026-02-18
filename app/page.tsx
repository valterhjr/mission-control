export default function Home() {
  return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <h1 style={{ fontSize: 32, marginBottom: 12 }}>🛡️ Mission Control</h1>
      <p style={{ color: '#aaa', marginBottom: 24 }}>
        Painel de controle para seus agentes OpenClaw
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
        <a
          href="/dashboard"
          style={{
            background: '#2A2A3E',
            color: '#88f',
            padding: '12px 24px',
            borderRadius: 8,
            textDecoration: 'none',
            border: '1px solid #3A3A5E',
          }}
        >
          Abrir Painel
        </a>
        <a
          href="/agentes"
          style={{
            background: '#2A2A3E',
            color: '#88f',
            padding: '12px 24px',
            borderRadius: 8,
            textDecoration: 'none',
            border: '1px solid #3A3A5E',
          }}
        >
          Meus Agentes
        </a>
        <a
          href="/config"
          style={{
            background: '#2A2A3E',
            color: '#88f',
            padding: '12px 24px',
            borderRadius: 8,
            textDecoration: 'none',
            border: '1px solid #3A3A5E',
          }}
        >
          Configurações
        </a>
      </div>
    </div>
  );
}
