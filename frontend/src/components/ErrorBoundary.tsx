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
        <div className="p-4 rounded-2xl bg-slate-900 border-2 border-red-500 text-white text-left space-y-2 shadow-2xl my-4 max-w-2xl mx-auto z-50 relative">
          <div className="flex items-center gap-2 border-b border-slate-700 pb-2">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <h3 className="text-sm font-black tracking-wider text-red-400 uppercase">
              BRAIN UI Runtime Exception Caught
            </h3>
          </div>
          
          <div className="p-3 bg-slate-950 rounded-xl font-mono text-xs text-red-300 overflow-x-auto border border-red-500/40">
            {this.state.error ? this.state.error.toString() : 'Unknown Error'}
          </div>

          {this.state.error?.stack && (
            <pre className="p-2 bg-slate-950/80 rounded-lg text-[10px] font-mono text-slate-400 max-h-40 overflow-y-auto whitespace-pre-wrap">
              {this.state.error.stack}
            </pre>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-black text-xs rounded-xl uppercase tracking-wider transition shadow-md"
            >
              Reset Component State
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
