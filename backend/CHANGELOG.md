# Backend Changelog

All notable changes to the backend are logged here.
Format: `YYYY-MM-DD HH:MM — [feat|fix|chore|refactor] Description`

---

## [0.1.0] — 2026-08-29

2026-08-29 22:00 — [chore] Initial project setup — ASP.NET Core Web API scaffolded with EF Core and PostgreSQL
2026-09-01 00:00 — [chore] Restructure into src/ (Controllers, Services, Models, DTOs, Data); drop Repository layer in favor of EF Core DbContext used directly in Services; remove demo WeatherForecast scaffold
2026-09-01 00:00 — [chore] Migrate target framework from net8.0 to net10.0
2026-09-01 00:00 — [feat] Add PostgreSQL via Docker Compose, EF Core (Npgsql + snake_case naming convention), AppDbContext, and entities for users, instructors, permits, sessions, bookings, exam_dates
2026-09-01 00:00 — [chore] Store local DB connection string in ASP.NET Core Secret Manager instead of appsettings; initial migration applied
2026-09-01 00:00 — [feat] Add GET /api/permits and GET /api/permits/{id} endpoints
2026-09-01 00:00 — [feat] Add GET /api/instructors and GET /api/instructors/{id} endpoints
2026-09-01 00:00 — [feat] Add GET /api/exam-dates and GET /api/sessions (filterable by type, permitId, date) with GET /api/sessions/{id}
2026-09-01 00:00 — [fix] Serialize enums as strings in JSON responses instead of integers
2026-09-01 00:00 — [feat] Add authentication: ASP.NET Core Identity + JWT in httpOnly cookies, refresh token rotation, CSRF protection, rate-limited /auth/login, deny-by-default authorization with [AllowAnonymous] on public catalog endpoints
2026-09-01 00:00 — [feat] Add password reset (forgot/reset-password, token logged to console pending real email sending) and soft delete for users (is_active flag, DELETE /api/users/{id} admin-only)
2026-09-01 00:00 — [test] Add BateauEcole.Api.Tests: xUnit + WebApplicationFactory + Testcontainers integration tests covering auth (register/login/refresh rotation/logout/deactivation/password reset/rate limiting), the permits/instructors/exam-dates/sessions catalog endpoints, and users soft delete; plus unit tests for TokenService
2026-09-02 00:00 — [feat] Add bookings: create/cancel/list-mine for students, list-all/confirm for admins, with session-capacity and duplicate-booking checks — with full test coverage in the same commit
2026-09-02 00:00 — [feat] Add CORS (frontend origin only, credentials allowed) and GET /api/auth/me, both needed for the Angular frontend
2026-09-02 00:00 — [fix] Update Cors:FrontendOrigins default to https://localhost:4200 (was http) — a scheme mismatch with the frontend dev server made Chrome treat every request as cross-site, silently dropping the SameSite=Strict auth cookies; found via a real browser session, not caught by curl-based testing since curl doesn't implement same-site classification
2026-09-02 00:00 — [feat] Add admin CRUD for permits, sessions, and exam-dates (POST/PUT/DELETE, [Authorize(Roles="Admin")]), plus POST /api/instructors to onboard a new instructor account+profile in one call (previously impossible via the API at all) — with full test coverage, using a JWT built directly in tests rather than /auth/login to keep the shared login rate limit out of the picture
2026-09-02 15:00 — [feat] Add instructor availability (new `availability_slots` table, explicit dated slots not a recurring pattern) via GET/POST/DELETE /api/instructors/{id}/availability, GET /api/instructors/me, and an instructorId filter on GET /api/sessions — with full test coverage
2026-09-02 16:30 — [feat] Seed the `permits` table with the school's real 8-offer catalog (extracted from the live site's Formules & tarifs page) via a data migration, so every environment starts with real data instead of an empty table
2026-09-02 17:15 — [feat] Add the contact form endpoint (new `contact_messages` table, POST/GET/DELETE /api/contact, rate-limited 5/min/IP on submission) — messages are persisted for an admin to read, no email sending yet — with full test coverage
