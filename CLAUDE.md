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

## Security

### Authentication
- Use **ASP.NET Core Identity** for user management (password hashing, roles, token generation).
- Issue **JWT tokens** stored in **`httpOnly` cookies** — never in `localStorage`.
  - `httpOnly` = JavaScript cannot read the token → immune to XSS theft.
  - Use ASP.NET Core's built-in anti-forgery (CSRF) protection to cover the cookie approach.
- JWT must have a short expiry (15–60 min). Use a refresh token (stored in a separate `httpOnly` cookie) to renew silently.
- Never log tokens, passwords, or sensitive user data.

### Authorization
- Three roles: `student`, `instructor`, `admin`.
- Protect endpoints with `[Authorize(Roles = "admin")]` etc. — never rely on frontend-only guards.
- Default to deny: every endpoint is protected unless explicitly marked `[AllowAnonymous]`.

### API protection
- **Rate limiting** — use .NET 8 built-in rate limiting middleware. Apply strict limits on `/auth/login` and `/contact` to prevent brute force and spam.
- **CORS** — whitelist only the frontend origin. Reject all other origins.
- **HTTPS** — enforced by Caddy in production. In development, use `dotnet dev-certs`.
- **Input validation** — validate all incoming DTOs with Data Annotations. Reject invalid requests at the controller boundary before they reach the service layer.
- **No raw SQL** — EF Core parameterises all queries, preventing SQL injection. Raw SQL is forbidden unless there is a documented performance justification.

### Data security
- Passwords hashed by ASP.NET Core Identity (bcrypt). Never store or log plain-text passwords.
- Use UUIDs (`Guid`) as primary keys — not auto-increment integers (harder to enumerate).
- All secrets (DB connection string, JWT secret, SMTP credentials) live in `.env` or environment variables. Never hardcode or commit them.
- The PostgreSQL port is never exposed publicly — only accessible inside the Docker network.

### Frontend security
- Angular's `HttpClient` sanitises values by default — do not bypass with `bypassSecurityTrust*` unless strictly necessary and reviewed.
- Never store the JWT in `localStorage` or `sessionStorage`.
- The CSRF token is handled automatically by the Angular `HttpClientXsrfModule` — keep it enabled.

## Documentation

Both `backend/docs/` and `frontend/docs/` must stay in sync with the code.

| File | Update when |
|---|---|
| `backend/docs/architecture.md` | A new layer, pattern, or cross-cutting concern is introduced |
| `backend/docs/api.md` | An endpoint is added, changed, or removed |
| `backend/docs/database.md` | A table or column is added, changed, or removed |
| `frontend/docs/architecture.md` | The folder structure, routing, or a core pattern changes |
| `frontend/docs/features.md` | A feature or shared component is added or significantly changed |

Rules:
- Keep it light — short paragraphs, bullet lists, small tables. No walls of text.
- Explain *what* a thing does and *why* it exists, not how the code works line by line.
- Every new concept introduced in the code gets a one-sentence explanation in the relevant doc.
- Doc updates are part of the same commit as the code change — never a separate "fix docs" commit after the fact.

## Changelog rules
- Every merged feature or fix gets one or two lines added to the relevant `CHANGELOG.md`.
- Format: `YYYY-MM-DD HH:MM — [feat|fix|chore] Short description`
- Log in the file closest to what changed (backend or frontend). If both are affected, log in both.
- No verbose prose — one sentence max per entry.

## Git workflow

### Branches
Every piece of work lives on its own branch, created from `main`.

Naming convention: `<type>/<scope>-<short-description>`

| Type | When to use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `chore` | Tooling, config, dependencies |
| `refactor` | Code restructure with no behavior change |
| `docs` | Documentation only |
| `release` | Version bump and release prep |

Examples:
- `feat/backend-booking-system`
- `feat/frontend-session-calendar`
- `fix/backend-booking-conflict`
- `chore/docker-compose-setup`
- `release/backend-v0.2.0`

### Commit messages
Follow Conventional Commits: `<type>(<scope>): <short description>`

- `feat(booking): add session conflict detection`
- `fix(auth): handle expired JWT on refresh`
- `chore(deps): upgrade EF Core to 8.0.4`
- `docs(readme): update local setup steps`

One logical change per commit. Never mix refactor + feature in the same commit.

### Merge process (rebase for clean history)
1. Work on your branch with regular commits.
2. Before merging, rebase on `main` to get a linear history:
   ```bash
   git fetch origin
   git rebase origin/main
   ```
3. Resolve any conflicts, then merge into `main` with fast-forward:
   ```bash
   git checkout main
   git merge --ff-only feat/your-branch
   git push origin main
   ```
4. Delete the branch after merging:
   ```bash
   git branch -d feat/your-branch
   git push origin --delete feat/your-branch
   ```

> **Why rebase instead of merge commits?** Merge commits create a tangled graph. Rebase replays your commits on top of `main` so the history stays a straight line — easy to read with `git log --oneline`.

### Never commit
- `.env` files or any file containing secrets
- Build artifacts (`bin/`, `obj/`, `dist/`, `node_modules/`)
- IDE-specific files not already in `.gitignore`

## Versioning

Both backend and frontend are versioned independently using **Semantic Versioning** (`MAJOR.MINOR.PATCH`):
- `MAJOR` — breaking change (rare)
- `MINOR` — new feature, backwards-compatible
- `PATCH` — bug fix

| Project | Version source |
|---|---|
| Backend | `<Version>` field in `backend/src/*.csproj` |
| Frontend | `"version"` field in `frontend/package.json` |

Both start at `0.1.0`. Version `1.0.0` marks the first production-ready release.

### Releasing a version
1. Create a `release/backend-vX.Y.Z` or `release/frontend-vX.Y.Z` branch.
2. Bump the version in the relevant file.
3. Update the corresponding `CHANGELOG.md` with a version header.
4. Rebase and merge into `main`.
5. Tag the commit:
   ```bash
   git tag backend-v0.2.0   # or frontend-v0.2.0
   git push origin --tags
   ```

### Changelog version format
When releasing, add a version header above the entries for that version:

```
## [0.2.0] — 2026-09-15

2026-09-15 14:30 — [feat] Session booking endpoint with conflict detection
2026-09-15 09:00 — [fix] Instructor availability query returning stale data
```

## Running locally
See `README.md` for setup instructions.
