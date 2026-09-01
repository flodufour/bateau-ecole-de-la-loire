# Backend — Database

PostgreSQL via EF Core. All table and column names are `snake_case`.

---

## Entities and relationships

```
users ──────────── bookings ──────────── sessions
                                             │
instructors ─────────────────────────────────┘
                                             │
permits ──────────────────────────────────── ┘

exam_dates  (standalone, no foreign keys)
```

---

## Tables

### `users`
Registered students, instructors, and admins. Backed by **ASP.NET Core Identity** (`IdentityUserContext<User, Guid>`), so it carries Identity's standard columns (`normalized_email`, `security_stamp`, `lockout_end`, etc.) alongside our own. We don't use Identity's role tables — a user has exactly one role, stored directly on this row.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `email` / `normalized_email` | varchar | Unique index on `normalized_email`, used for login |
| `password_hash` | varchar | Hashed by Identity's `PasswordHasher`, never plain text |
| `first_name` | varchar | |
| `last_name` | varchar | |
| `role` | varchar | `Student`, `Instructor`, `Admin` |
| `created_at` | timestamptz | |
| `is_active` | boolean | Default `true`. Soft-delete flag — set `false` by `DELETE /api/users/{id}` instead of removing the row, so `bookings`/`instructors` keep a valid `user_id`. Login is rejected when `false`. |
| *(+ Identity columns)* | — | `user_name`, `security_stamp`, `lockout_enabled`, `access_failed_count`, etc. — managed by Identity, not read directly by app code |

Three related tables also come from Identity and stay empty unless those features are used: `user_claims`, `user_logins`, `user_tokens`.

---

### `refresh_tokens`
One row per issued refresh token, so a token can be revoked (logout, rotation) without needing to blacklist JWTs.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK → `users.id`, cascade delete |
| `token_hash` | varchar | SHA-256 hash of the token — the raw value is never stored |
| `expires_at` | timestamptz | |
| `created_at` | timestamptz | |
| `revoked_at` | timestamptz? | Set on logout or when rotated by `/auth/refresh` |

---

### `instructors`
Instructor profiles. Linked to a `users` row (every instructor also has a user account).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK → `users.id` |
| `bio` | text | Short description shown on the site |
| `photo_url` | varchar | |
| `specialties` | varchar[] | e.g. `["cotier", "hauturier"]` |

---

### `permits`
The permit types the school offers (Côtier, Hauturier, Fluvial, bundles…).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `name` | varchar | e.g. `Permis Côtier` |
| `slug` | varchar | URL-friendly, unique |
| `description` | text | |
| `price` | numeric(8,2) | |
| `includes_theory` | boolean | |
| `includes_practical` | boolean | |
| `is_bundle` | boolean | True for combination packages |

---

### `sessions`
A bookable slot — theory or practical, tied to a permit type and an instructor.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `permit_id` | uuid | FK → `permits.id` |
| `instructor_id` | uuid | FK → `instructors.id` |
| `type` | varchar | `theory` or `practical` |
| `starts_at` | timestamptz | |
| `duration_minutes` | int | |
| `max_capacity` | int | |
| `location` | varchar | Address or "En ligne" |

---

### `bookings`
Links a student to a session.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK → `users.id` |
| `session_id` | uuid | FK → `sessions.id` |
| `status` | varchar | `pending`, `confirmed`, `cancelled` |
| `booked_at` | timestamptz | |

---

### `exam_dates`
Upcoming official exam dates, managed by admin.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `permit_type` | varchar | e.g. `cotier`, `fluvial` |
| `date` | date | |
| `location` | varchar | |
| `notes` | text | Optional extra info |

---

## Migrations

Generated with:
```bash
dotnet ef migrations add <MigrationName> --project src
dotnet ef database update --project src
```

Never edit a migration after it has been applied. Add a new migration instead.

**Gotcha:** a C# property initializer (`public bool IsActive { get; set; } = true;`) is not read as a column default — EF Core generates `DEFAULT FALSE` for a plain `bool` unless you also add `.HasDefaultValue(true)` in `OnModelCreating`. Always check a generated migration's `defaultValue` before applying it.
