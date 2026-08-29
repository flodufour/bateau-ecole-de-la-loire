# Backend — Security

## Authentication

We use **ASP.NET Core Identity** combined with **JWT tokens**.

- Identity handles everything user-related: password hashing, account storage, role management. You don't write any crypto yourself.
- On login, the API issues a signed JWT. The client sends it back on every request to prove who it is.
- The JWT is stored in an **`httpOnly` cookie**, not in localStorage. This means browser JavaScript can never read it — even if an attacker manages to inject a script into the page, they cannot steal the token.

### Token lifecycle

| Token | Expiry | Storage |
|---|---|---|
| Access token (JWT) | 60 minutes | `httpOnly` cookie |
| Refresh token | 7 days | `httpOnly` cookie (separate) |

When the access token expires, the frontend sends the refresh token to `/auth/refresh` silently (the user sees nothing). If the refresh token is also expired or revoked, the user is redirected to login.

### CSRF protection
Because we use cookies, we need to protect against Cross-Site Request Forgery (CSRF). ASP.NET Core's built-in anti-forgery middleware handles this. The frontend Angular app sends the CSRF token automatically via `HttpClientXsrfModule`.

---

## Authorization

Three roles, applied with `[Authorize]` attributes on controllers and endpoints.

| Role | Description |
|---|---|
| `student` | Default role after registration. Can book sessions and manage own bookings. |
| `instructor` | Can view assigned sessions and manage own availability. |
| `admin` | Full access to all resources. |

**Default policy is deny.** Every endpoint requires authentication unless explicitly decorated with `[AllowAnonymous]`. Never rely on the frontend to hide protected routes — the backend enforces it independently.

---

## Rate limiting

Applied via .NET 8 built-in rate limiting middleware. No extra library needed.

| Endpoint | Limit | Why |
|---|---|---|
| `POST /auth/login` | 5 requests / minute / IP | Prevent brute force |
| `POST /auth/register` | 3 requests / minute / IP | Prevent account spam |
| `POST /contact` | 2 requests / minute / IP | Prevent spam |
| All others | 60 requests / minute / IP | General protection |

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

- **Passwords** — hashed by Identity using bcrypt. Never stored or logged in plain text.
- **Primary keys** — UUIDs (`Guid`), not auto-increment integers. This prevents attackers from guessing or enumerating resource IDs (`/bookings/1`, `/bookings/2`…).
- **Secrets** — DB connection string, JWT signing key, SMTP credentials are loaded from environment variables. Never hardcoded, never committed to git.
- **SQL injection** — EF Core parameterises all queries by default. Raw SQL is not used.
- **Database network** — PostgreSQL listens only on the internal Docker network. Its port is never exposed to the internet.

---

## HTTPS

In production, Caddy acts as the reverse proxy and handles TLS automatically via Let's Encrypt. All HTTP traffic is redirected to HTTPS. The API itself runs on plain HTTP internally (inside Docker) — Caddy terminates TLS before passing the request through.

In development, use the .NET developer certificate:
```bash
dotnet dev-certs https --trust
```
