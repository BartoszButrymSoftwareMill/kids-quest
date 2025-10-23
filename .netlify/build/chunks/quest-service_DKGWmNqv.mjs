import { A as AppError } from './errors_ClCkzvSe.mjs';

class QuestService {
  constructor(supabase) {
    this.supabase = supabase;
  }
  /**
   * Creates a new quest in the database
   * Handles timestamps based on initial status
   * Creates quest_props relationships if prop_ids provided
   */
  async createQuest(userId, data) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const timestamps = {
      saved_at: null,
      started_at: null,
      completed_at: null
    };
    if (data.status === "saved" || !data.status) {
      timestamps.saved_at = now;
    } else if (data.status === "started") {
      timestamps.saved_at = now;
      timestamps.started_at = now;
    } else if (data.status === "completed") {
      timestamps.saved_at = now;
      timestamps.started_at = now;
      timestamps.completed_at = now;
    }
    const { data: quest, error } = await this.supabase.from("quests").insert({
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
      status: data.status || "saved",
      app_version: data.app_version || null,
      ...timestamps
    }).select().single();
    if (error) {
      console.error("Failed to create quest:", error);
      throw new AppError(500, "creation_failed", "Nie udało się utworzyć questa");
    }
    if (data.prop_ids && data.prop_ids.length > 0) {
      const questProps = data.prop_ids.map((propId) => ({
        quest_id: quest.id,
        prop_id: propId
      }));
      const { error: propsError } = await this.supabase.from("quest_props").insert(questProps);
      if (propsError) {
        console.error("Failed to create quest_props:", propsError);
      }
    }
    return this.formatQuestResponse(quest, data.prop_ids || []);
  }
  /**
   * Gets a single quest by ID
   * Includes age_group and props relationships
   */
  async getQuest(questId, userId) {
    const { data: quest, error } = await this.supabase.from("quests").select(
      `
        *,
        age_groups (id, code, label, span),
        quest_props (
          prop_id,
          props (id, code, label)
        )
      `
    ).eq("id", questId).eq("user_id", userId).single();
    if (error || !quest) {
      throw new AppError(404, "not_found", "Quest nie został znaleziony");
    }
    return this.formatQuestResponse(quest);
  }
  /**
   * Updates a quest's status or favorite status
   * Manages timestamps automatically based on status changes
   */
  async updateQuest(questId, userId, updates) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const data = { updated_at: now };
    if (updates.status !== void 0) {
      data.status = updates.status;
      if (updates.status === "started") {
        data.started_at = now;
      } else if (updates.status === "completed") {
        data.completed_at = now;
      }
    }
    if (updates.is_favorite !== void 0) {
      data.is_favorite = updates.is_favorite;
      data.favorited_at = updates.is_favorite ? now : null;
    }
    const { data: quest, error } = await this.supabase.from("quests").update(data).eq("id", questId).eq("user_id", userId).select(
      `
        *,
        age_groups (id, code, label, span),
        quest_props (
          prop_id,
          props (id, code, label)
        )
      `
    ).single();
    if (error || !quest) {
      throw new AppError(404, "not_found", "Quest nie został znaleziony");
    }
    return this.formatQuestResponse(quest);
  }
  /**
   * Deletes a quest
   * Cascading delete handles quest_props automatically
   */
  async deleteQuest(questId, userId) {
    const { error } = await this.supabase.from("quests").delete().eq("id", questId).eq("user_id", userId);
    if (error) {
      throw new AppError(404, "not_found", "Quest nie został znaleziony");
    }
  }
  /**
   * Formats raw quest data into QuestResponse DTO
   * Handles nested relationships (age_group, props)
   */
  formatQuestResponse(quest) {
    const ageGroup = {
      id: quest.age_groups?.id || quest.age_group_id,
      code: quest.age_groups?.code || "",
      label: quest.age_groups?.label || ""
    };
    if (quest.age_groups?.span) {
      const spanStr = quest.age_groups.span;
      const match = spanStr.match(/\[(\d+),(\d+)\)/);
      if (match) {
        ageGroup.min_age = parseInt(match[1]);
        ageGroup.max_age = parseInt(match[2]) - 1;
      }
    }
    const props = quest.quest_props?.map((qp) => ({
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

export { QuestService as Q };
