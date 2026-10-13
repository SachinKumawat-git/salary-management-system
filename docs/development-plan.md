# Development Plan

## Implementation Order

Features are implemented in dependency order. Each item maps to one Git commit.

| # | Commit | What it delivers |
|---|---|---|
| 1 | `docs: add requirements and development plan` | All docs in `/docs` |
| 2 | `chore: initialize Django and React projects` | Project scaffolding, venv, package.json, .env.example, .gitignore |
| 3 | `feat: add employee and department models` | Department, Employee, SalaryRecord models + migrations |
| 4 | `feat: add JWT authentication and permissions` | Login, refresh, logout endpoints; IsHRManager permission; throttling |
| 5 | `feat: implement employee CRUD APIs` | GET/POST /employees/, GET/PATCH /employees/{id}/, departments list |
| 6 | `feat: add salary records and history` | GET/POST /employees/{id}/salaries/, revision logic, overlap validation |
| 7 | `feat: add employee search and pagination` | Filter backend, search, ordering, pagination |
| 8 | `feat: add dashboard analytics APIs` | /dashboard/summary/, /analytics/salaries/ with aggregations |
| 9 | `feat: add 10000 employee seed command` | seed_employees management command using Faker + bulk_create |
| 10 | `feat: build authentication and dashboard UI` | Login page, protected routes, dashboard page with charts |
| 11 | `feat: add employee directory and salary management UI` | Employee list, detail, create/edit forms, salary history + revision |
| 12 | `feat: add salary analytics and charts` | Analytics page with Recharts bar/pie charts |
| 13 | `test: cover core employee and salary workflows` | pytest backend tests + Vitest frontend tests |
| 14 | `docs: add setup instructions and design decisions` | README.md update |

## Notes on Order

- Models (step 3) before APIs (steps 5–8) — no API can be built without models.
- Auth (step 4) before employee APIs (step 5) — every API requires a protected endpoint.
- Backend complete (steps 3–9) before starting the frontend (steps 10–12) — avoids mocking and rework.
- Tests (step 13) after all backend features are stable — allows testing real behavior.

## Branching Strategy

All work is done on `main` for this assessment. Each commit represents a complete, working feature. No feature branches are required given the single-developer context.

## Pre-commit Checklist

Before each commit:
1. Run `pytest` (backend) and verify tests pass.
2. Run `ruff check .` and `ruff format --check .` — fix any issues.
3. Review `git diff` for secrets, debug prints, or unrelated changes.
4. Commit only files belonging to the current feature.
