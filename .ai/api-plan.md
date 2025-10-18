# REST API Plan - KidsQuest MVP

## Overview

This REST API plan defines the backend interface for the KidsQuest application, a web-based platform that generates safe, age-appropriate activity scenarios ("quests") for children aged 3-10 years. The API is built on:

- **Backend**: Supabase (PostgreSQL + Auth + SDK)
- **Frontend**: Astro 5 + React 19 + TypeScript 5
- **AI Integration**: OpenRouter.ai for quest generation
- **Authentication**: Supabase Auth (email/password + Google OAuth)

## 1. Resources

| Resource | Database Table | Description |
|----------|----------------|-------------|
| **Profiles** | `profiles` | Extended user profiles with default preferences |
| **Quests** | `quests` | Main quest data (AI-generated or manual) |
| **Quest Props** | `quest_props` | Many-to-many relationship between quests and props |
| **Events** | `events` | Telemetry events (90-day retention) |
| **Age Groups** | `age_groups` | Dictionary: age group definitions |
| **Props** | `props` | Dictionary: available quest props/equipment |
| **Content Policy Rules** | `content_policy_rules` | Content safety rules (internal use) |

---

## 2. Endpoints

### 2.1 Authentication & Profile Management

#### GET /api/auth/me
**Description**: Get current authenticated user information  
**Authentication**: Required (Bearer token)

**Response (200 OK)**:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2025-01-15T10:00:00Z"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or missing authentication token

---

#### GET /api/profiles/me
**Description**: Get current user's profile with default preferences  
**Authentication**: Required

**Response (200 OK)**:
```json
{
  "user_id": "uuid",
  "default_age_group_id": 2,
  "default_duration_minutes": 30,
  "default_location": "home",
  "default_energy_level": "medium",
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-15T10:00:00Z"
}
```

**Error Responses**:
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Profile does not exist

---

#### PATCH /api/profiles/me
**Description**: Update current user's default preferences  
**Authentication**: Required

**Request Body**:
```json
{
  "default_age_group_id": 3,
  "default_duration_minutes": 45,
  "default_location": "outdoor",
  "default_energy_level": "high"
}
```

**Validation Rules**:
- `default_duration_minutes`: 1-480 or null
- `default_location`: "home" | "outdoor" | null
- `default_energy_level`: "low" | "medium" | "high" | null
- `default_age_group_id`: must reference valid age_groups.id or null

**Response (200 OK)**:
```json
{
  "user_id": "uuid",
  "default_age_group_id": 3,
  "default_duration_minutes": 45,
  "default_location": "outdoor",
  "default_energy_level": "high",
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-20T14:30:00Z"
}
```

**Error Responses**:
- `401 Unauthorized`: Not authenticated
- `400 Bad Request`: Validation failed (details in response body)
- `404 Not Found`: Age group ID does not exist

---

### 2.2 Quest Generation & Management

#### POST /api/quests/generate
**Description**: Generate a new quest using AI based on provided parameters. Returns quest data WITHOUT saving to database (user must explicitly save/start).  
**Authentication**: Required  
**Rate Limiting**: 5 requests/minute, 30 requests/hour per user

**Request Body**:
```json
{
  "age_group_id": 2,
  "duration_minutes": 30,
  "location": "home",
  "energy_level": "medium",
  "prop_ids": [1, 5],
  "app_version": "1.0.0"
}
```

**Validation Rules**:
- `age_group_id`: required, must reference valid age_groups.id
- `duration_minutes`: required, 1-480
- `location`: required, "home" | "outdoor"
- `energy_level`: required, "low" | "medium" | "high"
- `prop_ids`: optional array of valid prop IDs
- `app_version`: optional string, max 20 chars

**Response (200 OK)**:
```json
{
  "title": "Tajemnica Zagubionych Klocków",
  "hook": "Ktoś pomieszał wszystkie klocki! Czy pomożesz je posortować według kolorów i zbudować coś wspaniałego?",
  "step1": "Znajdź wszystkie klocki w pokoju i połóż je na dywanie",
  "step2": "Posortuj klocki według kolorów - czerwone do jednej kupki, niebieskie do drugiej",
  "step3": "Zbuduj wieżę używając klocków z każdego koloru",
  "easier_version": "Zamiast sortować według kolorów, posortuj klocki według wielkości - duże i małe",
  "harder_version": "Zbuduj most łączący dwa krzesła, używając klocków w kolejności: czerwony, niebieski, czerwony, niebieski",
  "safety_notes": "Upewnij się, że dziecko nie wchodzi na krzesła podczas zabawy",
  "age_group_id": 2,
  "duration_minutes": 30,
  "location": "home",
  "energy_level": "medium",
  "prop_ids": [1],
  "source": "ai"
}
```

**Error Responses**:
- `401 Unauthorized`: Not authenticated
- `400 Bad Request`: Validation failed or invalid parameters
- `429 Too Many Requests`: Rate limit exceeded
  ```json
  {
    "error": "rate_limit_exceeded",
    "message": "Wystąpił błąd, spróbuj później",
    "retry_after": 45
  }
  ```
