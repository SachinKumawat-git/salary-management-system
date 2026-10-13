# AI Usage

## How AI Was Used

This project was built with the assistance of an AI coding assistant (Google Antigravity / Gemini). The AI was used as a pair programmer — generating initial implementations, suggesting structure, and drafting documentation — while all decisions were reviewed and validated by the developer.

## Key Prompts

1. **Project setup** — "Initialize Django project at `backend/` with config/ layout, employees app, and analytics app. Install and configure DRF, SimpleJWT, django-filter, drf-spectacular, and ruff."
2. **Data models** — "Create Department, Employee (with employment_status choices), and SalaryRecord models with the fields and constraints described in the spec. Include migrations."
3. **Auth endpoints** — "Implement login, refresh (HttpOnly cookie), and logout using SimpleJWT. Add login throttling."
4. **Salary revision** — "Implement salary revision: wrap in a transaction, close the current record by setting effective_to, and insert the new record."
5. **Seed command** — "Write a seed_employees management command using Faker that bulk-creates 10,000 employees safely on rerun."
6. **Frontend auth flow** — "Set up Axios with a request interceptor for Bearer tokens and a response interceptor that silently refreshes on 401 and retries."

## Manual Verification

- All models reviewed against the spec before migration.
- Auth flow tested manually: login, 401 on expired token, silent refresh, logout.
- Salary overlap validation tested with overlapping date ranges.
- Seed command run twice to verify idempotency.
- Dashboard query results verified against raw DB counts.
- `ruff` and `pytest` run before each commit.

## Engineering Decisions Made Manually

| Decision | Rationale |
|---|---|
| Access token in React state, not localStorage | Reduces XSS exposure; page-refresh handled by silent refresh endpoint |
| `effective_to IS NULL` marks current salary | Simple, query-efficient, no extra `is_current` boolean to keep in sync |
| `UniqueConstraint(condition=Q(effective_to__isnull=True))` | Enforces single active salary at DB level |
| Django built-in `auth.User` + HR Manager group | Avoids custom user model complexity for a single role |
| SQLite for development | Specified in the brief; ORM usage kept portable |
| drf-spectacular for OpenAPI | Minimal setup, well-maintained, compatible with DRF 3.15+ |
