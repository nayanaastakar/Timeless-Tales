# Timeless Tales

Timeless Tales is a React 18 / TypeScript bookstore frontend backed by Django REST Framework and PostgreSQL. The backend migration keeps the existing PostgreSQL volume and copies legacy book and account data into Django-owned tables; it does not rewrite or drop the original Spring/Flyway tables.

## Run the full stack

1. Copy `D:\Projects\tt-backend\.env.example` to `D:\Projects\tt-backend\.env`.
2. Set distinct strong values for `DB_PASSWORD`, `JWT_SECRET` (at least 32 bytes), and `DJANGO_SECRET_KEY`. Keep `.env` private; it is ignored by Git.
3. From PowerShell:

   ```powershell
   cd D:\Projects\tt-backend
   docker compose --env-file .env up --build -d
   docker compose --env-file .env ps
   ```

Compose starts PostgreSQL, applies Django migrations, collects Django Admin static assets, waits for the API health check, and then serves the frontend.

| Service | URL |
| --- | --- |
| Frontend | http://localhost:5175 |
| Django REST API | http://localhost:8080/api/v1/ |
| API health | http://localhost:8080/actuator/health |
| Django Admin | http://localhost:8080/admin/ |
| PostgreSQL (host) | localhost:5434 |

Create an administrator after startup with `docker compose --env-file .env exec api python manage.py createsuperuser`.

Stop containers without deleting data using `docker compose --env-file .env down`. Do not use `down -v` unless you intend to delete the database volume.

## Run the frontend and API in development

Start PostgreSQL from `D:\Projects\tt-backend`:

```powershell
docker compose --env-file .env up -d db
```

In another terminal, install/run Django from `D:\Projects\tt-backend\django_backend` (Python 3.11+ required):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:DB_HOST = "localhost"
$env:DB_PORT = "5434"
$env:DB_NAME = "timeless"
$env:DB_USER = "timeless"
$env:DB_PASSWORD = "the-value-from-your-env-file"
$env:JWT_SECRET = "your-random-secret-at-least-32-bytes-long"
$env:DJANGO_SECRET_KEY = "your-separate-random-django-secret"
$env:CORS_ORIGIN = "http://localhost:5174,http://127.0.0.1:5174"
python manage.py migrate
python manage.py runserver 127.0.0.1:8080
```

Then run the React app:

```powershell
cd D:\Projects\tt
npm ci
$env:VITE_API_URL = "http://localhost:8080"
npm run dev -- --host 127.0.0.1 --port 5174
```

If `VITE_API_URL` is unset, the frontend explicitly uses the small development catalogue in `src/data/books.ts`. If an API URL is configured but unreachable, the UI shows an error rather than silently falling back to sample data.

## Build and tests

```powershell
cd D:\Projects\tt
npm run build
cd D:\Projects\tt-backend\django_backend
python manage.py check
python manage.py test
```

## API overview

- Public catalogue: `GET /api/v1/books/`, `GET /api/v1/books/{id}/`, `GET /api/v1/genres/`, `GET /api/v1/authors/`, `GET /api/v1/publishers/`.
- Book listing supports search, genre, maximum price, minimum rating, author, publisher, language, format, stock, year, sort, and zero-based pagination.
- Accounts: `POST /api/v1/auth/register/`, `POST /api/v1/auth/login/`, authenticated `GET /api/v1/auth/me/`.
- Authenticated cart: `GET /api/v1/cart/`, `POST /api/v1/cart/items/`, `PUT|DELETE /api/v1/cart/items/{id}/`, `DELETE /api/v1/cart/`.
- Authenticated wishlist: `GET /api/v1/wishlist/`, `POST|DELETE /api/v1/wishlist/{bookId}/`.
- Authenticated demo orders: `POST|GET /api/v1/orders/`, `GET /api/v1/orders/{id}/`.

Checkout atomically validates and decrements inventory and records a demonstration order. No payment is processed. No Google Books/Open Library import, email, shipping, or production payment integration is represented as active until configured and verified.

## Migration status

See the [migration plan](../tt-backend/MIGRATION_PLAN.md) for the audit, phased feature scope, data-preservation approach, and rollback steps. The initial Django API currently ports the prior catalogue, authentication, cart, wishlist, and demo-order workflows. The source catalogue contains 12 demo titles; it is not presented as a verified 200-book collection.
