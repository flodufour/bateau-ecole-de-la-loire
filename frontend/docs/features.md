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

## Catalog (`/formations`)

Browse all available permit types. Built: list page (card grid) and detail page.

- List: card grid, one `PermitCard` per permit (name, truncated description, price, Théorie/Pratique/Pack badges). Empty and error states are handled explicitly, not just a blank page.
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

Not built. Blocked on the backend: `PUT /api/instructors/{id}/availability` doesn't exist yet (no availability concept in the DB at all today — `instructors` has no schedule table). Frontend-only work here would just be a page with nothing real to call.

Only accessible to users with the `instructor` role.

- View assigned upcoming sessions
- Set availability (calendar picker)

API: `GET /api/sessions`, `PUT /api/instructors/{id}/availability` (not built)

---

## Admin back-office (`/admin`)

Only accessible to users with the `Admin` role, enforced by `roleGuard('Admin')` (see `frontend/docs/security.md`). The `Header` only shows the "Admin" link for that role, but the guard is what actually blocks direct navigation — never rely on the link being hidden.

`AdminLayout` is a lazy-loaded shell with a tab-style nav and a `<router-outlet>` for five child routes, each its own lazy-loaded standalone component. Every section follows the same pattern: a create/edit form (`ReactiveFormsModule`) above a table, backend validation errors surfaced inline via `extractApiErrors`.

- **Permits** (`/admin/permis`) — full CRUD. Editing populates the form (`editingId` signal toggles create vs. update); delete is rejected by the backend (shown inline) if the permit still has sessions.
- **Sessions** (`/admin/seances`) — full CRUD. Form has `<select>`s for permit and instructor (fetched on init alongside the sessions list); `startsAt` uses a `datetime-local` input, converted to/from ISO 8601 at the form boundary. Delete is rejected if the session has bookings.
- **Exam dates** (`/admin/dates-examen`) — create and delete only; the backend has no update endpoint for exam dates.
- **Instructors** (`/admin/moniteurs`) — create only; the backend has no update or delete endpoint for instructors. Creating one calls `POST /api/instructors`, which creates both the `User` (role `Instructor`) and the `Instructor` row — this is also the only way to onboard an instructor account today, there's no separate "invite instructor" flow. The `specialties` field is a single comma-separated text input, split/trimmed client-side into a `string[]` before the request.
- **Bookings** (`/admin/reservations`) — lists every booking across all students (reuses `BookingStatusBadge`); a "Confirmer" button appears only on `Pending` rows and updates that row's status in place, matching the Dashboard's cancel-in-place pattern.

Not built: a "Messages" section for contact-form submissions — no `/contact` endpoint exists yet.

API: `POST/PUT/DELETE /api/permits`, `POST/PUT/DELETE /api/sessions`, `POST/DELETE /api/exam-dates`, `POST /api/instructors`, `GET /api/bookings`, `PATCH /api/bookings/{id}/confirm`

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
