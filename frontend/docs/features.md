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

## Auth (`/connexion`, `/inscription`)

Login and registration. Reactive forms (`ReactiveFormsModule`), validated client-side (required fields, email format, 8-char minimum password) as a UX nicety — the backend re-validates everything regardless. On success, both redirect to `/`; on failure, the backend's error message(s) are shown inline (see `extractApiErrors` in `core/utils`).

Not built yet: forgot/reset password pages (the backend endpoints already exist — `POST /auth/forgot-password`, `POST /auth/reset-password`).

API: `POST /api/auth/login`, `POST /api/auth/register`

---

## Catalog (`/formations`)

Browse all available permit types.

- Card grid showing each permit (name, short description, price, type: theory/practical)
- Filter by permit category (coastal, offshore, inland)
- Detail page (`/formations/:slug`) with full description, what's included, and pricing

API: `GET /api/permits`, `GET /api/permits/{id}`

---

## Booking (`/reserver`)

Book a theory or practical session. Requires login.

- Filter sessions by permit type, session type (theory/practical), and date
- Session list with instructor name, date/time, available spots
- Select a session → confirm booking
- Confirmation screen + email sent automatically

API: `GET /api/sessions`, `POST /api/bookings`

---

## Dashboard (`/mon-espace`)

Personal space for logged-in students.

- Upcoming bookings (with cancel option)
- Booking history
- Account info (name, email)

API: `GET /api/bookings/me`, `DELETE /api/bookings/{id}`

---

## Instructor portal (`/instructeur`)

Only accessible to users with the `instructor` role.

- View assigned upcoming sessions
- Set availability (calendar picker)

API: `GET /api/sessions`, `PUT /api/instructors/{id}/availability`

---

## Admin back-office (`/admin`)

Only accessible to users with the `admin` role.

- **Sessions** — create, edit, delete sessions; assign instructor
- **Bookings** — view all bookings, confirm pending ones
- **Exam dates** — add / remove upcoming exam dates
- **Permits** — manage the permit catalog (name, description, price)
- **Messages** — view contact form submissions

API: all admin-scoped endpoints in `/api/*`

---

## Shared components

Built:

| Component | Description |
|---|---|
| `Header` | Sticky site header — brand, and login/register links or the current user's name + logout, depending on auth state |
| `Footer` | Minimal — site name and location |
| `LoadingBar` | Slim animated bar at the top of the page while any HTTP request is in flight |

Planned, not built yet:

| Component | Description |
|---|---|
| `SessionCard` | Displays a single session (date, instructor, type, spots left) |
| `PermitCard` | Displays a permit summary (name, price, type badges) |
| `BookingStatusBadge` | Color-coded badge: pending / confirmed / cancelled |
| `ConfirmDialog` | Generic modal for confirm/cancel actions |
| `EmptyState` | Shown when a list is empty |

---

> This file is updated each time a feature or shared component is added or significantly changed.
