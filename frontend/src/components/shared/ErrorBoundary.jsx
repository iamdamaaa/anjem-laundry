import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    // Dynamic error logging payload matching Phase 12 client-side logging specifications
    try {
      fetch('/api/v1/logs/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          error_type: error?.name || 'ClientErrorBoundary',
          error_message: error?.message || 'React render breakdown',
          stack_trace: error?.stack,
          request_url: window.location.href,
        })
      });
    } catch (e) {
      console.error('Failed to log client error to server:', e);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[300px] flex items-center justify-center p-6 bg-slate-50 rounded-card border border-slate-200 shadow-sm text-center">
          <div className="max-w-md space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-error text-xl font-bold">
              ⚠️
            </div>
            <h3 className="text-lg font-extrabold text-brandText">Terjadi Kesalahan Sistem</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Aplikasi mengalami kendala teknis saat memuat modul ini. Rincian error telah dicatat secara otomatis ke server.
            </p>
            {this.state.error?.message && (
              <div className="px-3 py-2 bg-red-50 text-error rounded-input text-xs font-mono break-words border border-red-100">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-btn shadow-sm hover:shadow transition-all duration-200"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
