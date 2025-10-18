/**
 * OpenRouter Service - Main exports
 * Uniwersalna usługa do komunikacji z OpenRouter API
 */

// Service and factory
export { OpenRouterService, createOpenRouterService } from './service';

// Types
export type {
  OpenRouterConfig,
  ChatMessage,
  ModelParameters,
  ResponseFormat,
  JSONSchemaObject,
  JSONSchemaProperty,
  CompletionRequest,
  CompletionResponse,
  ResponseMetadata,
  OpenRouterAPIResponse,
  ModelInfo,
} from './types';

// Errors
export {
  OpenRouterError,
  ConfigurationError,
  ValidationError,
  APIError,
  ParsingError,
  TimeoutError,
  RateLimitError,
  isOpenRouterError,
} from './errors';
