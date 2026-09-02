# Frontend — Features

Each feature is a lazy-loaded route group. This file describes what each feature does and which API endpoints it uses.

---

## Home (`/`)

Currently a minimal placeholder (hero heading + tagline). The full version below is planned but not built yet.

Landing page for the school.

- Hero section with a call-to-action
- Quick overview of the permit types offered
- Testimonials or key selling points
- Link to the permits catalog and the booking flow

API: none (static content, or optionally fetches featured permits from `/api/permits`)

---

## Auth (`/connexion`, `/inscription`, `/mot-de-passe-oublie`, `/reinitialiser-mot-de-passe`)

Login and registration. Reactive forms (`ReactiveFormsModule`), validated client-side (required fields, email format, 8-char minimum password) as a UX nicety — the backend re-validates everything regardless. On success, both redirect to `/`; on failure, the backend's error message(s) are shown inline (see `extractApiErrors` in `core/utils`).

`/mot-de-passe-oublie` always shows the same "check your email" message on completion, success or failure alike — matches the backend's anti-enumeration design on that endpoint. `/reinitialiser-mot-de-passe` reads `email`/`token` from the URL's query params (that's what a real reset link would carry); since there's no real email sending yet, get the token from the backend console log (`AuthService.ForgotPasswordAsync` logs it) and build the link by hand: `/reinitialiser-mot-de-passe?email=...&token=...`.

API: `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`

---

## Contact (`/contact`)

Public page: the school's address/hours/email/phone (static text) next to a contact form (name, email, phone optional, message — `Validators.minLength(10)` on the message client-side, real validation happens on the backend regardless). On success, the form is replaced by a confirmation message (same "swap the form for a message" pattern as `/mot-de-passe-oublie`, except this one only shows on actual success — the backend endpoint can genuinely fail, e.g. rate-limited, so failures are shown inline via `extractApiErrors` and the form stays up to retry).

No email is sent anywhere yet — the message is just persisted; an admin reads it in the back-office (`/admin/messages`).

API: `POST /api/contact`

---

## Catalog (`/formations`)

Browse all available permit types. Built: list page (card grid) and detail page.

- List: a short static explainer ("Les 3 permis, en bref" — Côtier, Hauturier, Fluvial, what each requires and how the théorie/pratique process works) above the card grid, then one `PermitCard` per permit (name, truncated description, price, Théorie/Pratique/Pack badges). The explainer is static content, not derived from the API — it describes the 3 base permit *types*, while the grid below lists the school's actual sellable *offers* (base permits, code-seul variants, bundles). Empty and error states are handled explicitly, not just a blank page.
- Detail (`/formations/:id`) — full description, price, badges. Route uses the permit's `id` (a GUID), not its `slug` — the backend only exposes `GET /api/permits/{id}` today, no slug-based lookup. Nicer URLs (`/formations/permis-cotier`) would need a `GET /api/permits/by-slug/{slug}`-style endpoint added first.

Not built yet: filtering by permit category.

API: `GET /api/permits`, `GET /api/permits/{id}`

---

## Booking (`/reserver`)

Book a theory or practical session. Requires login (`authGuard`) — not requires-Student specifically, since no role guard exists yet; an instructor/admin visiting the page would hit the backend's `[Authorize(Roles = "Student")]` and get a `403` from `POST /bookings` if they tried to book.

- Filters (type, permit, date) re-fetch the session list on every change (`filters.valueChanges`) — no separate "apply" button.
- `SessionCard` (dumb component) renders one session and emits `book` with the session id; the page owns the actual `BookingService.create()` call and the resulting success/error message.
- Capacity isn't shown as "N places restantes" — `GET /api/sessions` doesn't return a current booking count, only `maxCapacity`. A full session just fails on booking attempt with the backend's "Cette séance est complète." message. Showing remaining spots directly would need the sessions endpoint to also return a count.
- A successful booking re-fetches the session list (in case it's now full) and shows a success banner.

Not built yet: a confirmation *screen* (booking happens inline, feedback is a banner not a separate step) — matches what actually exists rather than the originally-planned "confirmation screen"; email confirmation (no email sending exists at all yet, see `backend/docs/security.md`).

API: `GET /api/sessions`, `POST /api/bookings`, `GET /api/permits` (to populate the permit filter)

---

## Dashboard (`/mon-espace`)

Personal space for logged-in students. Requires login (`authGuard`).

- Lists the caller's bookings (`GET /bookings/me` — the backend already scopes this to the authenticated user, no client-side filtering needed) with a `BookingStatusBadge` each.
- "Annuler" is hidden once a booking is already `Cancelled`; cancelling updates that one booking's status in place (no full refetch) for a snappier UI.
- Empty state links to `/reserver`.

Not built yet: booking history as a separate view (cancelled bookings just stay in the same list, badge shows the state), account info section (name/email — already visible in the header when logged in).

API: `GET /api/bookings/me`, `DELETE /api/bookings/{id}`

---

## Instructor portal (`/instructeur`)

Only accessible to users with the `Instructor` role, enforced by `roleGuard('Instructor')`. `InstructorPortal` first calls `GET /api/instructors/me` to learn its own instructor id (the JWT only carries the user id), then loads both sections in parallel.

- **Mes séances à venir** — read-only list, `GET /api/sessions?instructorId={id}` (the same public endpoint the booking page uses, just filtered). No cards/actions, just what's assigned.
- **Mes disponibilités** — availability is modelled as explicit dated slots (start/end datetime), not a recurring weekly pattern. A form (two `datetime-local` inputs) adds a slot; a table below lists upcoming slots with a "Supprimer" action. Backend validation errors (end before start, a slot in the past, an overlap with an existing slot) are surfaced inline via `extractApiErrors`, same pattern as every other admin-style form.

Not built yet: a calendar-style picker (the form is two plain datetime inputs); admins don't see or use this availability when creating sessions yet — it's informational only for now.

API: `GET /api/instructors/me`, `GET /api/sessions?instructorId=`, `GET/POST /api/instructors/{id}/availability`, `DELETE /api/instructors/{id}/availability/{slotId}`

---

## Admin back-office (`/admin`)

Only accessible to users with the `Admin` role, enforced by `roleGuard('Admin')` (see `frontend/docs/security.md`). The `Header` only shows the "Admin" link for that role, but the guard is what actually blocks direct navigation — never rely on the link being hidden.

`AdminLayout` is a lazy-loaded shell with a tab-style nav and a `<router-outlet>` for six child routes, each its own lazy-loaded standalone component. Most sections follow the same pattern: a create/edit form (`ReactiveFormsModule`) above a table, backend validation errors surfaced inline via `extractApiErrors`.

- **Permits** (`/admin/permis`) — full CRUD. Editing populates the form (`editingId` signal toggles create vs. update); delete is rejected by the backend (shown inline) if the permit still has sessions.
- **Sessions** (`/admin/seances`) — full CRUD. Form has `<select>`s for permit and instructor (fetched on init alongside the sessions list); `startsAt` uses a `datetime-local` input, converted to/from ISO 8601 at the form boundary. Delete is rejected if the session has bookings.
- **Exam dates** (`/admin/dates-examen`) — create and delete only; the backend has no update endpoint for exam dates.
- **Instructors** (`/admin/moniteurs`) — create only; the backend has no update or delete endpoint for instructors. Creating one calls `POST /api/instructors`, which creates both the `User` (role `Instructor`) and the `Instructor` row — this is also the only way to onboard an instructor account today, there's no separate "invite instructor" flow. The `specialties` field is a single comma-separated text input, split/trimmed client-side into a `string[]` before the request.
- **Bookings** (`/admin/reservations`) — lists every booking across all students (reuses `BookingStatusBadge`); a "Confirmer" button appears only on `Pending` rows and updates that row's status in place, matching the Dashboard's cancel-in-place pattern.
- **Messages** (`/admin/messages`) — list and delete only, no form (admins don't create messages). Shows every submission from the public `/contact` form, newest first; deleting removes it in place client-side without a full refetch.

API: `POST/PUT/DELETE /api/permits`, `POST/PUT/DELETE /api/sessions`, `POST/DELETE /api/exam-dates`, `POST /api/instructors`, `GET /api/bookings`, `PATCH /api/bookings/{id}/confirm`, `GET/DELETE /api/contact`

---

## Shared components

Built:

| Component | Description |
|---|---|
| `Header` | Sticky site header — brand, nav, and login/register links or the current user's name + logout, depending on auth state. Shows an "Admin" nav link only when `currentUser().role === 'Admin'` |
| `Footer` | Minimal — site name and location |
| `LoadingBar` | Slim animated bar at the top of the page while any HTTP request is in flight |
| `PermitCard` | Displays a permit summary (name, price, type badges), links to its detail page |
| `SessionCard` | Displays a single session (date, instructor, type, location, capacity — not spots *left*, see the Booking section above); emits `book` rather than calling `BookingService` itself |
| `BookingStatusBadge` | Colour-coded badge: `Pending` (neutral) / `Confirmed` (green) / `Cancelled` (red), French labels |

Planned, not built yet:

| Component | Description |
|---|---|
| `ConfirmDialog` | Generic modal for confirm/cancel actions — cancelling a booking today is immediate, no "are you sure?" step |

`EmptyState` — not a separate component; each list page (`CatalogList` today) handles its own empty/error states inline via signals, since there's only one so far and it isn't complex enough to justify extracting one yet.

---

> This file is updated each time a feature or shared component is added or significantly changed.
