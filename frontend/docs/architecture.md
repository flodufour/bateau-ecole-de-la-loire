# Frontend — Architecture

## Overview

The frontend is an **Angular** application using standalone components (no NgModules), signals for reactive state, and lazy-loaded feature routes.

---

## Folder structure

```
frontend/src/app/
├── core/                  # Loaded once at startup, never re-instantiated
│   ├── services/          # Auth, HTTP interceptors, global state
│   ├── guards/            # Route guards (e.g. auth required, admin only)
│   └── interceptors/      # Attach JWT token to every request
│
├── features/              # One folder per feature, lazy-loaded
│   ├── home/
│   ├── catalog/           # Permit listing and detail pages
│   ├── booking/           # Session browser and booking flow
│   ├── dashboard/         # Student personal dashboard
│   ├── instructor/        # Instructor availability management
│   └── admin/             # Back-office (sessions, bookings, exam dates)
│
└── shared/                # Reusable across features
    ├── components/        # Generic UI (buttons, cards, modals…)
    ├── pipes/             # Date formatting, currency, etc.
    └── models/            # TypeScript interfaces mirroring API DTOs
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
/                   → HomeComponent
/formations         → CatalogComponent (lazy)
/formations/:slug   → PermitDetailComponent (lazy)
/reserver           → BookingComponent (lazy, auth required)
/mon-espace         → DashboardComponent (lazy, auth required)
/admin              → AdminComponent (lazy, admin role required)
```

---

## Auth flow

1. User logs in → API returns a JWT.
2. Token is stored in `localStorage`.
3. An HTTP interceptor automatically attaches it to every outgoing request.
4. A route guard checks the token before allowing access to protected pages.
5. On 401 response, the interceptor triggers a token refresh or redirects to login.
