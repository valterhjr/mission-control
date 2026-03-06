import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "../src/components/Sidebar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mission Control — OpenClaw",
  description:
    "Painel tático de orquestração para agentes de IA OpenClaw",
  openGraph: {
    title: "Mission Control — OpenClaw",
    description: "Painel tático de orquestração para agentes de IA",
    type: "website",
    locale: "pt_BR",
    siteName: "Mission Control",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <title>Mission Control — OpenClaw</title>
        <meta name="description" content="Painel tático de orquestração para agentes de IA OpenClaw" />
        <meta property="og:title" content="Mission Control — OpenClaw" />
        <meta property="og:description" content="Painel tático de orquestração para agentes de IA" />
        <meta name="author" content="OpenClaw Team" />
        <meta name="date" content="2025-01-01" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "OpenClaw Mission Control",
              "url": "https://missioncontrol.openclaw.io"
            })
          }}
        />
      </head>
      <body className={`${inter.variable} ${jetbrains.variable}`}>
        <a href="#main-content" className="mc-skip-link">Pular para o conteúdo</a>
        <div className="mc-shell">
          <Sidebar />
          <main id="main-content" className="mc-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