- `500 Internal Server Error`: AI generation failed
  ```json
  {
    "error": "generation_failed",
    "message": "Wystąpił błąd, spróbuj później"
  }
  ```

**Business Logic**:
1. Validate request parameters against schema
2. Check rate limiting (5/min, 30/hour per user)
3. Call AI service (OpenRouter) with parameters and content safety rules
4. Validate AI output against content_policy_rules (hard-ban rejection, soft-ban replacement)
5. Create `quest_generated` telemetry event
6. Return quest data (NOT persisted to database yet)
7. On error, create `error_generation` telemetry event

---

#### POST /api/quests
**Description**: Create a new quest (manual or save AI-generated). Can optionally start the quest immediately.  
**Authentication**: Required

**Request Body**:
```json
{
  "title": "Tajemnica Zagubionych Klocków",
  "hook": "Ktoś pomieszał wszystkie klocki!...",
  "step1": "Znajdź wszystkie klocki...",
  "step2": "Posortuj klocki według kolorów...",
  "step3": "Zbuduj wieżę...",
  "easier_version": "Zamiast sortować...",
  "harder_version": "Zbuduj most...",
  "safety_notes": "Upewnij się, że...",
  "age_group_id": 2,
  "duration_minutes": 30,
  "location": "home",
  "energy_level": "medium",
  "prop_ids": [1, 5],
  "source": "ai",
  "status": "saved",
  "app_version": "1.0.0"
}
```

**Validation Rules**:
- `title`: required, 1-200 chars, must contain non-whitespace
- `hook`: required, 10-300 chars
- `step1`, `step2`, `step3`: required, 10-250 chars each
- `easier_version`: optional, 10-500 chars or null
- `harder_version`: optional, 10-500 chars or null
- `safety_notes`: optional, max 500 chars or null
- `age_group_id`: required, must reference valid age_groups.id
- `duration_minutes`: required, 1-480
- `location`: required, "home" | "outdoor"
- `energy_level`: required, "low" | "medium" | "high"
- `source`: required, "ai" | "manual"
- `status`: optional, "saved" | "started" | "completed", defaults to "saved"
- `prop_ids`: optional array of valid prop IDs
- `app_version`: optional string, max 20 chars
- Content validation: check against content_policy_rules (hard-ban blocks, soft-ban warns)

**Response (201 Created)**:
```json
{
  "id": "quest-uuid",
  "user_id": "user-uuid",
  "title": "Tajemnica Zagubionych Klocków",
  "hook": "Ktoś pomieszał wszystkie klocki!...",
  "step1": "Znajdź wszystkie klocki...",
  "step2": "Posortuj klocki według kolorów...",
  "step3": "Zbuduj wieżę...",
  "easier_version": "Zamiast sortować...",
  "harder_version": "Zbuduj most...",
  "safety_notes": "Upewnij się, że...",
  "age_group_id": 2,
  "duration_minutes": 30,
  "location": "home",
  "energy_level": "medium",
  "source": "ai",
  "status": "saved",
  "is_favorite": false,
  "app_version": "1.0.0",
  "created_at": "2025-01-20T15:00:00Z",
  "updated_at": "2025-01-20T15:00:00Z",
  "saved_at": "2025-01-20T15:00:00Z",
  "started_at": null,
  "completed_at": null,
  "favorited_at": null,
  "props": [
    {
      "id": 1,
      "code": "blocks",
      "label": "Klocki"
    }
  ]
}
```

**Error Responses**:
- `401 Unauthorized`: Not authenticated
- `400 Bad Request`: Validation failed or content policy violation
  ```json
  {
    "error": "validation_failed",
    "message": "Treść zawiera niedozwolone słowa",
    "violations": [
      {
        "field": "hook",
        "rule": "hard_ban",
        "pattern": "przemoc"
      }
    ],
    "suggestions": [
      {
        "field": "hook",
        "original": "pokonaj go",
        "replacement": "pokonaj go sprytem"
      }
    ]
  }
  ```

**Business Logic**:
1. Validate request body against schema
2. If source="manual", validate content against content_policy_rules
3. Create quest record in database
4. Create quest_props relationships if prop_ids provided
5. Create telemetry event: `quest_saved` or `quest_started` or `quest_created_manual` based on source and status
6. Update timestamps: saved_at if status=saved, started_at if status=started
7. Return created quest with populated props

---

#### GET /api/quests
**Description**: List current user's quests with filtering, sorting, and pagination  
**Authentication**: Required

**Query Parameters**:
- `age_group_id`: (optional) Filter by age group ID
- `location`: (optional) "home" | "outdoor"
- `energy_level`: (optional) "low" | "medium" | "high"
- `source`: (optional) "ai" | "manual"
- `status`: (optional) "saved" | "started" | "completed"
- `is_favorite`: (optional) "true" | "false"
- `prop_ids`: (optional) Comma-separated prop IDs (e.g., "1,3,5")
- `sort`: (optional) "recent" (default) | "favorites"
  - "recent": ORDER BY created_at DESC
  - "favorites": WHERE is_favorite=true ORDER BY favorited_at DESC
