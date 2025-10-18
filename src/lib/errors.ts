import type { ApiError } from '../types';

/**
 * Custom application error class for structured error handling
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public error: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Creates a standardized error response object
 */
export function createErrorResponse(
  statusCode: number,
  error: string,
  message: string,
  details?: unknown
): { status: number; body: ApiError } {
  return {
    status: statusCode,
    body: {
      error,
      message,
      details,
    },
  };
}

/**
 * Global error handler for API endpoints
 * Converts various error types into standardized API error responses
 */
export function handleError(error: unknown): { status: number; body: ApiError } {
  console.error('API Error:', error);

  if (error instanceof AppError) {
    return createErrorResponse(error.statusCode, error.error, error.message, error.details);
  }

  if (error instanceof Error) {
    return createErrorResponse(500, 'internal_server_error', 'Wystąpił błąd serwera', { message: error.message });
  }

  return createErrorResponse(500, 'unknown_error', 'Wystąpił nieznany błąd');
}
