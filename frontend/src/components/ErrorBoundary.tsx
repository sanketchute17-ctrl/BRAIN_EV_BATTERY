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
    console.warn('BRAIN UI ErrorBoundary caught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-emerald-500/40 text-white text-left space-y-2.5 shadow-xl my-2 max-w-xl mx-auto z-40 relative animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-xs font-black tracking-wider text-emerald-400 uppercase">
                BRAIN UI Module Auto-Recovery
              </h3>
            </div>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] rounded-xl uppercase tracking-wider transition shadow-sm cursor-pointer"
            >
              Restore View ↺
            </button>
          </div>
          
          <div className="p-2.5 bg-slate-950 rounded-xl font-mono text-[11px] text-slate-300 border border-slate-800 flex items-center justify-between gap-2">
            <span className="truncate opacity-90">
              {this.state.error ? this.state.error.message || this.state.error.toString() : 'Temporary UI state auto-recovered.'}
            </span>
            <span className="text-[9px] font-bold text-emerald-400 shrink-0 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              Auto-Protected
            </span>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