- `limit`: (optional) Number of results per page, default 20, max 100
- `offset`: (optional) Pagination offset, default 0

**Response (200 OK)**:
```json
{
  "quests": [
    {
      "id": "quest-uuid-1",
      "user_id": "user-uuid",
      "title": "Tajemnica Zagubionych Klocków",
      "hook": "Ktoś pomieszał wszystkie klocki!...",
      "step1": "Znajdź wszystkie klocki...",
      "step2": "Posortuj klocki według kolorów...",
      "step3": "Zbuduj wieżę...",
      "easier_version": "Zamiast sortować...",
      "harder_version": "Zbuduj most...",
      "safety_notes": "Upewnij się, że...",
      "age_group": {
        "id": 2,
        "code": "5_6",
        "label": "5–6 lat"
      },
      "duration_minutes": 30,
      "location": "home",
      "energy_level": "medium",
      "source": "ai",
      "status": "started",
      "is_favorite": true,
      "created_at": "2025-01-20T15:00:00Z",
      "updated_at": "2025-01-20T15:30:00Z",
      "saved_at": "2025-01-20T15:00:00Z",
      "started_at": "2025-01-20T15:30:00Z",
      "completed_at": null,
      "favorited_at": "2025-01-20T16:00:00Z",
      "props": [
        {
          "id": 1,
          "code": "blocks",
          "label": "Klocki"
        }
      ]
    }
  ],
  "pagination": {
    "total": 42,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Not authenticated
- `400 Bad Request`: Invalid query parameters

**Business Logic**:
1. Validate query parameters
2. Build SQL query with filters and sorting
3. Apply RLS (user can only see own quests)
4. Join with age_groups and quest_props/props for complete data
5. Apply pagination with limit/offset
6. Return results with metadata

---

#### GET /api/quests/:id
**Description**: Get detailed information about a specific quest  
**Authentication**: Required  
**Authorization**: User must own the quest (enforced by RLS)

**Response (200 OK)**:
```json
{
  "id": "quest-uuid",
  "user_id": "user-uuid",
  "title": "Tajemnica Zagubionych Klocków",
  "hook": "Ktoś pomieszał wszystkie klocki!...",
  "step1": "Znajdź wszystkie klocki...",
  "step2": "Posortuj klocki według kolorów...",
  "step3": "Zbuduj wieżę...",
  "easier_version": "Zamiast sortować...",
  "harder_version": "Zbuduj most...",
  "safety_notes": "Upewnij się, że...",
  "age_group": {
    "id": 2,
    "code": "5_6",
    "label": "5–6 lat"
  },
  "duration_minutes": 30,
  "location": "home",
  "energy_level": "medium",
  "source": "ai",
  "status": "started",
  "is_favorite": true,
  "app_version": "1.0.0",
  "created_at": "2025-01-20T15:00:00Z",
  "updated_at": "2025-01-20T15:30:00Z",
  "saved_at": "2025-01-20T15:00:00Z",
  "started_at": "2025-01-20T15:30:00Z",
  "completed_at": null,
  "favorited_at": "2025-01-20T16:00:00Z",
  "props": [
    {
      "id": 1,
      "code": "blocks",
      "label": "Klocki"
    },
    {
      "id": 5,
      "code": "paper_pencil",
      "label": "Kartka i ołówek"
    }
  ]
}
```

**Error Responses**:
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Quest does not exist or user does not own it

---

#### PATCH /api/quests/:id
**Description**: Update quest status, favorite status, or other mutable fields  
**Authentication**: Required  
**Authorization**: User must own the quest

**Request Body** (all fields optional):
```json
{
  "status": "completed",
  "is_favorite": true
}
```

**Validation Rules**:
- `status`: "saved" | "started" | "completed"
- `is_favorite`: boolean

**Response (200 OK)**:
```json
{
  "id": "quest-uuid",
  "user_id": "user-uuid",
  "title": "Tajemnica Zagubionych Klocków",
  "status": "completed",
  "is_favorite": true,
  "updated_at": "2025-01-20T17:00:00Z",
  "completed_at": "2025-01-20T17:00:00Z",
  "favorited_at": "2025-01-20T16:00:00Z",
  ...
}
```

**Error Responses**:
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Quest does not exist or user does not own it
- `400 Bad Request`: Invalid status transition or validation failed

**Business Logic**:
1. Validate request body
2. Check quest ownership (RLS)
3. Update quest record
4. Update appropriate timestamps:
   - `started_at` when status changes to "started"
   - `completed_at` when status changes to "completed"
   - `favorited_at` when is_favorite changes to true
   - `updated_at` always
5. Create telemetry event based on change:
   - `quest_started` if status → started
   - `quest_completed` if status → completed
   - `favorite_toggled` if is_favorite changed
6. Return updated quest

---

#### PATCH /api/quests/:id/start
**Description**: Convenience endpoint to start a quest (shortcut for PATCH with status=started)  
**Authentication**: Required  
**Authorization**: User must own the quest

**Request Body**: (empty)

**Response (200 OK)**:
```json
{
  "id": "quest-uuid",
  "status": "started",
  "started_at": "2025-01-20T15:30:00Z",
  "updated_at": "2025-01-20T15:30:00Z",
  ...
}
```

**Error Responses**:
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Quest does not exist or user does not own it

**Business Logic**:
1. Set status to "started"
2. Set started_at to now()
3. Create `quest_started` telemetry event
4. Return updated quest

---

#### PATCH /api/quests/:id/complete
**Description**: Convenience endpoint to mark quest as completed  
**Authentication**: Required  
**Authorization**: User must own the quest

**Request Body**: (empty)

**Response (200 OK)**:
```json
{
  "id": "quest-uuid",
  "status": "completed",
  "completed_at": "2025-01-20T17:00:00Z",
  "updated_at": "2025-01-20T17:00:00Z",
  ...
}
```

**Error Responses**:
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Quest does not exist or user does not own it

**Business Logic**:
1. Set status to "completed"
2. Set completed_at to now()
3. Create `quest_completed` telemetry event
4. Return updated quest

---

#### PATCH /api/quests/:id/favorite
**Description**: Toggle favorite status of a quest  
**Authentication**: Required  
**Authorization**: User must own the quest

**Request Body**:
```json
{
  "is_favorite": true
}
```

**Validation Rules**:
- `is_favorite`: required boolean

**Response (200 OK)**:
```json
{
  "id": "quest-uuid",
  "is_favorite": true,
  "favorited_at": "2025-01-20T16:00:00Z",
  "updated_at": "2025-01-20T16:00:00Z",
  ...
}
```

**Error Responses**:
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Quest does not exist or user does not own it
- `400 Bad Request`: Missing or invalid is_favorite value

**Business Logic**:
1. Update is_favorite field
2. Set favorited_at to now() if is_favorite=true, null if false
3. Create `favorite_toggled` telemetry event with is_favorite value in event_data
4. Return updated quest

---

#### DELETE /api/quests/:id
**Description**: Delete a quest (soft delete or hard delete based on implementation)  
**Authentication**: Required  
**Authorization**: User must own the quest

**Response (204 No Content)**: (empty body)

**Error Responses**:
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Quest does not exist or user does not own it

**Business Logic**:
1. Verify quest ownership (RLS)
2. Create `delete_quest` telemetry event
3. Delete quest record (CASCADE deletes quest_props, sets events.quest_id to NULL)
4. Return 204 No Content

---

### 2.3 Dictionary/Reference Data

#### GET /api/age-groups
**Description**: Get list of all available age groups  
**Authentication**: Not required (public read-only)

**Response (200 OK)**:
```json
{
  "age_groups": [
    {
      "id": 1,
      "code": "3_4",
      "label": "3–4 lata",
      "min_age": 3,
      "max_age": 4
    },
    {
      "id": 2,
      "code": "5_6",
      "label": "5–6 lat",
      "min_age": 5,
      "max_age": 6
    },
    {
      "id": 3,
      "code": "7_8",
      "label": "7–8 lat",
      "min_age": 7,
      "max_age": 8
    },
    {
      "id": 4,
      "code": "9_10",
      "label": "9–10 lat",
      "min_age": 9,
      "max_age": 10
    }
  ]
}
```

**Business Logic**:
1. Query age_groups table
2. Extract min/max from int4range span
3. Return all age groups (no pagination needed, small dataset)

---

#### GET /api/props
**Description**: Get list of all available props/equipment  
**Authentication**: Not required (public read-only)

**Response (200 OK)**:
```json
{
  "props": [
    {
      "id": 1,
      "code": "blocks",
      "label": "Klocki"
    },
    {
      "id": 2,
      "code": "drawing",
      "label": "Rysowanie"
    },
    {
      "id": 3,
      "code": "none",
      "label": "Bez rekwizytów"
    },
    {
      "id": 4,
      "code": "paper_pencil",
      "label": "Kartka i ołówek"
    },
    ...
  ]
}
```

**Business Logic**:
1. Query props table
2. Return all props (no pagination needed, small dataset)

---

### 2.4 Telemetry

#### POST /api/events
**Description**: Create a telemetry event (called by frontend for tracking)  
**Authentication**: Required

**Request Body**:
```json
{
  "event_type": "quest_started",
  "quest_id": "quest-uuid",
  "event_data": {
    "preset_used": "quick_5min",
    "time_to_start_seconds": 12
  },
  "app_version": "1.0.0"
}
```

**Validation Rules**:
- `event_type`: required, must be valid event_type enum value
  - `quest_generated`, `quest_started`, `quest_saved`, `quest_completed`, `quest_created_manual`, `auth_signup`, `auth_login`, `preset_used`, `favorite_toggled`, `delete_quest`, `error_generation`
- `quest_id`: optional UUID, must reference valid quest if provided
- `event_data`: optional JSON object with additional metadata
- `app_version`: optional string

**Response (201 Created)**:
```json
{
  "id": "event-uuid",
  "user_id": "user-uuid",
  "event_type": "quest_started",
  "quest_id": "quest-uuid",
  "event_data": {
    "preset_used": "quick_5min",
    "time_to_start_seconds": 12
  },
  "app_version": "1.0.0",
  "created_at": "2025-01-20T15:30:00Z"
}
```

**Error Responses**:
- `401 Unauthorized`: Not authenticated
- `400 Bad Request`: Invalid event_type or quest_id does not exist

**Business Logic**:
1. Validate request body
2. Set user_id from authenticated user
3. Verify quest_id belongs to user if provided
4. Create event record with automatic created_at timestamp
5. Return created event

**Note**: Most telemetry events are created server-side automatically (e.g., when starting/completing quests). This endpoint allows frontend to log additional events like `preset_used`, `auth_signup`, `auth_login`, etc.

---

## 3. Authentication and Authorization

### 3.1 Authentication Mechanism

**Provider**: Supabase Auth

**Supported Methods**:
- Email + Password
- Google OAuth

**Flow**:
1. User signs up/logs in via Supabase Auth (handled by Supabase SDK)
2. Supabase returns a JWT access token
3. Frontend stores token (httpOnly cookie or secure localStorage)
4. All API requests include token in `Authorization: Bearer <token>` header
5. Backend validates token using Supabase SDK
6. Backend extracts user ID from validated token

### 3.2 Authorization Strategy

**Row-Level Security (RLS)**: Enforced at database level via Supabase policies

**Policies**:

**profiles table**:
- SELECT: `user_id = auth.uid()`
- INSERT: `user_id = auth.uid()`
- UPDATE: `user_id = auth.uid()`

**quests table**:
- SELECT: `user_id = auth.uid()`
- INSERT: `user_id = auth.uid()`
- UPDATE: `user_id = auth.uid()`
- DELETE: `user_id = auth.uid()`

**quest_props table**:
- SELECT: `quest_id IN (SELECT id FROM quests WHERE user_id = auth.uid())`
- ALL: `quest_id IN (SELECT id FROM quests WHERE user_id = auth.uid())`

**events table**:
- SELECT: `user_id = auth.uid()`
- INSERT: `user_id = auth.uid()`

**Dictionary tables** (age_groups, props, content_policy_rules):
- No RLS enabled
- Read-only access at application level
- Managed via Supabase Dashboard

### 3.3 Session Management

- Sessions handled by Supabase Auth
- Refresh tokens used for automatic session renewal
- Logout invalidates tokens server-side
- Password reset via Supabase Auth email flow

### 3.4 Rate Limiting

**Implementation**: Application-level middleware

**Limits**:
- Quest generation: 5 requests/minute, 30 requests/hour per user
- General API: 100 requests/minute per user (configurable)

**Response on limit exceeded**:
- HTTP 429 Too Many Requests
- `Retry-After` header with seconds to wait
- Error body with retry_after field

---

## 4. Validation and Business Logic

### 4.1 Request Validation

All endpoints validate incoming requests against the following rules:

#### Quest Fields

| Field | Type | Constraints |
|-------|------|-------------|
| `title` | string | Required, 1-200 chars, must contain non-whitespace, matches `\S` |
| `hook` | string | Required, 10-300 chars |
| `step1`, `step2`, `step3` | string | Required, 10-250 chars each |
| `easier_version` | string \| null | Optional, 10-500 chars if provided |
| `harder_version` | string \| null | Optional, 10-500 chars if provided |
| `safety_notes` | string \| null | Optional, max 500 chars |
| `age_group_id` | integer | Required, must reference valid age_groups.id |
| `duration_minutes` | integer | Required, 1-480 |
| `location` | enum | Required, "home" \| "outdoor" |
| `energy_level` | enum | Required, "low" \| "medium" \| "high" |
| `source` | enum | Required, "ai" \| "manual" |
| `status` | enum | Optional, "saved" \| "started" \| "completed", defaults to "saved" |
| `is_favorite` | boolean | Optional, defaults to false |
| `prop_ids` | array | Optional, each ID must reference valid props.id |
| `app_version` | string | Optional, max 20 chars |

#### Profile Fields

| Field | Type | Constraints |
|-------|------|-------------|
| `default_age_group_id` | integer \| null | Optional, must reference valid age_groups.id if provided |
| `default_duration_minutes` | integer \| null | Optional, 1-480 if provided |
| `default_location` | enum \| null | Optional, "home" \| "outdoor" |
| `default_energy_level` | enum \| null | Optional, "low" \| "medium" \| "high" |

#### Event Fields

| Field | Type | Constraints |
|-------|------|-------------|
| `event_type` | enum | Required, must be valid event_type enum |
| `quest_id` | UUID \| null | Optional, must reference valid quest owned by user if provided |
| `event_data` | JSON \| null | Optional, valid JSON object |
| `app_version` | string \| null | Optional |

### 4.2 Content Safety Policy

**Implementation**: Validation middleware for quest creation/generation

**Rules Enforcement**:

1. **Hard-Ban Rules** (`rule_type = 'hard_ban'`):
   - Query active hard-ban patterns from `content_policy_rules`
   - Scan all text fields (title, hook, step1-3, easier_version, harder_version, safety_notes)
   - If match found: **REJECT** request with 400 Bad Request
   - Return violations list with matched patterns
   - Frontend must fix before re-submitting

2. **Soft-Ban Rules** (`rule_type = 'soft_ban'`):
   - Query active soft-ban patterns
   - Scan all text fields
   - If match found: **WARN** with suggestions in response
   - Provide replacement suggestions from `content_policy_rules.replacement`
   - Allow quest creation but return warnings

3. **Replacement Rules** (`rule_type = 'replacement'`):
   - Query active replacement patterns
   - Auto-replace matched patterns with safe alternatives
   - Log replacements in response metadata
   - Proceed with quest creation

**Pattern Matching** (`pattern_type`):
- `exact`: Exact string match (case-insensitive by default)
- `wildcard`: SQL LIKE pattern (e.g., `%pistol%`)
- `regex`: Regular expression matching (future enhancement)

**Example Hard-Ban Patterns**:
- przemoc, pistolet, karabin, nóż, miecz, alkohol, papieros, hazard, kradzież

**Example Soft-Ban Patterns**:
- złodziej → psotnik
- złoczyńca → psotnik
- potwór → sympatyczny potwór

**Example Replacement Patterns**:
- walka → pokonaj sprytem
- wyścig → podróż
- zawody → wspólna zabawa

### 4.3 Quest Lifecycle State Machine

**States**: `saved` → `started` → `completed`

**Allowed Transitions**:
- `saved` → `started`: User clicks "Accept and Start" or "Start"
- `saved` → `completed`: Direct completion allowed (user marks as done without explicit start)
- `started` → `completed`: User clicks "Complete"
- Any state → `saved`: Reset to saved (edge case, generally not exposed in UI)

**Disallowed Transitions**:
- `completed` → `saved` or `started`: Cannot un-complete (would require new endpoint if needed)

**Timestamp Updates**:
- `saved_at`: Set when quest first created with status=saved
- `started_at`: Set when status transitions to started (if previously null)
- `completed_at`: Set when status transitions to completed (if previously null)
- `updated_at`: Set on every update

### 4.4 Business Logic Rules

#### Quest Generation
1. Validate input parameters against schema
2. Check rate limiting (5/min, 30/hour)
3. Fetch user's default preferences if parameters omitted
4. Call AI service (OpenRouter) with:
   - Age-appropriate content guidelines
   - Location safety rules (outdoor = only safe places)
   - Energy level requirements
   - Prop constraints
   - Polish language requirement
   - Content safety rules (hard-ban list, soft-ban suggestions, replacements)
5. Validate AI output against content_policy_rules
6. If hard-ban violation: retry generation up to 2 times, then fail
7. Create `quest_generated` telemetry event
8. Return quest data (NOT saved to database)

#### Quest Creation
1. If source=manual: validate content against content_policy_rules before saving
2. Set user_id from authenticated user
3. Create quest record with provided data
4. Create quest_props relationships if prop_ids provided
5. Set appropriate timestamp: saved_at, started_at based on status
6. Create telemetry event: `quest_saved`, `quest_started`, or `quest_created_manual`
7. Return created quest with joined age_group and props

#### Quest Status Updates
1. Verify ownership via RLS
2. Update status field
3. Update appropriate lifecycle timestamp (started_at, completed_at)
4. Update updated_at
5. Create corresponding telemetry event (`quest_started`, `quest_completed`)
6. Return updated quest

#### Quest Favorite Toggle
1. Verify ownership via RLS
2. Update is_favorite field
3. Set favorited_at to now() if true, null if false
4. Update updated_at
5. Create `favorite_toggled` telemetry event with is_favorite in event_data
6. Return updated quest

#### Quest Deletion
1. Verify ownership via RLS
2. Create `delete_quest` telemetry event
3. Delete quest (CASCADE deletes quest_props, events.quest_id set to NULL)
4. Return 204 No Content

#### Metrics Calculation (not exposed via API in MVP)

These queries run server-side for admin/dev dashboards:

**Start Rate** (target ≥ 75%):
```sql
SELECT 
  COUNT(CASE WHEN event_type = 'quest_started' THEN 1 END)::float / 
  NULLIF(COUNT(CASE WHEN event_type = 'quest_generated' THEN 1 END), 0) AS start_rate
