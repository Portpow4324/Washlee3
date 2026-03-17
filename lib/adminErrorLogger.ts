'use client'

/**
 * Admin Error Logger
 * Captures, stores, and categorizes errors with detailed resolution guidance
 * Used app-wide to track issues for admin dashboard
 */

export interface ErrorDetails {
  id: string
  timestamp: string
  type: 'runtime' | 'network' | 'validation' | 'database' | 'authentication' | 'payment' | 'system'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  stack?: string
  context: {
    userId?: string
    url?: string
    userAgent?: string
    method?: string
    endpoint?: string
    statusCode?: number
    requestBody?: any
    responseBody?: any
    componentStack?: string
    file?: string
    line?: number
    column?: number
    [key: string]: any
  }
  resolutionSteps: string[]
  resolutionCategory: string
  resolved: boolean
  resolvedAt?: string
  resolvedBy?: string
  notes?: string
}

export interface AdminErrorLog {
  errors: ErrorDetails[]
  lastError?: ErrorDetails
  totalCount: number
  criticalCount: number
  unresolvedCount: number
}

// In-memory error store (production would use database)
let errorLog: ErrorDetails[] = []
const MAX_ERRORS = 500 // Keep last 500 errors

/**
 * Get or create error store from localStorage
 */
function getErrorStore(): ErrorDetails[] {
  if (typeof window === 'undefined') return errorLog

  try {
    const stored = localStorage.getItem('admin_error_log')
    return stored ? JSON.parse(stored) : errorLog
  } catch {
    return errorLog
  }
}

/**
 * Save error store to localStorage
 */
function saveErrorStore(errors: ErrorDetails[]) {
  if (typeof window === 'undefined') {
    errorLog = errors
    return
  }

  try {
    errorLog = errors
    localStorage.setItem('admin_error_log', JSON.stringify(errors.slice(-MAX_ERRORS)))
  } catch (e) {
    console.error('[ERROR-LOGGER] Failed to save error log:', e)
  }
}

/**
 * Log an error with automatic categorization and resolution steps
 */
export function logError(
  title: string,
  message: string,
  options?: Partial<ErrorDetails>
): ErrorDetails {
  const errors = getErrorStore()

  // Determine type and severity
  const type = determineErrorType(message, options?.type)
  const severity = determineSeverity(message, options?.severity, type)
  const resolutionCategory = getResolutionCategory(type)
  const resolutionSteps = getResolutionSteps(type, title, message)

  const errorEntry: ErrorDetails = {
    id: generateErrorId(),
    timestamp: new Date().toISOString(),
    type,
    severity,
    title,
    message,
    stack: options?.stack,
    context: {
      userId: options?.context?.userId,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      ...options?.context,
    },
    resolutionSteps,
    resolutionCategory,
    resolved: false,
    notes: options?.notes,
  }

  errors.push(errorEntry)
  saveErrorStore(errors)

  console.error('[ADMIN-LOGGER] Error logged:', {
    id: errorEntry.id,
    title,
    severity,
    type,
  })

  return errorEntry
}

/**
 * Mark an error as resolved
 */
export function resolveError(errorId: string, resolvedBy: string, notes?: string): void {
  const errors = getErrorStore()
  const error = errors.find(e => e.id === errorId)

  if (error) {
    error.resolved = true
    error.resolvedAt = new Date().toISOString()
    error.resolvedBy = resolvedBy
    if (notes) error.notes = notes
    saveErrorStore(errors)
  }
}

/**
 * Delete an error from log
 */
export function deleteError(errorId: string): void {
  const errors = getErrorStore()
  saveErrorStore(errors.filter(e => e.id !== errorId))
}

/**
 * Get all errors (with optional filtering)
 */
export function getErrors(options?: {
  type?: ErrorDetails['type']
  severity?: ErrorDetails['severity']
  resolved?: boolean
  limit?: number
  offset?: number
}): ErrorDetails[] {
  const errors = getErrorStore()

  let filtered = errors

  if (options?.type) {
    filtered = filtered.filter(e => e.type === options.type)
  }

  if (options?.severity) {
    filtered = filtered.filter(e => e.severity === options.severity)
  }

  if (typeof options?.resolved === 'boolean') {
    filtered = filtered.filter(e => e.resolved === options.resolved)
  }

  // Return most recent first
  filtered.reverse()

  const offset = options?.offset || 0
  const limit = options?.limit || 50

  return filtered.slice(offset, offset + limit)
}

/**
 * Get error statistics
 */
export function getErrorStats() {
  const errors = getErrorStore()

  return {
    totalCount: errors.length,
    unresolvedCount: errors.filter(e => !e.resolved).length,
    criticalCount: errors.filter(e => e.severity === 'critical').length,
    highCount: errors.filter(e => e.severity === 'high').length,
    byType: {
      runtime: errors.filter(e => e.type === 'runtime').length,
      network: errors.filter(e => e.type === 'network').length,
      validation: errors.filter(e => e.type === 'validation').length,
      database: errors.filter(e => e.type === 'database').length,
      authentication: errors.filter(e => e.type === 'authentication').length,
      payment: errors.filter(e => e.type === 'payment').length,
      system: errors.filter(e => e.type === 'system').length,
    },
    byStatus: {
      resolved: errors.filter(e => e.resolved).length,
      unresolved: errors.filter(e => !e.resolved).length,
    },
    lastError: errors[errors.length - 1],
  }
}

