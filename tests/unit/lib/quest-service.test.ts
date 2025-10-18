/**
 * Unit tests for quest-service.ts
 * Tests QuestService methods: createQuest(), updateQuest(), formatQuestResponse()
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuestService } from '../../../src/lib/quest-service';
import { AppError } from '../../../src/lib/errors';
import { createMockSupabaseClient } from '../../helpers/mock-supabase';
import questFixtures from '../../fixtures/quests.json';
import type { CreateQuestRequest } from '../../../src/types';

describe('QuestService', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;
  let questService: QuestService;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    questService = new QuestService(mockSupabase);
    vi.clearAllMocks();
  });

  describe('createQuest()', () => {
    it('should set saved_at timestamp for status "saved"', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const questData: CreateQuestRequest = {
        ...questFixtures.validQuest,
        status: 'saved' as const,
      } as CreateQuestRequest;

      const mockQuestResponse = {
        id: 'quest-123',
        user_id: userId,
        ...questData,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        saved_at: '2025-01-01T00:00:00Z',
        started_at: null,
        completed_at: null,
        favorited_at: null,
        is_favorite: false,
      };

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const mockInsert = vi.fn((data: Record<string, unknown>) => {
        return {
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: mockQuestResponse,
              error: null,
            }),
          })),
        };
      });

      const mockFrom = vi.fn(() => ({
        insert: mockInsert,
      })) as unknown as typeof mockSupabase.from;

      mockSupabase.from = mockFrom;

      await questService.createQuest(userId, questData);

      expect(mockInsert).toHaveBeenCalled();
      const insertCallArg = mockInsert.mock.calls[0][0] as Record<string, unknown>;
      expect(insertCallArg.saved_at).toBeTruthy();
      expect(insertCallArg.started_at).toBeNull();
      expect(insertCallArg.completed_at).toBeNull();
    });

    it('should set saved_at and started_at for status "started"', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const questData: CreateQuestRequest = {
        ...questFixtures.validQuest,
        status: 'started' as const,
      } as CreateQuestRequest;

      const mockQuestResponse = {
        id: 'quest-123',
        user_id: userId,
        ...questData,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        saved_at: '2025-01-01T00:00:00Z',
        started_at: '2025-01-01T00:00:00Z',
        completed_at: null,
        favorited_at: null,
        is_favorite: false,
      };

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const mockInsert = vi.fn((data: Record<string, unknown>) => {
        return {
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: mockQuestResponse,
              error: null,
            }),
          })),
        };
      });

      const mockFrom = vi.fn(() => ({
        insert: mockInsert,
      })) as unknown as typeof mockSupabase.from;

      mockSupabase.from = mockFrom;

      await questService.createQuest(userId, questData);

      expect(mockInsert).toHaveBeenCalled();
      const insertCallArg = mockInsert.mock.calls[0][0] as Record<string, unknown>;
      expect(insertCallArg.saved_at).toBeTruthy();
      expect(insertCallArg.started_at).toBeTruthy();
      expect(insertCallArg.completed_at).toBeNull();
    });

    it('should create quest_props relationships when prop_ids provided', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const questData: CreateQuestRequest = {
        ...questFixtures.validQuest,
        prop_ids: [1, 2, 3],
      } as CreateQuestRequest;

      const mockQuestResponse = {
        id: 'quest-123',
        user_id: userId,
        ...questData,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        saved_at: '2025-01-01T00:00:00Z',
        started_at: null,
        completed_at: null,
        favorited_at: null,
        is_favorite: false,
      };

      let questPropsInsertCalled = false;

      const mockFrom = vi.fn((table: string) => {
        if (table === 'quests') {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: mockQuestResponse,
                  error: null,
                }),
              })),
            })),
          };
        } else if (table === 'quest_props') {
          return {
            insert: vi.fn((data: { quest_id: string; prop_id: number }[]) => {
              questPropsInsertCalled = true;
              expect(data).toHaveLength(3);
              expect(data[0]).toEqual({ quest_id: 'quest-123', prop_id: 1 });
              return Promise.resolve({ data: null, error: null });
            }),
          };
        }
      }) as unknown as typeof mockSupabase.from;

      mockSupabase.from = mockFrom;

      await questService.createQuest(userId, questData);

      expect(questPropsInsertCalled).toBe(true);
    });

    it('should throw AppError(500) on database error', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const questData = questFixtures.validQuest as CreateQuestRequest;

      const mockFrom = vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error', code: 'DB_ERROR' },
            }),
          })),
        })),
      })) as unknown as typeof mockSupabase.from;

      mockSupabase.from = mockFrom;

      await expect(questService.createQuest(userId, questData)).rejects.toThrow(AppError);
      await expect(questService.createQuest(userId, questData)).rejects.toMatchObject({
        statusCode: 500,
        error: 'creation_failed',
      });
    });
  });

  describe('updateQuest()', () => {
    it('should update is_favorite and set favorited_at when is_favorite=true', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const questId = 'quest-123';

      const mockQuestResponse = {
        id: questId,
        user_id: userId,
        ...questFixtures.validQuest,
        status: 'saved',
        is_favorite: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        saved_at: '2025-01-01T00:00:00Z',
        started_at: null,
        completed_at: null,
        favorited_at: '2025-01-01T00:00:00Z',
      };

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const mockUpdate = vi.fn((data: Record<string, unknown>) => {
        return {
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: mockQuestResponse,
                  error: null,
                }),
              })),
            })),
          })),
        };
      });

      const mockFrom = vi.fn(() => ({
        update: mockUpdate,
      })) as unknown as typeof mockSupabase.from;

      mockSupabase.from = mockFrom;

      await questService.updateQuest(questId, userId, { is_favorite: true });

      expect(mockUpdate).toHaveBeenCalled();
      const updateCallArg = mockUpdate.mock.calls[0][0] as Record<string, unknown>;
      expect(updateCallArg.is_favorite).toBe(true);
      expect(updateCallArg.favorited_at).toBeTruthy();
    });

    it('should set favorited_at to null when is_favorite=false', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const questId = 'quest-123';

      const mockQuestResponse = {
        id: questId,
        user_id: userId,
        ...questFixtures.validQuest,
        status: 'saved',
        is_favorite: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        saved_at: '2025-01-01T00:00:00Z',
        started_at: null,
        completed_at: null,
        favorited_at: null,
      };

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const mockUpdate = vi.fn((data: Record<string, unknown>) => {
        return {
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: mockQuestResponse,
                  error: null,
                }),
              })),
            })),
          })),
        };
      });

      const mockFrom = vi.fn(() => ({
        update: mockUpdate,
      })) as unknown as typeof mockSupabase.from;

      mockSupabase.from = mockFrom;

      await questService.updateQuest(questId, userId, { is_favorite: false });

      expect(mockUpdate).toHaveBeenCalled();
      const updateCallArg = mockUpdate.mock.calls[0][0] as Record<string, unknown>;
      expect(updateCallArg.is_favorite).toBe(false);
      expect(updateCallArg.favorited_at).toBeNull();
    });

    it('should set started_at when status changes to "started"', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const questId = 'quest-123';

      const mockQuestResponse = {
        id: questId,
        user_id: userId,
        ...questFixtures.validQuest,
        status: 'started',
        is_favorite: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        saved_at: '2025-01-01T00:00:00Z',
        started_at: '2025-01-01T00:00:00Z',
        completed_at: null,
        favorited_at: null,
      };

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const mockUpdate = vi.fn((data: Record<string, unknown>) => {
        return {
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: mockQuestResponse,
                  error: null,
                }),
              })),
            })),
          })),
        };
      });

      const mockFrom = vi.fn(() => ({
        update: mockUpdate,
      })) as unknown as typeof mockSupabase.from;

      mockSupabase.from = mockFrom;

      await questService.updateQuest(questId, userId, { status: 'started' });

      expect(mockUpdate).toHaveBeenCalled();
      const updateCallArg = mockUpdate.mock.calls[0][0] as Record<string, unknown>;
      expect(updateCallArg.status).toBe('started');
      expect(updateCallArg.started_at).toBeTruthy();
    });

    it('should throw AppError(404) when quest not found', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const questId = 'nonexistent-quest';

      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Not found' },
              }),
            })),
          })),
        })),
      }));

      const mockFrom = vi.fn(() => ({
        update: mockUpdate,
      })) as unknown as typeof mockSupabase.from;

      mockSupabase.from = mockFrom;

      await expect(questService.updateQuest(questId, userId, { status: 'completed' })).rejects.toThrow(AppError);
      await expect(questService.updateQuest(questId, userId, { status: 'completed' })).rejects.toMatchObject({
        statusCode: 404,
        error: 'not_found',
      });
    });
  });

  describe('formatQuestResponse() - age span parsing', () => {
    it('should parse age span "[3,5)" to min_age=3, max_age=4', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const questId = 'quest-123';

      const mockQuestResponse = {
        id: questId,
        user_id: userId,
        ...questFixtures.validQuest,
        age_group_id: 1,
        status: 'saved',
        is_favorite: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        saved_at: '2025-01-01T00:00:00Z',
        started_at: null,
        completed_at: null,
        favorited_at: null,
        age_groups: {
          id: 1,
          code: 'toddler',
          label: '3-4 lata',
          span: '[3,5)',
        },
        quest_props: [],
      };

      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: mockQuestResponse,
              error: null,
            }),
          })),
        })),
      }));

      const mockFrom = vi.fn(() => ({
        select: mockSelect,
      })) as unknown as typeof mockSupabase.from;

      mockSupabase.from = mockFrom;

      const result = await questService.getQuest(questId, userId);

      expect(result.age_group.min_age).toBe(3);
      expect(result.age_group.max_age).toBe(4); // exclusive upper bound - 1
    });

    it('should parse age span "[7,9)" to min_age=7, max_age=8', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const questId = 'quest-123';

      const mockQuestResponse = {
        id: questId,
        user_id: userId,
        ...questFixtures.validQuest,
        age_group_id: 3,
        status: 'saved',
        is_favorite: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        saved_at: '2025-01-01T00:00:00Z',
        started_at: null,
        completed_at: null,
        favorited_at: null,
        age_groups: {
          id: 3,
          code: 'school_age',
          label: '7-8 lat',
          span: '[7,9)',
        },
        quest_props: [],
      };

      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: mockQuestResponse,
              error: null,
            }),
          })),
        })),
      }));

      const mockFrom = vi.fn(() => ({
        select: mockSelect,
      })) as unknown as typeof mockSupabase.from;

      mockSupabase.from = mockFrom;

      const result = await questService.getQuest(questId, userId);

      expect(result.age_group.min_age).toBe(7);
      expect(result.age_group.max_age).toBe(8);
    });
  });
});
