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
  retry_after?: number; // dla rate limiting
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
