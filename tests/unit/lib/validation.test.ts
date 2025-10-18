/**
 * Unit tests for validation.ts
 * Tests all Zod schemas
 */

import { describe, it, expect } from 'vitest';
import {
  generateQuestSchema,
  createQuestSchema,
  updateQuestSchema,
  toggleFavoriteSchema,
  updateProfileSchema,
  createEventSchema,
  questListQuerySchema,
} from '../../../src/lib/validation';

describe('validation.ts', () => {
  describe('generateQuestSchema', () => {
    it('should validate correct quest generation request', () => {
      const validData = {
        age_group_id: 1,
        duration_minutes: 30,
        location: 'home' as const,
        energy_level: 'medium' as const,
        prop_ids: [1, 2, 3],
        app_version: '0.0.1',
      };

      const result = generateQuestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject duration_minutes > 480', () => {
      const invalidData = {
        age_group_id: 1,
        duration_minutes: 500,
        location: 'home' as const,
        energy_level: 'low' as const,
      };

      const result = generateQuestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative duration_minutes', () => {
      const invalidData = {
        age_group_id: 1,
        duration_minutes: -10,
        location: 'home' as const,
        energy_level: 'low' as const,
      };

      const result = generateQuestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require age_group_id, location, and energy_level', () => {
      const invalidData = {
        duration_minutes: 30,
      };

      const result = generateQuestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should set default empty array for prop_ids', () => {
      const validData = {
        age_group_id: 2,
        duration_minutes: 45,
        location: 'outdoor' as const,
        energy_level: 'high' as const,
      };

      const result = generateQuestSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.prop_ids).toEqual([]);
      }
    });
  });

  describe('createQuestSchema', () => {
    const validQuest = {
      title: 'Poszukiwanie skarbów',
      hook: 'W ogrodzie ukryte są magiczne skarby czekające na odkrycie!',
      step1: 'Znajdź 5 kamieni i ułóż z nich ścieżkę',
      step2: 'Poszukaj czegoś zielonego pod dużym drzewem',
      step3: 'Zakończ przygodę tańcem radości!',
      age_group_id: 1,
      duration_minutes: 30,
      location: 'outdoor' as const,
      energy_level: 'medium' as const,
      source: 'ai' as const,
    };

    it('should validate correct quest', () => {
      const result = createQuestSchema.safeParse(validQuest);
      expect(result.success).toBe(true);
    });

    it('should reject title longer than 200 characters', () => {
      const invalidData = {
        ...validQuest,
        title: 'a'.repeat(201),
      };

      const result = createQuestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject title with only whitespace', () => {
      const invalidData = {
        ...validQuest,
        title: '   ',
      };

      const result = createQuestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require title length >= 1 with non-whitespace', () => {
      const invalidData = {
        ...validQuest,
        title: '',
      };

      const result = createQuestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept title with exactly 1 character', () => {
      const validData = {
        ...validQuest,
        title: 'A',
      };

      const result = createQuestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should require hook length >= 10', () => {
      const invalidData = {
        ...validQuest,
        hook: 'Too short',
      };

      const result = createQuestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept nullable easier_version and harder_version', () => {
      const validData = {
        ...validQuest,
        easier_version: null,
        harder_version: null,
      };

      const result = createQuestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('updateQuestSchema', () => {
    it('should validate status update', () => {
      const validData = {
        status: 'started' as const,
      };

      const result = updateQuestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate favorite update', () => {
      const validData = {
        is_favorite: true,
      };

      const result = updateQuestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate both status and favorite updates', () => {
      const validData = {
        status: 'completed' as const,
        is_favorite: true,
      };

      const result = updateQuestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty object (no fields provided)', () => {
      const invalidData = {};

      const result = updateQuestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('toggleFavoriteSchema', () => {
    it('should validate is_favorite true', () => {
      const result = toggleFavoriteSchema.safeParse({ is_favorite: true });
      expect(result.success).toBe(true);
    });

    it('should validate is_favorite false', () => {
      const result = toggleFavoriteSchema.safeParse({ is_favorite: false });
      expect(result.success).toBe(true);
    });

    it('should reject non-boolean values', () => {
      const result = toggleFavoriteSchema.safeParse({ is_favorite: 'true' });
      expect(result.success).toBe(false);
    });
  });

  describe('updateProfileSchema', () => {
    it('should validate profile updates', () => {
      const validData = {
        default_age_group_id: 2,
        default_duration_minutes: 45,
        default_location: 'outdoor' as const,
        default_energy_level: 'high' as const,
      };

      const result = updateProfileSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should allow nullable fields', () => {
      const validData = {
        default_age_group_id: null,
        default_duration_minutes: null,
      };

      const result = updateProfileSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject duration > 480', () => {
      const invalidData = {
        default_duration_minutes: 500,
      };

      const result = updateProfileSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('createEventSchema', () => {
    it('should validate event creation', () => {
      const validData = {
        event_type: 'quest_generated' as const,
        quest_id: '550e8400-e29b-41d4-a716-446655440000',
        event_data: { preset: 'outdoor_adventure' },
        app_version: '0.0.1',
      };

      const result = createEventSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should require valid event_type', () => {
      const invalidData = {
        event_type: 'invalid_event',
      };

      const result = createEventSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('questListQuerySchema', () => {
    it('should parse query parameters correctly', () => {
      const validData = {
        age_group_id: '1',
        location: 'home' as const,
        energy_level: 'low' as const,
        sort: 'favorites' as const,
        limit: '10',
        offset: '0',
      };

      const result = questListQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.age_group_id).toBe(1); // coerced to number
        expect(result.data.limit).toBe(10);
        expect(result.data.offset).toBe(0);
      }
    });

    it('should use default values for limit and offset', () => {
      const validData = {};

      const result = questListQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20);
        expect(result.data.offset).toBe(0);
        expect(result.data.sort).toBe('recent');
      }
    });

    it('should reject limit > 100', () => {
      const invalidData = {
        limit: '150',
      };

      const result = questListQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
