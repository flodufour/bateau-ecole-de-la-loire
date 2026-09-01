# Backend — API Reference

Base URL (local): `http://localhost:5258/api`
Base URL (production): `https://api.bateauecoledelaloire.fr/api`

All endpoints return JSON. Protected endpoints require `Authorization: Bearer <token>`.

---

## Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Register a new student account |
| POST | `/auth/login` | No | Login, returns JWT token |
| POST | `/auth/refresh` | No | Refresh an expired JWT |

---

## Permits

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/permits` | No | List all permit types |
| GET | `/permits/{id}` | No | Get a single permit with details and pricing |
| POST | `/permits` | Admin | Create a permit |
| PUT | `/permits/{id}` | Admin | Update a permit |
| DELETE | `/permits/{id}` | Admin | Delete a permit |

---

## Sessions

Sessions are bookable slots — either theory (classroom) or practical (on the water).

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/sessions` | No | List upcoming sessions (filterable by type, permit, date) |
| GET | `/sessions/{id}` | No | Get session details |
| POST | `/sessions` | Admin | Create a session |
| PUT | `/sessions/{id}` | Admin | Update a session |
| DELETE | `/sessions/{id}` | Admin | Delete a session |

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
| GET | `/instructors/{id}` | No | Get instructor profile and upcoming sessions |
| PUT | `/instructors/{id}/availability` | Instructor | Update availability calendar |

---

## Exam dates

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/exam-dates` | No | List upcoming exam dates |
| POST | `/exam-dates` | Admin | Add an exam date |
| DELETE | `/exam-dates/{id}` | Admin | Remove an exam date |

---

## Contact

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/contact` | No | Send a contact message (triggers email to school) |

---

> This file is updated each time an endpoint is added or changed.
