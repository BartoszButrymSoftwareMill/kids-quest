/**
 * Unit tests for content-safety.ts
 * Tests ContentSafetyService: validateContent(), matchPattern(), replacePattern()
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContentSafetyService } from '../../../src/lib/content-safety';
import { createMockSupabaseClient } from '../../helpers/mock-supabase';

interface ContentRule {
  id: number;
  rule_type: string;
  pattern: string;
  pattern_type: string;
  case_sensitive: boolean;
  replacement: string | null;
  is_active: boolean;
}

describe('ContentSafetyService', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;
  let contentSafety: ContentSafetyService;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    contentSafety = new ContentSafetyService(mockSupabase);
    vi.clearAllMocks();
  });

  const createMockChain = (mockRules: ContentRule[]) => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: (resolve: (value: { data: ContentRule[]; error: null }) => void) =>
        resolve({
          data: mockRules,
          error: null,
        }),
    };

    return chain;
  };

  describe('validateContent()', () => {
    it('should detect hard_ban pattern and return violations', async () => {
      const mockRules = [
        {
          id: 1,
          rule_type: 'hard_ban',
          pattern: 'broń',
          pattern_type: 'exact',
          case_sensitive: false,
          replacement: null,
          is_active: true,
        },
      ];

      // Mock the from method properly
      mockSupabase.from = vi.fn(() => createMockChain(mockRules)) as never;

      const content = {
        title: 'Zabawa z broń',
        hook: 'To jest test',
      };

      const result = await contentSafety.validateContent(content);

      expect(result.isValid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0]).toMatchObject({
        field: 'title',
        rule: 'hard_ban',
        pattern: 'broń',
      });
    });

    it('should detect soft_ban and return suggestions', async () => {
      const mockRules = [
        {
          id: 2,
          rule_type: 'soft_ban',
          pattern: 'walka',
          pattern_type: 'exact',
          case_sensitive: false,
          replacement: 'współpraca',
          is_active: true,
        },
      ];

      mockSupabase.from = vi.fn(() => createMockChain(mockRules)) as never;

      const content = {
        title: 'Zabawa w walka',
        hook: 'To jest test',
      };

      const result = await contentSafety.validateContent(content);

      expect(result.isValid).toBe(true); // soft_ban doesn't invalidate
      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0]).toMatchObject({
        field: 'title',
        original: 'walka',
        replacement: 'współpraca',
      });
    });

    it('should apply replacement rules to sanitizedContent', async () => {
      const mockRules = [
        {
          id: 3,
          rule_type: 'replacement',
          pattern: 'złe słowo',
          pattern_type: 'exact',
          case_sensitive: false,
          replacement: '***',
          is_active: true,
        },
      ];

      mockSupabase.from = vi.fn(() => createMockChain(mockRules)) as never;

      const content = {
        title: 'To jest złe słowo w tytule',
        hook: 'Hook bez złych słów',
      };

      const result = await contentSafety.validateContent(content);

      expect(result.isValid).toBe(true);
      expect(result.sanitizedContent).toBeDefined();
      expect(result.sanitizedContent?.title).toContain('***');
      expect(result.sanitizedContent?.title).not.toContain('złe słowo');
    });

    it('should return isValid=true when no violations', async () => {
      const mockRules = [
        {
          id: 4,
          rule_type: 'hard_ban',
          pattern: 'zakazane',
          pattern_type: 'exact',
          case_sensitive: false,
          replacement: null,
          is_active: true,
        },
      ];

      mockSupabase.from = vi.fn(() => createMockChain(mockRules)) as never;

      const content = {
        title: 'Bezpieczna zabawa',
        hook: 'Wspaniała przygoda',
      };

      const result = await contentSafety.validateContent(content);

      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.suggestions).toHaveLength(0);
    });

    it('should skip empty content fields', async () => {
      const mockRules = [
        {
          id: 5,
          rule_type: 'hard_ban',
          pattern: 'test',
          pattern_type: 'exact',
          case_sensitive: false,
          replacement: null,
          is_active: true,
        },
      ];

      mockSupabase.from = vi.fn(() => createMockChain(mockRules)) as never;

      const content = {
        title: 'Tytuł',
        hook: '',
        step1: '',
      };

      const result = await contentSafety.validateContent(content);

      expect(result.isValid).toBe(true);
      // Should not process empty/null fields
    });
  });

  describe('matchPattern() - via validateContent', () => {
    it('should match exact pattern case-insensitive', async () => {
      const mockRules = [
        {
          id: 6,
          rule_type: 'hard_ban',
          pattern: 'TEST',
          pattern_type: 'exact',
          case_sensitive: false,
          replacement: null,
          is_active: true,
        },
      ];

      mockSupabase.from = vi.fn(() => createMockChain(mockRules)) as never;

      const content = {
        title: 'This is a test content',
      };

      const result = await contentSafety.validateContent(content);

      expect(result.isValid).toBe(false);
      expect(result.violations).toHaveLength(1);
    });

    it('should match exact pattern case-sensitive', async () => {
      const mockRules = [
        {
          id: 7,
          rule_type: 'hard_ban',
          pattern: 'TEST',
          pattern_type: 'exact',
          case_sensitive: true,
          replacement: null,
          is_active: true,
        },
      ];

      mockSupabase.from = vi.fn(() => createMockChain(mockRules)) as never;

      const content = {
        title: 'This is a test content', // lowercase 'test' should not match
      };

      const result = await contentSafety.validateContent(content);

      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should match wildcard pattern', async () => {
      const mockRules = [
        {
          id: 8,
          rule_type: 'hard_ban',
          pattern: 'bad%word',
          pattern_type: 'wildcard',
          case_sensitive: false,
          replacement: null,
          is_active: true,
        },
      ];

      mockSupabase.from = vi.fn(() => createMockChain(mockRules)) as never;

      const content = {
        title: 'This is a bad-word content',
      };

      const result = await contentSafety.validateContent(content);

      expect(result.isValid).toBe(false);
      expect(result.violations).toHaveLength(1);
    });

    it('should match regex pattern', async () => {
      const mockRules = [
        {
          id: 9,
          rule_type: 'hard_ban',
          pattern: '\\d{3}-\\d{3}-\\d{3}', // phone number pattern
          pattern_type: 'regex',
          case_sensitive: false,
          replacement: null,
          is_active: true,
        },
      ];

      mockSupabase.from = vi.fn(() => createMockChain(mockRules)) as never;

      const content = {
        title: 'Call me at 123-456-789',
      };

      const result = await contentSafety.validateContent(content);

      expect(result.isValid).toBe(false);
      expect(result.violations).toHaveLength(1);
    });
  });

  describe('replacePattern() - via validateContent', () => {
    it('should replace exact pattern globally', async () => {
      const mockRules = [
        {
          id: 10,
          rule_type: 'replacement',
          pattern: 'bad',
          pattern_type: 'exact',
          case_sensitive: false,
          replacement: 'good',
          is_active: true,
        },
      ];

      mockSupabase.from = vi.fn(() => createMockChain(mockRules)) as never;

      const content = {
        title: 'bad bad bad',
      };

      const result = await contentSafety.validateContent(content);

      expect(result.isValid).toBe(true);
      expect(result.sanitizedContent?.title).toBe('good good good');
    });

    it('should replace wildcard pattern', async () => {
      const mockRules = [
        {
          id: 11,
          rule_type: 'replacement',
          pattern: 'test%content',
          pattern_type: 'wildcard',
          case_sensitive: false,
          replacement: '[FILTERED]',
          is_active: true,
        },
      ];

      mockSupabase.from = vi.fn(() => createMockChain(mockRules)) as never;

      const content = {
        title: 'This is test-content example',
      };

      const result = await contentSafety.validateContent(content);

      expect(result.isValid).toBe(true);
      expect(result.sanitizedContent?.title).toContain('[FILTERED]');
    });

    it('should replace regex pattern', async () => {
      const mockRules = [
        {
          id: 12,
          rule_type: 'replacement',
          pattern: '\\d{3}-\\d{3}-\\d{3}',
          pattern_type: 'regex',
          case_sensitive: false,
          replacement: '[PHONE]',
          is_active: true,
        },
      ];

      mockSupabase.from = vi.fn(() => createMockChain(mockRules)) as never;

      const content = {
        title: 'Call 123-456-789 or 987-654-321',
      };

      const result = await contentSafety.validateContent(content);

      expect(result.isValid).toBe(true);
      expect(result.sanitizedContent?.title).toBe('Call [PHONE] or [PHONE]');
    });
  });
});
