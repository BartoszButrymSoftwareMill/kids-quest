/**
 * OpenRouter Service
 * Uniwersalna usługa do komunikacji z OpenRouter API
 */

import type {
  OpenRouterConfig,
  CompletionRequest,
  CompletionResponse,
  ResponseMetadata,
  OpenRouterAPIResponse,
  ModelInfo,
  JSONSchemaObject,
  ResponseFormat,
  ModelParameters,
} from './types';

import {
  ConfigurationError,
  ValidationError,
  APIError,
  ParsingError,
  TimeoutError,
  RateLimitError,
  OpenRouterError,
} from './errors';

/**
 * Główna klasa usługi OpenRouter
 */
export class OpenRouterService {
  private readonly config: Required<OpenRouterConfig>;
  private readonly baseHeaders: Record<string, string>;

  /**
   * Tworzy nową instancję usługi
   */
  constructor(config: OpenRouterConfig) {
    // Walidacja konfiguracji
    this.validateConfig(config);

    // Ustaw wartości domyślne
    this.config = {
      baseUrl: 'https://openrouter.ai/api/v1',
      timeout: 30000,
      defaultModel: 'meta-llama/llama-4-maverick:free',
      defaultModelParams: {
        temperature: 0.7,
        max_tokens: 2000,
      },
      ...config,
    } as Required<OpenRouterConfig>;

    // Przygotuj bazowe headery
    this.baseHeaders = {
      Authorization: `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': this.config.httpReferer,
      'X-Title': this.config.appTitle,
    };
  }

  /**
   * Waliduje konfigurację
   */
  private validateConfig(config: OpenRouterConfig): void {
    if (!config.apiKey || config.apiKey.trim() === '') {
      throw new ConfigurationError('API key is required', { field: 'apiKey' });
    }

    if (!config.httpReferer || config.httpReferer.trim() === '') {
      throw new ConfigurationError('HTTP Referer is required', {
        field: 'httpReferer',
      });
    }

    if (!config.appTitle || config.appTitle.trim() === '') {
      throw new ConfigurationError('App title is required', {
        field: 'appTitle',
      });
    }

    if (config.timeout && config.timeout < 1000) {
      throw new ConfigurationError('Timeout must be at least 1000ms', {
        field: 'timeout',
        value: config.timeout,
      });
    }
  }

  /**
   * Główna metoda do wykonywania completion requestów
   */
  async complete<T = unknown>(request: CompletionRequest): Promise<CompletionResponse<T>> {
    // Walidacja requestu
    this.validateRequest(request);

    const maxRetries = request.maxRetries ?? 0;

    // Wykonaj z retry logic
    return this.retryWithBackoff(async () => {
      // Zbuduj request body
      const body = this.buildRequestBody(request);

      // Wykonaj HTTP request
      const apiResponse = await this.makeRequest('/chat/completions', body);

      // Parsuj odpowiedź
      const parsedResponse = this.parseResponse<T>(apiResponse, request.responseFormat);

      // Custom walidacja
      if (request.validator) {
        const isValid = await request.validator(parsedResponse.data);
        if (!isValid) {
          throw new ValidationError('Response validation failed', { data: parsedResponse.data });
        }
      }

      return parsedResponse;
    }, maxRetries);
  }

  /**
   * Pobiera listę dostępnych modeli
   */
  async getAvailableModels(): Promise<ModelInfo[]> {
    try {
      const response = await this.makeRequest('/models', null, 'GET');

      if (!Array.isArray(response)) {
        throw new ParsingError('Invalid models response format');
      }

      return response as ModelInfo[];
    } catch (error) {
      this.logError(error, 'getAvailableModels');
      throw error;
    }
  }

  /**
   * Waliduje completion request
   */
  private validateRequest(request: CompletionRequest): void {
    if (!request.messages || request.messages.length === 0) {
      throw new ValidationError('Messages array cannot be empty', {
        field: 'messages',
      });
    }

    for (let i = 0; i < request.messages.length; i++) {
      const msg = request.messages[i];
      if (!msg.role || !msg.content) {
        throw new ValidationError(`Invalid message at index ${i}`, {
          field: 'messages',
          index: i,
          message: msg,
        });
      }
    }

    if (request.responseFormat?.type === 'json_schema') {
      if (!request.responseFormat.json_schema) {
        throw new ValidationError('json_schema is required when type is "json_schema"', {
          field: 'responseFormat.json_schema',
        });
      }

      this.validateJsonSchema(request.responseFormat.json_schema.schema);
    }

    if (request.modelParams) {
      this.validateModelParams(request.modelParams);
    }
  }

  /**
   * Waliduje JSON Schema
   */
  private validateJsonSchema(schema: JSONSchemaObject): void {
    if (!schema.type || schema.type !== 'object') {
      throw new ValidationError('Schema must be of type "object"', { schema });
    }

    if (!schema.properties || Object.keys(schema.properties).length === 0) {
      throw new ValidationError('Schema must have at least one property', {
        schema,
      });
    }

    if (!Array.isArray(schema.required)) {
      throw new ValidationError('Schema must have "required" array', {
        schema,
      });
    }
  }

  /**
   * Waliduje parametry modelu
   */
  private validateModelParams(params: ModelParameters): void {
    if (params.temperature !== undefined) {
      if (params.temperature < 0 || params.temperature > 2) {
        throw new ValidationError('Temperature must be between 0 and 2', {
          field: 'temperature',
          value: params.temperature,
        });
      }
    }

    if (params.max_tokens !== undefined) {
      if (params.max_tokens < 1) {
        throw new ValidationError('max_tokens must be at least 1', {
          field: 'max_tokens',
          value: params.max_tokens,
        });
      }
    }

    if (params.top_p !== undefined) {
      if (params.top_p < 0 || params.top_p > 1) {
        throw new ValidationError('top_p must be between 0 and 1', {
          field: 'top_p',
          value: params.top_p,
        });
      }
    }
  }

  /**
   * Buduje request body
   */
  private buildRequestBody(request: CompletionRequest): unknown {
    const model = request.model || this.config.defaultModel;
    const params = {
      ...this.config.defaultModelParams,
      ...request.modelParams,
    };

    const body: Record<string, unknown> = {
      model,
      messages: request.messages,
      ...params,
    };

    // Dodaj response_format jeśli podany
    if (request.responseFormat) {
      if (request.responseFormat.type === 'json_schema') {
        const jsonSchema = request.responseFormat.json_schema;
        if (jsonSchema) {
          body.response_format = {
            type: 'json_schema',
            json_schema: {
              name: jsonSchema.name,
              strict: jsonSchema.strict ?? true,
              schema: jsonSchema.schema,
            },
          };
        }
      } else if (request.responseFormat.type === 'json_object') {
        body.response_format = { type: 'json_object' };
      }
      // Dla 'text' nie dodajemy nic
    }

    return body;
  }

  /**
   * Wykonuje HTTP request do API
   */
  private async makeRequest(endpoint: string, body: unknown, method: 'POST' | 'GET' = 'POST'): Promise<unknown> {
    const url = `${this.config.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method,
        headers: this.baseHeaders,
        body: method === 'POST' ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(this.config.timeout),
      });

      // Odczytaj body tylko raz
      const responseText = await response.text();

      // Obsługa błędów HTTP
      if (!response.ok) {
        console.error('[OpenRouter] Error response:', responseText);
        try {
          const errorData = JSON.parse(responseText);
          console.error('[OpenRouter] Parsed error:', errorData);
        } catch {
          console.error('[OpenRouter] Could not parse error as JSON');
        }
        await this.handleHTTPError(response);
      }

      const responseData = JSON.parse(responseText);

      return responseData;
    } catch (error) {
      console.error('[OpenRouter] Request error:', error);

      // Obsługa timeout
      if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
        throw new TimeoutError(`Request timeout after ${this.config.timeout}ms`);
      }

