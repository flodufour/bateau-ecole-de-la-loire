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
2026-09-02 19:00 — [refactor] Redesign UI to a flatter, square-cornered look: tighter `--radius-*` tokens, remove `box-shadow`/`backdrop-filter` and pill (`999px`) shapes app-wide, and make the header transparent at the top of the page with a solid background/border only once scrolled
2026-09-02 20:30 — [refactor] Rework the palette to a deep "bleu roi" (Header/Footer/headings) alternating with white content, plus a softened orange accent for buttons/badges; drop the header's scroll-transparency (it left white text unreadable on every non-home page) for a permanently navy header
2026-09-02 20:30 — [feat] Add real photos sourced from the school's own live site to the home page hero and a new pre-footer CTA band, both faded into the navy palette via a gradient overlay
2026-09-02 20:30 — [feat] Add a decorative ship's-wheel SVG next to the intro text on `/formations`
2026-09-02 20:30 — [fix] Uniform permit/session card heights — clamp titles/descriptions and reserve their line-height so a short card no longer looks smaller than a long one in the same grid row
2026-09-02 20:30 — [fix] Pin the footer to the bottom of the viewport on short pages (e.g. an empty cart) via a sticky-footer flex layout in `app.css`
2026-09-02 20:30 — [chore] Style the scrollbar (thin, palette-colored) instead of the bulky OS default
2026-09-02 21:15 — [feat] Add `ScrollRevealDirective` (`appScrollReveal`) and fade/slide the home page's below-the-fold sections into view on scroll — with tests
2026-09-02 21:45 — [feat] Replace the plain white page-header on `/formations` and `/reserver` with a full-bleed photo band (matching the home page hero pattern), and swap the decorative ship's-wheel SVG for a real sailboat photo next to the "Hauturier" description
2026-09-02 22:00 — [fix] Swap the static sailboat photo next to "Les 3 permis, en bref" back for a ship's-wheel illustration — this time with more detail (visible handle grips) and a slow, continuous CSS spin animation (respects `prefers-reduced-motion`)
2026-09-02 22:15 — [chore] Replace the default Angular favicon with a ship's-wheel badge matching the site palette (favicon.svg, with the old favicon.ico kept as a fallback for browsers without SVG icon support — favicons can't run CSS animations, so it's a static version of the spinning wheel)
2026-09-02 22:30 — [feat] Add real Google Maps reviews (rating + 3 testimonials, copied verbatim, linking to the actual listing) next to "Une école à taille humaine" on the home page
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
2026-09-02 22:00 — [feat] Add permit purchasing: an "Acheter ce permis" button on the permit detail page (Student only, no real payment yet), and a "Mes permis achetés" section in the dashboard with a per-row "Transférer" action to move a purchase to another registered account by email — with tests (147 specs total)
2026-09-02 22:30 — [feat] Add a client-side cart (/panier): add permits from the detail page in any quantity, edit/remove lines, and check out — the "Acheter ce permis" button is gone, buying now always goes through the cart. Header shows a "Mon panier" link with an item-count badge. Checkout still requires being logged in as a Student, enforced at that step instead of on the detail page — with tests (166 specs total)
2026-09-02 23:00 — [feat] On /reserver, a session the caller already booked shows a disabled, greyed-out "En attente" or "Confirmée" button instead of "Réserver" — with tests (173 specs total)
2026-09-02 23:15 — [fix] Fix misaligned rows in every admin table (permits, sessions, exam dates, instructors, bookings, messages, cart): `.admin-table__actions` used `display: flex` directly on the `<td>`, which drops its table-cell rendering (row border disappears, column stops tracking the table) — replaced with plain inline content plus margin between buttons
2026-09-02 23:30 — [fix] Clean up the Facebook embed on the contact page: dropped `adapt_container_width` (only valid for the JS-SDK embed method — on our plain iframe it made content overflow and clip text), added a heading and a bordered card, and used the compact header/no-facepile options
2026-09-02 23:45 — [feat] Add a short "candidat libre" blurb to the home page (already holding one permit, get an extra option in autonomy, ~15 days, nationwide), linking to `/contact` — real content from the school's live site, condensed
2026-09-03 00:00 — [feat] Add `WaveBackground` to `/panier`: up to 4 small orange wavy SVG lines fade/draw in, hold ~2s, then fade out and reappear elsewhere ~10s later — `position: fixed` at `z-index: -1` so it only shows through the page's plain white space; skips the animation loop entirely under `prefers-reduced-motion` — with tests
2026-09-03 00:15 — [fix] Enlarge the ship's-wheel illustration on `/formations` (170px → 210px) — it read as too small next to the intro text
2026-09-03 09:15 — [feat] Grow the `/formations` ship's wheel further on hover (scale 1.2, 300ms) — wrapped it in a container so the hover transform doesn't fight the SVG's own spin-keyframe transform
2026-09-03 09:45 — [feat] Mark the caller's own instructor profile with "(moi)" in the "Moniteur" dropdown on `/admin/seances` (via `GET /instructors/me`, silently ignored if the Admin has no profile)
2026-09-03 09:45 — [fix] Every admin CRUD form and both instructor-portal forms now show "Veuillez remplir tous les champs." when submitted incomplete, instead of `markAllAsTouched()`'s silent no-op — with tests
