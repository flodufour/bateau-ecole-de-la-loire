# Frontend — Security

## Token storage

The JWT access token is stored in an **`httpOnly` cookie** set by the backend — Angular never touches it directly. This is intentional: `httpOnly` cookies are invisible to JavaScript, so even if a malicious script runs on the page, it cannot steal the token.

Never store tokens in `localStorage` or `sessionStorage`.

## CSRF protection

Because the token lives in a cookie, we need protection against Cross-Site Request Forgery (CSRF) — an attack where another site tricks the browser into sending a request with your cookie.

Angular's `HttpClientXsrfModule` handles this automatically:
- The backend sets a readable cookie named `XSRF-TOKEN`.
- Angular reads it and adds an `X-XSRF-TOKEN` header to every mutating request (POST, PUT, PATCH, DELETE).
- The backend validates this header. A forged request from another site cannot read the cookie, so it cannot set the header.

Keep `HttpClientXsrfModule` enabled in the app config — never disable it.

## XSS protection

Angular escapes all values bound in templates by default. This means user-provided content rendered in the UI cannot inject executable scripts.

- Never use `bypassSecurityTrustHtml`, `bypassSecurityTrustScript`, or any other `bypassSecurityTrust*` method unless absolutely necessary and explicitly reviewed.
- Never use `innerHTML` binding with untrusted content.

## Route guards

Protected pages (dashboard, booking, admin) are guarded at the router level:

- `AuthGuard` — redirects to login if the user has no valid session.
- `RoleGuard` — redirects to home if the user's role does not match (e.g. a student trying to access `/admin`).

**These guards are a UX convenience, not a security measure.** The real enforcement is on the backend. A user who bypasses a frontend guard will still get a `401` or `403` from the API.

## HTTP interceptor

A single interceptor handles two things:
1. Attaches any required headers to outgoing requests (CSRF token is handled by `HttpClientXsrfModule`, not here).
2. Catches `401 Unauthorized` responses and triggers a silent token refresh before retrying the original request. If the refresh fails, the user is redirected to login.

## Content Security Policy

The Caddy server sets a `Content-Security-Policy` header that restricts which scripts, styles, and resources the browser will load. This is a last line of defence against XSS. Configured in the `Caddyfile`, not in the Angular app.
