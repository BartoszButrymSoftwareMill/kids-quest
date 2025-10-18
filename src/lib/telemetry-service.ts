import type { SupabaseClient } from '../db/supabase.client';
import type { EventResponse, CreateEventRequest } from '../types';

/**
 * Telemetry Service
 * Tracks user events and interactions for analytics
 * Non-fatal: errors are logged but don't interrupt main application flow
 */
export class TelemetryService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Creates a telemetry event in the database
   */
  async createEvent(userId: string, data: CreateEventRequest): Promise<EventResponse> {
    const { data: event, error } = await this.supabase
      .from('events')
      .insert({
        user_id: userId,
        event_type: data.event_type,
        quest_id: data.quest_id || null,
        event_data: (data.event_data || null) as never,
        app_version: data.app_version || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create event:', error);
      // Re-throw to allow caller to handle
      throw error;
    }

    return {
      id: event.id,
      user_id: event.user_id,
      event_type: event.event_type,
      quest_id: event.quest_id,
      event_data: event.event_data as Record<string, unknown> | null,
      app_version: event.app_version,
      created_at: event.created_at,
    };
  }

  /**
   * Track quest generation event
   */
  async trackQuestGenerated(
    userId: string,
    questId: string | null,
    params: Record<string, unknown>,
    appVersion?: string
  ): Promise<void> {
    try {
      await this.createEvent(userId, {
        event_type: 'quest_generated',
        quest_id: questId || undefined,
        event_data: params,
        app_version: appVersion,
      });
    } catch (error) {
      console.error('Failed to track quest_generated:', error);
    }
  }

  /**
   * Track quest started event
   */
  async trackQuestStarted(userId: string, questId: string, appVersion?: string): Promise<void> {
    try {
      await this.createEvent(userId, {
        event_type: 'quest_started',
        quest_id: questId,
        app_version: appVersion,
      });
    } catch (error) {
      console.error('Failed to track quest_started:', error);
    }
  }

  /**
   * Track quest completed event
   */
  async trackQuestCompleted(userId: string, questId: string, appVersion?: string): Promise<void> {
    try {
      await this.createEvent(userId, {
        event_type: 'quest_completed',
        quest_id: questId,
        app_version: appVersion,
      });
    } catch (error) {
      console.error('Failed to track quest_completed:', error);
    }
  }

  /**
   * Track quest saved event
   */
  async trackQuestSaved(userId: string, questId: string, appVersion?: string): Promise<void> {
    try {
      await this.createEvent(userId, {
        event_type: 'quest_saved',
        quest_id: questId,
        app_version: appVersion,
      });
    } catch (error) {
      console.error('Failed to track quest_saved:', error);
    }
  }

  /**
   * Track favorite toggle event
   */
  async trackFavoriteToggled(userId: string, questId: string, isFavorite: boolean, appVersion?: string): Promise<void> {
    try {
      await this.createEvent(userId, {
        event_type: 'favorite_toggled',
        quest_id: questId,
        event_data: { is_favorite: isFavorite },
        app_version: appVersion,
      });
    } catch (error) {
      console.error('Failed to track favorite_toggled:', error);
    }
  }

  /**
   * Track quest deletion event
   */
  async trackQuestDeleted(userId: string, questId: string, appVersion?: string): Promise<void> {
    try {
      await this.createEvent(userId, {
        event_type: 'delete_quest',
        quest_id: questId,
        app_version: appVersion,
      });
    } catch (error) {
      console.error('Failed to track delete_quest:', error);
    }
  }

  /**
   * Track generation error event
   */
  async trackGenerationError(
    userId: string,
    errorCode: string,
    params: Record<string, unknown>,
    appVersion?: string
  ): Promise<void> {
    try {
      await this.createEvent(userId, {
        event_type: 'error_generation',
        event_data: { error_code: errorCode, ...params },
        app_version: appVersion,
      });
    } catch (error) {
      console.error('Failed to track error_generation:', error);
    }
  }

  /**
   * Track authentication login event
   * US-002, US-003: Records successful login attempts
   */
  async trackAuthLogin(userId: string, method: 'email' | 'google'): Promise<void> {
    try {
      await this.createEvent(userId, {
        event_type: 'auth_login',
        event_data: { method },
        app_version: undefined, // Omitted in MVP as per spec
      });
    } catch (error) {
      console.error('Failed to track auth_login:', error);
      // Non-fatal: don't interrupt login flow
    }
  }

  /**
   * Track authentication signup event
   * US-001: Records successful registration attempts
   */
  async trackAuthSignup(userId: string, method: 'email' | 'google', needsConfirmation: boolean): Promise<void> {
    try {
      await this.createEvent(userId, {
        event_type: 'auth_signup',
        event_data: { method, needs_confirmation: needsConfirmation },
        app_version: undefined, // Omitted in MVP as per spec
      });
    } catch (error) {
      console.error('Failed to track auth_signup:', error);
      // Non-fatal: don't interrupt registration flow
    }
  }
}
