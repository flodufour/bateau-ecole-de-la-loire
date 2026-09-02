# Frontend — Architecture

## Overview

The frontend is an **Angular** application using standalone components (no NgModules), signals for reactive state, and lazy-loaded feature routes.

---

## Folder structure

```
frontend/src/app/
├── core/                  # Loaded once at startup, never re-instantiated
│   ├── models/            # TypeScript interfaces mirroring API DTOs
│   ├── services/          # AuthService (signals-based session state), LoadingService
│   ├── interceptors/      # credentials (withCredentials), loading, auth-error (401 → clear session)
│   ├── guards/            # authGuard — UX only, the API is the real boundary
│   └── utils/             # e.g. extractApiErrors — parses the { errors: string[] } shape
│
├── features/              # One folder per feature, lazy-loaded
│   ├── home/
│   ├── auth/              # login/, register/
│   ├── catalog/           # not built yet — permit listing and detail pages
│   ├── booking/           # not built yet — session browser and booking flow
│   ├── dashboard/         # not built yet — student personal dashboard
│   ├── instructor/        # not built yet — instructor availability management
│   └── admin/             # not built yet — back-office (sessions, bookings, exam dates)
│
└── shared/                # Reusable across features
    └── components/        # Header, Footer, LoadingBar today
```

---

## Key concepts

### Standalone components
Angular 17+ lets you declare a component without belonging to a NgModule. Each component imports only what it needs. Simpler, more explicit, easier to trace dependencies.

### Signals
Signals are Angular's reactive primitive (like a variable that notifies the UI when it changes). Used for component state instead of `BehaviorSubject` or `@Input` chains where possible — less boilerplate, more predictable.

### Lazy loading
Each feature folder has its own routes file. The router only loads a feature's code when the user navigates to it. This keeps the initial bundle small and the app fast.

### Smart vs dumb components
- **Smart** (feature-level): knows about services, makes HTTP calls, holds state.
- **Dumb** (shared): receives data via `@Input`, emits events via `@Output`. No dependencies on services.

This keeps shared components reusable and easy to test.

### HTTP and services
All API calls live in services (`core/services/` or `features/*/services/`). Components never call `HttpClient` directly. This centralises error handling and makes it easy to mock during tests.

---

## Routing

Top-level routes are defined in `app.routes.ts`. Each feature is a lazy-loaded child:

```
/                   → Home
/connexion          → Login (lazy)
/inscription        → Register (lazy)
/formations         → not built yet — Catalog (lazy)
/formations/:slug   → not built yet — permit detail (lazy)
/reserver           → not built yet — Booking (lazy, auth required)
/mon-espace         → not built yet — Dashboard (lazy, auth required)
/admin              → not built yet — Admin (lazy, admin role required)
```

---

## Auth flow

The JWT is **never** touched by frontend code — it lives only in an `httpOnly` cookie the backend sets, which JavaScript can't read even if it wanted to (see `backend/docs/security.md`). `AuthService` holds the *profile* the backend hands back (a `User`), as a signal — not the token.

1. `provideAppInitializer` (in `app.config.ts`) runs once before the app renders: it calls `GET /auth/csrf` to seed the `XSRF-TOKEN` cookie, then `AuthService.restoreSession()` (`GET /auth/me`) to find out whether a cookie from a previous visit is still valid.
2. `credentialsInterceptor` adds `withCredentials: true` to every request, so the browser attaches the cookies to calls to the API's origin.
3. Angular's built-in XSRF handling (`withXsrfConfiguration`) reads the `XSRF-TOKEN` cookie and echoes it in an `X-XSRF-TOKEN` header on state-changing requests — cookie/header names are configured to match the backend's antiforgery middleware exactly, so this needs no extra wiring.
4. `login()`/`register()`/`logout()` on `AuthService` call the corresponding endpoint and update the `currentUser` signal from the response body.
5. `authErrorInterceptor` clears the local session on any `401` response — the source of truth is always the backend, this just keeps the UI (header, guards) from lagging behind a session that already died server-side.
6. `authGuard` blocks navigation to a protected route when `currentUser()` is null. This is a UX nicety only — the backend enforces authorization independently and is the real boundary.

---

## Loading indicator

`LoadingService` tracks how many HTTP requests are currently in flight, as a signal. `loadingInterceptor` increments it when a request starts and decrements it (via `finalize`, so this runs on success *and* error) when it ends. `LoadingBar` (in the app shell) renders a slim animated bar at the top of the page whenever that count is above zero — deliberately not a full-page spinner/overlay, to keep the UI feeling responsive rather than blocked.

---

## Design system

Design tokens (colors, spacing scale, radii, font stack) are CSS custom properties in `src/styles.css`, not a component library or Tailwind — nothing here justifies that dependency yet. Two choices worth calling out:

- **System font stack** (`-apple-system, BlinkMacSystemFont, "Segoe UI", …`), not a webfont. Renders as San Francisco on macOS, Segoe UI on Windows — matching what a real native-feeling site does, rather than the "Inter everywhere" look of most AI-generated pages.
- **Generic form primitives** (`.field`, `.form-errors`, `.submit-button`, `.auth-card`) live in the global stylesheet because they're reused across every form (auth today; booking/contact later), not duplicated per component.

---

## Testing

Jasmine/Karma (Angular's `ng new` default). Run with `ng test` (interactive, opens Chrome) or `ng test --watch=false --browsers=ChromeHeadless` (CI-style, one run). See `CLAUDE.md`'s Testing section for the conventions (DOM-driven component tests, `provideHttpClient() + provideHttpClientTesting()` for anything that injects `HttpClient`).
