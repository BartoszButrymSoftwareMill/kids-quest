# Complete API Implementation Plan - KidsQuest MVP

## Table of Contents
1. [Overview](#overview)
2. [Shared Infrastructure](#shared-infrastructure)
3. [Authentication Endpoints](#authentication-endpoints)
4. [Profile Endpoints](#profile-endpoints)
5. [Quest Management Endpoints](#quest-management-endpoints)
6. [Dictionary Endpoints](#dictionary-endpoints)
7. [Telemetry Endpoints](#telemetry-endpoints)
8. [Implementation Order](#implementation-order)

---

## Overview

This document provides comprehensive implementation plans for all REST API endpoints in the KidsQuest MVP application. The API is built using:
- **Framework**: Astro 5 API routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Language**: TypeScript 5
- **Validation**: Zod schemas

### Key Architecture Decisions

1. **Authentication**: Middleware-based auth checking using Supabase client from `context.locals`
2. **Authorization**: Row-Level Security (RLS) enforced at database level
3. **Validation**: Zod schemas for all request/response data
4. **Error Handling**: Standardized error responses with consistent format
5. **Type Safety**: Generated database types + custom DTOs

---

## Shared Infrastructure

Before implementing endpoints, create these shared components:

### 1. Type Definitions (`src/types.ts`)

```typescript
import type { Database } from './db/database.types';

// Database table types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Quest = Database['public']['Tables']['quests']['Row'];
export type QuestProp = Database['public']['Tables']['quest_props']['Row'];
export type Event = Database['public']['Tables']['events']['Row'];
export type AgeGroup = Database['public']['Tables']['age_groups']['Row'];
export type Prop = Database['public']['Tables']['props']['Row'];
export type ContentPolicyRule = Database['public']['Tables']['content_policy_rules']['Row'];

// Enums
export type QuestStatus = Database['public']['Enums']['quest_status'];
export type QuestSource = Database['public']['Enums']['quest_source'];
export type LocationType = Database['public']['Enums']['location_type'];
export type EnergyLevel = Database['public']['Enums']['energy_level'];
export type EventType = Database['public']['Enums']['event_type'];
export type RuleType = Database['public']['Enums']['rule_type'];
export type PatternMatchType = Database['public']['Enums']['pattern_match_type'];

// DTOs - Request
export interface GenerateQuestRequest {
  age_group_id: number;
  duration_minutes: number;
  location: LocationType;
  energy_level: EnergyLevel;
  prop_ids?: number[];
  app_version?: string;
}

export interface CreateQuestRequest {
  title: string;
  hook: string;
  step1: string;
  step2: string;
  step3: string;
  easier_version?: string | null;
  harder_version?: string | null;
  safety_notes?: string | null;
  age_group_id: number;
  duration_minutes: number;
  location: LocationType;
  energy_level: EnergyLevel;
  prop_ids?: number[];
  source: QuestSource;
  status?: QuestStatus;
  app_version?: string;
}

export interface UpdateQuestRequest {
  status?: QuestStatus;
  is_favorite?: boolean;
}

export interface UpdateProfileRequest {
  default_age_group_id?: number | null;
  default_duration_minutes?: number | null;
  default_location?: LocationType | null;
  default_energy_level?: EnergyLevel | null;
}

export interface CreateEventRequest {
  event_type: EventType;
  quest_id?: string;
  event_data?: Record<string, unknown>;
  app_version?: string;
}

export interface ToggleFavoriteRequest {
  is_favorite: boolean;
}

// DTOs - Response
export interface QuestResponse {
  id: string;
  user_id: string;
  title: string;
  hook: string;
  step1: string;
  step2: string;
  step3: string;
  easier_version: string | null;
  harder_version: string | null;
  safety_notes: string | null;
  age_group: AgeGroupResponse;
  duration_minutes: number;
  location: LocationType;
  energy_level: EnergyLevel;
  source: QuestSource;
  status: QuestStatus;
  is_favorite: boolean;
  app_version: string | null;
  created_at: string;
  updated_at: string;
  saved_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  favorited_at: string | null;
  props: PropResponse[];
}

export interface AgeGroupResponse {
  id: number;
  code: string;
  label: string;
  min_age?: number;
  max_age?: number;
}

export interface PropResponse {
  id: number;
  code: string;
  label: string;
}

export interface ProfileResponse {
  user_id: string;
  default_age_group_id: number | null;
  default_duration_minutes: number | null;
  default_location: LocationType | null;
  default_energy_level: EnergyLevel | null;
  created_at: string;
  updated_at: string;
}

export interface EventResponse {
  id: string;
  user_id: string;
  event_type: EventType;
  quest_id: string | null;
  event_data: Record<string, unknown> | null;
  app_version: string | null;
  created_at: string;
}

export interface UserResponse {
  id: string;
  email: string;
  created_at: string;
}

export interface QuestListResponse {
  quests: QuestResponse[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

// Error response
export interface ApiError {
  error: string;
  message: string;
  details?: unknown;
  violations?: ContentViolation[];
  suggestions?: ContentSuggestion[];
}

export interface ContentViolation {
  field: string;
  rule: RuleType;
  pattern: string;
}

export interface ContentSuggestion {
  field: string;
  original: string;
  replacement: string;
}

// AI Generation
export interface AIGeneratedQuest {
  title: string;
  hook: string;
  step1: string;
  step2: string;
  step3: string;
  easier_version: string | null;
  harder_version: string | null;
  safety_notes: string | null;
  age_group_id: number;
  duration_minutes: number;
  location: LocationType;
  energy_level: EnergyLevel;
  prop_ids: number[];
  source: 'ai';
}
```

### 2. Validation Schemas (`src/lib/validation.ts`)

```typescript
import { z } from 'zod';

// Enums
export const locationTypeSchema = z.enum(['home', 'outdoor']);
export const energyLevelSchema = z.enum(['low', 'medium', 'high']);
export const questStatusSchema = z.enum(['saved', 'started', 'completed']);
export const questSourceSchema = z.enum(['ai', 'manual']);
export const eventTypeSchema = z.enum([
  'quest_generated',
  'quest_started',
  'quest_saved',
  'quest_completed',
  'quest_created_manual',
  'delete_quest',
  'favorite_toggled',
  'auth_signup',
  'auth_login',
  'error_generation'
]);

// Quest validation
export const generateQuestSchema = z.object({
  age_group_id: z.number().int().positive(),
  duration_minutes: z.number().int().min(1).max(480),
  location: locationTypeSchema,
  energy_level: energyLevelSchema,
  prop_ids: z.array(z.number().int().positive()).optional(),
  app_version: z.string().max(20).optional()
});

export const createQuestSchema = z.object({
  title: z.string().min(1).max(200).regex(/\S/, 'Title must contain non-whitespace'),
  hook: z.string().min(10).max(300),
  step1: z.string().min(10).max(250),
  step2: z.string().min(10).max(250),
  step3: z.string().min(10).max(250),
  easier_version: z.string().min(10).max(500).nullable().optional(),
  harder_version: z.string().min(10).max(500).nullable().optional(),
  safety_notes: z.string().max(500).nullable().optional(),
  age_group_id: z.number().int().positive(),
  duration_minutes: z.number().int().min(1).max(480),
  location: locationTypeSchema,
  energy_level: energyLevelSchema,
  prop_ids: z.array(z.number().int().positive()).optional(),
  source: questSourceSchema,
  status: questStatusSchema.optional(),
  app_version: z.string().max(20).optional()
});

export const updateQuestSchema = z.object({
  status: questStatusSchema.optional(),
  is_favorite: z.boolean().optional()
}).refine(data => data.status !== undefined || data.is_favorite !== undefined, {
  message: 'At least one field must be provided'
});

export const toggleFavoriteSchema = z.object({
  is_favorite: z.boolean()
});

// Profile validation
export const updateProfileSchema = z.object({
  default_age_group_id: z.number().int().positive().nullable().optional(),
  default_duration_minutes: z.number().int().min(1).max(480).nullable().optional(),
  default_location: locationTypeSchema.nullable().optional(),
  default_energy_level: energyLevelSchema.nullable().optional()
});

// Event validation
export const createEventSchema = z.object({
  event_type: eventTypeSchema,
  quest_id: z.string().uuid().optional(),
  event_data: z.record(z.unknown()).nullable().optional(),
  app_version: z.string().optional()
});

// Query params validation
export const questListQuerySchema = z.object({
  age_group_id: z.coerce.number().int().positive().optional(),
  location: locationTypeSchema.optional(),
  energy_level: energyLevelSchema.optional(),
  source: questSourceSchema.optional(),
  status: questStatusSchema.optional(),
  is_favorite: z.enum(['true', 'false']).optional(),
  prop_ids: z.string().optional(), // comma-separated
  sort: z.enum(['recent', 'favorites']).optional().default('recent'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0)
});
```

### 3. Error Utilities (`src/lib/errors.ts`)

```typescript
import type { ApiError } from '../types';

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
      details
    }
  };
}

export function handleError(error: unknown): { status: number; body: ApiError } {
  console.error('API Error:', error);

  if (error instanceof AppError) {
    return createErrorResponse(
      error.statusCode,
      error.error,
      error.message,
      error.details
    );
  }

  if (error instanceof Error) {
    return createErrorResponse(
      500,
      'internal_server_error',
      'Wystąpił błąd serwera',
      { message: error.message }
    );
  }

  return createErrorResponse(
    500,
    'unknown_error',
    'Wystąpił nieznany błąd'
  );
}
```

### 4. Authentication Helpers (`src/lib/auth.ts`)

```typescript
import type { SupabaseClient } from '../db/supabase.client';
import { AppError } from './errors';

export async function requireAuth(supabase: SupabaseClient): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new AppError(401, 'unauthorized', 'Wymagane uwierzytelnienie');
  }
  
  return user.id;
}

export async function getAuthUser(supabase: SupabaseClient) {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new AppError(401, 'unauthorized', 'Wymagane uwierzytelnienie');
  }
  
  return user;
}
```

### 5. Content Safety Service (`src/lib/content-safety.ts`)

```typescript
import type { SupabaseClient } from '../db/supabase.client';
import type { ContentViolation, ContentSuggestion } from '../types';

interface ContentValidationResult {
  isValid: boolean;
  violations: ContentViolation[];
  suggestions: ContentSuggestion[];
  sanitizedContent?: Record<string, string>;
}

export class ContentSafetyService {
  private rules: Map<string, any> | null = null;
  private lastFetch: number = 0;
  private cacheDuration = 5 * 60 * 1000; // 5 minutes

  constructor(private supabase: SupabaseClient) {}

  private async loadRules() {
    const now = Date.now();
    if (this.rules && (now - this.lastFetch) < this.cacheDuration) {
      return this.rules;
    }

    const { data, error } = await this.supabase
      .from('content_policy_rules')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('Failed to load content policy rules:', error);
      throw new Error('Failed to load content safety rules');
    }

    this.rules = new Map(data.map(rule => [rule.id.toString(), rule]));
    this.lastFetch = now;
    return this.rules;
  }

  async validateContent(content: Record<string, string>): Promise<ContentValidationResult> {
    const rules = await this.loadRules();
    const violations: ContentViolation[] = [];
    const suggestions: ContentSuggestion[] = [];
    const sanitizedContent: Record<string, string> = { ...content };

    for (const [field, text] of Object.entries(content)) {
      if (!text) continue;

      for (const rule of rules.values()) {
        const matched = this.matchPattern(text, rule.pattern, rule.pattern_type, rule.case_sensitive);

        if (matched) {
          if (rule.rule_type === 'hard_ban') {
            violations.push({
              field,
              rule: rule.rule_type,
              pattern: rule.pattern
            });
          } else if (rule.rule_type === 'soft_ban' && rule.replacement) {
            suggestions.push({
              field,
              original: rule.pattern,
              replacement: rule.replacement
            });
          } else if (rule.rule_type === 'replacement' && rule.replacement) {
            sanitizedContent[field] = this.replacePattern(
              sanitizedContent[field],
              rule.pattern,
              rule.replacement,
              rule.pattern_type,
              rule.case_sensitive
            );
          }
        }
      }
    }

    return {
      isValid: violations.length === 0,
      violations,
      suggestions,
      sanitizedContent: violations.length === 0 ? sanitizedContent : undefined
    };
  }

  private matchPattern(
    text: string,
    pattern: string,
    patternType: string,
    caseSensitive: boolean
  ): boolean {
    const flags = caseSensitive ? '' : 'i';

    switch (patternType) {
      case 'exact':
        return caseSensitive 
          ? text.includes(pattern)
          : text.toLowerCase().includes(pattern.toLowerCase());
      
      case 'wildcard':
        const regexPattern = pattern
          .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          .replace(/\\%/g, '.*');
        return new RegExp(regexPattern, flags).test(text);
      
      case 'regex':
        return new RegExp(pattern, flags).test(text);
      
      default:
        return false;
    }
  }

  private replacePattern(
    text: string,
    pattern: string,
    replacement: string,
    patternType: string,
    caseSensitive: boolean
  ): string {
    const flags = caseSensitive ? 'g' : 'gi';

    switch (patternType) {
      case 'exact':
        const exactRegex = new RegExp(
          pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
          flags
        );
        return text.replace(exactRegex, replacement);
      
      case 'wildcard':
        const wildcardPattern = pattern
          .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          .replace(/\\%/g, '.*');
        return text.replace(new RegExp(wildcardPattern, flags), replacement);
      
      case 'regex':
        return text.replace(new RegExp(pattern, flags), replacement);
      
      default:
        return text;
    }
  }
}
```

### 6. Rate Limiter (`src/lib/rate-limiter.ts`)

```typescript
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  async checkLimit(
    userId: string,
    config: RateLimitConfig
  ): Promise<{ allowed: boolean; retryAfter?: number }> {
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    // Get user's request timestamps
    let timestamps = this.requests.get(userId) || [];
    
    // Filter out old requests outside the window
    timestamps = timestamps.filter(ts => ts > windowStart);
    
    if (timestamps.length >= config.maxRequests) {
      const oldestRequest = timestamps[0];
      const retryAfter = Math.ceil((oldestRequest + config.windowMs - now) / 1000);
      
      return { allowed: false, retryAfter };
    }
    
    // Add current request
    timestamps.push(now);
    this.requests.set(userId, timestamps);
    
    return { allowed: true };
  }

  cleanup() {
    const now = Date.now();
    for (const [userId, timestamps] of this.requests.entries()) {
      const filtered = timestamps.filter(ts => ts > now - 3600000); // Keep last hour
      if (filtered.length === 0) {
        this.requests.delete(userId);
      } else {
        this.requests.set(userId, filtered);
      }
    }
  }
}

export const rateLimiter = new RateLimiter();

// Cleanup old entries every 5 minutes
setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);

export const RATE_LIMITS = {
  QUEST_GENERATION_MINUTE: { windowMs: 60 * 1000, maxRequests: 5 },
  QUEST_GENERATION_HOUR: { windowMs: 60 * 60 * 1000, maxRequests: 30 },
  GENERAL_API: { windowMs: 60 * 1000, maxRequests: 100 }
};
```

### 7. AI Service (`src/lib/ai-service.ts`)

```typescript
import type { AIGeneratedQuest, GenerateQuestRequest } from '../types';
import { ContentSafetyService } from './content-safety';
import type { SupabaseClient } from '../db/supabase.client';

export class AIService {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor(
    apiKey: string,
    private contentSafety: ContentSafetyService
  ) {
    this.apiKey = apiKey;
  }

  async generateQuest(params: GenerateQuestRequest): Promise<AIGeneratedQuest> {
    const systemPrompt = this.buildSystemPrompt(params);
    const maxRetries = 2;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://kidsquest.app',
            'X-Title': 'KidsQuest'
          },
          body: JSON.stringify({
            model: 'anthropic/claude-3-haiku',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: this.buildUserPrompt(params) }
            ],
            temperature: 0.8,
            max_tokens: 2000
          }),
          signal: AbortSignal.timeout(30000)
        });

        if (!response.ok) {
          throw new Error(`AI API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        const quest = this.parseQuestResponse(content, params);

        // Validate content safety
        const validation = await this.contentSafety.validateContent({
          title: quest.title,
          hook: quest.hook,
          step1: quest.step1,
          step2: quest.step2,
          step3: quest.step3,
          easier_version: quest.easier_version || '',
          harder_version: quest.harder_version || '',
          safety_notes: quest.safety_notes || ''
        });

        if (!validation.isValid && attempt < maxRetries) {
          attempt++;
          console.warn(`Content validation failed, retry ${attempt}/${maxRetries}`);
          continue;
        }

        if (!validation.isValid) {
          throw new Error('Content validation failed after retries');
        }

        return quest;
      } catch (error) {
        if (attempt >= maxRetries) {
          throw error;
        }
        attempt++;
      }
    }

    throw new Error('Failed to generate quest after retries');
  }

  private buildSystemPrompt(params: GenerateQuestRequest): string {
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

WYMAGANY FORMAT ODPOWIEDZI (JSON):
{
  "title": "Krótki, chwytliwy tytuł (max 200 znaków)",
  "hook": "Intrygujące wprowadzenie (10-300 znaków)",
  "step1": "Pierwszy krok questa (10-250 znaków)",
  "step2": "Drugi krok questa (10-250 znaków)",
  "step3": "Trzeci krok questa (10-250 znaków)",
  "easier_version": "Prostsza wersja lub null",
  "harder_version": "Trudniejsza wersja lub null",
  "safety_notes": "Uwagi dotyczące bezpieczeństwa lub null"
}`;
  }

  private buildUserPrompt(params: GenerateQuestRequest): string {
    const ageGroupMap: Record<number, string> = {
      1: '3-4 lata',
      2: '5-6 lat',
      3: '7-8 lat',
      4: '9-10 lat'
    };

    return `Wygeneruj scenariusz zabawy (quest) o następujących parametrach:
- Grupa wiekowa: ${ageGroupMap[params.age_group_id]}
- Czas trwania: ${params.duration_minutes} minut
- Lokalizacja: ${params.location === 'home' ? 'dom' : 'na zewnątrz'}
- Poziom energii: ${params.energy_level === 'low' ? 'niski' : params.energy_level === 'medium' ? 'średni' : 'wysoki'}

Odpowiedz TYLKO w formacie JSON bez dodatkowego tekstu.`;
  }

  private parseQuestResponse(content: string, params: GenerateQuestRequest): AIGeneratedQuest {
    // Remove markdown code blocks if present
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
    const jsonString = jsonMatch ? jsonMatch[1] : content;

    const parsed = JSON.parse(jsonString.trim());

    return {
      title: parsed.title,
      hook: parsed.hook,
      step1: parsed.step1,
      step2: parsed.step2,
      step3: parsed.step3,
      easier_version: parsed.easier_version || null,
      harder_version: parsed.harder_version || null,
      safety_notes: parsed.safety_notes || null,
      age_group_id: params.age_group_id,
      duration_minutes: params.duration_minutes,
      location: params.location,
      energy_level: params.energy_level,
      prop_ids: params.prop_ids || [],
      source: 'ai'
    };
  }
}

export function createAIService(supabase: SupabaseClient): AIService {
  const apiKey = import.meta.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }
  
  const contentSafety = new ContentSafetyService(supabase);
  return new AIService(apiKey, contentSafety);
}
```

### 8. Quest Service (`src/lib/quest-service.ts`)

```typescript
import type { SupabaseClient } from '../db/supabase.client';
import type { QuestResponse, AgeGroupResponse, PropResponse, CreateQuestRequest } from '../types';
import { AppError } from './errors';

export class QuestService {
  constructor(private supabase: SupabaseClient) {}

  async createQuest(userId: string, data: CreateQuestRequest): Promise<QuestResponse> {
    // Determine timestamps based on status
    const now = new Date().toISOString();
    const timestamps: any = {
      saved_at: null,
      started_at: null,
      completed_at: null
    };

    if (data.status === 'saved' || !data.status) {
      timestamps.saved_at = now;
    } else if (data.status === 'started') {
      timestamps.saved_at = now;
      timestamps.started_at = now;
    } else if (data.status === 'completed') {
      timestamps.saved_at = now;
      timestamps.started_at = now;
      timestamps.completed_at = now;
    }

    // Create quest
    const { data: quest, error } = await this.supabase
      .from('quests')
      .insert({
        user_id: userId,
        title: data.title,
        hook: data.hook,
        step1: data.step1,
        step2: data.step2,
        step3: data.step3,
        easier_version: data.easier_version || null,
        harder_version: data.harder_version || null,
        safety_notes: data.safety_notes || null,
        age_group_id: data.age_group_id,
        duration_minutes: data.duration_minutes,
        location: data.location,
        energy_level: data.energy_level,
        source: data.source,
        status: data.status || 'saved',
        app_version: data.app_version || null,
        ...timestamps
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create quest:', error);
      throw new AppError(500, 'creation_failed', 'Nie udało się utworzyć questa');
    }

    // Create quest_props relationships
    if (data.prop_ids && data.prop_ids.length > 0) {
      const questProps = data.prop_ids.map(propId => ({
        quest_id: quest.id,
        prop_id: propId
      }));

      const { error: propsError } = await this.supabase
        .from('quest_props')
        .insert(questProps);

      if (propsError) {
        console.error('Failed to create quest_props:', propsError);
        // Non-fatal: quest is created, just missing props
      }
    }

    return this.formatQuestResponse(quest, data.prop_ids || []);
  }

  async getQuest(questId: string, userId: string): Promise<QuestResponse> {
    const { data: quest, error } = await this.supabase
      .from('quests')
      .select(`
        *,
        age_groups (id, code, label, span),
        quest_props (
          prop_id,
          props (id, code, label)
        )
      `)
      .eq('id', questId)
      .eq('user_id', userId)
      .single();

    if (error || !quest) {
      throw new AppError(404, 'not_found', 'Quest nie został znaleziony');
    }

    return this.formatQuestResponse(quest);
  }

  async updateQuest(
    questId: string,
    userId: string,
    updates: { status?: string; is_favorite?: boolean }
  ): Promise<QuestResponse> {
    const now = new Date().toISOString();
    const data: any = { updated_at: now };

    if (updates.status !== undefined) {
      data.status = updates.status;
      
      if (updates.status === 'started') {
        data.started_at = now;
      } else if (updates.status === 'completed') {
        data.completed_at = now;
      }
    }

    if (updates.is_favorite !== undefined) {
      data.is_favorite = updates.is_favorite;
      data.favorited_at = updates.is_favorite ? now : null;
    }

    const { data: quest, error } = await this.supabase
      .from('quests')
      .update(data)
      .eq('id', questId)
      .eq('user_id', userId)
      .select(`
        *,
        age_groups (id, code, label, span),
        quest_props (
          prop_id,
          props (id, code, label)
        )
      `)
      .single();

    if (error || !quest) {
      throw new AppError(404, 'not_found', 'Quest nie został znaleziony');
    }

    return this.formatQuestResponse(quest);
  }

  async deleteQuest(questId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('quests')
      .delete()
      .eq('id', questId)
      .eq('user_id', userId);

    if (error) {
      throw new AppError(404, 'not_found', 'Quest nie został znaleziony');
    }
  }

  private formatQuestResponse(quest: any, propIds?: number[]): QuestResponse {
    // Extract age group
    const ageGroup: AgeGroupResponse = {
      id: quest.age_groups?.id || quest.age_group_id,
      code: quest.age_groups?.code || '',
      label: quest.age_groups?.label || ''
    };

    // Extract props
    const props: PropResponse[] = quest.quest_props?.map((qp: any) => ({
      id: qp.props.id,
      code: qp.props.code,
      label: qp.props.label
    })) || [];

    return {
      id: quest.id,
      user_id: quest.user_id,
      title: quest.title,
      hook: quest.hook,
      step1: quest.step1,
      step2: quest.step2,
      step3: quest.step3,
      easier_version: quest.easier_version,
      harder_version: quest.harder_version,
      safety_notes: quest.safety_notes,
      age_group: ageGroup,
      duration_minutes: quest.duration_minutes,
      location: quest.location,
      energy_level: quest.energy_level,
      source: quest.source,
      status: quest.status,
      is_favorite: quest.is_favorite,
      app_version: quest.app_version,
      created_at: quest.created_at,
      updated_at: quest.updated_at,
      saved_at: quest.saved_at,
      started_at: quest.started_at,
      completed_at: quest.completed_at,
      favorited_at: quest.favorited_at,
      props
    };
  }
}
```

### 9. Telemetry Service (`src/lib/telemetry-service.ts`)

```typescript
import type { SupabaseClient } from '../db/supabase.client';
import type { EventType, EventResponse, CreateEventRequest } from '../types';

export class TelemetryService {
  constructor(private supabase: SupabaseClient) {}

  async createEvent(
    userId: string,
    data: CreateEventRequest
  ): Promise<EventResponse> {
    const { data: event, error } = await this.supabase
      .from('events')
      .insert({
        user_id: userId,
        event_type: data.event_type,
        quest_id: data.quest_id || null,
        event_data: data.event_data || null,
        app_version: data.app_version || null
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create event:', error);
      // Non-fatal: log error but don't throw
      throw error;
    }

    return {
      id: event.id,
      user_id: event.user_id,
      event_type: event.event_type,
      quest_id: event.quest_id,
      event_data: event.event_data as Record<string, unknown> | null,
      app_version: event.app_version,
      created_at: event.created_at
    };
  }

  async trackQuestGenerated(
    userId: string,
    questId: string | null,
    params: any,
    appVersion?: string
  ): Promise<void> {
    try {
      await this.createEvent(userId, {
        event_type: 'quest_generated',
        quest_id: questId || undefined,
        event_data: params,
        app_version: appVersion
      });
    } catch (error) {
      console.error('Failed to track quest_generated:', error);
    }
  }

  async trackQuestStarted(
    userId: string,
    questId: string,
    appVersion?: string
  ): Promise<void> {
    try {
      await this.createEvent(userId, {
        event_type: 'quest_started',
        quest_id: questId,
        app_version: appVersion
      });
    } catch (error) {
      console.error('Failed to track quest_started:', error);
    }
  }

  async trackQuestCompleted(
    userId: string,
    questId: string,
    appVersion?: string
  ): Promise<void> {
    try {
      await this.createEvent(userId, {
        event_type: 'quest_completed',
        quest_id: questId,
        app_version: appVersion
      });
    } catch (error) {
      console.error('Failed to track quest_completed:', error);
    }
  }

  async trackQuestSaved(
    userId: string,
    questId: string,
    appVersion?: string
  ): Promise<void> {
    try {
      await this.createEvent(userId, {
        event_type: 'quest_saved',
        quest_id: questId,
        app_version: appVersion
      });
    } catch (error) {
      console.error('Failed to track quest_saved:', error);
    }
  }

  async trackFavoriteToggled(
    userId: string,
    questId: string,
    isFavorite: boolean,
    appVersion?: string
  ): Promise<void> {
    try {
      await this.createEvent(userId, {
        event_type: 'favorite_toggled',
        quest_id: questId,
        event_data: { is_favorite: isFavorite },
        app_version: appVersion
      });
    } catch (error) {
      console.error('Failed to track favorite_toggled:', error);
    }
  }

  async trackQuestDeleted(
    userId: string,
    questId: string,
    appVersion?: string
  ): Promise<void> {
    try {
      await this.createEvent(userId, {
        event_type: 'delete_quest',
        quest_id: questId,
        app_version: appVersion
      });
    } catch (error) {
      console.error('Failed to track delete_quest:', error);
    }
  }

  async trackGenerationError(
    userId: string,
    errorCode: string,
    params: any,
    appVersion?: string
  ): Promise<void> {
    try {
      await this.createEvent(userId, {
        event_type: 'error_generation',
        event_data: { error_code: errorCode, ...params },
        app_version: appVersion
      });
    } catch (error) {
      console.error('Failed to track error_generation:', error);
    }
  }
}
```

---

## Authentication Endpoints

### GET /api/auth/me

**Purpose**: Get current authenticated user information

**Implementation**: `src/pages/api/auth/me.ts`

```typescript
import type { APIRoute } from 'astro';
import { getAuthUser } from '../../lib/auth';
import { handleError } from '../../lib/errors';
import type { UserResponse } from '../../types';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const user = await getAuthUser(locals.supabase);

    const response: { user: UserResponse } = {
      user: {
        id: user.id,
        email: user.email || '',
        created_at: user.created_at || new Date().toISOString()
      }
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    const errorResponse = handleError(error);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

**Flow**:
1. Extract supabase client from `locals`
2. Call `getAuthUser()` which validates JWT and returns user
3. Format user data into response DTO
4. Return 200 with user data or 401 if not authenticated

**Security**:
- Relies on Astro middleware to attach authenticated supabase client to `locals`
- JWT validation handled by Supabase SDK

---

## Profile Endpoints

### GET /api/profiles/me

**Purpose**: Get current user's profile with default preferences

**Implementation**: `src/pages/api/profiles/me.ts`

```typescript
import type { APIRoute } from 'astro';
import { requireAuth } from '../../lib/auth';
import { handleError, AppError } from '../../lib/errors';
import type { ProfileResponse } from '../../types';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const userId = await requireAuth(locals.supabase);

    const { data: profile, error } = await locals.supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !profile) {
      throw new AppError(404, 'not_found', 'Profil nie został znaleziony');
    }

    const response: ProfileResponse = {
      user_id: profile.user_id,
      default_age_group_id: profile.default_age_group_id,
      default_duration_minutes: profile.default_duration_minutes,
      default_location: profile.default_location,
      default_energy_level: profile.default_energy_level,
      created_at: profile.created_at,
      updated_at: profile.updated_at
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    const errorResponse = handleError(error);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

### PATCH /api/profiles/me

**Purpose**: Update current user's default preferences

**Implementation**: Add to `src/pages/api/profiles/me.ts`

```typescript
import { updateProfileSchema } from '../../lib/validation';

export const PATCH: APIRoute = async ({ locals, request }) => {
  try {
    const userId = await requireAuth(locals.supabase);
    const body = await request.json();

    // Validate input
    const validation = updateProfileSchema.safeParse(body);
    if (!validation.success) {
      throw new AppError(
        400,
        'validation_failed',
        'Nieprawidłowe dane wejściowe',
        validation.error.errors
      );
    }

    const updates = validation.data;

    // Verify age_group_id exists if provided
    if (updates.default_age_group_id !== undefined && updates.default_age_group_id !== null) {
      const { data: ageGroup } = await locals.supabase
        .from('age_groups')
        .select('id')
        .eq('id', updates.default_age_group_id)
        .single();

      if (!ageGroup) {
        throw new AppError(404, 'not_found', 'Grupa wiekowa nie istnieje');
      }
    }

    // Update profile
    const { data: profile, error } = await locals.supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new AppError(500, 'update_failed', 'Nie udało się zaktualizować profilu');
    }

    const response: ProfileResponse = {
      user_id: profile.user_id,
      default_age_group_id: profile.default_age_group_id,
      default_duration_minutes: profile.default_duration_minutes,
      default_location: profile.default_location,
      default_energy_level: profile.default_energy_level,
      created_at: profile.created_at,
      updated_at: profile.updated_at
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    const errorResponse = handleError(error);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

---

## Quest Management Endpoints

### POST /api/quests/generate

**Purpose**: Generate a new quest using AI (not saved to database)

**Implementation**: `src/pages/api/quests/generate.ts`

```typescript
import type { APIRoute } from 'astro';
import { requireAuth } from '../../lib/auth';
import { handleError, AppError } from '../../lib/errors';
import { generateQuestSchema } from '../../lib/validation';
import { rateLimiter, RATE_LIMITS } from '../../lib/rate-limiter';
import { createAIService } from '../../lib/ai-service';
import { TelemetryService } from '../../lib/telemetry-service';
import type { AIGeneratedQuest } from '../../types';

export const POST: APIRoute = async ({ locals, request }) => {
  try {
    const userId = await requireAuth(locals.supabase);
    const body = await request.json();

    // Validate input
    const validation = generateQuestSchema.safeParse(body);
    if (!validation.success) {
      throw new AppError(
        400,
        'validation_failed',
        'Nieprawidłowe dane wejściowe',
        validation.error.errors
      );
    }

    const params = validation.data;

    // Check rate limiting (minute)
    const minuteLimit = await rateLimiter.checkLimit(
      `${userId}:gen:minute`,
      RATE_LIMITS.QUEST_GENERATION_MINUTE
    );

    if (!minuteLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: 'rate_limit_exceeded',
          message: 'Wystąpił błąd, spróbuj później',
          retry_after: minuteLimit.retryAfter
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': minuteLimit.retryAfter?.toString() || '60'
          }
        }
      );
    }

    // Check rate limiting (hour)
    const hourLimit = await rateLimiter.checkLimit(
      `${userId}:gen:hour`,
      RATE_LIMITS.QUEST_GENERATION_HOUR
    );

    if (!hourLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: 'rate_limit_exceeded',
          message: 'Wystąpił błąd, spróbuj później',
          retry_after: hourLimit.retryAfter
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': hourLimit.retryAfter?.toString() || '3600'
          }
        }
      );
    }

    // Generate quest with AI
    const aiService = createAIService(locals.supabase);
    let quest: AIGeneratedQuest;

    try {
      quest = await aiService.generateQuest(params);
    } catch (error) {
      // Track generation error
      const telemetry = new TelemetryService(locals.supabase);
      await telemetry.trackGenerationError(
        userId,
        'generation_failed',
        params,
        params.app_version
      );

      throw new AppError(
        500,
        'generation_failed',
        'Wystąpił błąd, spróbuj później'
      );
    }

    // Track successful generation
    const telemetry = new TelemetryService(locals.supabase);
    await telemetry.trackQuestGenerated(userId, null, params, params.app_version);

    return new Response(JSON.stringify(quest), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    const errorResponse = handleError(error);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

### POST /api/quests

**Purpose**: Create/save a quest (manual or AI-generated)

**Implementation**: `src/pages/api/quests/index.ts`

```typescript
import type { APIRoute } from 'astro';
import { requireAuth } from '../../lib/auth';
import { handleError, AppError } from '../../lib/errors';
import { createQuestSchema } from '../../lib/validation';
import { QuestService } from '../../lib/quest-service';
import { ContentSafetyService } from '../../lib/content-safety';
import { TelemetryService } from '../../lib/telemetry-service';
import type { QuestResponse } from '../../types';

export const POST: APIRoute = async ({ locals, request }) => {
  try {
    const userId = await requireAuth(locals.supabase);
    const body = await request.json();

    // Validate input
    const validation = createQuestSchema.safeParse(body);
    if (!validation.success) {
      throw new AppError(
        400,
        'validation_failed',
        'Nieprawidłowe dane wejściowe',
        validation.error.errors
      );
    }

    const questData = validation.data;

    // Validate content if source is manual
    if (questData.source === 'manual') {
      const contentSafety = new ContentSafetyService(locals.supabase);
      const contentValidation = await contentSafety.validateContent({
        title: questData.title,
        hook: questData.hook,
        step1: questData.step1,
        step2: questData.step2,
        step3: questData.step3,
        easier_version: questData.easier_version || '',
        harder_version: questData.harder_version || '',
        safety_notes: questData.safety_notes || ''
      });

      if (!contentValidation.isValid) {
        return new Response(
          JSON.stringify({
            error: 'validation_failed',
            message: 'Treść zawiera niedozwolone słowa',
            violations: contentValidation.violations,
            suggestions: contentValidation.suggestions
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // Create quest
    const questService = new QuestService(locals.supabase);
    const quest = await questService.createQuest(userId, questData);

    // Track telemetry
    const telemetry = new TelemetryService(locals.supabase);
    
    if (questData.source === 'manual') {
      await telemetry.createEvent(userId, {
        event_type: 'quest_created_manual',
        quest_id: quest.id,
        app_version: questData.app_version
      });
    } else if (questData.status === 'started') {
      await telemetry.trackQuestStarted(userId, quest.id, questData.app_version);
    } else {
      await telemetry.trackQuestSaved(userId, quest.id, questData.app_version);
    }

    return new Response(JSON.stringify(quest), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    const errorResponse = handleError(error);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

### GET /api/quests

**Purpose**: List user's quests with filtering and pagination

**Implementation**: Add to `src/pages/api/quests/index.ts`

```typescript
import { questListQuerySchema } from '../../lib/validation';
import type { QuestListResponse } from '../../types';

export const GET: APIRoute = async ({ locals, url }) => {
  try {
    const userId = await requireAuth(locals.supabase);

    // Parse and validate query params
    const params = Object.fromEntries(url.searchParams.entries());
    const validation = questListQuerySchema.safeParse(params);
    
    if (!validation.success) {
      throw new AppError(
        400,
        'validation_failed',
        'Nieprawidłowe parametry zapytania',
        validation.error.errors
      );
    }

    const query = validation.data;

    // Build query
    let dbQuery = locals.supabase
      .from('quests')
      .select(`
        *,
        age_groups (id, code, label, span),
        quest_props (
          prop_id,
          props (id, code, label)
        )
      `, { count: 'exact' })
      .eq('user_id', userId);

    // Apply filters
    if (query.age_group_id) {
      dbQuery = dbQuery.eq('age_group_id', query.age_group_id);
    }
    if (query.location) {
      dbQuery = dbQuery.eq('location', query.location);
    }
    if (query.energy_level) {
      dbQuery = dbQuery.eq('energy_level', query.energy_level);
    }
    if (query.source) {
      dbQuery = dbQuery.eq('source', query.source);
    }
    if (query.status) {
      dbQuery = dbQuery.eq('status', query.status);
    }
    if (query.is_favorite) {
      dbQuery = dbQuery.eq('is_favorite', query.is_favorite === 'true');
    }

    // Apply sorting
    if (query.sort === 'favorites') {
      dbQuery = dbQuery
        .eq('is_favorite', true)
        .order('favorited_at', { ascending: false });
    } else {
      dbQuery = dbQuery.order('created_at', { ascending: false });
    }

    // Apply pagination
    dbQuery = dbQuery
      .range(query.offset, query.offset + query.limit - 1);

    const { data: quests, error, count } = await dbQuery;

    if (error) {
      throw new AppError(500, 'query_failed', 'Nie udało się pobrać questów');
    }

    // Format response
    const questService = new QuestService(locals.supabase);
    const formattedQuests = quests.map(q => questService['formatQuestResponse'](q));

    const response: QuestListResponse = {
      quests: formattedQuests,
      pagination: {
        total: count || 0,
        limit: query.limit,
        offset: query.offset,
        has_more: (query.offset + query.limit) < (count || 0)
      }
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    const errorResponse = handleError(error);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

### GET /api/quests/[id]

**Purpose**: Get detailed information about a specific quest

**Implementation**: `src/pages/api/quests/[id].ts`

```typescript
import type { APIRoute } from 'astro';
import { requireAuth } from '../../../lib/auth';
import { handleError } from '../../../lib/errors';
import { QuestService } from '../../../lib/quest-service';

export const GET: APIRoute = async ({ locals, params }) => {
  try {
    const userId = await requireAuth(locals.supabase);
    const questId = params.id!;

    const questService = new QuestService(locals.supabase);
    const quest = await questService.getQuest(questId, userId);

    return new Response(JSON.stringify(quest), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    const errorResponse = handleError(error);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

### PATCH /api/quests/[id]

**Purpose**: Update quest status or favorite status

**Implementation**: Add to `src/pages/api/quests/[id].ts`

```typescript
import { updateQuestSchema } from '../../../lib/validation';
import { TelemetryService } from '../../../lib/telemetry-service';

export const PATCH: APIRoute = async ({ locals, params, request }) => {
  try {
    const userId = await requireAuth(locals.supabase);
    const questId = params.id!;
    const body = await request.json();

    // Validate input
    const validation = updateQuestSchema.safeParse(body);
    if (!validation.success) {
      throw new AppError(
        400,
        'validation_failed',
        'Nieprawidłowe dane wejściowe',
        validation.error.errors
      );
    }

    const updates = validation.data;

    // Update quest
    const questService = new QuestService(locals.supabase);
    const quest = await questService.updateQuest(questId, userId, updates);

    // Track telemetry
    const telemetry = new TelemetryService(locals.supabase);
    
    if (updates.status === 'started') {
      await telemetry.trackQuestStarted(userId, questId);
    } else if (updates.status === 'completed') {
      await telemetry.trackQuestCompleted(userId, questId);
    }
    
    if (updates.is_favorite !== undefined) {
      await telemetry.trackFavoriteToggled(userId, questId, updates.is_favorite);
    }

    return new Response(JSON.stringify(quest), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    const errorResponse = handleError(error);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

### DELETE /api/quests/[id]

**Purpose**: Delete a quest

**Implementation**: Add to `src/pages/api/quests/[id].ts`

```typescript
export const DELETE: APIRoute = async ({ locals, params }) => {
  try {
    const userId = await requireAuth(locals.supabase);
    const questId = params.id!;

    // Track deletion before deleting
    const telemetry = new TelemetryService(locals.supabase);
    await telemetry.trackQuestDeleted(userId, questId);

    // Delete quest
    const questService = new QuestService(locals.supabase);
    await questService.deleteQuest(questId, userId);

    return new Response(null, {
      status: 204
    });
  } catch (error) {
    const errorResponse = handleError(error);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

### PATCH /api/quests/[id]/start

**Purpose**: Convenience endpoint to start a quest

**Implementation**: `src/pages/api/quests/[id]/start.ts`

```typescript
import type { APIRoute } from 'astro';
import { requireAuth } from '../../../../lib/auth';
import { handleError } from '../../../../lib/errors';
import { QuestService } from '../../../../lib/quest-service';
import { TelemetryService } from '../../../../lib/telemetry-service';

export const PATCH: APIRoute = async ({ locals, params }) => {
  try {
    const userId = await requireAuth(locals.supabase);
    const questId = params.id!;

    const questService = new QuestService(locals.supabase);
    const quest = await questService.updateQuest(questId, userId, {
      status: 'started'
    });

    // Track telemetry
    const telemetry = new TelemetryService(locals.supabase);
    await telemetry.trackQuestStarted(userId, questId);

    return new Response(JSON.stringify(quest), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    const errorResponse = handleError(error);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

### PATCH /api/quests/[id]/complete

**Purpose**: Convenience endpoint to mark quest as completed

**Implementation**: `src/pages/api/quests/[id]/complete.ts`

```typescript
import type { APIRoute } from 'astro';
import { requireAuth } from '../../../../lib/auth';
import { handleError } from '../../../../lib/errors';
import { QuestService } from '../../../../lib/quest-service';
import { TelemetryService } from '../../../../lib/telemetry-service';

export const PATCH: APIRoute = async ({ locals, params }) => {
  try {
    const userId = await requireAuth(locals.supabase);
    const questId = params.id!;

    const questService = new QuestService(locals.supabase);
    const quest = await questService.updateQuest(questId, userId, {
      status: 'completed'
    });

    // Track telemetry
    const telemetry = new TelemetryService(locals.supabase);
    await telemetry.trackQuestCompleted(userId, questId);

    return new Response(JSON.stringify(quest), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    const errorResponse = handleError(error);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

### PATCH /api/quests/[id]/favorite

**Purpose**: Toggle favorite status of a quest

**Implementation**: `src/pages/api/quests/[id]/favorite.ts`

```typescript
import type { APIRoute } from 'astro';
import { requireAuth } from '../../../../lib/auth';
import { handleError, AppError } from '../../../../lib/errors';
import { toggleFavoriteSchema } from '../../../../lib/validation';
import { QuestService } from '../../../../lib/quest-service';
import { TelemetryService } from '../../../../lib/telemetry-service';

export const PATCH: APIRoute = async ({ locals, params, request }) => {
  try {
    const userId = await requireAuth(locals.supabase);
    const questId = params.id!;
    const body = await request.json();

    // Validate input
    const validation = toggleFavoriteSchema.safeParse(body);
    if (!validation.success) {
      throw new AppError(
        400,
        'validation_failed',
        'Nieprawidłowe dane wejściowe',
        validation.error.errors
      );
    }

    const { is_favorite } = validation.data;

    const questService = new QuestService(locals.supabase);
    const quest = await questService.updateQuest(questId, userId, {
      is_favorite
    });

    // Track telemetry
    const telemetry = new TelemetryService(locals.supabase);
    await telemetry.trackFavoriteToggled(userId, questId, is_favorite);

    return new Response(JSON.stringify(quest), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    const errorResponse = handleError(error);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

---

## Dictionary Endpoints

### GET /api/age-groups

**Purpose**: Get list of all available age groups

**Implementation**: `src/pages/api/age-groups.ts`

```typescript
import type { APIRoute } from 'astro';
import { handleError } from '../../lib/errors';
import type { AgeGroupResponse } from '../../types';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const { data: ageGroups, error } = await locals.supabase
      .from('age_groups')
      .select('*')
      .order('id');

    if (error) {
      throw error;
    }

    // Extract min/max from int4range span
    const formatted: AgeGroupResponse[] = ageGroups.map(ag => {
      // Parse span like "[3,5)" to get min=3, max=4
      const spanStr = ag.span as string;
      const match = spanStr.match(/\[(\d+),(\d+)\)/);
      
      let min_age: number | undefined;
      let max_age: number | undefined;
      
      if (match) {
        min_age = parseInt(match[1]);
        max_age = parseInt(match[2]) - 1; // Exclusive upper bound
      }

      return {
        id: ag.id,
        code: ag.code,
        label: ag.label,
        min_age,
        max_age
      };
    });

    return new Response(
      JSON.stringify({ age_groups: formatted }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    const errorResponse = handleError(error);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

### GET /api/props

**Purpose**: Get list of all available props/equipment

**Implementation**: `src/pages/api/props.ts`

```typescript
import type { APIRoute } from 'astro';
import { handleError } from '../../lib/errors';
import type { PropResponse } from '../../types';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const { data: props, error } = await locals.supabase
      .from('props')
      .select('*')
      .order('id');

    if (error) {
      throw error;
    }

    const formatted: PropResponse[] = props.map(p => ({
      id: p.id,
      code: p.code,
      label: p.label
    }));

    return new Response(
      JSON.stringify({ props: formatted }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    const errorResponse = handleError(error);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

---

## Telemetry Endpoints

### POST /api/events

**Purpose**: Create a telemetry event (frontend tracking)

**Implementation**: `src/pages/api/events.ts`

```typescript
import type { APIRoute } from 'astro';
import { requireAuth } from '../../lib/auth';
import { handleError, AppError } from '../../lib/errors';
import { createEventSchema } from '../../lib/validation';
import { TelemetryService } from '../../lib/telemetry-service';

export const POST: APIRoute = async ({ locals, request }) => {
  try {
    const userId = await requireAuth(locals.supabase);
    const body = await request.json();

    // Validate input
    const validation = createEventSchema.safeParse(body);
    if (!validation.success) {
      throw new AppError(
        400,
        'validation_failed',
        'Nieprawidłowe dane wejściowe',
        validation.error.errors
      );
    }

    const eventData = validation.data;

    // Verify quest_id belongs to user if provided
    if (eventData.quest_id) {
      const { data: quest } = await locals.supabase
        .from('quests')
        .select('id')
        .eq('id', eventData.quest_id)
        .eq('user_id', userId)
        .single();

      if (!quest) {
        throw new AppError(400, 'invalid_quest', 'Quest nie istnieje lub nie należy do użytkownika');
      }
    }

    // Create event
    const telemetry = new TelemetryService(locals.supabase);
    const event = await telemetry.createEvent(userId, eventData);

    return new Response(JSON.stringify(event), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    const errorResponse = handleError(error);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

---

## Implementation Order

### Phase 1: Foundation (Days 1-2)
1. ✅ Set up shared infrastructure:
   - Create `src/types.ts` with all DTOs
   - Create `src/lib/validation.ts` with Zod schemas
   - Create `src/lib/errors.ts` with error handling utilities
   - Create `src/lib/auth.ts` with authentication helpers
   - Update middleware to attach Supabase client to `locals`

### Phase 2: Dictionary Endpoints (Day 2)
2. ✅ Implement simple read-only endpoints:
   - `GET /api/age-groups`
   - `GET /api/props`
3. ✅ Test with curl/Postman

### Phase 3: Authentication & Profile (Day 3)
4. ✅ Implement authentication endpoint:
   - `GET /api/auth/me`
5. ✅ Implement profile endpoints:
   - `GET /api/profiles/me`
   - `PATCH /api/profiles/me`
6. ✅ Test authentication flow

### Phase 4: Services (Days 4-5)
7. ✅ Implement core services:
   - `ContentSafetyService` in `src/lib/content-safety.ts`
   - `RateLimiter` in `src/lib/rate-limiter.ts`
   - `AIService` in `src/lib/ai-service.ts`
   - `QuestService` in `src/lib/quest-service.ts`
   - `TelemetryService` in `src/lib/telemetry-service.ts`

### Phase 5: Quest Endpoints - Part 1 (Days 6-7)
8. ✅ Implement basic quest endpoints:
   - `POST /api/quests` (create/save)
   - `GET /api/quests` (list with filtering)
   - `GET /api/quests/:id` (get details)

### Phase 6: Quest Endpoints - Part 2 (Days 8-9)
9. ✅ Implement quest management endpoints:
   - `PATCH /api/quests/:id` (update)
   - `DELETE /api/quests/:id` (delete)
   - `PATCH /api/quests/:id/start`
   - `PATCH /api/quests/:id/complete`
   - `PATCH /api/quests/:id/favorite`

### Phase 7: AI Generation (Days 10-11)
10. ✅ Implement AI generation endpoint:
    - `POST /api/quests/generate`
11. ✅ Test AI generation with various parameters
12. ✅ Test content safety validation

### Phase 8: Telemetry (Day 12)
13. ✅ Implement telemetry endpoint:
    - `POST /api/events`
14. ✅ Verify telemetry tracking throughout other endpoints

### Phase 9: Integration Testing (Days 13-14)
15. ✅ End-to-end testing of complete flows:
    - User signup → profile setup → quest generation → start → complete
    - Manual quest creation → favorite → delete
    - Content policy enforcement
    - Rate limiting
16. ✅ Performance testing

### Phase 10: Documentation & Deployment (Day 15)
17. ✅ Complete API documentation
18. ✅ Deploy to staging environment
19. ✅ Final QA and bug fixes

---

## Environment Variables

Add to `.env`:

```env
# Supabase
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenRouter AI
OPENROUTER_API_KEY=your_openrouter_api_key

# App
APP_VERSION=1.0.0
NODE_ENV=production
```

---

## Testing Checklist

### Unit Tests
- [ ] Validation schemas (Zod)
- [ ] Content safety pattern matching
- [ ] Rate limiter logic
- [ ] Error handling utilities

### Integration Tests
- [ ] Authentication flow
- [ ] Profile CRUD operations
- [ ] Quest CRUD operations
- [ ] Quest lifecycle transitions
- [ ] Content policy enforcement
- [ ] Rate limiting enforcement
- [ ] Telemetry event creation

### End-to-End Tests
- [ ] Complete user journey (signup → generate → start → complete)
- [ ] Manual quest creation flow
- [ ] Favorite/unfavorite quests
- [ ] Filter and sort quests
- [ ] Delete quest
- [ ] Error scenarios (401, 404, 400, 500)
- [ ] Rate limit exceeded (429)

---

## Security Checklist

- [ ] All endpoints require authentication (except dictionaries)
- [ ] RLS policies enforce user data isolation
- [ ] Input validation on all endpoints
- [ ] Content safety validation for user-generated content
- [ ] Rate limiting on AI generation
- [ ] SQL injection prevention (Supabase SDK parameterized queries)
- [ ] XSS prevention (React sanitizes by default)
- [ ] CORS configured to frontend domain only
- [ ] Environment variables for secrets
- [ ] HTTPS enforced
- [ ] No sensitive data in error messages

---

## Performance Optimization

- [ ] Database indexes in place (from migrations)
- [ ] Pagination on quest listings
- [ ] Cache dictionary data (age_groups, props)
- [ ] Cache content policy rules (5 min TTL)
- [ ] Optimize JOIN queries for quest listings
- [ ] Monitor slow queries (>100ms)
- [ ] Set appropriate timeouts (30s for AI generation)

---

## Monitoring & Logging

- [ ] Log all API errors with context
- [ ] Track telemetry events
- [ ] Monitor rate limit hits
- [ ] Monitor AI generation success/failure rate
- [ ] Track quest lifecycle metrics (Start Rate, Completion Rate)
- [ ] Monitor database connection pool
- [ ] Alert on error rate spikes

---

**Document Status**: Ready for Implementation  
**Last Updated**: 2025-10-12  
**Version**: 1.0

