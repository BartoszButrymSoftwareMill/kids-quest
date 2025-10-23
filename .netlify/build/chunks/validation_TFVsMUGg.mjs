import { z } from 'zod';

const locationTypeSchema = z.enum(["home", "outdoor"]);
const energyLevelSchema = z.enum(["low", "medium", "high"]);
const questStatusSchema = z.enum(["saved", "started", "completed"]);
const questSourceSchema = z.enum(["ai", "manual"]);
const eventTypeSchema = z.enum([
  "quest_generated",
  "quest_started",
  "quest_saved",
  "quest_completed",
  "quest_created_manual",
  "delete_quest",
  "favorite_toggled",
  "auth_signup",
  "auth_login",
  "error_generation",
  "preset_used"
]);
const generateQuestSchema = z.object({
  age_group_id: z.number().int().positive().optional(),
  duration_minutes: z.number().int().min(1).max(480),
  location: locationTypeSchema.optional(),
  energy_level: energyLevelSchema.optional(),
  prop_ids: z.array(z.number().int().positive()).default([]),
  app_version: z.string().max(20).optional()
}).refine((data) => data.age_group_id && data.location && data.energy_level, {
  message: "Age group, location, and energy level are required"
});
const createQuestSchema = z.object({
  title: z.string().min(1).max(200).regex(/\S/, "Title must contain non-whitespace"),
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
const updateQuestSchema = z.object({
  status: questStatusSchema.optional(),
  is_favorite: z.boolean().optional()
}).refine((data) => data.status !== void 0 || data.is_favorite !== void 0, {
  message: "At least one field must be provided"
});
const toggleFavoriteSchema = z.object({
  is_favorite: z.boolean()
});
const updateProfileSchema = z.object({
  default_age_group_id: z.number().int().positive().nullable().optional(),
  default_duration_minutes: z.number().int().min(1).max(480).nullable().optional(),
  default_location: locationTypeSchema.nullable().optional(),
  default_energy_level: energyLevelSchema.nullable().optional()
});
const createEventSchema = z.object({
  event_type: eventTypeSchema,
  quest_id: z.string().uuid().optional(),
  event_data: z.record(z.unknown()).nullable().optional(),
  app_version: z.string().optional()
});
const questListQuerySchema = z.object({
  age_group_id: z.coerce.number().int().positive().optional(),
  location: locationTypeSchema.optional(),
  energy_level: energyLevelSchema.optional(),
  source: questSourceSchema.optional(),
  status: questStatusSchema.optional(),
  is_favorite: z.enum(["true", "false"]).optional(),
  prop_ids: z.string().optional(),
  // comma-separated
  sort: z.enum(["recent", "favorites"]).optional().default("recent"),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0)
});

export { updateQuestSchema as a, createQuestSchema as b, createEventSchema as c, generateQuestSchema as g, questListQuerySchema as q, toggleFavoriteSchema as t, updateProfileSchema as u };
