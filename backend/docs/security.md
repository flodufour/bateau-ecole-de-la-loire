# Backend — Security

## Authentication

We use **ASP.NET Core Identity** combined with **JWT tokens**.

- Identity handles everything user-related: password hashing, account storage, role management. You don't write any crypto yourself.
- On login, the API issues a signed JWT. The client sends it back on every request to prove who it is.
- The JWT is stored in an **`httpOnly` cookie**, not in localStorage. This means browser JavaScript can never read it — even if an attacker manages to inject a script into the page, they cannot steal the token.

### Token lifecycle

| Token | Expiry | Storage |
|---|---|---|
| Access token (JWT) | 30 minutes | `httpOnly` cookie (`access_token`) |
| Refresh token | 7 days | `httpOnly` cookie (`refresh_token`, scoped to `/api/auth`) |

The refresh token itself is never stored server-side — only its SHA-256 hash, in the `refresh_tokens` table. `/auth/refresh` looks up the hash, checks it isn't expired/revoked, then **rotates** it: the old row is marked revoked and a brand new refresh token is issued. This means a stolen-and-reused refresh token can only be used once before the legitimate user's next refresh invalidates it.

When the access token expires, the frontend sends the refresh token to `/auth/refresh` silently (the user sees nothing). If the refresh token is also expired or revoked, the user is redirected to login.

### CSRF protection
Because we use cookies, we need to protect against Cross-Site Request Forgery (CSRF). ASP.NET Core's built-in anti-forgery middleware handles this: the API exposes `GET /auth/csrf`, which sets a JS-readable `XSRF-TOKEN` cookie; the frontend echoes its value back in an `X-XSRF-TOKEN` header on state-changing requests. Those are Angular's `HttpClientXsrfModule` default cookie/header names, so the frontend needs zero configuration.

### Password reset
`POST /auth/forgot-password` generates a reset token via Identity's `GeneratePasswordResetTokenAsync` and **logs it to the console** instead of emailing it — there's no SMTP service wired up yet (see the `SMTP_*` vars in `.env.example`). It always responds `204`, whether or not the email is registered, so the endpoint can't be used to enumerate accounts. `POST /auth/reset-password` consumes that token via `ResetPasswordAsync`. Real email delivery will be added alongside booking notification emails, via a shared `EmailService`.

### Account deactivation
There's no hard delete for `users`. `DELETE /api/users/{id}` (Admin only) sets `is_active = false` instead — login and token refresh both check this flag and reject deactivated accounts. Rows stay in place so `bookings` and `instructors` keep a valid `user_id`, and the action is reversible by flipping the flag back (no endpoint for that yet — direct DB access only).

---

## Authorization

Three roles, applied with `[Authorize]` attributes on controllers and endpoints.

| Role | Description |
|---|---|
| `Student` | Default role after registration. Can book sessions and manage own bookings. |
| `Instructor` | Can view assigned sessions and manage own availability. |
| `Admin` | Full access to all resources. |

Stored as a single `role` column on `users` (not Identity's multi-role tables — a user has exactly one role here). The JWT carries it as a standard `ClaimTypes.Role` claim, so `[Authorize(Roles = "Admin")]` works normally.

**Default policy is deny.** Every endpoint requires authentication unless explicitly decorated with `[AllowAnonymous]`. Never rely on the frontend to hide protected routes — the backend enforces it independently.

---

## Rate limiting

Applied via .NET's built-in rate limiting middleware. No extra library needed.

| Endpoint | Limit | Why |
|---|---|---|
| `POST /auth/login` | 5 requests / minute / IP | Prevent brute force |

Partitioned per client IP (`AddPolicy` + `RateLimitPartition.GetFixedWindowLimiter`) — a plain `AddFixedWindowLimiter` would share one counter across every caller, letting one attacker lock out everyone else.

`/auth/register` and `/contact` aren't rate-limited yet — `/contact` doesn't exist yet, and register will get a limit when abuse patterns (or lack thereof) are better understood.

---

## Input validation

All incoming request bodies are validated via Data Annotations on DTOs. ASP.NET Core rejects invalid requests automatically before they reach any service or database layer.

Example checks:
- Email format
- Required fields
- String length limits
- Date ranges (can't book a session in the past)

---

## Data security

- **Passwords** — hashed by Identity's default `PasswordHasher` (PBKDF2 with HMAC-SHA256, not bcrypt — that's Identity's actual default, not a project choice). Never stored or logged in plain text.
- **Primary keys** — UUIDs (`Guid`), not auto-increment integers. This prevents attackers from guessing or enumerating resource IDs (`/bookings/1`, `/bookings/2`…).
- **Secrets** — DB connection string, JWT signing key, SMTP credentials are loaded from environment variables. Never hardcoded, never committed to git.
- **SQL injection** — EF Core parameterises all queries by default. Raw SQL is not used.
- **Database network** — PostgreSQL listens only on the internal Docker network. Its port is never exposed to the internet.

---

## CORS

Only the frontend's own origin is allowed (`Cors:FrontendOrigins` in `appsettings.json` — `http://localhost:4200` in dev), with `AllowCredentials()` so the browser will attach our cookies to cross-origin requests. Never `AllowAnyOrigin()` combined with `AllowCredentials()` — that combination would let any website ride a logged-in user's cookies to call the API as them. The frontend origin must be an exact match (scheme + host + port); update `Cors:FrontendOrigins` when the production frontend domain is known.

---

## HTTPS

In production, Caddy acts as the reverse proxy and handles TLS automatically via Let's Encrypt. All HTTP traffic is redirected to HTTPS. The API itself runs on plain HTTP internally (inside Docker) — Caddy terminates TLS before passing the request through.

In development, use the .NET developer certificate:
```bash
dotnet dev-certs https --trust
```
