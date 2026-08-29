# CLAUDE.md — Bateau Ecole de la Loire

## Project overview
Full-stack web application for a boating school in Nantes. Students can browse permits, book theory and practical sessions with instructors, and track their training. Admins and instructors manage sessions, availability, and bookings.

**Stack:** Angular (frontend) · ASP.NET Core Web API (backend) · PostgreSQL · EF Core · Docker Compose
**Deployment:** Hetzner VPS · Docker Compose · Caddy (reverse proxy + auto HTTPS)

## Teaching mindset

The developer working on this project is learning while building. Every non-trivial decision must be explained.

- **Always explain why** a pattern, library, or approach was chosen — not just what it does.
- When introducing a concept for the first time (e.g. EF Core migrations, Angular signals, Docker networking), add a short plain-English explanation before the code.
- If there are two reasonable ways to do something, briefly state both and explain the tradeoff before picking one.
- Call out anything that could be a gotcha or a common mistake (e.g. "never block on `.Result` because it deadlocks in ASP.NET").
- Keep explanations concise — a short paragraph is enough. No lectures, no walls of text.
- After scaffolding a file or feature, summarize what was created and what the next step is.

## Language
- All code, comments, variable names, and commit messages must be in **English**.
- UI-facing text (labels, headings, emails) is in **French** (target audience is French speakers).

## Code style

### General
- Maintainable but not over-engineered. No abstractions before they are needed.
- Three similar lines is acceptable. Extract only when a fourth appears or the logic is genuinely reusable.
- No comments that explain *what* the code does — only *why* when it's non-obvious.
- No dead code, no commented-out blocks, no TODO left in committed code.
- Delete unused variables, imports, and files outright.

### C# / ASP.NET Core
- Use `var` when the type is obvious from the right-hand side.
- Controllers are thin: validation + service call + return result. No business logic in controllers.
- Services hold business logic. Repositories handle data access.
- Use async/await throughout. Never block with `.Result` or `.Wait()`.
- Return `IActionResult` typed results (`Ok()`, `NotFound()`, `BadRequest()`).
- Use EF Core for all DB access. No raw SQL unless there is a proven performance reason.
- DTOs for API input/output. Never expose EF entities directly on endpoints.
- Use `record` for DTOs when they are immutable.

### Angular
- Standalone components (no NgModule unless forced by a third-party lib).
- Use signals and `inject()` over constructor injection where Angular version supports it.
- Keep components dumb where possible — smart logic in services.
- No `any`. TypeScript strict mode is on.
- Use Angular reactive forms for all forms.
- HTTP calls only inside services, never in components.

### PostgreSQL / EF Core
- Table names: `snake_case` (plural). Column names: `snake_case`.
- All migrations generated via `dotnet ef migrations add`.
- Never edit a migration after it has been applied. Add a new one instead.
- Use data annotations or Fluent API consistently — pick one and stick to it (prefer Fluent API).

## File structure

```
/
├── backend/          # ASP.NET Core Web API
│   ├── src/
│   │   ├── Controllers/
│   │   ├── Services/
│   │   ├── Repositories/
│   │   ├── Models/       # EF Core entities
│   │   ├── DTOs/
│   │   └── Data/         # DbContext, migrations
│   └── CHANGELOG.md
├── frontend/         # Angular app
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/         # singleton services, guards, interceptors
│   │   │   ├── features/     # one folder per feature (booking, catalog, admin…)
│   │   │   └── shared/       # reusable components, pipes, directives
│   └── CHANGELOG.md
├── docker-compose.yml
├── README.md
└── CLAUDE.md
```

## Changelog rules
- Every merged feature or fix gets one or two lines added to the relevant `CHANGELOG.md`.
- Format: `YYYY-MM-DD HH:MM — [feat|fix|chore] Short description`
- Log in the file closest to what changed (backend or frontend). If both are affected, log in both.
- No verbose prose — one sentence max per entry.

## Git
- Commits follow Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`.
- One logical change per commit.
- Never commit secrets, `.env` files, or build artifacts.

## Running locally
See `README.md` for setup instructions.
