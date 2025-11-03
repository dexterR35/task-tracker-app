import React from 'react';
import { logger } from '@/utils/logger';
import { getErrorBoundaryInfo } from '@/features/utils/errorHandling';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { 
      hasError: true,
      errorId: Date.now().toString()
    };
  }

  componentDidCatch(error, errorInfo) {
    const errorId = this.state.errorId;
    const componentName = this.props.componentName || 'Unknown';
    
    // Use standardized error boundary info
    const errorBoundaryInfo = getErrorBoundaryInfo(error, componentName);
    
    // Log error details with standardized format
    logger.error('ErrorBoundary caught an error:', {
      ...errorBoundaryInfo,
      errorId,
      errorInfo: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });

    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Report to error tracking service in production
    if (import.meta.env.MODE === 'production') {
      // You can integrate with services like Sentry, LogRocket, etc.
      logger.error('Production error:', { 
        ...errorBoundaryInfo, 
        error, 
        errorInfo, 
        errorId 
      });
    }
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null 
    });
  };

  render() {
    if (this.state.hasError) {
      const { fallback: CustomFallback, componentName } = this.props;
      
      // Use custom fallback if provided
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

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900 rounded-full">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="mt-4 text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {componentName ? `${componentName} Error` : 'Something went wrong'}
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                An error occurred while loading this component. Please try refreshing or contact support.
              </p>
              {this.state.errorId && (
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  Error ID: {this.state.errorId}
                </p>
              )}
              {import.meta.env.MODE === 'development' && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                    Error Details
                  </summary>
                  <pre className="mt-2 text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap bg-gray-100 dark:bg-gray-700 p-2 rounded">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
              <div className="mt-4 space-y-2">
                <button
                  onClick={this.handleRetry}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
                >
                  Reload Page
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-500 transition-colors"
                >
                  Go to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