      // Re-throw OpenRouter errors
      if (error instanceof OpenRouterError) {
        throw error;
      }

      // Inne błędy sieciowe
      throw new APIError('Network error occurred', 0, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Obsługuje błędy HTTP
   */
  private async handleHTTPError(response: Response): Promise<never> {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }

    switch (response.status) {
      case 400:
        throw new ValidationError('Invalid request', errorData);

      case 401:
        throw new APIError('Invalid API key', 401, errorData);

      case 403:
        throw new APIError('Forbidden', 403, errorData);

      case 404:
        throw new APIError('Endpoint not found', 404, errorData);

      case 429: {
        const retryAfter = response.headers.get('Retry-After');
        throw new RateLimitError('Rate limit exceeded', retryAfter ? parseInt(retryAfter) : undefined);
      }

      case 500:
      case 502:
      case 503:
      case 504:
        throw new APIError('OpenRouter API server error', response.status, errorData);

      default:
        throw new APIError(`HTTP error ${response.status}`, response.status, errorData);
    }
  }

  /**
   * Parsuje odpowiedź z API
   */
  private parseResponse<T>(apiResponse: unknown, format?: ResponseFormat): CompletionResponse<T> {
    // Walidacja struktury odpowiedzi
    if (!this.isValidAPIResponse(apiResponse)) {
      throw new ParsingError('Invalid API response structure', { apiResponse });
    }

    const response = apiResponse as OpenRouterAPIResponse;

    // Ekstraktuj content
    const rawContent = response.choices[0]?.message?.content;
    if (rawContent === undefined) {
      throw new ParsingError('No content in API response', { response });
    }

    // Parsuj content według formatu
    let data: T;
    if (format?.type === 'json_schema' || format?.type === 'json_object') {
      data = this.parseJSON<T>(rawContent);
    } else if (!format) {
      // Jeśli format nie jest określony, próbuj parsować jako JSON
      try {
        data = this.parseJSON<T>(rawContent);
      } catch {
        // Jeśli parsowanie nie powiodło się, zwróć surowy tekst
        data = rawContent as T;
      }
    } else {
      data = rawContent as T;
    }

    // Ekstraktuj metadata
    const metadata: ResponseMetadata = {
      model: response.model,
      usage: response.usage,
      finish_reason: response.choices[0].finish_reason,
    };

    return {
      data,
      rawContent,
      metadata,
    };
  }

