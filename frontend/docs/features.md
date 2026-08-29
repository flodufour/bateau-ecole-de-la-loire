# Frontend — Features

Each feature is a lazy-loaded route group. This file describes what each feature does and which API endpoints it uses.

---

## Home (`/`)

Landing page for the school.

- Hero section with a call-to-action
- Quick overview of the permit types offered
- Testimonials or key selling points
- Link to the permits catalog and the booking flow

API: none (static content, or optionally fetches featured permits from `/api/permits`)

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

| Component | Description |
|---|---|
| `SessionCard` | Displays a single session (date, instructor, type, spots left) |
| `PermitCard` | Displays a permit summary (name, price, type badges) |
| `BookingStatusBadge` | Color-coded badge: pending / confirmed / cancelled |
| `ConfirmDialog` | Generic modal for confirm/cancel actions |
| `LoadingSpinner` | Shown during API calls |
| `EmptyState` | Shown when a list is empty |

---

> This file is updated each time a feature or shared component is added or significantly changed.
