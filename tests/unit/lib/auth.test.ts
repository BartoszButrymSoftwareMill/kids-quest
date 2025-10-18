/**
 * Unit tests for auth.ts
 * Tests requireAuth() and getAuthUser() functions
 */

import { describe, it, expect, vi } from 'vitest';
import { requireAuth, getAuthUser } from '../../../src/lib/auth';
import { AppError } from '../../../src/lib/errors';
import { createMockSupabaseClient, mockAuthUser } from '../../helpers/mock-supabase';

describe('auth.ts', () => {
  describe('requireAuth()', () => {
    it('should return user ID for authenticated user', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const mockSupabase = createMockSupabaseClient();
      const user = mockAuthUser(userId);

      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user },
        error: null,
      });

      const result = await requireAuth(mockSupabase);

      expect(result).toBe(userId);
      expect(mockSupabase.auth.getUser).toHaveBeenCalledTimes(1);
    });

    it('should throw AppError(401) when user is not authenticated', async () => {
      const mockSupabase = createMockSupabaseClient();

      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      await expect(requireAuth(mockSupabase)).rejects.toThrow(AppError);
      await expect(requireAuth(mockSupabase)).rejects.toMatchObject({
        statusCode: 401,
        error: 'unauthorized',
        message: 'Wymagane uwierzytelnienie',
      });
    });

    it('should throw AppError(401) when auth error occurs', async () => {
      const mockSupabase = createMockSupabaseClient();

      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: {
          message: 'Invalid token',
          name: 'AuthError',
          status: 401,
          code: 'invalid_token',
          __isAuthError: true,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      await expect(requireAuth(mockSupabase)).rejects.toThrow(AppError);
      await expect(requireAuth(mockSupabase)).rejects.toMatchObject({
        statusCode: 401,
      });
    });
  });

  describe('getAuthUser()', () => {
    it('should return full user object for authenticated user', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const mockSupabase = createMockSupabaseClient();
      const user = mockAuthUser(userId, 'test@example.com');

      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user },
        error: null,
      });

      const result = await getAuthUser(mockSupabase);

      expect(result).toEqual(user);
      expect(result.id).toBe(userId);
      expect(result.email).toBe('test@example.com');
    });

    it('should throw AppError(401) when user is not authenticated', async () => {
      const mockSupabase = createMockSupabaseClient();

      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      await expect(getAuthUser(mockSupabase)).rejects.toThrow(AppError);
      await expect(getAuthUser(mockSupabase)).rejects.toMatchObject({
        statusCode: 401,
        error: 'unauthorized',
      });
    });

    it('should throw AppError(401) when auth error occurs', async () => {
      const mockSupabase = createMockSupabaseClient();

      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: {
          message: 'Session expired',
          name: 'AuthError',
          status: 401,
          code: 'session_expired',
          __isAuthError: true,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      await expect(getAuthUser(mockSupabase)).rejects.toThrow(AppError);
    });
  });
});
