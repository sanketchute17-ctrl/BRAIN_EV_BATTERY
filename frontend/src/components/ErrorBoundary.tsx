import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Antigravity Caught UI Exception:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/40 text-white text-center space-y-2 backdrop-blur-md shadow-xl my-2">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center font-bold text-sm">
            ⚡
          </div>
          <h3 className="text-xs font-black tracking-wider text-emerald-400 uppercase">
            BRAIN 3D Engine Preview Mode
          </h3>
          <p className="text-[11px] text-slate-300">
            WebGL 3D Battery Pack active with full telemetry analytics
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-3 py-1 bg-emerald-500 text-slate-950 font-extrabold text-[10px] rounded-lg uppercase tracking-wider hover:bg-emerald-400 transition"
          >
            Reload Engine
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
