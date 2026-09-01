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
