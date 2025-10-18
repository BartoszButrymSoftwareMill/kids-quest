# Plan Implementacji Usługi OpenRouter

## 1. Opis usługi

`OpenRouterService` jest uniwersalną usługą TypeScript odpowiedzialną za komunikację z OpenRouter API w celu uzupełniania czatów opartych na modelach językowych (LLM). Usługa zapewnia:

- Bezpieczną komunikację z OpenRouter API
- Elastyczną konfigurację modeli i parametrów generowania
- Obsługę ustrukturyzowanych odpowiedzi poprzez JSON Schema
- Walidację i parsowanie odpowiedzi
- Obsługę błędów i mechanizm retry
- Type-safe interfejs dla TypeScript

### Główne Cele

1. **Abstrakcja komunikacji z API**: Ukrycie szczegółów implementacji HTTP przed użytkownikiem
2. **Type Safety**: Wykorzystanie TypeScript do zapewnienia bezpieczeństwa typów
3. **Reużywalność**: Elastyczna konstrukcja umożliwiająca wielokrotne użycie dla różnych przypadków
4. **Niezawodność**: Obsługa błędów, timeouty, retry logic
5. **Strukturalizacja**: Wsparcie dla JSON Schema w odpowiedziach modelu

## 2. Opis konstruktora

Konstruktor inicjalizuje instancję usługi z wymaganymi parametrami konfiguracyjnymi.

### Sygnatura

```typescript
constructor(config: OpenRouterConfig)
```

### Interfejs konfiguracyjny

```typescript
interface OpenRouterConfig {
  /**
   * Klucz API OpenRouter (wymagany)
   * Pobierany z zmiennych środowiskowych
   */
  apiKey: string;

  /**
   * URL bazowy API OpenRouter
   * @default 'https://openrouter.ai/api/v1'
   */
  baseUrl?: string;

  /**
   * Timeout dla requestów w milisekundach
   * @default 30000
   */
  timeout?: number;

  /**
   * HTTP Referer dla identyfikacji aplikacji
   * Wymagany przez OpenRouter API
   */
  httpReferer: string;

  /**
   * Tytuł aplikacji
   * Wyświetlany w dashboardzie OpenRouter
   */
  appTitle: string;

  /**
   * Domyślna nazwa modelu
   * Może być nadpisana w indywidualnych requestach
   * @example 'anthropic/claude-3-haiku'
   */
  defaultModel?: string;

  /**
   * Domyślne parametry modelu
   * Mogą być nadpisane w indywidualnych requestach
   */
  defaultModelParams?: ModelParameters;
}
```

### Przykład użycia

```typescript
const service = new OpenRouterService({
  apiKey: import.meta.env.OPENROUTER_API_KEY,
  httpReferer: 'https://kidsquest.app',
  appTitle: 'KidsQuest',
  defaultModel: 'anthropic/claude-3-haiku',
  timeout: 30000,
  defaultModelParams: {
    temperature: 0.7,
    max_tokens: 2000,
    top_p: 1.0,
  },
});
```

## 3. Publiczne metody i pola

### 3.1. Metoda `complete()`

Główna metoda do wykonywania completion requestów z obsługą ustrukturyzowanych odpowiedzi.

#### Sygnatura

```typescript
async complete<T = unknown>(
  request: CompletionRequest
): Promise<CompletionResponse<T>>
```

#### Interfejsy

