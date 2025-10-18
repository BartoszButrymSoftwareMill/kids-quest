/**
 * OpenRouter Service Types
 * Definiuje wszystkie interfejsy i typy używane przez usługę
 */

/**
 * Konfiguracja usługi OpenRouter
 */
export interface OpenRouterConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  httpReferer: string;
  appTitle: string;
  defaultModel?: string;
  defaultModelParams?: ModelParameters;
}

/**
 * Wiadomość w konwersacji
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Parametry modelu językowego
 */
export interface ModelParameters {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  top_k?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string | string[];
}

/**
 * Format odpowiedzi
 */
export interface ResponseFormat {
  type: 'json_schema' | 'json_object' | 'text';
  json_schema?: {
    name: string;
    strict?: boolean;
    schema: JSONSchemaObject;
  };
}

/**
 * Definicja JSON Schema
 */
export interface JSONSchemaObject {
  type: 'object';
  properties: Record<string, JSONSchemaProperty>;
  required: string[];
  additionalProperties?: boolean;
}

/**
 * Właściwość JSON Schema
 */
export interface JSONSchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'null' | string[];
  description?: string;
  enum?: (string | number)[];
  items?: JSONSchemaProperty;
  properties?: Record<string, JSONSchemaProperty>;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
}

/**
 * Request do completion endpoint
 */
export interface CompletionRequest {
  messages: ChatMessage[];
  model?: string;
  modelParams?: ModelParameters;
  responseFormat?: ResponseFormat;
  maxRetries?: number;
  validator?: <T>(data: T) => boolean | Promise<boolean>;
}

/**
 * Odpowiedź z completion endpoint
 */
export interface CompletionResponse<T = unknown> {
  data: T;
  rawContent: string;
  metadata: ResponseMetadata;
}

/**
 * Metadata odpowiedzi
 */
export interface ResponseMetadata {
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  finish_reason: string;
}

/**
 * Surowa odpowiedź z OpenRouter API
 */
export interface OpenRouterAPIResponse {
  id: string;
  model: string;
  created: number;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Informacje o modelu
 */
export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  pricing: {
    prompt: number;
    completion: number;
  };
  context_length: number;
  supports_tools: boolean;
  supports_vision: boolean;
}
