# Backend — API Reference

Base URL (local): `http://localhost:5258/api`
Base URL (production): `https://api.bateauecoledelaloire.fr/api`

All endpoints return JSON. Every endpoint requires authentication by default (deny-by-default); endpoints marked "No" below are explicitly `[AllowAnonymous]`.

Auth works via `httpOnly` cookies, not an `Authorization` header — the browser sends `access_token` automatically, JS never touches it. Any endpoint that isn't `[AllowAnonymous]` needs a valid `access_token` cookie, obtained via login/register and renewed via `/auth/refresh`.

---

## Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/auth/csrf` | No | Issues the `XSRF-TOKEN` cookie; call once before any state-changing request |
| GET | `/auth/me` | Yes | Current user's profile — used by the frontend to restore session state on page load |
| POST | `/auth/register` | No | Register a new student account, sets auth cookies |
| POST | `/auth/login` | No | Login, sets `access_token` + `refresh_token` cookies (rate-limited: 5/min/IP) |
| POST | `/auth/refresh` | No | Rotates the refresh token, issues a new `access_token` |
| POST | `/auth/logout` | No | Revokes the refresh token and clears both cookies |
| POST | `/auth/forgot-password` | No | Logs a password reset token (rate-limited: 5/min/IP). No email sending yet — see `backend/docs/security.md` |
| POST | `/auth/reset-password` | No | Consumes the token from `/forgot-password` to set a new password |

---

## Users

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| DELETE | `/users/{id}` | Admin | Soft delete — sets `is_active = false`, row is kept |

---

## Permits

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/permits` | No | List all permit types |
| GET | `/permits/{id}` | No | Get a single permit with details and pricing |
| POST | `/permits` | Admin | Create a permit |
| PUT | `/permits/{id}` | Admin | Update a permit |
| DELETE | `/permits/{id}` | Admin | Delete a permit — rejected with `400` if any session still references it |

---

## Sessions

Sessions are bookable slots — either theory (classroom) or practical (on the water).

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/sessions` | No | List upcoming sessions (filterable by type, permit, date, instructor) |
| GET | `/sessions/{id}` | No | Get session details |
| POST | `/sessions` | Admin | Create a session — `400` if `permitId`/`instructorId` don't match a real row |
| PUT | `/sessions/{id}` | Admin | Update a session — same reference validation as create |
| DELETE | `/sessions/{id}` | Admin | Delete a session — rejected with `400` if any booking still references it |

---

## Bookings

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/bookings/me` | Student | List the current user's bookings |
| POST | `/bookings` | Student | Book a session |
| DELETE | `/bookings/{id}` | Student | Cancel a booking |
| GET | `/bookings` | Admin | List all bookings |
| PATCH | `/bookings/{id}/confirm` | Admin | Confirm a pending booking |

---

## Instructors

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/instructors` | No | List all instructors |
| GET | `/instructors/me` | Instructor | Current instructor's own profile — used by the frontend portal to learn its own instructor id, since the JWT only carries the user id |
| GET | `/instructors/{id}` | No | Get instructor profile. Upcoming sessions: use `GET /sessions?instructorId={id}` |
| POST | `/instructors` | Admin | Create an instructor account **and** profile in one call (email/password/name + bio/specialties) — there was no other way to onboard one; not in the original plan for this file but needed for the admin back-office to be usable at all |
| GET | `/instructors/{id}/availability` | No | List an instructor's upcoming availability slots (dated windows, not a recurring pattern) |
| POST | `/instructors/{id}/availability` | Instructor | Add an availability slot — `403` unless `{id}` is the caller's own instructor id. Rejected with `400` on end-before-start, a slot in the past, or an overlap with an existing slot |
| DELETE | `/instructors/{id}/availability/{slotId}` | Instructor | Remove one of the caller's own slots — same ownership check as above |

---

## Exam dates

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/exam-dates` | No | List upcoming exam dates |
| POST | `/exam-dates` | Admin | Add an exam date |
| DELETE | `/exam-dates/{id}` | Admin | Remove an exam date — hard delete, no references to protect (exam dates aren't linked to bookings/sessions) |

---

## Contact

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/contact` | No | Submit a contact message (rate-limited: 5/min/IP). No email sending yet — persisted for an admin to read, see `backend/docs/security.md` |
| GET | `/contact` | Admin | List all submitted messages, newest first |
| DELETE | `/contact/{id}` | Admin | Remove a message |

---

> This file is updated each time an endpoint is added or changed.