```typescript
interface CompletionRequest {
  /**
   * Wiadomości w konwersacji
   * Zgodne z formatem OpenAI Chat Completions API
   */
  messages: ChatMessage[];

  /**
   * Nazwa modelu do użycia
   * Nadpisuje defaultModel z konfiguracji
   */
  model?: string;

  /**
   * Parametry modelu
   * Nadpisują defaultModelParams z konfiguracji
   */
  modelParams?: ModelParameters;

  /**
   * Format odpowiedzi
   * Używany do wymuszenia strukturalnych odpowiedzi JSON
   */
  responseFormat?: ResponseFormat;

  /**
   * Maksymalna liczba prób przy błędach
   * @default 1 (bez retry)
   */
  maxRetries?: number;

  /**
   * Custom walidator odpowiedzi
   * Wykonywany po otrzymaniu odpowiedzi od API
   */
  validator?: (data: T) => boolean | Promise<boolean>;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ResponseFormat {
  /**
   * Typ formatu odpowiedzi
   * Dla strukturalnych odpowiedzi użyj 'json_schema'
   */
  type: 'json_schema' | 'json_object' | 'text';

  /**
   * Definicja JSON Schema
   * Wymagana gdy type === 'json_schema'
   */
  json_schema?: {
    /**
     * Nazwa schematu
     * Musi być unikalna i opisowa
     */
    name: string;

    /**
     * Czy używać strict mode
     * Zalecane: true
     * @default true
     */
    strict?: boolean;

    /**
     * Obiekt JSON Schema
     * Zgodny ze standardem JSON Schema Draft 7
     */
    schema: JSONSchemaObject;
  };
}

interface JSONSchemaObject {
  type: 'object';
  properties: Record<string, JSONSchemaProperty>;
  required: string[];
  additionalProperties?: boolean;
}

interface JSONSchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'null';
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

interface ModelParameters {
  /**
   * Temperatura - kontroluje losowość
   * @range 0.0 - 2.0
   * @default 1.0
   */
  temperature?: number;

  /**
   * Maksymalna liczba tokenów do wygenerowania
   */
  max_tokens?: number;

  /**
   * Top P - nucleus sampling
   * @range 0.0 - 1.0
   * @default 1.0
   */
  top_p?: number;

  /**
   * Top K - ograniczenie liczby najbardziej prawdopodobnych tokenów
   */
  top_k?: number;

  /**
   * Frequency penalty - zmniejsza powtarzanie
   * @range -2.0 - 2.0
   * @default 0.0
   */
  frequency_penalty?: number;

  /**
   * Presence penalty - zwiększa różnorodność tematów
   * @range -2.0 - 2.0
   * @default 0.0
   */
  presence_penalty?: number;

  /**
   * Stop sequences - zatrzymują generowanie
   */
  stop?: string | string[];
}

interface CompletionResponse<T = unknown> {
  /**
   * Sparsowana odpowiedź modelu
   * Typ zależy od responseFormat
   */
  data: T;

  /**
   * Surowa treść odpowiedzi
   */
  rawContent: string;

  /**
   * Metadata z API
   */
  metadata: {
    model: string;
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
    finish_reason: string;
  };
}
```

#### Przykłady użycia

**Przykład 1: Prosty completion bez struktury**

```typescript
const response = await service.complete({
  messages: [
    {
      role: 'system',
      content: 'Jesteś pomocnym asystentem.',
    },
    {
      role: 'user',
      content: 'Napisz krótki wiersz o kocie.',
    },
  ],
  modelParams: {
    temperature: 0.8,
    max_tokens: 150,
  },
});

console.log(response.data); // string z wierszem
```

**Przykład 2: Ustrukturyzowana odpowiedź z JSON Schema**

```typescript
// Definiujemy typ odpowiedzi
interface QuestData {
  title: string;
  hook: string;
  steps: string[];
  safety_notes: string | null;
}

// Definiujemy JSON Schema
const questSchema: JSONSchemaObject = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      description: 'Krótki, chwytliwy tytuł questa',
      minLength: 10,
      maxLength: 200,
    },
    hook: {
      type: 'string',
      description: 'Intrygujące wprowadzenie',
      minLength: 10,
      maxLength: 300,
    },
    steps: {
      type: 'array',
      description: 'Lista kroków questa',
      items: {
        type: 'string',
        minLength: 10,
        maxLength: 250,
      },
    },
    safety_notes: {
      type: ['string', 'null'],
      description: 'Uwagi dotyczące bezpieczeństwa',
    },
  },
  required: ['title', 'hook', 'steps'],
  additionalProperties: false,
};

const response = await service.complete<QuestData>({
  messages: [
    {
      role: 'system',
      content: `Jesteś ekspertem w tworzeniu scenariuszy zabaw dla dzieci.
Twórz bezpieczne, kreatywne i edukacyjne aktywności.`,
    },
    {
      role: 'user',
      content: `Stwórz quest dla dzieci 5-6 lat, trwający 20 minut, w domu.`,
    },
  ],
  responseFormat: {
    type: 'json_schema',
    json_schema: {
      name: 'quest_generation',
      strict: true,
      schema: questSchema,
    },
  },
  modelParams: {
    temperature: 0.8,
    max_tokens: 2000,
  },
  maxRetries: 2,
});

// TypeScript wie, że response.data jest typu QuestData
console.log(response.data.title);
console.log(response.data.steps);
```

**Przykład 3: Z custom walidatorem**

```typescript
interface ProductDescription {
  name: string;
  price: number;
  features: string[];
}

const response = await service.complete<ProductDescription>({
  messages: [
    {
      role: 'user',
      content: 'Opisz laptop gamingowy w formacie JSON',
    },
  ],
  responseFormat: {
    type: 'json_schema',
    json_schema: {
      name: 'product_description',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          price: { type: 'number', minimum: 0 },
          features: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['name', 'price', 'features'],
        additionalProperties: false,
      },
    },
  },
  validator: async (data) => {
    // Custom business logic validation
    return (
      data.price > 0 &&
      data.price < 10000 &&
      data.features.length >= 3
    );
  },
  maxRetries: 2,
});
```

**Przykład 4: Różne modele dla różnych zadań**

