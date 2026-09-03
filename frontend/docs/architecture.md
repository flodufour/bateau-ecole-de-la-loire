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

Design tokens (colors, spacing scale, radii, font stack) are CSS custom properties in `src/styles.css`, not a component library or Tailwind — nothing here justifies that dependency yet.

**Editorial/nautical redesign (2026-09-03)** — a full visual pass to a warm-paper, navy/orange, Archivo+Barlow+IBM Plex Mono system, CSS-and-classes only (no route/content/logic changes):

- **Palette**: `--color-paper`/`--color-paper-alt` (warm off-white + beige) as the two light backgrounds, `--color-navy` as the full-width accent band and heading color, `--color-accent` (orange) as the one accent color for CTAs/hover/active states, `--color-footer` (a darker near-black navy, distinct from `--color-navy`) for `Footer` only. No color outside this set — the earlier `--color-accent-text` (a separate deeper orange for links) was dropped since it wasn't in the approved palette; links use `--color-accent` directly.
- **Type**: `--font-display` (Archivo 800, tight letter-spacing, for headings) and `--font-body` (Barlow, `line-height: 1.6`, `text-wrap: pretty`) via a Google Fonts `@import` at the top of `styles.css`. `--font-mono` (IBM Plex Mono) backs a small unused `.eyebrow` label class — see below.
- **Rounded over square**: this reverses the earlier "square corners" decision — `--radius-pill` (999px) on every button, `--radius-lg` (14px) on cards/images, `--radius-sm` (8px) on form fields. Cards (`.card`, `.permit-card`, `.session-card`, `.testimonial`, `.dashboard__item`, `.instructor-portal__item`) get a `border-color` + `translateY(-3px)` hover.
- **Header**: reversed again from "permanently solid navy" back to a light, translucent, `backdrop-filter: blur(10px)` sticky bar (this only works because it no longer needs to double as a dark band on every page — the navy accent now lives in the hero/CTA bands, not the header).
- **Full-width section bands**: `.section-band`/`.section-band--alt` are a new *neutral* full-bleed wrapper (mirroring the `.hero` pattern) so a section can carry an edge-to-edge background while its content stays inside `.container` — added around the home page's "taille humaine / candidat libre / testimonials" section so it could become a beige band, since the flattened `container home-section` markup elsewhere has no full-bleed layer to color. This is the one HTML structural change in the redesign, and it's semantically inert (a wrapping `<section>`, no new text).
- **Never two dark sections back to back**: the pre-footer CTA band (`.hero--cta`) used to fade its photo into a solid navy matching the footer, deliberately merging the two into one dark moment. That's exactly the rhythm this redesign forbids, so it's now a *light* beige-scrimmed photo band instead, sitting between the light "Nous trouver" section and the dark footer.
- **No gradients**: every hero/CTA photo overlay was a two-stop `linear-gradient` fade; all of them are now a flat single-tone scrim (the same color repeated as both gradient stops — visually flat, still using the `linear-gradient()` function since CSS has no other way to layer a tint over a background-image).
- **Real photos, not stock**: `public/images/quai-nantes.jpg` and `ecole-conviviale.jpg` are both sourced from the school's own live site (bateauecoledelaloire.fr), not generated or stock imagery.
- **Testimonials as quote cards**: reversed from the earlier deliberately-discreet, borderless, 1-line style to bordered white cards with a large orange Archivo quote mark (`.testimonial::before`), per this redesign's spec — kept a 2-line clamp and compact padding rather than the spec's full card padding, since 3 stacked cards at full size reintroduced an earlier "avis prennent trop de place" complaint.
- **Not applied**: numbered "01 —" mono eyebrow labels above section titles (would add new visible text, which the redesign brief explicitly forbids elsewhere), a price/feature-list component and a key-figures/stats component (both defined as unused CSS — `.spec-list`, `.stats`/`.stat` — since no existing content matches either shape), and a strict 4/5 hero image ratio (the hero is a full-bleed CSS background, not a boxed `<img>`, and boxing it would be a structural change beyond a neutral wrapper).
- **Ambient wave background**: `WaveBackground` (`shared/components/wave-background/`) draws up to 4 small orange wavy SVG lines that each fade in, "draw" themselves via an animated `stroke-dashoffset`, hold for ~2s, then fade out and reappear at a new random spot roughly 9–11s later. It's `position: fixed` at `z-index: -1` behind the current page, so an opaque section would naturally paint over it if one were present. Mounted only on `/panier` (`Cart`) — not app-wide — so it doesn't compete with content on every page. Skips the whole animation loop (not just the CSS) for `prefers-reduced-motion: reduce`.
- **Sticky footer**: `app.css` makes `app-root` a `min-height: 100dvh` flex column with `main { flex: 1 }`, so `Footer` stays pinned to the bottom of the viewport on short pages (e.g. an empty cart) instead of riding up under sparse content, while still scrolling normally on taller pages.
- **Scroll reveal**: `ScrollRevealDirective` (`shared/directives/`, selector `appScrollReveal`) fades and slides an element in the first time it scrolls into the viewport, via `IntersectionObserver` — it reveals once and then disconnects, it doesn't hide the element again on scrolling back up. Used on the home page's below-the-fold sections; the `.scroll-reveal`/`.scroll-reveal--visible` CSS lives in `styles.css` since the directive is a generic, reusable primitive, not home-specific. Respects `prefers-reduced-motion`.

---

## Testing

Jasmine/Karma (Angular's `ng new` default). Run with `ng test` (interactive, opens Chrome) or `ng test --watch=false --browsers=ChromeHeadless` (CI-style, one run). See `CLAUDE.md`'s Testing section for the conventions (DOM-driven component tests, `provideHttpClient() + provideHttpClientTesting()` for anything that injects `HttpClient`).
