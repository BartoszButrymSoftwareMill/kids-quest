import { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 max-w-md mx-auto px-4">
          <div className="w-full rounded-lg border border-red-200 bg-red-50 p-6">
            <div className="flex items-start gap-3">
              <svg
                className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 mb-1">Coś poszło nie tak</h3>
                <p className="text-sm text-red-800">Wystąpił nieoczekiwany błąd. Spróbuj odświeżyć stronę.</p>
                {this.state.error && (
                  <details className="mt-3">
                    <summary className="text-xs text-red-700 cursor-pointer hover:underline">Szczegóły błędu</summary>
                    <pre className="mt-2 text-xs text-red-700 overflow-auto p-2 bg-red-100 rounded">
                      {this.state.error.message}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Odśwież stronę
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
