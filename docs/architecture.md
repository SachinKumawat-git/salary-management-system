# Architecture

## Overview

A standard client-server architecture: a React SPA (Vite) talks to a Django REST API backed by SQLite. JWT tokens authenticate every request.

```
Browser (React + Vite)
        │
        │  HTTPS / REST JSON
        ▼
Django REST Framework API
        │
        ├── JWT Auth (SimpleJWT)
        ├── employees app
        ├── analytics app
        │
        ▼
    SQLite (dev)
```

## Frontend

- **React 18 + Vite** — fast HMR, minimal config.
- **Tailwind CSS** — utility-first styling; consistent design with no custom CSS overhead.
- **React Router v6** — client-side routing; protected route wrapper checks token presence.
- **TanStack Query** — server-state caching, background refetch, and loading/error states.
- **Axios** — HTTP client with request interceptor that attaches the Bearer token; response interceptor handles 401 → refresh → retry.
- **React Hook Form** — controlled forms with built-in validation; errors displayed inline.
- **Recharts** — bar and pie charts for dashboard and analytics pages.

## Backend

- **Django 5** — project scaffolding, ORM, migrations, admin.
- **Django REST Framework** — ViewSets/APIViews, serializers, permissions, throttling, pagination.
- **djangorestframework-simplejwt** — issues access (15 min) and refresh (7 days) tokens. Refresh token is set as an HttpOnly cookie; access token is returned in the JSON response body and stored in React state (not localStorage).
- **django-filter** — clean filter backend for employee list queries.
- **drf-spectacular** — OpenAPI 3 schema auto-generated at `/api/schema/`; Swagger UI at `/api/docs/`.

## Token Storage Trade-offs

| Approach | XSS risk | CSRF risk | Chosen? |
|---|---|---|---|
| Access token in memory (React state) | Low | n/a | ✅ |
| Refresh token in HttpOnly cookie | n/a | Mitigated by CSRF token | ✅ |
| Access token in localStorage | High | n/a | ❌ |

Storing the access token only in React memory means it is lost on page refresh. The app silently exchanges the HttpOnly cookie for a fresh access token on startup via `/api/auth/refresh/`.

## Request Flow (Authenticated)

1. Browser sends `Authorization: Bearer <access>` + CSRF header on mutating requests.
2. DRF's `JWTAuthentication` validates the token.
3. `IsHRManager` permission class checks the user's group/flag.
4. View queries the ORM, serializes, and returns JSON.
5. On 401 (expired access token), the Axios interceptor calls `/api/auth/refresh/` (cookie sent automatically), stores the new access token in memory, and retries the original request.

## Apps

| App | Responsibility |
|---|---|
| `config` | Project settings, root URL conf |
| `employees` | Department, Employee, SalaryRecord models; CRUD APIs |
| `analytics` | Aggregated salary/employee analytics endpoints |

No shared service layer is needed at this scale. Business logic (date overlap check, salary revision) lives in the serializers/views where it is used.