FROM events
WHERE created_at >= NOW() - INTERVAL '30 days';
```

**AI Share** (target ≥ 75%):
```sql
SELECT 
  COUNT(CASE WHEN q.source = 'ai' THEN 1 END)::float / 
  NULLIF(COUNT(*), 0) AS ai_share
FROM events e
JOIN quests q ON e.quest_id = q.id
WHERE e.event_type = 'quest_started'
  AND e.created_at >= NOW() - INTERVAL '30 days';
```

**Completion Rate**:
```sql
SELECT 
  COUNT(CASE WHEN event_type = 'quest_completed' THEN 1 END)::float / 
  NULLIF(COUNT(CASE WHEN event_type = 'quest_started' THEN 1 END), 0) AS completion_rate
FROM events
WHERE created_at >= NOW() - INTERVAL '30 days';
```

**Favorite Rate**:
```sql
SELECT 
  COUNT(DISTINCT user_id)::float / 
  NULLIF((SELECT COUNT(*) FROM profiles), 0) AS favorite_rate
FROM events
WHERE event_type = 'favorite_toggled'
  AND (event_data->>'is_favorite')::boolean = true
  AND created_at >= NOW() - INTERVAL '30 days';
```

**Error Rate**:
```sql
SELECT 
  COUNT(CASE WHEN event_type = 'error_generation' THEN 1 END)::float / 
  NULLIF(COUNT(CASE WHEN event_type = 'quest_generated' THEN 1 END), 0) AS error_rate
