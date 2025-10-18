/**
 * OpenRouter Service Error Classes
 * Hierarchia błędów dla różnych scenariuszy
 */

/**
 * Bazowy błąd dla OpenRouter Service
 */
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'OpenRouterError';

    // Utrzymuj poprawny stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Serializuje błąd do obiektu
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

/**
 * Błąd konfiguracji usługi
 */
export class ConfigurationError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, 'CONFIGURATION_ERROR', details);
    this.name = 'ConfigurationError';
  }
}

/**
 * Błąd walidacji requestu
 */
export class ValidationError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

/**
 * Błąd komunikacji z API
 */
export class APIError extends OpenRouterError {
  constructor(
    message: string,
    public readonly statusCode: number,
    details?: unknown
  ) {
    super(message, 'API_ERROR', details);
    this.name = 'APIError';
  }
}

/**
 * Błąd parsowania odpowiedzi
 */
export class ParsingError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, 'PARSING_ERROR', details);
    this.name = 'ParsingError';
  }
}

/**
 * Błąd timeout
 */
export class TimeoutError extends OpenRouterError {
  constructor(message = 'Request timeout') {
    super(message, 'TIMEOUT_ERROR');
    this.name = 'TimeoutError';
  }
}

/**
 * Błąd rate limiting
 */
export class RateLimitError extends OpenRouterError {
  constructor(
    message: string,
    public readonly retryAfter?: number
  ) {
    super(message, 'RATE_LIMIT_ERROR', { retryAfter });
    this.name = 'RateLimitError';
  }
}

/**
 * Helper do sprawdzania typu błędu
 */
export function isOpenRouterError(error: unknown): error is OpenRouterError {
  return error instanceof OpenRouterError;
}
