import { NextResponse } from 'next/server'

/**
 * Standardized API Response Utilities
 * All API routes use these helpers for consistent responses
 */

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
  timestamp: string
  details?: Record<string, any>
}

// ============================================================================
// SUCCESS RESPONSES
// ============================================================================

/**
 * Return successful API response with data
 */
export function successResponse<T>(
  data: T,
  status: number = 200,
  message?: string
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status }
  )
}

/**
 * Return successful response with 201 Created status
 */
export function createdResponse<T>(
  data: T,
  message?: string
): NextResponse<ApiResponse<T>> {
  return successResponse(data, 201, message)
}

/**
 * Return successful response with no data
 */
export function okResponse(
  status: number = 200
): NextResponse<ApiResponse<null>> {
  return NextResponse.json(
    {
      success: true,
      data: null,
      timestamp: new Date().toISOString(),
    },
    { status }
  )
}

// ============================================================================
// ERROR RESPONSES
// ============================================================================

/**
 * Return error API response
 */
export function errorResponse(
  error: string,
  status: number = 400,
  code?: string,
  details?: Record<string, any>
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      code: code || getErrorCode(status),
      timestamp: new Date().toISOString(),
      ...(details && { details }),
    },
    { status }
  )
}

/**
 * Handle validation errors (400)
 */
export function validationError(
  error: string,
  details?: Record<string, any>
): NextResponse<ApiResponse> {
  return errorResponse(
    error || 'Validation failed',
    400,
    'VALIDATION_ERROR',
    details
  )
}

/**
 * Handle authentication errors (401)
 */
export function unauthorizedError(
  message: string = 'Unauthorized'
): NextResponse<ApiResponse> {
  return errorResponse(message, 401, 'UNAUTHORIZED')
}

/**
 * Handle permission errors (403)
 */
export function forbiddenError(
  message: string = 'Forbidden'
): NextResponse<ApiResponse> {
  return errorResponse(message, 403, 'FORBIDDEN')
}

/**
 * Handle not found errors (404)
 */
export function notFoundError(
  message: string = 'Not found'
): NextResponse<ApiResponse> {
  return errorResponse(message, 404, 'NOT_FOUND')
}

/**
 * Handle conflicts (409)
 */
export function conflictError(
  message: string = 'Conflict'
): NextResponse<ApiResponse> {
  return errorResponse(message, 409, 'CONFLICT')
}

/**
 * Handle rate limit errors (429)
 */
export function rateLimitError(
  retryAfter?: number
): NextResponse<ApiResponse> {
  const response = errorResponse(
    'Too many requests. Please try again later.',
    429,
    'RATE_LIMITED'
  )
  
  if (retryAfter) {
    response.headers.set('Retry-After', String(retryAfter))
  }
  
  return response
}

/**
 * Handle server errors (500)
 */
export function serverError(
  error?: any,
  message: string = 'Internal server error'
): NextResponse<ApiResponse> {
  if (error && process.env.NODE_ENV === 'development') {
    console.error('[API Error]', error)
  }
  
  return errorResponse(message, 500, 'SERVER_ERROR')
}

/**
 * Handle database errors
 */
export function databaseError(
  message: string = 'Database error'
): NextResponse<ApiResponse> {
  return errorResponse(message, 500, 'DATABASE_ERROR')
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map HTTP status code to error code string
 */
function getErrorCode(status: number): string {
  const codeMap: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    429: 'RATE_LIMITED',
    500: 'SERVER_ERROR',
    503: 'SERVICE_UNAVAILABLE',
  }
  return codeMap[status] || 'ERROR'
}

/**
 * Safe error handler for async API routes
 * Usage: export const POST = withErrorHandler(async (req) => { ... })
 */
export function withErrorHandler(
  handler: (request: Request) => Promise<NextResponse>
) {
  return async (request: Request) => {
    try {
      return await handler(request)
    } catch (error: any) {
      console.error('[API Error Handler]', error)
      
      // Handle specific error types
      if (error instanceof SyntaxError) {
        return validationError('Invalid JSON in request body')
      }
      
      if (error.name === 'ZodError') {
        return validationError('Validation failed', error.flatten())
      }
      
      // Default server error
      return serverError(error)
    }
  }
}

/**
 * Async wrapper for catching errors in API routes
 */
export async function handleAsync<T>(
  fn: () => Promise<T>
): Promise<[T | null, Error | null]> {
  try {
    const data = await fn()
    return [data, null]
  } catch (error) {
    return [null, error as Error]
  }
}
