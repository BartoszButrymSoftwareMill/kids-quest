import { r as requireAuth } from '../../../chunks/auth_BXBtxCV-.mjs';
import { A as AppError, h as handleError } from '../../../chunks/errors_ClCkzvSe.mjs';
import { g as generateQuestSchema } from '../../../chunks/validation_TFVsMUGg.mjs';
import { r as rateLimiter, R as RATE_LIMITS } from '../../../chunks/rate-limiter_CparevQz.mjs';
import { C as ContentSafetyService } from '../../../chunks/content-safety_WWQcEu_D.mjs';
import { T as TelemetryService } from '../../../chunks/telemetry-service_C3Qw2RXq.mjs';
export { renderers } from '../../../renderers.mjs';

class OpenRouterError extends Error {
  constructor(message, code, details) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = "OpenRouterError";
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
      details: this.details
    };
  }
}
class ConfigurationError extends OpenRouterError {
  constructor(message, details) {
    super(message, "CONFIGURATION_ERROR", details);
    this.name = "ConfigurationError";
  }
}
class ValidationError extends OpenRouterError {
  constructor(message, details) {
    super(message, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}
class APIError extends OpenRouterError {
  constructor(message, statusCode, details) {
    super(message, "API_ERROR", details);
    this.statusCode = statusCode;
    this.name = "APIError";
  }
}
class ParsingError extends OpenRouterError {
  constructor(message, details) {
    super(message, "PARSING_ERROR", details);
    this.name = "ParsingError";
  }
}
class TimeoutError extends OpenRouterError {
  constructor(message = "Request timeout") {
    super(message, "TIMEOUT_ERROR");
    this.name = "TimeoutError";
  }
}
class RateLimitError extends OpenRouterError {
  constructor(message, retryAfter) {
    super(message, "RATE_LIMIT_ERROR", { retryAfter });
    this.retryAfter = retryAfter;
    this.name = "RateLimitError";
  }
}

class OpenRouterService {
  config;
  baseHeaders;
  /**
   * Tworzy nową instancję usługi
   */
  constructor(config) {
    this.validateConfig(config);
    this.config = {
      baseUrl: "https://openrouter.ai/api/v1",
      timeout: 3e4,
      defaultModel: "meta-llama/llama-4-maverick:free",
      defaultModelParams: {
        temperature: 0.7,
        max_tokens: 2e3
      },
      ...config
    };
    this.baseHeaders = {
      Authorization: `Bearer ${this.config.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": this.config.httpReferer,
      "X-Title": this.config.appTitle
    };
  }
  /**
   * Waliduje konfigurację
   */
  validateConfig(config) {
    if (!config.apiKey || config.apiKey.trim() === "") {
      throw new ConfigurationError("API key is required", { field: "apiKey" });
    }
    if (!config.httpReferer || config.httpReferer.trim() === "") {
      throw new ConfigurationError("HTTP Referer is required", {
        field: "httpReferer"
      });
    }
    if (!config.appTitle || config.appTitle.trim() === "") {
      throw new ConfigurationError("App title is required", {
        field: "appTitle"
      });
    }
    if (config.timeout && config.timeout < 1e3) {
      throw new ConfigurationError("Timeout must be at least 1000ms", {
        field: "timeout",
        value: config.timeout
      });
    }
  }
  /**
   * Główna metoda do wykonywania completion requestów
   */
  async complete(request) {
    this.validateRequest(request);
    const maxRetries = request.maxRetries ?? 0;
    return this.retryWithBackoff(async () => {
      const body = this.buildRequestBody(request);
      const apiResponse = await this.makeRequest("/chat/completions", body);
      const parsedResponse = this.parseResponse(apiResponse, request.responseFormat);
      if (request.validator) {
        const isValid = await request.validator(parsedResponse.data);
        if (!isValid) {
          throw new ValidationError("Response validation failed", { data: parsedResponse.data });
        }
      }
      return parsedResponse;
    }, maxRetries);
  }
  /**
   * Pobiera listę dostępnych modeli
   */
  async getAvailableModels() {
    try {
      const response = await this.makeRequest("/models", null, "GET");
      if (!Array.isArray(response)) {
        throw new ParsingError("Invalid models response format");
      }
      return response;
    } catch (error) {
      this.logError(error, "getAvailableModels");
      throw error;
    }
  }
  /**
   * Waliduje completion request
   */
  validateRequest(request) {
    if (!request.messages || request.messages.length === 0) {
      throw new ValidationError("Messages array cannot be empty", {
        field: "messages"
      });
    }
    for (let i = 0; i < request.messages.length; i++) {
      const msg = request.messages[i];
      if (!msg.role || !msg.content) {
        throw new ValidationError(`Invalid message at index ${i}`, {
          field: "messages",
          index: i,
          message: msg
        });
      }
    }
    if (request.responseFormat?.type === "json_schema") {
      if (!request.responseFormat.json_schema) {
        throw new ValidationError('json_schema is required when type is "json_schema"', {
          field: "responseFormat.json_schema"
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
  validateJsonSchema(schema) {
    if (!schema.type || schema.type !== "object") {
      throw new ValidationError('Schema must be of type "object"', { schema });
    }
    if (!schema.properties || Object.keys(schema.properties).length === 0) {
      throw new ValidationError("Schema must have at least one property", {
        schema
      });
    }
    if (!Array.isArray(schema.required)) {
      throw new ValidationError('Schema must have "required" array', {
        schema
      });
    }
  }
  /**
   * Waliduje parametry modelu
   */
  validateModelParams(params) {
    if (params.temperature !== void 0) {
      if (params.temperature < 0 || params.temperature > 2) {
        throw new ValidationError("Temperature must be between 0 and 2", {
          field: "temperature",
          value: params.temperature
        });
      }
    }
    if (params.max_tokens !== void 0) {
      if (params.max_tokens < 1) {
        throw new ValidationError("max_tokens must be at least 1", {
          field: "max_tokens",
          value: params.max_tokens
        });
      }
    }
    if (params.top_p !== void 0) {
      if (params.top_p < 0 || params.top_p > 1) {
        throw new ValidationError("top_p must be between 0 and 1", {
          field: "top_p",
          value: params.top_p
        });
      }
    }
  }
  /**
   * Buduje request body
   */
  buildRequestBody(request) {
    const model = request.model || this.config.defaultModel;
    const params = {
      ...this.config.defaultModelParams,
      ...request.modelParams
    };
    const body = {
      model,
      messages: request.messages,
      ...params
    };
    if (request.responseFormat) {
      if (request.responseFormat.type === "json_schema") {
        const jsonSchema = request.responseFormat.json_schema;
        if (jsonSchema) {
          body.response_format = {
            type: "json_schema",
            json_schema: {
              name: jsonSchema.name,
              strict: jsonSchema.strict ?? true,
              schema: jsonSchema.schema
            }
          };
        }
      } else if (request.responseFormat.type === "json_object") {
        body.response_format = { type: "json_object" };
      }
    }
    return body;
  }
  /**
   * Wykonuje HTTP request do API
   */
  async makeRequest(endpoint, body, method = "POST") {
    const url = `${this.config.baseUrl}${endpoint}`;
    try {
      const response = await fetch(url, {
        method,
        headers: this.baseHeaders,
        body: method === "POST" ? JSON.stringify(body) : void 0,
        signal: AbortSignal.timeout(this.config.timeout)
      });
      const responseText = await response.text();
      if (!response.ok) {
        console.error("[OpenRouter] Error response:", responseText);
        try {
          const errorData = JSON.parse(responseText);
          console.error("[OpenRouter] Parsed error:", errorData);
        } catch {
          console.error("[OpenRouter] Could not parse error as JSON");
        }
        await this.handleHTTPError(response);
      }
      const responseData = JSON.parse(responseText);
      return responseData;
    } catch (error) {
      console.error("[OpenRouter] Request error:", error);
      if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
        throw new TimeoutError(`Request timeout after ${this.config.timeout}ms`);
      }
      if (error instanceof OpenRouterError) {
        throw error;
      }
      throw new APIError("Network error occurred", 0, error instanceof Error ? error.message : "Unknown error");
    }
  }
  /**
   * Obsługuje błędy HTTP
   */
  async handleHTTPError(response) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }
    switch (response.status) {
      case 400:
        throw new ValidationError("Invalid request", errorData);
      case 401:
        throw new APIError("Invalid API key", 401, errorData);
      case 403:
        throw new APIError("Forbidden", 403, errorData);
      case 404:
        throw new APIError("Endpoint not found", 404, errorData);
      case 429: {
        const retryAfter = response.headers.get("Retry-After");
        throw new RateLimitError("Rate limit exceeded", retryAfter ? parseInt(retryAfter) : void 0);
      }
      case 500:
      case 502:
      case 503:
      case 504:
        throw new APIError("OpenRouter API server error", response.status, errorData);
      default:
        throw new APIError(`HTTP error ${response.status}`, response.status, errorData);
    }
  }
  /**
   * Parsuje odpowiedź z API
   */
  parseResponse(apiResponse, format) {
    if (!this.isValidAPIResponse(apiResponse)) {
      throw new ParsingError("Invalid API response structure", { apiResponse });
    }
    const response = apiResponse;
    const rawContent = response.choices[0]?.message?.content;
    if (rawContent === void 0) {
      throw new ParsingError("No content in API response", { response });
    }
    let data;
    if (format?.type === "json_schema" || format?.type === "json_object") {
      data = this.parseJSON(rawContent);
    } else if (!format) {
      try {
        data = this.parseJSON(rawContent);
      } catch {
        data = rawContent;
      }
    } else {
      data = rawContent;
    }
    const metadata = {
      model: response.model,
      usage: response.usage,
      finish_reason: response.choices[0].finish_reason
    };
    return {
      data,
      rawContent,
      metadata
    };
  }
  /**
   * Parsuje JSON z obsługą markdown code blocks
   */
  parseJSON(content) {
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      return JSON.parse(jsonString.trim());
    } catch (error) {
      throw new ParsingError("Failed to parse JSON response", {
        rawContent: content.substring(0, 200),
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
  /**
   * Sprawdza czy odpowiedź ma poprawną strukturę
   */
  isValidAPIResponse(response) {
    if (typeof response !== "object" || response === null) {
      return false;
    }
    const r = response;
    return Array.isArray(r.choices) && r.choices.length > 0 && typeof r.choices[0].message === "object" && "content" in r.choices[0].message && typeof r.usage === "object";
  }
  /**
   * Implementuje retry logic z exponential backoff
   */
  async retryWithBackoff(fn, maxRetries, attempt = 0) {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof ConfigurationError || error instanceof ValidationError || error instanceof APIError && error.statusCode === 401) {
        throw error;
      }
      if (attempt >= maxRetries) {
        this.logError(error, `retryWithBackoff (final attempt ${attempt})`);
        throw error;
      }
      const delay = Math.min(1e3 * Math.pow(2, attempt), 1e4);
      console.warn(
        `[OpenRouterService] Retry ${attempt + 1}/${maxRetries} after ${delay}ms`,
        error instanceof Error ? error.message : "Unknown error"
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.retryWithBackoff(fn, maxRetries, attempt + 1);
    }
  }
  /**
   * Loguje błędy
   */
  logError(error, context) {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const errorInfo = {
      timestamp,
      context,
      service: "OpenRouterService",
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...error instanceof OpenRouterError && {
          code: error.code,
          details: this.sanitizeForLogging(error.details)
        }
      } : error
    };
    console.error("[OpenRouterService Error]", errorInfo);
  }
  /**
   * Sanityzuje dane do logowania
   */
  sanitizeForLogging(data) {
    if (typeof data === "object" && data !== null) {
      const sanitized = { ...data };
      const sensitiveFields = ["apiKey", "password", "token", "secret", "authorization"];
      for (const field of sensitiveFields) {
        if (field in sanitized) {
          sanitized[field] = "[REDACTED]";
        }
      }
      return sanitized;
    }
    return data;
  }
}

class AIService {
  constructor(apiKey, contentSafety) {
    this.contentSafety = contentSafety;
    this.openRouter = new OpenRouterService({
      apiKey,
      httpReferer: "https://kidsquest.app",
      appTitle: "KidsQuest",
      defaultModel: "meta-llama/llama-4-maverick:free",
      timeout: 3e4,
      defaultModelParams: {
        temperature: 0.8,
        max_tokens: 2e3
      }
    });
  }
  openRouter;
  /**
   * Generates a quest using AI based on provided parameters
   * Includes content safety validation and retry logic
   */
  async generateQuest(params) {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(params);
    const response = await this.openRouter.complete({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      // responseFormat nie jest wspierane przez wszystkie modele (np. Meta/Llama)
      // Polegamy na instrukcjach w prompcie
      maxRetries: 2,
      validator: async (quest) => {
        const q = quest;
        if (!q.title || !q.hook || !q.step1 || !q.step2 || !q.step3) {
          return false;
        }
        const validation = await this.contentSafety.validateContent({
          title: q.title,
          hook: q.hook,
          step1: q.step1,
          step2: q.step2,
          step3: q.step3,
          easier_version: q.easier_version || "",
          harder_version: q.harder_version || "",
          safety_notes: q.safety_notes || ""
        });
        return validation.isValid;
      }
    });
    return {
      ...response.data,
      age_group_id: params.age_group_id,
      duration_minutes: params.duration_minutes,
      location: params.location,
      energy_level: params.energy_level,
      prop_ids: params.prop_ids || [],
      source: "ai"
    };
  }
  /**
   * Builds the system prompt for AI generation
   */
  buildSystemPrompt() {
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
- Unikaj konkurencji - skup się na zabawie i odkrywaniu

FORMAT ODPOWIEDZI:
Odpowiedz TYLKO w formacie JSON bez dodatkowego tekstu. Struktura:
{
  "title": "Krótki, chwytliwy tytuł (10-200 znaków)",
  "hook": "Intrygujące wprowadzenie (10-300 znaków)",
  "step1": "Pierwszy krok questa (10-250 znaków)",
  "step2": "Drugi krok questa (10-250 znaków)",
  "step3": "Trzeci krok questa (10-250 znaków)",
  "easier_version": "Prostsza wersja lub null",
  "harder_version": "Trudniejsza wersja lub null",
  "safety_notes": "Uwagi dotyczące bezpieczeństwa lub null"
}`;
  }
  /**
   * Builds the user prompt with quest parameters
   */
  buildUserPrompt(params) {
    const ageGroupMap = {
      1: "3-4 lata",
      2: "5-6 lat",
      3: "7-8 lat",
      4: "9-10 lat"
    };
    const ageLabel = ageGroupMap[params.age_group_id] || "nieznana";
    return `Wygeneruj scenariusz zabawy (quest) o następujących parametrach:
- Grupa wiekowa: ${ageLabel}
- Czas trwania: ${params.duration_minutes} minut
- Lokalizacja: ${params.location === "home" ? "dom" : "na zewnątrz"}
- Poziom energii: ${params.energy_level === "low" ? "niski" : params.energy_level === "medium" ? "średni" : "wysoki"}

Zwróć odpowiedź TYLKO w formacie JSON zgodnie ze strukturą podaną w instrukcjach systemowych.`;
  }
}
function createAIService(supabase) {
  const apiKey = "sk-or-v1-dummy-key-for-development";
  const contentSafety = new ContentSafetyService(supabase);
  return new AIService(apiKey, contentSafety);
}

const POST = async ({ locals, request }) => {
  try {
    const userId = await requireAuth(locals.supabase);
    const body = await request.json();
    const validation = generateQuestSchema.safeParse(body);
    if (!validation.success) {
      throw new AppError(400, "validation_failed", "Nieprawidłowe dane wejściowe", validation.error.errors);
    }
    const params = validation.data;
    const minuteLimit = await rateLimiter.checkLimit(`${userId}:gen:minute`, RATE_LIMITS.QUEST_GENERATION_MINUTE);
    if (!minuteLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: "rate_limit_exceeded",
          message: "Wystąpił błąd, spróbuj później",
          retry_after: minuteLimit.retryAfter
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": minuteLimit.retryAfter?.toString() || "60"
          }
        }
      );
    }
    const hourLimit = await rateLimiter.checkLimit(`${userId}:gen:hour`, RATE_LIMITS.QUEST_GENERATION_HOUR);
    if (!hourLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: "rate_limit_exceeded",
          message: "Wystąpił błąd, spróbuj później",
          retry_after: hourLimit.retryAfter
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": hourLimit.retryAfter?.toString() || "3600"
          }
        }
      );
    }
    const aiService = createAIService(locals.supabase);
    let quest;
    try {
      quest = await aiService.generateQuest(params);
    } catch {
      const telemetry2 = new TelemetryService(locals.supabase);
      await telemetry2.trackGenerationError(userId, "generation_failed", params, params.app_version);
      throw new AppError(500, "generation_failed", "Wystąpił błąd, spróbuj później");
    }
    const telemetry = new TelemetryService(locals.supabase);
    await telemetry.trackQuestGenerated(userId, null, params, params.app_version);
    return new Response(JSON.stringify(quest), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    const errorResponse = handleError(error);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
