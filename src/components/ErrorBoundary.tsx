import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  level?: 'app' | 'page' | 'component';
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary component that catches JavaScript errors in child components.
 * 
 * Usage:
 * - Wrap the entire app to prevent white-screen crashes
 * - Wrap individual pages for graceful page-level recovery
 * - Wrap risky components (those with complex state or external data)
 * 
 * Levels:
 * - 'app': Full-page error with reload option (use at root)
 * - 'page': Page-level error with navigation option (use around routes)
 * - 'component': Inline error message (use around specific components)
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo });
    
    // Log error for debugging
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
    
    // Call optional error handler (for future analytics/monitoring)
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // If custom fallback provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Otherwise, render appropriate fallback based on level
      const { level = 'page' } = this.props;
      const { error } = this.state;

      if (level === 'app') {
        return <AppErrorFallback error={error} onReload={this.handleReload} />;
      }

      if (level === 'page') {
        return (
          <PageErrorFallback 
            error={error} 
            onRetry={this.handleReset} 
            onGoHome={this.handleGoHome} 
          />
        );
      }

      // Component level - inline error
      return (
        <ComponentErrorFallback 
          error={error} 
          onRetry={this.handleReset} 
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Full-screen error fallback for app-level crashes
 */
function AppErrorFallback({ 
  error, 
  onReload 
}: { 
  error: Error | null; 
  onReload: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Something went wrong
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The app encountered an unexpected error. Your workout data is safe — 
          please reload to continue.
        </p>

        {error && import.meta.env.DEV && (
          <div className="mb-6 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-left">
            <p className="text-xs font-mono text-red-600 dark:text-red-400 break-all">
              {error.message}
            </p>
          </div>
        )}

        <button
          onClick={onReload}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Reload App
        </button>
      </div>
    </div>
  );
}

/**
 * Page-level error fallback with retry and navigation options
 */
function PageErrorFallback({ 
  error, 
  onRetry, 
  onGoHome 
}: { 
  error: Error | null; 
  onRetry: () => void;
  onGoHome: () => void;
}) {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="max-w-sm w-full text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </div>
        
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Page Error
        </h2>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          This page couldn't load properly. Try again or go back to the home screen.
        </p>

        {error && import.meta.env.DEV && (
          <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-800 rounded text-left">
            <p className="text-xs font-mono text-red-600 dark:text-red-400 break-all">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onGoHome}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Home className="w-4 h-4" />
            Home
          </button>
          <button
            onClick={onRetry}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Inline error fallback for component-level errors
 */
function ComponentErrorFallback({ 
  error, 
  onRetry 
}: { 
  error: Error | null; 
  onRetry: () => void;
}) {
  return (
    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            Failed to load this section
          </p>
          {error && import.meta.env.DEV && (
            <p className="mt-1 text-xs font-mono text-red-600 dark:text-red-400 break-all">
              {error.message}
            </p>
          )}
          <button
            onClick={onRetry}
            className="mt-2 text-sm text-red-700 dark:text-red-300 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}

export default ErrorBoundary;
