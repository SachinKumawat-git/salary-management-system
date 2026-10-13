# ACME Enterprise Salary Management System

A production-grade, secure, and intuitive web application built for **ACME Corporation** to replace legacy Excel-based salary workflows for **10,000 employees** across multiple international offices. Built with **Django REST Framework** (Python) and **React 19 + Vite** (Tailwind CSS, TanStack Query, Recharts).

---

## Problem Statement & Product Framing

Currently, ACME Corporation's HR team manages compensation for 10,000 employees globally using disconnected Excel spreadsheets. This causes:
1. **Missing audit trails**: Prior salary values get overwritten or lost across spreadsheet versions.
2. **Data integrity errors**: Overlapping effective dates, duplicate employee codes, or negative compensation figures go undetected.
3. **Inability to answer executive questions**: Leadership cannot quickly query how ACME compensates personnel across departments, currencies, and global locations.

This system directly solves these challenges, giving the HR Manager instant answers to:
- *How much does ACME pay people across each department and region?*
- *What are the minimum, average, and maximum compensation spreads per team?*
- *What is an employee's complete compensation and revision history?*
- *Who is actively on payroll vs. inactive or departed?*

---

## Architecture & Technology Stack

```
Browser (React 19 SPA + Vite + Tailwind CSS)
        │
        │  HTTPS / REST JSON
        ▼
Django REST Framework API (:8001 / :8000)
        │
        ├── JWT Authentication (In-Memory Access Token + HttpOnly Refresh Cookie)
        ├── Employee & Salary Domain Models (Indexed on search, status, and dates)
        ├── DB-Level Aggregations (Strictly separated by ISO currency)
        │
        ▼
SQLite Database (Indexed for sub-20ms 10,000-row performance)
```

### Backend
- **Framework**: Django 4.2 / Django REST Framework
- **Authentication**: `djangorestframework-simplejwt` with cookie-based token rotation & blacklist
- **Filtering & Search**: `django-filter`, `rest_framework.filters`
- **Documentation**: `drf-spectacular` (OpenAPI 3 / Swagger UI at `/api/docs/`)
- **Testing**: `pytest`, `pytest-django`, `faker` (**43 comprehensive tests**)
- **Linting & Formatting**: `ruff` (Zero linter errors)

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4, Google Fonts (Inter, Plus Jakarta Sans), Lucide Icons
- **Data Fetching & Cache**: `@tanstack/react-query`
- **HTTP Client**: `axios` with automatic 401 cookie-refresh interceptor
- **Routing**: `react-router-dom` v7 with Protected Route guard
- **Form Management**: `react-hook-form`
- **Data Visualization**: `recharts` (Bar charts, range spreads)
- **Testing**: `vitest`, `@testing-library/react` (**9 unit & integration tests**)
- **Linting**: `oxlint` (Zero errors)

---

## Core Features

1. **Secure HR Authentication**
   - Role-based access control requiring `HR Manager` group membership.
   - Access tokens kept in JavaScript memory (safeguarded against XSS).
   - Refresh tokens stored in `HttpOnly`, `SameSite=Lax` cookies.
   - Scoped brute-force throttling on login endpoints (5 attempts/min).
   - 1-click **Auto-fill Demo HR Credentials** shortcut on the login page.

2. **Executive Workforce & Compensation Dashboard**
   - Real-time KPIs: Total Headcount (10,000), Active Personnel, Inactive/Terminated Staff, Global Presence.
   - **Strict Currency Isolation**: Average Base Salary and Bonus segmented by ISO currency (USD, EUR, GBP, CAD, etc.) — never mixing currencies.
   - Interactive Recharts bar chart for department headcount distribution.
   - Geographic distribution breakdown.

3. **Employee Directory (10,000 Personnel Scale)**
   - Sub-second server-side search across first name, last name, and employee code.
   - Filter by department and employment status (Active, Inactive, Terminated).
   - Multi-field sorting (Last Name, First Name, Date Joined, Code).
   - Server-side pagination with configurable page size (10, 25, 50, 100).
   - Modal dialog to register new employees with validation against duplicate codes and emails.

4. **Salary Revisions & Historical Audit Trail**
   - Detailed compensation views: Base salary, bonus, currency, effective date ranges.
   - **Automated Revision Workflow**: Adding an open-ended salary revision automatically closes the previous active record as of `effective_from - 1 day` inside an atomic transaction.
   - **Overlap Prevention**: Mathematical validation blocking overlapping or backwards date intervals.
   - Chronological audit table preserving every past compensation record.

5. **Salary Analytics & Pay Distribution**
   - Aggregated department- and country-level salary metrics computed via database ORM aggregations.
   - Visual comparison of minimum, average, and maximum base compensation by department.
   - Department, Country, and Currency filtering to analyze specific compensation bands.

6. **Synthetic 10,000 Employee Seeder**
   - Management command `python manage.py seed_employees` generating 10,000 realistic international employees and salary records using `Faker` and `bulk_create`.
   - 100% idempotent: safely repeatable without creating duplicates or orphan records.

---

## Performance Benchmarks (10,000 Employees)

Direct performance measurements on SQLite locally with full index coverage:

| Query Operation | Latency | Target | Status |
|---|---|---|---|
| Dashboard Summary Aggregation | **11.0 ms** | < 100 ms | Passed |
| Employee List (25 rows + relations) | **19.8 ms** | < 100 ms | Passed |
| Live Search across 10,000 rows | **19.7 ms** | < 100 ms | Passed |
| Salary Analytics (17,800 records) | **16.8 ms** | < 100 ms | Passed |
| 10,000 Employee Seeding | **3.4 seconds** | < 60 s | Passed |

---

## Quickstart Guide

### Prerequisites
- Python 3.8+
- Node.js 18+ and npm

---

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
python manage.py migrate

# Seed 10,000 employees and demo HR manager account (takes ~3.5 seconds)
python manage.py seed_employees --count 10000

# Start Django development server (default port: 8001)
python manage.py runserver 8001
```

#### Demo HR Manager Login
- **Username**: `hrmanager`
- **Password**: `hrpassword123`

---

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server (runs on http://localhost:5173 with proxy to :8001)
npm run dev
```

Navigate to `http://localhost:5173` in your browser.

---

## Running Test Suites

### Backend Tests (pytest)
Runs 43 backend tests covering authentication, employee CRUD, salary revisions, overlap logic, seed idempotency, and analytics:

```bash
cd backend
source venv/bin/activate
python -m pytest
```

### Frontend Tests (Vitest)
Runs 9 frontend tests verifying UI components, authentication flows, and protected navigation:

```bash
cd frontend
npm test
```

---

## Code Quality & Linting

### Backend Linting (Ruff)
```bash
cd backend
source venv/bin/activate
ruff check .
ruff format --check .
```

### Frontend Linting (Oxlint) & Production Build
```bash
cd frontend
npm run lint
npm run build
```

---

## Artifacts & Documentation Index

All planning and engineering decision documents are located in `/docs`:
- [docs/requirements.md](docs/requirements.md) — One-page product requirements, scope boundaries, and deliberate exclusions.
- [docs/development-plan.md](docs/development-plan.md) — 14-step implementation plan mapping to incremental git commits.
- [docs/architecture.md](docs/architecture.md) — Client-server architecture, token security trade-offs, and data flow.
- [docs/database-design.md](docs/database-design.md) — Schema, indexes, relationship modeling, and revision rules.
- [docs/ai-usage.md](docs/ai-usage.md) — Prompts used, manual verifications, and engineering decisions.
