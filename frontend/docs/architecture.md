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
│   ├── home/              # placeholder landing page — see frontend/docs/features.md
│   ├── auth/              # login/, register/, forgot-password/, reset-password/
│   ├── contact/           # public contact page (info + form)
│   ├── catalog/           # permit listing and detail pages
│   ├── cart/              # client-side cart (CartService) + checkout
│   ├── booking/           # session browser and booking flow
│   ├── dashboard/         # student personal space (list/cancel own bookings)
│   ├── instructor/        # instructor portal: assigned sessions + availability slots
│   └── admin/             # back-office: permits, sessions, exam dates, instructors, bookings, messages
│
└── shared/                # Reusable across features
    └── components/        # Header, Footer, LoadingBar, PermitCard, SessionCard, BookingStatusBadge
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
/                              → Home
/connexion                     → Login (lazy)
/inscription                   → Register (lazy)
/mot-de-passe-oublie           → ForgotPassword (lazy)
/reinitialiser-mot-de-passe    → ResetPassword (lazy)
/contact                       → Contact (lazy)
/formations                    → Catalog list (lazy)
/formations/:id                → Permit detail (lazy) — by id (guid), not slug
/panier                        → Cart (lazy) — no guard, works logged out; checkout itself requires Student
/reserver                      → Booking (lazy, authGuard)
/mon-espace                    → Dashboard (lazy, authGuard)
/admin                         → Admin layout (lazy, roleGuard('Admin')), with child routes
                                  /admin/permis, /seances, /dates-examen, /moniteurs, /reservations, /messages
/instructeur                   → Instructor portal (lazy, roleGuard('Instructor'))
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
- **Square over rounded, borders over shadows**: `--radius-*` tokens are deliberately tight (2–4px) and no component uses `box-shadow` — flat borders read as more deliberate/editorial than the soft-shadow, big-radius, pill-button look most generated UIs default to.
- **Nautical palette**: `--color-navy`/`--color-navy-deep`/`--color-navy-soft` (a deep, deliberately muted "bleu roi" rather than a bright electric blue) drive `Header`, `Footer`, and every `h1`/`h2`, alternating with white page content for a consistent blue/white rhythm across the whole app. `--color-accent`/`--color-accent-hover` are a softened orange used for solid fills (buttons, `.badge--accent`, the cart badge) — always paired with `--color-ink` text, not white, since white-on-orange fails contrast at this lightness. `--color-accent-text` is a separate, deeper shade of the same orange for inline text/links on the white background, where the fill color alone reads as too light.
- **Real photos, not stock**: `public/images/quai-nantes.jpg` and `ecole-conviviale.jpg` are both sourced from the school's own live site (bateauecoledelaloire.fr), not generated or stock imagery — consistent with the project's rule of never inventing content that isn't real. The home page hero and the pre-footer CTA band fade these photos into the navy palette via a `linear-gradient` overlay in the `background` shorthand, rather than placing them in a hard-edged image box.
- **Ambient wave background**: `WaveBackground` (`shared/components/wave-background/`) draws up to 4 small orange wavy SVG lines that each fade in, "draw" themselves via an animated `stroke-dashoffset`, hold for ~2s, then fade out and reappear at a new random spot roughly 9–11s later. It's `position: fixed` at `z-index: -1` behind the current page, so an opaque section would naturally paint over it if one were present. Mounted only on `/panier` (`Cart`) — not app-wide — so it doesn't compete with content on every page. Skips the whole animation loop (not just the CSS) for `prefers-reduced-motion: reduce`.
- **Sticky footer**: `app.css` makes `app-root` a `min-height: 100dvh` flex column with `main { flex: 1 }`, so `Footer` stays pinned to the bottom of the viewport on short pages (e.g. an empty cart) instead of riding up under sparse content, while still scrolling normally on taller pages.
- **Scroll reveal**: `ScrollRevealDirective` (`shared/directives/`, selector `appScrollReveal`) fades and slides an element in the first time it scrolls into the viewport, via `IntersectionObserver` — it reveals once and then disconnects, it doesn't hide the element again on scrolling back up. Used on the home page's below-the-fold sections; the `.scroll-reveal`/`.scroll-reveal--visible` CSS lives in `styles.css` since the directive is a generic, reusable primitive, not home-specific. Respects `prefers-reduced-motion`.

---

## Testing

Jasmine/Karma (Angular's `ng new` default). Run with `ng test` (interactive, opens Chrome) or `ng test --watch=false --browsers=ChromeHeadless` (CI-style, one run). See `CLAUDE.md`'s Testing section for the conventions (DOM-driven component tests, `provideHttpClient() + provideHttpClientTesting()` for anything that injects `HttpClient`).
