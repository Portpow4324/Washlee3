'use client'

import React, { ReactNode } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { logError } from '@/lib/adminErrorLogger'
import Button from './Button'

interface Props {
  children: ReactNode
  fallback?: (error: Error, retry: () => void) => ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorCount: number
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorCount: 0 }
  }

  static getDerivedStateFromError(error: Error): Omit<State, 'errorCount'> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for monitoring
    console.error('[ErrorBoundary] Caught error:', error)
    console.error('[ErrorBoundary] Error info:', errorInfo.componentStack)
    
    // Send to admin error logger
    logError(error.name || 'Component Error', error.message, {
      type: 'runtime',
      stack: error.stack,
      context: {
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        componentStack: errorInfo.componentStack || '',
      },
    })
    
    // Track error count (max 3 before forcing reload)
    this.setState(state => ({
      errorCount: state.errorCount + 1
    }))

    // If too many errors, suggest full page reload
    if (this.state.errorCount >= 3) {
      console.error('[ErrorBoundary] Too many errors, forcing reload')
      setTimeout(() => {
        window.location.reload()
      }, 3000)
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError)
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 p-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-xl shadow-xl p-8 border border-red-100">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle size={32} className="text-red-600" />
                </div>
              </div>

              {/* Message */}
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                Oops! Something Went Wrong
              </h2>

              <p className="text-gray-600 text-center mb-6 text-sm">
                {this.state.errorCount > 1 
                  ? 'Multiple errors detected. Please reload to continue.'
                  : 'We encountered an unexpected error. Please try again.'}
              </p>

              {/* Error Details (Dev Only) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <details className="cursor-pointer">
                    <summary className="font-semibold text-red-700 text-sm">
                      Error Details
                    </summary>
                    <div className="mt-2 text-xs bg-white p-2 rounded border border-red-100 overflow-auto max-h-40">
                      <p className="font-mono text-red-600 break-words">
                        {this.state.error.message}
                      </p>
                      <pre className="text-gray-700 mt-2 text-xs overflow-auto max-h-32">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  </details>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={this.resetError}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <RefreshCw size={18} />
                  Try Again
                </Button>

                <Button
                  onClick={() => (window.location.href = '/')}
                  variant="outline"
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Home size={18} />
                  Go Home
                </Button>
              </div>

              {/* Error Count */}
              {this.state.errorCount > 1 && (
                <p className="text-xs text-gray-500 text-center mt-4">
                  Error #{this.state.errorCount} - {this.state.errorCount >= 3 ? 'Auto-reloading...' : 'Try again'}
                </p>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