/**
 * Export all errors as JSON
 */
export function exportErrors(): string {
  return JSON.stringify(getErrorStore(), null, 2)
}

/**
 * Clear all errors (admin only)
 */
export function clearErrors(): void {
  saveErrorStore([])
}

/**
 * Clear resolved errors
 */
export function clearResolvedErrors(): void {
  const errors = getErrorStore()
  saveErrorStore(errors.filter(e => !e.resolved))
}

/**
 * Search errors by title or message
 */
export function searchErrors(query: string): ErrorDetails[] {
  const errors = getErrorStore()
  const lower = query.toLowerCase()

  return errors
    .filter(
      e =>
        e.title.toLowerCase().includes(lower) ||
        e.message.toLowerCase().includes(lower) ||
        e.id.includes(lower)
    )
    .reverse()
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

function generateErrorId(): string {
  return `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function determineErrorType(
  message: string,
  override?: ErrorDetails['type']
): ErrorDetails['type'] {
  if (override) return override

  const lower = message.toLowerCase()

  if (
    lower.includes('network') ||
    lower.includes('fetch') ||
    lower.includes('connection') ||
    lower.includes('timeout')
  ) {
    return 'network'
  }

  if (lower.includes('validation') || lower.includes('invalid')) {
    return 'validation'
  }

  if (
    lower.includes('database') ||
    lower.includes('firestore') ||
    lower.includes('query') ||
    lower.includes('collection')
  ) {
    return 'database'
  }

  if (lower.includes('auth') || lower.includes('unauthorized') || lower.includes('token')) {
    return 'authentication'
  }

  if (lower.includes('stripe') || lower.includes('payment') || lower.includes('invoice')) {
    return 'payment'
  }

  if (lower.includes('system') || lower.includes('memory') || lower.includes('resource')) {
    return 'system'
  }

  return 'runtime'
}

function determineSeverity(
  message: string,
  override?: ErrorDetails['severity'],
  type?: ErrorDetails['type']
): ErrorDetails['severity'] {
  if (override) return override

  const lower = message.toLowerCase()

  // Critical indicators
  if (lower.includes('critical') || lower.includes('fatal') || lower.includes('crash')) {
    return 'critical'
  }

  // High severity types/keywords
  if (
    type === 'payment' ||
    type === 'authentication' ||
    lower.includes('security') ||
    lower.includes('breach') ||
    lower.includes('unauthorized access')
  ) {
    return 'high'
  }

  // Medium severity
  if (
    type === 'database' ||
    type === 'network' ||
    lower.includes('warning') ||
    lower.includes('error')
  ) {
    return 'medium'
  }

  return 'low'
}

function getResolutionCategory(type: ErrorDetails['type']): string {
  const categories = {
    runtime: 'Runtime & Code',
    network: 'Network & Connectivity',
    validation: 'Data Validation',
    database: 'Database & Storage',
    authentication: 'Authentication & Security',
    payment: 'Payment Processing',
    system: 'System & Infrastructure',
  }

  return categories[type] || 'General'
}

function getResolutionSteps(
  type: ErrorDetails['type'],
  title: string,
  message: string
): string[] {
  const common = [
    'Check browser console for detailed error stack trace',
    'Verify network connection is stable',
    'Check admin dashboard for recent related errors',
  ]

  const steps: Record<ErrorDetails['type'], string[]> = {
    runtime: [
      ...common,
      'Check app/layout.tsx ErrorBoundary is properly wrapped',
      'Review console logs for component render errors',
      'Clear browser cache and reload',
      'Check for TypeScript compilation errors: npm run build',
      'Restart dev server: npm run dev',
    ],
    network: [
      ...common,
      'Check internet connection',
      'Verify API endpoints are accessible',
      'Check browser Network tab for failed requests',
      'Verify environment variables (NEXT_PUBLIC_*)',
      'Check server logs for API errors',
      'Verify CORS settings if cross-origin request',
    ],
    validation: [
      ...common,
      'Check input data format and required fields',
      'Review Zod schema in lib/validationSchemas.ts',
      'Verify all required fields are provided',
      'Check data types match schema (number, string, etc)',
      'Review validation error details for specific fields',
    ],
    database: [
      ...common,
      'Check Firebase connection status',
      'Verify Firestore credentials in .env.local',
      'Check database rules allow read/write access',
      'Review Firestore console for collection/document structure',
      'Check for quota exceeded errors',
      'Verify user has proper permissions',
      'Check network connectivity to Firebase',
    ],
    authentication: [
      ...common,
      'Verify user is properly authenticated',
      'Check authentication tokens are not expired',
      'Review NextAuth.js configuration',
      'Check provider credentials (Google OAuth, etc)',
      'Verify session storage is working',
      'Check user account status in Firebase Auth',
    ],
    payment: [
      ...common,
      'Check Stripe API keys in .env.local',
      'Verify Stripe webhook is properly configured',
      'Review payment intent details in Stripe dashboard',
      'Check Stripe rate limiting',
      'Verify currency is set correctly (AUD)',
      'Check for PCI compliance issues',
      'Review transaction logs in Stripe dashboard',
    ],
    system: [
      ...common,
      'Check system resource usage (memory, CPU)',
      'Review server logs for system errors',
      'Check disk space availability',
      'Verify service dependencies are running',
      'Review environment configuration',
      'Check for memory leaks in long-running processes',
    ],
  }

  return steps[type] || common
}