```typescript
// Szybki i tani model dla prostych zadań
const simpleResponse = await service.complete({
  messages: [
    { role: 'user', content: 'Przetłumacz "Hello" na polski' },
  ],
  model: 'anthropic/claude-3-haiku',
  modelParams: {
    temperature: 0.1,
    max_tokens: 50,
  },
});

// Zaawansowany model dla skomplikowanych zadań
const complexResponse = await service.complete({
  messages: [
    {
      role: 'user',
      content: 'Napisz szczegółową analizę marketingową produktu',
    },
  ],
  model: 'anthropic/claude-3-opus',
  modelParams: {
    temperature: 0.7,
    max_tokens: 4000,
  },
});
```

### 3.2. Metoda `getAvailableModels()`

Opcjonalna metoda do pobierania listy dostępnych modeli z OpenRouter API.

```typescript
async getAvailableModels(): Promise<ModelInfo[]>

interface ModelInfo {
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
```

## 4. Prywatne metody i pola

### 4.1. Pola prywatne

```typescript
private readonly config: Required<OpenRouterConfig>;
private readonly baseHeaders: Record<string, string>;
```

### 4.2. Metoda `makeRequest()`

Wykonuje HTTP request do OpenRouter API z obsługą timeout i błędów.

```typescript
private async makeRequest(
  endpoint: string,
  body: unknown
): Promise<unknown>
```

**Odpowiedzialności:**
- Dodawanie wymaganych headerów
- Obsługa timeout przez AbortSignal
- Parsowanie odpowiedzi JSON
- Rzucanie odpowiednich błędów

### 4.3. Metoda `parseResponse()`

Parsuje odpowiedź z API i ekstraktuje dane zgodnie z formatem.

```typescript
private parseResponse<T>(
  apiResponse: unknown,
  format?: ResponseFormat
): { data: T; rawContent: string; metadata: ResponseMetadata }
```

**Odpowiedzialności:**
- Walidacja struktury odpowiedzi API
- Parsowanie JSON dla structured outputs
- Ekstrakcja metadata (usage, model, finish_reason)
- Obsługa różnych formatów odpowiedzi

### 4.4. Metoda `retryWithBackoff()`

Implementuje retry logic z exponential backoff.

```typescript
private async retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  attempt: number = 0
): Promise<T>
```

**Odpowiedzialności:**
- Wykonywanie funkcji z retry logic
- Implementacja exponential backoff
- Logowanie prób
- Rzucanie błędu po wyczerpaniu prób

**Implementacja backoff:**
```typescript
const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
await new Promise(resolve => setTimeout(resolve, delay));
```

### 4.5. Metoda `validateJsonSchema()`

Waliduje, czy JSON Schema jest poprawny.

```typescript
private validateJsonSchema(schema: JSONSchemaObject): void
```

**Odpowiedzialności:**
- Sprawdzanie poprawności struktury schematu
- Walidacja wymaganych pól
- Rzucanie błędów dla niepoprawnych schematów

### 4.6. Metoda `buildRequestBody()`

Buduje ciało requestu zgodne z OpenRouter API.

```typescript
private buildRequestBody(request: CompletionRequest): unknown
```

**Odpowiedzialności:**
- Mergowanie defaultowych i custom parametrów
- Formatowanie response_format zgodnie z API
- Walidacja wymaganych pól

## 5. Obsługa błędów

### 5.1. Hierarchia błędów

```typescript
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
  constructor(message: string = 'Request timeout') {
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
```

### 5.2. Scenariusze błędów i obsługa

#### Scenariusz 1: Brak API Key

```typescript
// W konstruktorze
if (!config.apiKey || config.apiKey.trim() === '') {
  throw new ConfigurationError(
    'API key is required',
    { field: 'apiKey' }
  );
}
```

#### Scenariusz 2: Niepoprawny JSON Schema

```typescript
// W validateJsonSchema()
if (!schema.type || schema.type !== 'object') {
  throw new ValidationError(
    'Schema must be of type "object"',
    { schema }
  );
}

if (!schema.properties || Object.keys(schema.properties).length === 0) {
  throw new ValidationError(
    'Schema must have at least one property',
    { schema }
  );
}
```

#### Scenariusz 3: Błąd HTTP

```typescript
// W makeRequest()
if (!response.ok) {
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    throw new RateLimitError(
      'Rate limit exceeded',
      retryAfter ? parseInt(retryAfter) : undefined
    );
  }

  if (response.status === 401) {
    throw new APIError(
      'Invalid API key',
      401,
      { statusCode: 401 }
    );
  }

  if (response.status === 400) {
    const errorData = await response.json();
    throw new ValidationError(
      'Invalid request',
      errorData
    );
  }

  if (response.status >= 500) {
    throw new APIError(
      'OpenRouter API server error',
      response.status,
      { statusCode: response.status }
    );
  }

  throw new APIError(
    `HTTP error ${response.status}`,
    response.status
  );
}
```

