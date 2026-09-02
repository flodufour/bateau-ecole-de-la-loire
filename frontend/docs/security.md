# Frontend — Security

## Token storage

The JWT access token is stored in an **`httpOnly` cookie** set by the backend — Angular never touches it directly. This is intentional: `httpOnly` cookies are invisible to JavaScript, so even if a malicious script runs on the page, it cannot steal the token.

Never store tokens in `localStorage` or `sessionStorage`.

## CSRF protection

Because the token lives in a cookie, we need protection against Cross-Site Request Forgery (CSRF) — an attack where another site tricks the browser into sending a request with your cookie.

Angular's built-in XSRF handling (`withXsrfConfiguration`, configured in `app.config.ts`'s `provideHttpClient`) handles this automatically:
- The backend sets a readable cookie named `XSRF-TOKEN` (explicitly **not** `httpOnly` — that's the one cookie that must stay JS-readable, unlike `access_token`/`refresh_token`).
- Angular reads it and adds an `X-XSRF-TOKEN` header to every mutating request (POST, PUT, PATCH, DELETE).
- The backend validates this header. A forged request from another site cannot read the cookie, so it cannot set the header.

Keep the XSRF configuration in `provideHttpClient(...)` — never remove it.

## XSS protection

Angular escapes all values bound in templates by default. This means user-provided content rendered in the UI cannot inject executable scripts.

- Never use `bypassSecurityTrustHtml`, `bypassSecurityTrustScript`, or any other `bypassSecurityTrust*` method unless absolutely necessary and explicitly reviewed.
- Never use `innerHTML` binding with untrusted content.

## Route guards

Protected pages (dashboard, booking, admin) are guarded at the router level:

- `authGuard` — redirects to `/connexion` if the user has no valid session. Built.
- A role-checking guard (redirecting away when the user's role doesn't match, e.g. a student hitting `/admin`) isn't built yet — no role-restricted route exists in the frontend so far.

**These guards are a UX convenience, not a security measure.** The real enforcement is on the backend. A user who bypasses a frontend guard will still get a `401` or `403` from the API.

## HTTP interceptors

Three, each with one job (`core/interceptors/`):
1. `credentialsInterceptor` — sets `withCredentials: true` so the browser attaches the auth cookies to cross-origin requests (the XSRF header itself is handled by Angular's built-in XSRF support, not here).
2. `loadingInterceptor` — increments/decrements `LoadingService`'s counter around each request, driving the top-of-page loading bar.
3. `authErrorInterceptor` — on any `401`, clears the local session (`AuthService.clearSession()`) so the header/guards reflect it immediately, and re-throws the error.

**Not built yet:** silently calling `/auth/refresh` and retrying the original request when a `401` hits an expired-but-refreshable session, instead of just clearing the session. Doing this correctly needs a guard against concurrent requests each triggering their own refresh call — the backend rotates (revokes) the refresh token on every use, so two simultaneous refresh attempts would have the second one fail. Today, an expired access token just logs the user out; they log back in with their still-valid refresh token cookie via `/connexion` if needed. Revisit this once it's a real friction point.

## Content Security Policy

The Caddy server sets a `Content-Security-Policy` header that restricts which scripts, styles, and resources the browser will load. This is a last line of defence against XSS. Configured in the `Caddyfile`, not in the Angular app.
