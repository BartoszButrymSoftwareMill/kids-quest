/**
 * Unit tests for ai-service.ts
 * Tests AIService: buildSystemPrompt(), buildUserPrompt(), validation logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIService } from '../../../src/lib/ai-service';
import { ContentSafetyService } from '../../../src/lib/content-safety';
import { createMockSupabaseClient } from '../../helpers/mock-supabase';
import questFixtures from '../../fixtures/quests.json';

// Mock OpenRouterService
const mockComplete = vi.fn();
vi.mock('../../../src/lib/openrouter/service', () => ({
  OpenRouterService: vi.fn().mockImplementation(() => ({
    complete: mockComplete,
  })),
}));

describe('AIService', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;
  let contentSafety: ContentSafetyService;
  let aiService: AIService;

  // Helper to setup mocks for content safety
  const setupMocks = () => {
    mockComplete.mockResolvedValue({
      data: questFixtures.aiGeneratedResponse,
      rawContent: JSON.stringify(questFixtures.aiGeneratedResponse),
      metadata: {
        model: 'test-model',
        usage: { prompt_tokens: 10, completion_tokens: 50, total_tokens: 60 },
        finish_reason: 'stop',
      },
    });

    interface SupabaseChain {
      select: ReturnType<typeof vi.fn>;
      eq: ReturnType<typeof vi.fn>;
      then: (resolve: (value: { data: unknown[]; error: null }) => void) => void;
    }

    mockSupabase.from = vi.fn(() => {
      const chain: SupabaseChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: (resolve: (value: { data: unknown[]; error: null }) => void) => resolve({ data: [], error: null }),
      };
      return chain as ReturnType<typeof mockSupabase.from>;
    });
  };

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    contentSafety = new ContentSafetyService(mockSupabase);
    aiService = new AIService('test-api-key', contentSafety);
    vi.clearAllMocks();
  });

  describe('buildUserPrompt()', () => {
    it('should map age_group_id 1 to "3-4 lata"', async () => {
      setupMocks();

      await aiService.generateQuest({
        age_group_id: 1,
        duration_minutes: 30,
        location: 'home',
        energy_level: 'medium',
      });

      const completeCall = mockComplete.mock.calls[0][0];
      const userPrompt = completeCall.messages[1].content;

      expect(userPrompt).toContain('3-4 lata');
    });

    it('should map age_group_id 2 to "5-6 lat"', async () => {
      setupMocks();

      await aiService.generateQuest({
        age_group_id: 2,
        duration_minutes: 30,
        location: 'outdoor',
        energy_level: 'high',
      });

      const completeCall = mockComplete.mock.calls[0][0];
      const userPrompt = completeCall.messages[1].content;

      expect(userPrompt).toContain('5-6 lat');
    });

    it('should include duration_minutes in prompt', async () => {
      setupMocks();

      await aiService.generateQuest({
        age_group_id: 3,
        duration_minutes: 45,
        location: 'outdoor',
        energy_level: 'high',
      });

      const completeCall = mockComplete.mock.calls[0][0];
      const userPrompt = completeCall.messages[1].content;

      expect(userPrompt).toContain('45 minut');
    });

    it('should translate location "home" to "dom"', async () => {
      setupMocks();

      await aiService.generateQuest({
        age_group_id: 1,
        duration_minutes: 30,
        location: 'home',
        energy_level: 'low',
      });

      const completeCall = mockComplete.mock.calls[0][0];
      const userPrompt = completeCall.messages[1].content;

      expect(userPrompt).toContain('dom');
    });

    it('should translate location "outdoor" to "na zewnątrz"', async () => {
      setupMocks();

      await aiService.generateQuest({
        age_group_id: 1,
        duration_minutes: 30,
        location: 'outdoor',
        energy_level: 'medium',
      });

      const completeCall = mockComplete.mock.calls[0][0];
      const userPrompt = completeCall.messages[1].content;

      expect(userPrompt).toContain('na zewnątrz');
    });

    it('should translate energy_level values correctly', async () => {
      setupMocks();

      // Test 'low'
      await aiService.generateQuest({
        age_group_id: 1,
        duration_minutes: 30,
        location: 'home',
        energy_level: 'low',
      });

      let userPrompt = mockComplete.mock.calls[0][0].messages[1].content;
      expect(userPrompt).toContain('niski');

      // Test 'medium'
      await aiService.generateQuest({
        age_group_id: 1,
        duration_minutes: 30,
        location: 'home',
        energy_level: 'medium',
      });

      userPrompt = mockComplete.mock.calls[1][0].messages[1].content;
      expect(userPrompt).toContain('średni');

      // Test 'high'
      await aiService.generateQuest({
        age_group_id: 1,
        duration_minutes: 30,
        location: 'home',
        energy_level: 'high',
      });

      userPrompt = mockComplete.mock.calls[2][0].messages[1].content;
      expect(userPrompt).toContain('wysoki');
    });
  });

  describe('buildSystemPrompt()', () => {
    it('should include safety rules in system prompt', async () => {
      setupMocks();

      await aiService.generateQuest({
        age_group_id: 1,
        duration_minutes: 30,
        location: 'home',
        energy_level: 'medium',
      });

      const completeCall = mockComplete.mock.calls[0][0];
      const systemPrompt = completeCall.messages[0].content;

      expect(systemPrompt).toContain('ZASADY BEZPIECZEŃSTWA');
      expect(systemPrompt).toContain('bezpieczeństwo dziecka');
      expect(systemPrompt).toContain('przemocą');
    });

    it('should include JSON format instructions in system prompt', async () => {
      setupMocks();

      await aiService.generateQuest({
        age_group_id: 1,
        duration_minutes: 30,
        location: 'home',
        energy_level: 'medium',
      });

      const completeCall = mockComplete.mock.calls[0][0];
      const systemPrompt = completeCall.messages[0].content;

      expect(systemPrompt).toContain('FORMAT ODPOWIEDZI');
      expect(systemPrompt).toContain('JSON');
      expect(systemPrompt).toContain('title');
      expect(systemPrompt).toContain('hook');
      expect(systemPrompt).toContain('step1');
    });
  });

  describe('validator in generateQuest()', () => {
    it('should reject response without required fields', async () => {
      // Mock response missing required fields
      mockComplete.mockRejectedValue(new Error('Validation failed'));

      interface SupabaseChain {
        select: ReturnType<typeof vi.fn>;
        eq: ReturnType<typeof vi.fn>;
        then: (resolve: (value: { data: unknown[]; error: null }) => void) => void;
      }

      mockSupabase.from = vi.fn(() => {
        const chain: SupabaseChain = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          then: (resolve: (value: { data: unknown[]; error: null }) => void) => resolve({ data: [], error: null }),
        };
        return chain as ReturnType<typeof mockSupabase.from>;
      });

      await expect(
        aiService.generateQuest({
          age_group_id: 1,
          duration_minutes: 30,
          location: 'home',
          energy_level: 'medium',
        })
      ).rejects.toThrow();
    });

    it('should call content safety validation', async () => {
      setupMocks();

      await aiService.generateQuest({
        age_group_id: 1,
        duration_minutes: 30,
        location: 'home',
        energy_level: 'medium',
      });

      // Validator should have been called during complete()
      // But since complete is mocked, we verify the validator function exists
      const completeCall = mockComplete.mock.calls[0][0];
      expect(completeCall.validator).toBeDefined();
      expect(typeof completeCall.validator).toBe('function');
    });
  });

  describe('generateQuest() - full flow', () => {
    it('should return quest with correct parameters', async () => {
      setupMocks();

      const result = await aiService.generateQuest({
        age_group_id: 3,
        duration_minutes: 45,
        location: 'outdoor',
        energy_level: 'high',
        prop_ids: [1, 2, 3],
      });

      expect(result.age_group_id).toBe(3);
      expect(result.duration_minutes).toBe(45);
      expect(result.location).toBe('outdoor');
      expect(result.energy_level).toBe('high');
      expect(result.prop_ids).toEqual([1, 2, 3]);
      expect(result.source).toBe('ai');
      expect(result.title).toBeDefined();
      expect(result.hook).toBeDefined();
    });
  });
});
