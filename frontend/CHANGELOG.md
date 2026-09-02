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
2026-09-02 00:00 — [feat] Add forgot/reset password pages, session browsing + booking (/reserver, filterable, SessionCard), and the student dashboard (/mon-espace, list/cancel bookings, BookingStatusBadge) — with tests (64 specs total). Admin back-office and instructor portal are blocked on missing backend write endpoints, not built yet.
2026-09-02 00:00 — [fix] Serve ng serve over HTTPS (angular.json, reusing the trusted .NET dev cert) — running the frontend on http while the API is https made Chrome treat them as cross-site, so SameSite=Strict auth cookies were silently dropped on every request, looking exactly like being logged out on any protected page
2026-09-02 00:00 — [feat] Add the admin back-office (/admin, role-guarded): CRUD UI for permits, sessions, exam dates, and instructors, plus a bookings list with confirm — with tests (98 specs total)
2026-09-02 15:00 — [feat] Add the instructor portal (/instructeur, role-guarded): read-only list of assigned upcoming sessions plus create/delete UI for availability slots — with tests (109 specs total)
2026-09-02 17:15 — [feat] Add the public contact page (/contact: school info + form) and the admin Messages inbox (/admin/messages: list + delete) — with tests (119 specs total). Also fixes frontend/docs/architecture.md, whose folder-structure and routing sections still described catalog, booking, dashboard, and admin as "not built yet" despite already shipping.
2026-09-02 18:00 — [feat] Add a short "Les 3 permis, en bref" explainer (Côtier, Hauturier, Fluvial, and the théorie/pratique process) to the catalog list page
2026-09-02 18:30 — [feat] Build the real home page: boat photo, "who we are" blurb, and an embedded Google Map, using facts and assets pulled from the school's live site — with tests (122 specs total)
2026-09-02 19:00 — [feat] Let an Admin also use the instructor portal (/instructeur now allows Instructor or Admin): a "Créer mon profil moniteur" form appears when the caller has no profile yet — with tests (127 specs total)
2026-09-02 19:30 — [feat] Replace the flat "Mes séances à venir" list in the instructor portal with a Monday–Sunday week calendar, navigable by week — with tests (129 specs total)
2026-09-02 20:00 — [feat] Add a "Mes informations" section (name, email, role) to the student dashboard, reusing the already-loaded AuthService profile — with tests (130 specs total)
2026-09-02 20:30 — [feat] Add Mentions légales and Politique de confidentialité pages, linked from the footer (LCEN and RGPD require them) — legal form/SIRET are marked "à compléter", not invented — with tests (136 specs total)
2026-09-02 21:00 — [feat] Embed the school's Facebook page (Meta Page Plugin) on the contact page — with tests (137 specs total)
2026-09-02 21:15 — [fix] Correct the school's name in the header and footer — "École de bateau de la Loire" (wrong word order) to "Bateau École de la Loire", matching the real name used everywhere else