FROM events
WHERE created_at >= NOW() - INTERVAL '30 days';
```

### 4.5 Error Handling

**Standard Error Response Format**:
```json
{
  "error": "error_code",
  "message": "Human-readable error message in Polish",
  "details": {
    "field": "specific_field",
    "constraint": "validation_rule"
  }
}
```

**Common Error Codes**:
- `validation_failed`: Request body validation failed
- `not_found`: Resource not found
- `unauthorized`: Not authenticated
- `forbidden`: Authenticated but not authorized
- `rate_limit_exceeded`: Too many requests
- `generation_failed`: AI quest generation failed
- `content_policy_violation`: Content contains banned/unsafe material

### 4.6 Performance Considerations

**Database Indexes** (from db-plan.md):
- `quests_user_created_idx`: (user_id, created_at DESC) - Fast listing
- `quests_user_favorite_idx`: (user_id, is_favorite, favorited_at DESC) WHERE is_favorite=true - Fast favorites
- `quests_user_age_idx`: (user_id, age_group_id) - Age filtering
- `quests_user_location_idx`: (user_id, location) - Location filtering
- `quests_user_source_idx`: (user_id, source) - Source filtering
- `quest_props_prop_id_idx`: (prop_id) - Prop filtering
- `events_user_created_idx`: (user_id, created_at DESC) - Event timeline
- `events_type_created_idx`: (event_type, created_at DESC) - Event analytics

**Query Optimization**:
- Use prepared statements for all queries
- Leverage RLS policies to automatically filter by user_id
- Join age_groups and props only when needed for display
- Paginate quest listings (default 20, max 100)
- Cache dictionary data (age_groups, props) in application memory (small, rarely changes)

**AI Generation**:
- Async generation if response time > 15 seconds (future enhancement)
- Retry logic for transient failures (max 2 retries)
- Timeout after 30 seconds
- Cache content_policy_rules in memory (reload every 5 minutes)

---

## 5. API Versioning

**Strategy**: URL path versioning (future-proof)

**Current Version**: v1 (implicit, no version in path for MVP)

**Future Versions**: `/api/v2/...` when breaking changes are introduced

**Deprecation Policy** (post-MVP):
- Maintain previous version for 6 months after new version release
- Provide migration guides
- Send deprecation warnings in response headers

---

## 6. Implementation Notes

### 6.1 Technology Stack Integration

**Astro 5 + React 19**:
- API endpoints implemented as Astro API routes (`src/pages/api/**/*.ts`)
- Endpoints return JSON responses
- Use Astro middleware for authentication/authorization (`src/middleware/index.ts`)

**Supabase Client**:
- Initialize Supabase client with service role key for server-side operations
- Use RLS policies for automatic authorization
- Leverage Supabase SDK for auth token validation

**TypeScript**:
- Define shared types in `src/types.ts` (DTOs, entities)
- Generate database types from Supabase schema
- Use type-safe Supabase client queries

**OpenRouter AI**:
- Separate service layer (`src/lib/ai-service.ts`) for AI integration
- Handle retries, timeouts, and error handling
- Pass content safety rules to AI system prompt

### 6.2 File Structure

```
src/
├── pages/
│   └── api/
│       ├── auth/
│       │   └── me.ts
│       ├── profiles/
│       │   └── me.ts
│       ├── quests/
│       │   ├── index.ts                 # GET /api/quests, POST /api/quests
│       │   ├── [id].ts                  # GET /api/quests/:id, PATCH, DELETE
│       │   ├── [id]/start.ts            # PATCH /api/quests/:id/start
│       │   ├── [id]/complete.ts         # PATCH /api/quests/:id/complete
│       │   ├── [id]/favorite.ts         # PATCH /api/quests/:id/favorite
│       │   └── generate.ts              # POST /api/quests/generate
│       ├── age-groups.ts                # GET /api/age-groups
│       ├── props.ts                     # GET /api/props
│       └── events.ts                    # POST /api/events
├── middleware/
│   └── index.ts                         # Auth middleware
├── lib/
│   ├── supabase.ts                      # Supabase client initialization
│   ├── ai-service.ts                    # AI generation service
│   ├── content-safety.ts                # Content policy validation
│   ├── rate-limiter.ts                  # Rate limiting logic
│   └── validation.ts                    # Request validation helpers
├── db/
│   ├── supabase.client.ts               # Supabase client
│   └── database.types.ts                # Generated types
└── types.ts                             # Shared types (DTOs, entities)
```

### 6.3 Testing Strategy

**Unit Tests**:
- Validation functions
- Content safety rule matching
- Rate limiting logic

**Integration Tests**:
- API endpoints with test database
- Authentication flows
- Quest lifecycle transitions

**E2E Tests**:
- Complete user flows (signup → generate → start → complete)
- Content policy enforcement
- Error handling scenarios

---

## 7. Security Considerations

### 7.1 OWASP Top 10 Mitigations

1. **Injection**: Use parameterized queries (Supabase SDK), validate all inputs
2. **Broken Authentication**: Leverage Supabase Auth, secure token storage
3. **Sensitive Data Exposure**: No child data collection, HTTPS only, secure cookies
4. **XML External Entities**: N/A (JSON only)
5. **Broken Access Control**: RLS policies enforce ownership, no direct object references
6. **Security Misconfiguration**: Environment variables for secrets, no debug info in production
7. **XSS**: React sanitizes output by default, validate user-generated content
8. **Insecure Deserialization**: Validate JSON payloads, use type-safe parsing
9. **Using Components with Known Vulnerabilities**: Regular dependency updates, security audits
10. **Insufficient Logging & Monitoring**: Telemetry events, error logging, metrics tracking

### 7.2 Additional Security Measures

- **CORS**: Restrict to frontend domain only
- **CSRF**: Use SameSite cookies, CSRF tokens for state-changing operations
- **Rate Limiting**: Prevent abuse of AI generation and API endpoints
- **Input Sanitization**: Strip HTML/scripts from user-generated content
- **Content Policy**: Hard-ban dangerous content, prevent inappropriate material
- **SQL Injection**: Use Supabase SDK (parameterized queries only)
- **Secrets Management**: Use environment variables, never commit secrets
- **HTTPS Only**: Enforce TLS 1.2+ for all traffic
- **Password Requirements**: Enforce minimum complexity via Supabase Auth

---

## 8. Future Enhancements (Post-MVP)

1. **WebSocket Support**: Real-time quest collaboration (multi-user quests)
2. **Batch Operations**: Bulk quest creation, bulk favorite/delete
3. **Advanced Search**: Full-text search in quest content (PostgreSQL full-text search)
4. **Quest Templates**: Reusable quest templates with variable substitution
5. **Analytics API**: Expose metrics endpoints for dashboard (Start Rate, AI Share, etc.)
6. **Export/Import**: Export user's quests as JSON, import from file
7. **Webhooks**: Notify external services on quest completion
8. **GraphQL Alternative**: Provide GraphQL endpoint alongside REST
9. **API Versioning**: Introduce /api/v2/ when breaking changes needed
10. **Caching Layer**: Redis for frequently accessed data (age groups, props, user profiles)

---

## Appendix A: Complete Endpoint Summary

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/auth/me` | Get current user info | Yes |
| GET | `/api/profiles/me` | Get user profile | Yes |
| PATCH | `/api/profiles/me` | Update user profile | Yes |
| POST | `/api/quests/generate` | Generate quest with AI | Yes |
| POST | `/api/quests` | Create/save quest | Yes |
| GET | `/api/quests` | List user's quests | Yes |
| GET | `/api/quests/:id` | Get quest details | Yes |
| PATCH | `/api/quests/:id` | Update quest | Yes |
| PATCH | `/api/quests/:id/start` | Start quest | Yes |
| PATCH | `/api/quests/:id/complete` | Complete quest | Yes |
| PATCH | `/api/quests/:id/favorite` | Toggle favorite | Yes |
| DELETE | `/api/quests/:id` | Delete quest | Yes |
| GET | `/api/age-groups` | List age groups | No |
| GET | `/api/props` | List props | No |
| POST | `/api/events` | Create telemetry event | Yes |