#### Scenariusz 4: Timeout

```typescript
// W complete()
try {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(this.config.timeout),
    // ... inne opcje
  });
} catch (error) {
  if (error.name === 'TimeoutError' || error.name === 'AbortError') {
    throw new TimeoutError(
      `Request timeout after ${this.config.timeout}ms`
    );
  }
  throw error;
}
```

#### Scenariusz 5: Błąd parsowania JSON

```typescript
// W parseResponse()
try {
  const parsed = JSON.parse(rawContent);
  return parsed as T;
} catch (error) {
  throw new ParsingError(
    'Failed to parse JSON response',
    { 
      rawContent: rawContent.substring(0, 200),
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  );
}
```

#### Scenariusz 6: Niepowodzenie walidacji custom

```typescript
// W complete()
if (request.validator) {
  const isValid = await request.validator(parsedData.data);
  if (!isValid) {
    if (attempt < maxRetries) {
      console.warn(
        `Validation failed, retry ${attempt + 1}/${maxRetries}`
      );
      continue; // retry
    }
    throw new ValidationError(
      'Response validation failed after all retries',
      { data: parsedData.data }
    );
  }
}
```

### 5.3. Logowanie błędów

```typescript
private logError(error: unknown, context: string): void {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    context,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error,
  };

  console.error('[OpenRouterService]', errorInfo);

  // Opcjonalnie: integracja z zewnętrznym serwisem logowania
  // np. Sentry, LogRocket, etc.
}
```

## 6. Kwestie bezpieczeństwa

### 6.1. Ochrona API Key

**Nigdy nie hardkoduj API key w kodzie:**
```typescript
// ❌ ZŁE
const service = new OpenRouterService({
  apiKey: 'sk-or-v1-abc123...',
  // ...
});

// ✅ DOBRE
const service = new OpenRouterService({
  apiKey: import.meta.env.OPENROUTER_API_KEY,
  // ...
});
```

**Używaj zmiennych środowiskowych:**
```bash
# .env
OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
```

**Dodaj .env do .gitignore:**
```gitignore
.env
.env.local
.env.*.local
```

### 6.2. Walidacja input

```typescript
// Sanityzacja user input przed wysłaniem do API
private sanitizeUserInput(input: string): string {
  // Usuń potencjalnie niebezpieczne znaki
  // Ogranicz długość
  const maxLength = 10000;
  return input
    .trim()
    .substring(0, maxLength)
    .replace(/[\x00-\x1F\x7F]/g, ''); // usuń control characters
}
```

### 6.3. Rate Limiting po stronie klienta

```typescript
// Implementacja prostego rate limitera
class ClientRateLimiter {
  private requestTimes: number[] = [];
  
  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  async checkLimit(): Promise<void> {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Usuń stare requesty
    this.requestTimes = this.requestTimes.filter(
      time => time > windowStart
    );
    
    if (this.requestTimes.length >= this.maxRequests) {
      const oldestRequest = this.requestTimes[0];
      const waitTime = oldestRequest + this.windowMs - now;
      throw new RateLimitError(
        `Client rate limit exceeded. Wait ${waitTime}ms`,
        waitTime
      );
    }
    
    this.requestTimes.push(now);
  }
}
```

### 6.4. Content Safety

Dla aplikacji generujących treść dla dzieci (jak KidsQuest):

```typescript
interface ContentSafetyChecker {
  validateContent(content: unknown): Promise<{
    isValid: boolean;
    violations?: string[];
    suggestions?: string[];
  }>;
}

// Integracja w complete()
if (this.contentSafetyChecker) {
  const validation = await this.contentSafetyChecker.validateContent(
    parsedData.data
  );
  
  if (!validation.isValid) {
    throw new ValidationError(
      'Content safety validation failed',
      validation
    );
  }
}
```

### 6.5. Timeout i Resource Management

```typescript
// Zawsze ustawiaj rozsądny timeout
const DEFAULT_TIMEOUT = 30000; // 30 sekund

// W przypadku długotrwałych operacji, informuj użytkownika
if (timeout > 60000) {
  console.warn(
    'Long timeout detected. Consider implementing progress feedback.'
  );
}
```

### 6.6. Dane wrażliwe w logach

```typescript
private sanitizeForLogging(data: unknown): unknown {
  if (typeof data === 'object' && data !== null) {
    const sanitized = { ...data };
    
    // Usuń wrażliwe pola
    const sensitiveFields = [
      'apiKey',
      'password',
      'token',
      'secret',
      'authorization'
    ];
    
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
  
  return data;
}
```

## 7. Plan wdrożenia krok po kroku

### Krok 1: Przygotowanie struktury projektu

#### 1.1. Utwórz plik usługi

```bash
touch src/lib/openrouter-service.ts
```

#### 1.2. Utwórz plik z typami

