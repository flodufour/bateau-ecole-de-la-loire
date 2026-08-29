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
Registered students (and admins).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `email` | varchar | Unique, used for login |
| `password_hash` | varchar | Bcrypt hash, never plain text |
| `first_name` | varchar | |
| `last_name` | varchar | |
| `role` | varchar | `student`, `instructor`, `admin` |
| `created_at` | timestamptz | |

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
