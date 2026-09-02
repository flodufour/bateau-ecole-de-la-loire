# Backend — Database

PostgreSQL via EF Core. All table and column names are `snake_case`.

---

## Entities and relationships

```
users ──────────── bookings ──────────── sessions
                                             │
instructors ─────────────────────────────────┘
     │                                      │
     └────────── availability_slots   permits ──┘

exam_dates  (standalone, no foreign keys)
contact_messages  (standalone, no foreign keys)
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
| `price` | numeric(8,2) | All-inclusive price (base + exam + tax stamps combined) — the breakdown lives in `description`, there's no separate fee columns |
| `includes_theory` | boolean | |
| `includes_practical` | boolean | |
| `is_bundle` | boolean | True for combination packages |

Seeded with the school's real 8-offer catalog via the `SeedPermits` migration (`AppDbContext.SeedPermits()`), so every environment starts with real data instead of an empty table. Admins can freely edit or delete these afterwards through the normal `/api/permits` CRUD — the seed is just a starting point, not a fixed reference table. Not seeded: the "Carte Cadeau" (gift card) product, since it isn't a permit and doesn't fit this table's shape (no theory/practical/pricing-by-navigation-rights) — it would need its own concept if ever built.

---

### `sessions`
A bookable slot — theory or practical, tied to a permit type and an instructor.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `permit_id` | uuid | FK → `permits.id` |
| `instructor_id` | uuid | FK → `instructors.id` |
| `type` | varchar | `Theory` or `Practical` |
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
| `status` | varchar | `Pending`, `Confirmed`, `Cancelled` |
| `booked_at` | timestamptz | |

A student can hold at most one non-`Cancelled` booking per session, and a session accepts bookings up to its `max_capacity` — both enforced in `BookingService`, not by a DB constraint.

---

### `availability_slots`
A window of time an instructor has declared themselves free — explicit dated slots (e.g. "Sept 12, 9h-12h"), not a recurring weekly pattern. Admins aren't required to only schedule sessions inside these; it's informational input for now, not an enforced constraint on `sessions`.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `instructor_id` | uuid | FK → `instructors.id`, cascade delete — a slot has no meaning once its instructor is gone |
| `starts_at` | timestamptz | |
| `ends_at` | timestamptz | |

`InstructorService` rejects a new slot that ends before it starts, starts in the past, or overlaps an existing slot for the same instructor — enforced in the service, not a DB constraint (same approach as the booking capacity/duplicate checks on `bookings`).

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

### `contact_messages`
Submissions from the public contact form. No email sending yet (see `backend/docs/security.md`), so a message is only ever readable by an admin through `GET /api/contact` — there's no other notification.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `name` | varchar | |
| `email` | varchar | |
| `phone` | varchar? | Optional |
| `message` | text | |
| `created_at` | timestamptz | |

---

## Migrations

Generated with:
```bash
dotnet ef migrations add <MigrationName> --project src
dotnet ef database update --project src
```

Never edit a migration after it has been applied. Add a new migration instead.

**Gotcha:** a C# property initializer (`public bool IsActive { get; set; } = true;`) is not read as a column default — EF Core generates `DEFAULT FALSE` for a plain `bool` unless you also add `.HasDefaultValue(true)` in `OnModelCreating`. Always check a generated migration's `defaultValue` before applying it.
