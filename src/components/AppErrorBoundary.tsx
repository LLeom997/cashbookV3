import React from 'react';
import { Button } from './ui/button';

interface Props {
  children?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class AppErrorBoundary extends React.Component<Props, State> {
  declare props: Readonly<Props>;

  state: State = {
    hasError: false,
  };

  constructor(props: Props) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App boundary caught an error', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-lg w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-rose-500">Application Error</p>
          <h1 className="mt-3 text-2xl font-black text-slate-900">Something broke while rendering this page.</h1>
          <p className="mt-3 text-sm font-medium text-slate-500">
            Reload the app first. If this keeps happening, check the console and the latest code changes.
          </p>
          {this.state.error?.message && (
            <pre className="mt-4 overflow-auto rounded-2xl bg-slate-950 p-4 text-left text-xs text-slate-100">
              {this.state.error.message}
            </pre>
          )}
          <Button onClick={this.handleReload} className="mt-6 bg-blue-600 hover:bg-blue-700">
            Reload app
          </Button>
        </div>
      </div>
    );
  }
}
