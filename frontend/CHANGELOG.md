# Frontend Changelog

All notable changes to the frontend are logged here.
Format: `YYYY-MM-DD HH:MM — [feat|fix|chore|refactor] Description`

---

## [0.1.0] — 2026-08-29

2026-08-29 22:00 — [chore] Initial project setup — Angular app scaffolded with standalone components and routing
2026-09-02 00:00 — [chore] Scaffold the Angular 20 workspace for real (ng new, standalone, routing, no SSR, plain CSS)
2026-09-02 00:00 — [feat] Add app shell (Header, Footer, LoadingBar) and design tokens (neutral palette, system font stack, spacing scale) in styles.css
2026-09-02 00:00 — [feat] Add core auth infrastructure: AuthService (signals-based session state), credentials/loading/auth-error interceptors, authGuard, session restore + CSRF bootstrap via provideAppInitializer
2026-09-02 00:00 — [feat] Add login/register pages (reactive forms) and a minimal home page — with Jasmine/Karma tests for all of the above (28 specs)
2026-09-02 00:00 — [feat] Add permits catalog (list + detail pages, PermitCard, PermitService) and register French locale for currency/date formatting — with tests (38 specs total)
