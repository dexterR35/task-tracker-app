import React from 'react';
import { logger } from '@/utils/logger';
import { getErrorBoundaryInfo } from '@/utils/errorHandling';
import StatusPage from '@/components/ui/StatusPage';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error: error,
      errorId: Date.now().toString(),
    };
  }

  componentDidCatch(error, errorInfo) {
    const errorId = this.state.errorId;
    const componentName = this.props.componentName || 'Unknown';

    const errorBoundaryInfo = getErrorBoundaryInfo(error, componentName);

    logger.error('ErrorBoundary caught an error:', {
      ...errorBoundaryInfo,
      errorId,
      errorInfo: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    if (import.meta.env.MODE === 'production') {
      logger.error('Production error:', {
        ...errorBoundaryInfo,
        error,
        errorInfo,
        errorId,
      });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  render() {
    if (this.state.hasError) {
      const { fallback: CustomFallback, componentName } = this.props;

      if (CustomFallback) {
        return (
          <CustomFallback
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            errorId={this.state.errorId}
            onRetry={this.handleRetry}
            componentName={componentName}
          />
        );
      }

      const title = componentName ? `${componentName} Error` : 'Something went wrong';
      const message =
        'An error occurred while loading this component. Try again or reload the page.';

      return (
        <StatusPage
          variant="error"
          title={title}
          message={message}
          fullScreen
          primaryAction={{ onClick: this.handleRetry, label: 'Try Again' }}
          secondaryAction={{
            onClick: () => window.location.reload(),
            label: 'Reload Page',
          }}
          tertiaryAction={{
            onClick: () => (window.location.href = '/'),
            label: 'Go to Home',
          }}
        >
          {this.state.errorId && (
            <p className="text-xs text-app-muted mb-2">Error ID: {this.state.errorId}</p>
          )}
          {import.meta.env.MODE === 'development' && this.state.error && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-medium text-app">
                Error Details
              </summary>
              <pre className="mt-2 text-xs text-red-error dark:text-red-400 whitespace-pre-wrap bg-gray-100 dark:bg-gray-700/50 p-3 rounded-lg overflow-auto max-h-40">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </StatusPage>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
