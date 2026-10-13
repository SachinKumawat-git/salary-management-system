# Requirements

## Goal and Target User

Build a web application for HR Managers to view, manage, and analyze employee salary data for an organization of ~10,000 employees.

## Core Features

1. **Authentication** — JWT-based login/logout for HR staff; protected routes and APIs.
2. **Dashboard** — Aggregate stats: total employees, active count, average salary by currency, department/country breakdowns, and distribution charts.
3. **Employee Management** — Paginated list with search, filter, and sort; create and update employee records.
4. **Salary Management** — View current and historical salary records; add and revise compensation with effective-date tracking.
5. **Salary Analytics** — Department- and country-level salary statistics grouped by currency; date-range filtering.
6. **Seed Data** — Management command to generate 10,000 synthetic employees with realistic salary history.

## Scope

### In Scope
- HR Manager login and protected API access.
- Full employee CRUD (create, read, update — no delete exposed in UI).
- Salary history preserved on every compensation change.
- Dashboard and analytics computed via DB aggregations.
- Server-side pagination, filtering, search, and sorting.
- 10,000 synthetic employee seed via `python manage.py seed_employees`.
- Backend tests (pytest) and frontend tests (Vitest + RTL).

### Out of Scope
- Docker, cloud deployment, CI/CD pipelines (phase 2).
- Tax calculations, payroll transfers, approval workflows.
- Employee self-service portal.
- External HR system integrations.
- Redis, Celery, or any async task infrastructure.
- Multi-currency conversion.

## Security Considerations

- Passwords hashed via Django's default PBKDF2.
- JWT access tokens (short-lived, 15 min); refresh tokens in HttpOnly cookies.
- CSRF protection enabled when cookies carry credentials.
- CORS restricted to the frontend origin.
- Every API endpoint requires authentication; salary write endpoints require HR role check.
- Login throttled (5 attempts / minute); API throttled for anonymous users.
- Secrets loaded from `.env`; never committed.
- Django ORM used for all queries (no raw SQL with user input).
- Error responses never expose tracebacks.

## Performance Expectations (10,000 Employees)

- List endpoint returns ≤25 rows per page; max page size 100.
- Dashboard queries use DB aggregations — no Python-side iteration over all records.
- Indexed fields: `employee_code`, `email`, `department`, `country`, `employment_status`, `effective_from`.
- `select_related` / `prefetch_related` used to avoid N+1 queries.
- Target: employee list page loads in <500 ms on SQLite locally.

## Acceptance Criteria

- HR can log in, view the dashboard, and log out.
- Employee list shows paginated results with working search, filter, and sort.
- Creating an employee with a duplicate code is rejected with a clear error.
- Salary revision creates a new record and retains the old one.
- Overlapping salary periods for the same employee are rejected.
- Dashboard totals match the seeded data counts.
- Analytics never mix different currencies in a single sum.
- `seed_employees --count 10000` completes without errors and is safe to rerun.
- All backend tests pass; critical frontend flows covered by Vitest tests.
- No secrets or real employee data committed to Git.