```bash
touch src/lib/openrouter.types.ts
```

#### 1.3. Utwórz plik z błędami

```bash
touch src/lib/openrouter-errors.ts
```

#### 1.4. Dodaj zmienną środowiskową

```bash
# .env
OPENROUTER_API_KEY=your-api-key-here
```

Dodaj typ do `src/env.d.ts`:
```typescript
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly OPENROUTER_API_KEY: string;
  // ... inne zmienne
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### Krok 2: Implementacja typów

Stwórz plik `src/lib/openrouter.types.ts`:

```typescript
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
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
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
```

### Krok 3: Implementacja błędów

Stwórz plik `src/lib/openrouter-errors.ts`:

```typescript
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
  constructor(message: string = 'Request timeout') {
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
```

### Krok 4: Implementacja głównej usługi

Stwórz plik `src/lib/openrouter-service.ts`:

```typescript
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
} from './openrouter.types';

import {
  ConfigurationError,
  ValidationError,
  APIError,
  ParsingError,
  TimeoutError,
  RateLimitError,
} from './openrouter-errors';

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
      defaultModel: 'anthropic/claude-3-haiku',
      defaultModelParams: {
        temperature: 0.7,
        max_tokens: 2000,
      },
      ...config,
    };

    // Przygotuj bazowe headery
    this.baseHeaders = {
      'Authorization': `Bearer ${this.config.apiKey}`,
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
  async complete<T = unknown>(
    request: CompletionRequest
  ): Promise<CompletionResponse<T>> {
    // Walidacja requestu
    this.validateRequest(request);

    const maxRetries = request.maxRetries ?? 0;

    // Wykonaj z retry logic
    return this.retryWithBackoff(
      async () => {
        // Zbuduj request body
        const body = this.buildRequestBody(request);

        // Wykonaj HTTP request
        const apiResponse = await this.makeRequest('/chat/completions', body);

        // Parsuj odpowiedź
        const parsedResponse = this.parseResponse<T>(
          apiResponse,
          request.responseFormat
        );

        // Custom walidacja
        if (request.validator) {
          const isValid = await request.validator(parsedResponse.data);
          if (!isValid) {
            throw new ValidationError(
              'Response validation failed',
              { data: parsedResponse.data }
            );
          }
        }

        return parsedResponse;
      },
      maxRetries
    );
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
        throw new ValidationError(
          'json_schema is required when type is "json_schema"',
          { field: 'responseFormat.json_schema' }
        );
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
  private validateModelParams(params: any): void {
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

    const body: any = {
      model,
      messages: request.messages,
      ...params,
    };

    // Dodaj response_format jeśli podany
    if (request.responseFormat) {
      if (request.responseFormat.type === 'json_schema') {
        body.response_format = {
          type: 'json_schema',
          json_schema: {
            name: request.responseFormat.json_schema!.name,
            strict: request.responseFormat.json_schema!.strict ?? true,
            schema: request.responseFormat.json_schema!.schema,
          },
        };
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
  private async makeRequest(
    endpoint: string,
    body: unknown,
    method: 'POST' | 'GET' = 'POST'
  ): Promise<unknown> {
    const url = `${this.config.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method,
        headers: this.baseHeaders,
        body: method === 'POST' ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(this.config.timeout),
      });

      // Obsługa błędów HTTP
      if (!response.ok) {
        await this.handleHTTPError(response);
      }

      return await response.json();
    } catch (error) {
      // Obsługa timeout
      if (
        error instanceof Error &&
        (error.name === 'TimeoutError' || error.name === 'AbortError')
      ) {
        throw new TimeoutError(
          `Request timeout after ${this.config.timeout}ms`
        );
      }

      // Re-throw OpenRouter errors
      if (error instanceof OpenRouterError) {
        throw error;
      }

      // Inne błędy sieciowe
      throw new APIError(
        'Network error occurred',
        0,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Obsługuje błędy HTTP
   */
  private async handleHTTPError(response: Response): Promise<never> {
    let errorData: any;
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

      case 429:
        const retryAfter = response.headers.get('Retry-After');
        throw new RateLimitError(
          'Rate limit exceeded',
          retryAfter ? parseInt(retryAfter) : undefined
        );

      case 500:
      case 502:
      case 503:
      case 504:
        throw new APIError(
          'OpenRouter API server error',
          response.status,
          errorData
        );

      default:
        throw new APIError(
          `HTTP error ${response.status}`,
          response.status,
          errorData
        );
    }
  }

  /**
   * Parsuje odpowiedź z API
   */
  private parseResponse<T>(
    apiResponse: unknown,
    format?: ResponseFormat
  ): CompletionResponse<T> {
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
      const jsonMatch =
        content.match(/```json\s*([\s\S]*?)\s*```/) ||
        content.match(/```\s*([\s\S]*?)\s*```/);
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

    const r = response as any;
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
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number,
    attempt: number = 0
  ): Promise<T> {
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
      const sanitized = { ...data } as any;

      const sensitiveFields = [
        'apiKey',
        'password',
        'token',
        'secret',
        'authorization',
      ];

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
    throw new ConfigurationError(
      'OPENROUTER_API_KEY not found in environment variables'
    );
  }

  return new OpenRouterService({
    ...config,
    apiKey,
  });
}
```

### Krok 5: Przykładowe zastosowanie w projekcie

#### 5.1. Aktualizacja istniejącego AIService

Zaktualizuj `src/lib/ai-service.ts` aby używał nowej usługi:

```typescript
import type { AIGeneratedQuest, GenerateQuestRequest } from '../types';
import { ContentSafetyService } from './content-safety';
import type { SupabaseClient } from '../db/supabase.client';
import { OpenRouterService } from './openrouter-service';
import type { JSONSchemaObject } from './openrouter.types';

/**
 * AI Service for generating quests
 * Teraz używa uniwersalnej OpenRouterService
 */
export class AIService {
  private openRouter: OpenRouterService;

  constructor(
    apiKey: string,
    private contentSafety: ContentSafetyService
  ) {
    this.openRouter = new OpenRouterService({
      apiKey,
      httpReferer: 'https://kidsquest.app',
      appTitle: 'KidsQuest',
      defaultModel: 'anthropic/claude-3-haiku',
      timeout: 30000,
      defaultModelParams: {
        temperature: 0.8,
        max_tokens: 2000,
      },
    });
  }

  /**
   * Generuje quest używając AI
   */
  async generateQuest(params: GenerateQuestRequest): Promise<AIGeneratedQuest> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(params);
    const schema = this.buildQuestSchema();

    const response = await this.openRouter.complete<AIGeneratedQuest>({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      responseFormat: {
        type: 'json_schema',
        json_schema: {
          name: 'quest_generation',
          strict: true,
          schema,
        },
      },
      maxRetries: 2,
      validator: async (quest) => {
        // Walidacja content safety
        const validation = await this.contentSafety.validateContent({
          title: quest.title,
          hook: quest.hook,
          step1: quest.step1,
          step2: quest.step2,
          step3: quest.step3,
          easier_version: quest.easier_version || '',
          harder_version: quest.harder_version || '',
          safety_notes: quest.safety_notes || '',
        });

        return validation.isValid;
      },
    });

    // Dodaj parametry z requestu
    return {
      ...response.data,
      age_group_id: params.age_group_id,
      duration_minutes: params.duration_minutes,
      location: params.location,
      energy_level: params.energy_level,
      prop_ids: params.prop_ids || [],
      source: 'ai',
    };
  }

  /**
   * Buduje JSON Schema dla questa
   */
  private buildQuestSchema(): JSONSchemaObject {
    return {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Krótki, chwytliwy tytuł (max 200 znaków)',
          minLength: 10,
          maxLength: 200,
        },
        hook: {
          type: 'string',
          description: 'Intrygujące wprowadzenie (10-300 znaków)',
          minLength: 10,
          maxLength: 300,
        },
        step1: {
          type: 'string',
          description: 'Pierwszy krok questa (10-250 znaków)',
          minLength: 10,
          maxLength: 250,
        },
        step2: {
          type: 'string',
          description: 'Drugi krok questa (10-250 znaków)',
          minLength: 10,
          maxLength: 250,
        },
        step3: {
          type: 'string',
          description: 'Trzeci krok questa (10-250 znaków)',
          minLength: 10,
          maxLength: 250,
        },
        easier_version: {
          type: ['string', 'null'],
          description: 'Prostsza wersja lub null',
        },
        harder_version: {
          type: ['string', 'null'],
          description: 'Trudniejsza wersja lub null',
        },
        safety_notes: {
          type: ['string', 'null'],
          description: 'Uwagi dotyczące bezpieczeństwa lub null',
        },
      },
      required: ['title', 'hook', 'step1', 'step2', 'step3'],
      additionalProperties: false,
    };
  }

  /**
   * Buduje system prompt
   */
  private buildSystemPrompt(): string {
    return `Jesteś ekspertem w tworzeniu kreatywnych, bezpiecznych scenariuszy zabaw dla dzieci.

ZASADY BEZPIECZEŃSTWA:
- Zawsze priorytetuj bezpieczeństwo dziecka
- Unikaj niebezpiecznych aktywności (wysokości, ostrych przedmiotów, ognia)
- Dla lokacji "outdoor" sugeruj tylko bezpieczne miejsca (park, ogród, plac zabaw)
- Nie używaj tematów związanych z przemocą, bronią, alkoholem, papierosami

WYTYCZNE TREŚCI:
- Używaj języka polskiego
- Dostosuj poziom trudności do grupy wiekowej
- Twórz pozytywne, wspierające narracje
- Zachęcaj do współpracy, kreatywności i rozwiązywania problemów
- Unikaj konkurencji - skup się na zabawie i odkrywaniu`;
  }

  /**
   * Buduje user prompt
   */
  private buildUserPrompt(params: GenerateQuestRequest): string {
    const ageGroupMap: Record<number, string> = {
      1: '3-4 lata',
      2: '5-6 lat',
      3: '7-8 lat',
      4: '9-10 lat',
    };

    const ageLabel = ageGroupMap[params.age_group_id] || 'nieznana';

    return `Wygeneruj scenariusz zabawy (quest) o następujących parametrach:
- Grupa wiekowa: ${ageLabel}
- Czas trwania: ${params.duration_minutes} minut
- Lokalizacja: ${params.location === 'home' ? 'dom' : 'na zewnątrz'}
- Poziom energii: ${params.energy_level === 'low' ? 'niski' : params.energy_level === 'medium' ? 'średni' : 'wysoki'}`;
  }
}

/**
 * Factory function
 */
export function createAIService(supabase: SupabaseClient): AIService {
  const apiKey = import.meta.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  const contentSafety = new ContentSafetyService(supabase);
  return new AIService(apiKey, contentSafety);
}
```

### Krok 6: Testy jednostkowe (opcjonalne ale zalecane)

Stwórz `src/lib/__tests__/openrouter-service.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OpenRouterService } from '../openrouter-service';
import {
  ConfigurationError,
  ValidationError,
  APIError,
} from '../openrouter-errors';

describe('OpenRouterService', () => {
  describe('constructor', () => {
    it('should throw ConfigurationError when apiKey is missing', () => {
      expect(() => {
        new OpenRouterService({
          apiKey: '',
          httpReferer: 'https://test.com',
          appTitle: 'Test',
        });
      }).toThrow(ConfigurationError);
    });

    it('should throw ConfigurationError when httpReferer is missing', () => {
      expect(() => {
        new OpenRouterService({
          apiKey: 'test-key',
          httpReferer: '',
          appTitle: 'Test',
        });
      }).toThrow(ConfigurationError);
    });

    it('should create instance with valid config', () => {
      const service = new OpenRouterService({
        apiKey: 'test-key',
        httpReferer: 'https://test.com',
        appTitle: 'Test',
      });

      expect(service).toBeInstanceOf(OpenRouterService);
    });
  });

  describe('complete', () => {
    let service: OpenRouterService;

    beforeEach(() => {
      service = new OpenRouterService({
        apiKey: 'test-key',
        httpReferer: 'https://test.com',
        appTitle: 'Test',
      });
    });

    it('should throw ValidationError when messages array is empty', async () => {
      await expect(
        service.complete({
          messages: [],
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when json_schema is missing for json_schema type', async () => {
      await expect(
        service.complete({
          messages: [{ role: 'user', content: 'test' }],
          responseFormat: {
            type: 'json_schema',
          } as any,
        })
      ).rejects.toThrow(ValidationError);
    });
  });
});
```

### Krok 7: Dokumentacja i przykłady użycia

Stwórz `src/lib/examples/openrouter-examples.ts`:

```typescript
/**
 * Przykłady użycia OpenRouterService
 */

import { createOpenRouterService } from '../openrouter-service';

/**
 * Przykład 1: Podstawowe użycie
 */
export async function example1_basic() {
  const service = createOpenRouterService({
    httpReferer: 'https://myapp.com',
    appTitle: 'My App',
  });

  const response = await service.complete({
    messages: [
      { role: 'user', content: 'Napisz krótki wiersz o kocie' },
    ],
  });

  console.log(response.data);
}

/**
 * Przykład 2: Structured output z JSON Schema
 */
export async function example2_structured() {
  const service = createOpenRouterService({
    httpReferer: 'https://myapp.com',
    appTitle: 'My App',
  });

  interface Recipe {
    name: string;
    ingredients: string[];
    steps: string[];
    prep_time_minutes: number;
  }

  const response = await service.complete<Recipe>({
    messages: [
      {
        role: 'user',
        content: 'Podaj prosty przepis na omlet',
      },
    ],
    responseFormat: {
      type: 'json_schema',
      json_schema: {
        name: 'recipe',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            ingredients: {
              type: 'array',
              items: { type: 'string' },
            },
            steps: {
              type: 'array',
              items: { type: 'string' },
            },
            prep_time_minutes: {
              type: 'number',
              minimum: 1,
            },
          },
          required: ['name', 'ingredients', 'steps', 'prep_time_minutes'],
          additionalProperties: false,
        },
      },
    },
  });

  console.log(`Przepis: ${response.data.name}`);
  console.log(`Składniki: ${response.data.ingredients.join(', ')}`);
}

/**
 * Przykład 3: Z retry i custom validation
 */
export async function example3_with_retry() {
  const service = createOpenRouterService({
    httpReferer: 'https://myapp.com',
    appTitle: 'My App',
  });

  interface Story {
    title: string;
    content: string;
    word_count: number;
  }

  const response = await service.complete<Story>({
    messages: [
      {
        role: 'user',
        content: 'Napisz krótką historię dla dzieci (max 100 słów)',
      },
    ],
    responseFormat: {
      type: 'json_schema',
      json_schema: {
        name: 'story',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            title: { type: 'string', maxLength: 100 },
            content: { type: 'string' },
            word_count: { type: 'number' },
          },
          required: ['title', 'content', 'word_count'],
          additionalProperties: false,
        },
      },
    },
    maxRetries: 2,
    validator: (story) => {
      // Sprawdź czy liczba słów się zgadza
      const actualWordCount = story.content.split(/\s+/).length;
      return story.word_count === actualWordCount && actualWordCount <= 100;
    },
  });

  console.log(response.data);
}

/**
 * Przykład 4: Różne modele
 */
export async function example4_different_models() {
  const service = createOpenRouterService({
    httpReferer: 'https://myapp.com',
    appTitle: 'My App',
  });

  // Szybki i tani model
  const quickResponse = await service.complete({
    messages: [{ role: 'user', content: 'Co to jest TypeScript?' }],
    model: 'anthropic/claude-3-haiku',
    modelParams: {
      temperature: 0.1,
      max_tokens: 200,
    },
  });

  // Zaawansowany model
  const detailedResponse = await service.complete({
    messages: [
      {
        role: 'user',
        content: 'Wyjaśnij szczegółowo wzorzec projektowy Observer',
      },
    ],
    model: 'anthropic/claude-3-opus',
    modelParams: {
      temperature: 0.7,
      max_tokens: 2000,
    },
  });
}
```

### Krok 8: Integracja z Astro endpoints

Przykład użycia w endpointach API:

```typescript
// src/pages/api/ai/generate.ts
import type { APIRoute } from 'astro';
import { createOpenRouterService } from '../../../lib/openrouter-service';
import { handleError } from '../../../lib/errors';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Sprawdź autentykację
    if (!locals.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    // Parsuj request
    const body = await request.json();

    // Utwórz usługę
    const service = createOpenRouterService({
      httpReferer: 'https://kidsquest.app',
      appTitle: 'KidsQuest',
    });

    // Wykonaj generation
    const response = await service.complete({
      messages: [
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: body.prompt },
      ],
      maxRetries: 2,
    });

    return new Response(
      JSON.stringify({ result: response.data }),
      { status: 200 }
    );
  } catch (error) {
    const errorResponse = handleError(error);
    return new Response(
      JSON.stringify(errorResponse.body),
      { status: errorResponse.status }
    );
  }
};
```

## 8. Podsumowanie i następne kroki

### Co zaimplementowaliśmy

1. ✅ Uniwersalną usługę OpenRouter z pełnym type safety
2. ✅ Obsługę JSON Schema dla structured outputs
3. ✅ Hierarchię błędów dla różnych scenariuszy
4. ✅ Retry logic z exponential backoff
5. ✅ Walidację konfiguracji i requestów
6. ✅ Obsługę timeout i rate limiting
7. ✅ Logowanie i debugging
8. ✅ Factory functions dla wygody użycia
9. ✅ Przykłady użycia i dokumentację

### Następne kroki

1. **Testy**: Napisz testy jednostkowe i integracyjne
2. **Monitoring**: Zintegruj z serwisem monitoringu (np. Sentry)
3. **Caching**: Dodaj caching dla powtarzających się requestów
4. **Analytics**: Dodaj tracking kosztów i użycia
5. **Rate Limiting**: Zaimplementuj client-side rate limiting
6. **Streaming**: Dodaj obsługę streaming responses (opcjonalne)
7. **Telemetry**: Integracja z istniejącym TelemetryService

### Najlepsze praktyki przy użyciu

1. Zawsze używaj zmiennych środowiskowych dla API keys
2. Implementuj custom walidatory dla business logic
3. Używaj retry tylko tam gdzie ma to sens
4. Monitoruj koszty przez metadata.usage
5. Dostosuj parametry modelu do przypadku użycia
6. Używaj strict mode dla JSON Schema
7. Loguj błędy do zewnętrznego serwisu
8. Testuj z różnymi modelami przed production

### Optymalizacja kosztów

1. Używaj tańszych modeli dla prostych zadań (claude-haiku)
2. Ogranicz max_tokens do minimum
3. Cachuj powtarzające się generacje
4. Monitoruj usage przez metadata
5. Implementuj rate limiting po stronie klienta
6. Używaj nižszej temperatury dla deterministycznych zadań

---

**Autor**: AI Assistant  
**Data**: 2025-10-15  
**Wersja**: 1.0.0

