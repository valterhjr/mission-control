import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mission Control - OpenClaw",
  description: "Painel de controle para agentes OpenClaw",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ background: '#0A0A0F', color: '#EDEDED', margin: 0 }}
      >
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          padding: '12px 24px',
          borderBottom: '1px solid #2A2A3E',
          background: '#1A1A2E',
        }}>
          <strong style={{ fontSize: 18 }}>🛡️ Mission Control</strong>
          <a href="/" style={{ color: '#88f', textDecoration: 'none' }}>Início</a>
          <a href="/dashboard" style={{ color: '#88f', textDecoration: 'none' }}>Painel</a>
          <a href="/agentes" style={{ color: '#88f', textDecoration: 'none' }}>Agentes</a>
          <a href="/config" style={{ color: '#88f', textDecoration: 'none' }}>Configurações</a>
          <a href="/logs" style={{ color: '#88f', textDecoration: 'none' }}>Logs</a>
        </nav>
        {children}
      </body>
    </html>
  );
}
