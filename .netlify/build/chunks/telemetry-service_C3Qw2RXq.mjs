class TelemetryService {
  constructor(supabase) {
    this.supabase = supabase;
  }
  /**
   * Creates a telemetry event in the database
   */
  async createEvent(userId, data) {
    const { data: event, error } = await this.supabase.from("events").insert({
      user_id: userId,
      event_type: data.event_type,
      quest_id: data.quest_id || null,
      event_data: data.event_data || null,
      app_version: data.app_version || null
    }).select().single();
    if (error) {
      console.error("Failed to create event:", error);
      throw error;
    }
    return {
      id: event.id,
      user_id: event.user_id,
      event_type: event.event_type,
      quest_id: event.quest_id,
      event_data: event.event_data,
      app_version: event.app_version,
      created_at: event.created_at
    };
  }
  /**
   * Track quest generation event
   */
  async trackQuestGenerated(userId, questId, params, appVersion) {
    try {
      await this.createEvent(userId, {
        event_type: "quest_generated",
        quest_id: questId || void 0,
        event_data: params,
        app_version: appVersion
      });
    } catch (error) {
      console.error("Failed to track quest_generated:", error);
    }
  }
  /**
   * Track quest started event
   */
  async trackQuestStarted(userId, questId, appVersion) {
    try {
      await this.createEvent(userId, {
        event_type: "quest_started",
        quest_id: questId,
        app_version: appVersion
      });
    } catch (error) {
      console.error("Failed to track quest_started:", error);
    }
  }
  /**
   * Track quest completed event
   */
  async trackQuestCompleted(userId, questId, appVersion) {
    try {
      await this.createEvent(userId, {
        event_type: "quest_completed",
        quest_id: questId,
        app_version: appVersion
      });
    } catch (error) {
      console.error("Failed to track quest_completed:", error);
    }
  }
  /**
   * Track quest saved event
   */
  async trackQuestSaved(userId, questId, appVersion) {
    try {
      await this.createEvent(userId, {
        event_type: "quest_saved",
        quest_id: questId,
        app_version: appVersion
      });
    } catch (error) {
      console.error("Failed to track quest_saved:", error);
    }
  }
  /**
   * Track favorite toggle event
   */
  async trackFavoriteToggled(userId, questId, isFavorite, appVersion) {
    try {
      await this.createEvent(userId, {
        event_type: "favorite_toggled",
        quest_id: questId,
        event_data: { is_favorite: isFavorite },
        app_version: appVersion
      });
    } catch (error) {
      console.error("Failed to track favorite_toggled:", error);
    }
  }
  /**
   * Track quest deletion event
   */
  async trackQuestDeleted(userId, questId, appVersion) {
    try {
      await this.createEvent(userId, {
        event_type: "delete_quest",
        quest_id: questId,
        app_version: appVersion
      });
    } catch (error) {
      console.error("Failed to track delete_quest:", error);
    }
  }
  /**
   * Track generation error event
   */
  async trackGenerationError(userId, errorCode, params, appVersion) {
    try {
      await this.createEvent(userId, {
        event_type: "error_generation",
        event_data: { error_code: errorCode, ...params },
        app_version: appVersion
      });
    } catch (error) {
      console.error("Failed to track error_generation:", error);
    }
  }
  /**
   * Track authentication login event
   * US-002, US-003: Records successful login attempts
   */
  async trackAuthLogin(userId, method) {
    try {
      await this.createEvent(userId, {
        event_type: "auth_login",
        event_data: { method },
        app_version: void 0
        // Omitted in MVP as per spec
      });
    } catch (error) {
      console.error("Failed to track auth_login:", error);
    }
  }
  /**
   * Track authentication signup event
   * US-001: Records successful registration attempts
   */
  async trackAuthSignup(userId, method, needsConfirmation) {
    try {
      await this.createEvent(userId, {
        event_type: "auth_signup",
        event_data: { method, needs_confirmation: needsConfirmation },
        app_version: void 0
        // Omitted in MVP as per spec
      });
    } catch (error) {
      console.error("Failed to track auth_signup:", error);
    }
  }
}

export { TelemetryService as T };