---

## Appendix B: Database-to-API Mapping

| Database Table | API Resource | Primary Endpoints |
|----------------|--------------|-------------------|
| `auth.users` | (Supabase Auth) | `/api/auth/me` |
| `profiles` | Profiles | `/api/profiles/me` |
| `quests` | Quests | `/api/quests/*` |
| `quest_props` | (Junction table) | Embedded in quest responses |
| `events` | Events | `/api/events` |
| `age_groups` | Age Groups | `/api/age-groups` |
| `props` | Props | `/api/props` |
| `content_policy_rules` | (Internal) | Not exposed via API |

---

## Appendix C: Event Types Reference

| Event Type | Triggered When | Telemetry Fields |
|------------|----------------|------------------|
| `quest_generated` | AI generates quest | age_group_id, duration_minutes, location, energy_level, prop_ids |
| `quest_started` | User starts quest | quest_id, preset_used (if applicable) |
| `quest_saved` | User saves quest for later | quest_id |
| `quest_completed` | User marks quest complete | quest_id |
| `quest_created_manual` | User creates manual quest | quest_id, age_group_id, duration_minutes, location, energy_level |
| `auth_signup` | User registers | - |
| `auth_login` | User logs in | - |
| `preset_used` | User selects preset | preset_name, parameters |
| `favorite_toggled` | User toggles favorite | quest_id, is_favorite |
| `delete_quest` | User deletes quest | quest_id |
| `error_generation` | AI generation fails | error_code, parameters |

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-11  
**Status**: Ready for Implementation