  /**
   * Parsuje JSON z obsługą markdown code blocks
   */
  private parseJSON<T>(content: string): T {
    try {
      // Usuń markdown code blocks jeśli obecne
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;

      return JSON.parse(jsonString.trim()) as T;
    } catch (error) {
      throw new ParsingError('Failed to parse JSON response', {
        rawContent: content.substring(0, 200),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Sprawdza czy odpowiedź ma poprawną strukturę
   */
  private isValidAPIResponse(response: unknown): boolean {
    if (typeof response !== 'object' || response === null) {
      return false;
    }

    const r = response as Record<string, unknown>;
    return (
      Array.isArray(r.choices) &&
      r.choices.length > 0 &&
      typeof r.choices[0].message === 'object' &&
      'content' in r.choices[0].message &&
      typeof r.usage === 'object'
    );
  }

  /**
   * Implementuje retry logic z exponential backoff
   */
  private async retryWithBackoff<T>(fn: () => Promise<T>, maxRetries: number, attempt = 0): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      // Nie retry dla niektórych błędów
      if (
        error instanceof ConfigurationError ||
        error instanceof ValidationError ||
        (error instanceof APIError && error.statusCode === 401)
      ) {
        throw error;
      }

      // Sprawdź czy można retry
      if (attempt >= maxRetries) {
        this.logError(error, `retryWithBackoff (final attempt ${attempt})`);
        throw error;
      }

      // Oblicz delay z exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt), 10000);

      console.warn(
        `[OpenRouterService] Retry ${attempt + 1}/${maxRetries} after ${delay}ms`,
        error instanceof Error ? error.message : 'Unknown error'
      );

      // Czekaj przed następną próbą
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Rekurencyjnie spróbuj ponownie
      return this.retryWithBackoff(fn, maxRetries, attempt + 1);
    }
  }

  /**
   * Loguje błędy
   */
  private logError(error: unknown, context: string): void {
    const timestamp = new Date().toISOString();
    const errorInfo = {
      timestamp,
      context,
      service: 'OpenRouterService',
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
              ...(error instanceof OpenRouterError && {
                code: error.code,
                details: this.sanitizeForLogging(error.details),
              }),
            }
          : error,
    };

    console.error('[OpenRouterService Error]', errorInfo);

    // TODO: Integracja z zewnętrznym serwisem logowania
    // np. Sentry.captureException(error, { contexts: { openrouter: errorInfo } });
  }

  /**
   * Sanityzuje dane do logowania
   */
  private sanitizeForLogging(data: unknown): unknown {
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data } as Record<string, unknown>;

      const sensitiveFields = ['apiKey', 'password', 'token', 'secret', 'authorization'];

      for (const field of sensitiveFields) {
        if (field in sanitized) {
          sanitized[field] = '[REDACTED]';
        }
      }

      return sanitized;
    }

    return data;
  }
}

/**
 * Factory function do tworzenia instancji usługi
 * Automatycznie pobiera API key ze zmiennych środowiskowych
 */
export function createOpenRouterService(
  config: Omit<OpenRouterConfig, 'apiKey'> & { apiKey?: string }
): OpenRouterService {
  const apiKey = config.apiKey || import.meta.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new ConfigurationError('OPENROUTER_API_KEY not found in environment variables');
  }

  return new OpenRouterService({
    ...config,
    apiKey,
  });
}
