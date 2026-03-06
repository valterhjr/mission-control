"use client";

import React from "react";

type Props = { children: React.ReactNode; label?: string };
type State = { hasError: boolean; message: string };

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err.message };
  }

  componentDidCatch(err: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary] ${this.props.label ?? ""}`, err, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mc-alert mc-alert-error" style={{ margin: "16px 0" }}>
          {this.props.label ? `[${this.props.label}] ` : ""}
          Erro ao renderizar: {this.state.message}
        </div>
      );
    }
    return this.props.children;
  }
}
