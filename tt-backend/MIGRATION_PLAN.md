# Timeless Tales Django Migration Plan

## Current state

- The customer application is React 18, TypeScript, Vite, Tailwind, and React Router.
- The active Compose API is Django REST Framework and PostgreSQL. The former Spring Boot/Java API is no longer in the runtime path.
- The catalogue has 12 public-domain demo titles. Pricing, ratings, stock, and review scores are store demo data, not verified market data.
- The existing PostgreSQL volume and Spring/Flyway tables are retained. The Django data migration copies source rows into Django-owned tables and normalizes legacy BCrypt hashes for Django verification.
- Basic normalized genre, author, and publisher records, public list/detail APIs, and Django Admin editing exist. Editorial collections, public profiles, reviews, and reader-community workflows are not implemented yet.

## Progress

1. **Audit and migration design — complete.** The current code and schema were compared with the submitted scope and this non-destructive migration plan was recorded.
2. **Django foundation — complete for the migrated workflows.** Django, DRF, JWT, PostgreSQL, CORS, rate throttling, health checks, modular account/catalogue/commerce models, migrations, and admin registration are in place.
3. **Commerce/API parity — complete for existing workflows.** The React API client now uses `/api/v1/`; Django serves book search/filter/pagination, auth, cart, wishlist, and transactional demo orders.
4. **Discovery/editorial — partial.** Genre, author, and publisher records, basic APIs, and admin editing exist. Editorial collections, provider imports, and the richer public discovery pages remain outstanding.
5. **Reader features — not started.**
6. **Commerce extensions — not started.** Real payment, email, and shipping remain disabled.
7. **Quality/cutover — runtime cutover and current checks complete; full-spec acceptance remains outstanding.** Nine Django API/admin tests pass; frontend build and browser purchase/order-history flow pass.

## Target and compatibility

Keep the React application and migrate its API dependency to versioned Django REST Framework endpoints under `/api/v1/`. Keep PostgreSQL and the existing database volume. Do not reset the volume, rewrite applied Flyway migrations, or expose database credentials to the frontend.

Django will own new, namespaced tables. Its first data migration will copy books, users, carts, wishlists, and orders from the legacy tables using their existing IDs. Legacy tables remain untouched during the cutover and serve as a rollback/data-reconciliation source. Import existing BCrypt password hashes and configure Django to verify them; never copy plaintext credentials or JWT secrets.

The Compose runtime contains one application API (Django), not two competing APIs. After Django passed the migration and browser checks, the Spring Java source, Maven build, and Spring Dockerfile were removed. The original Flyway SQL remains as read-only schema history; it is not run by the Django service. The PostgreSQL volume is retained.

## Phases

1. **Audit and migration design** — compare the requested features with the actual frontend, API, and database; record the source schema, compatibility contract, and non-destructive cutover. (Complete.)
2. **Django foundation** — configure Django, DRF, JWT, PostgreSQL, CORS, health checks, modular models, admin, and migrations. Import legacy records idempotently. (Complete for current workflows.)
3. **Commerce/API parity** — implement catalogue search/filtering, registration/login, cart, wishlist, and transactional demo checkout/order history; switch the frontend to `/api/v1/`. (Complete.)
4. **Discovery and editorial** — extend normalized genres/authors/publishers with collections and article workflows; add provider-backed book lookup/import without fabricated metadata or cover imagery. (Partial.)
5. **Reader features** — add approved reviews, shelves, reading progress, profiles, and moderated clubs/discussions with ownership and throttling.
6. **Commerce extensions** — add coupons, shipping/address capture, returns, and inventory history. Keep real payment, email, and shipping integrations disabled unless credentials and verified sandbox/webhook configuration are supplied.
7. **Quality and cutover** — run Django checks/tests, frontend type/build, migration and data-preservation checks, Docker health checks, and representative browser flows before removing Spring from the active Compose path. (Runtime cutover complete; full-spec tests/features remain.)

Each phase is accepted only after its targeted checks pass. Production deployment, bulk book imports, payment processing, and email delivery are not claimed until separately configured and verified.

## Cutover and rollback

1. Back up PostgreSQL before the first Django migration.
2. Build and test Django without stopping the current API.
3. Apply additive Django migrations and compare imported row counts and IDs with the legacy tables.
4. Switch the Compose API service to Django, then run health, auth, cart, and order checks.
5. If checks fail, switch the API image back to the prior Spring image; do not delete or restore over the PostgreSQL volume.
6. Retire the Spring runtime only after successful verification. Keep legacy tables until their data has been reconciled and a separately approved cleanup is planned.

## Local commands after cutover

The authoritative startup and test commands are in the project README. Compose now runs Django on port 8080; the existing PostgreSQL volume is unchanged. The pre-cutover Spring image remains available locally as a rollback option, but is not part of the active stack.
