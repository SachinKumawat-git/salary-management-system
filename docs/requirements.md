# Requirements & Product Framing

## 1. Context & Problem Statement

**Organization**: ACME Corp (~10,000 employees worldwide across 10+ countries).  
**User Persona**: HR Manager.

Currently, ACME's HR team manages salary and compensation records for 10,000 employees using fragmented Excel spreadsheets. This manual workflow creates severe operational friction:
- **No historical audit trail**: When salaries are updated, previous compensation figures are overwritten or lost across spreadsheet versions.
- **Data integrity & concurrency issues**: No validation for overlapping pay periods, duplicate employee codes, or negative compensation numbers.
- **Inability to answer executive compensation questions**: The HR Manager struggles to quickly answer basic leadership questions:
  1. *How does ACME pay people across departments and global locations?*
  2. *What are the minimum, average, and maximum salary bands per team?*
  3. *What is an employee's full salary revision history over their tenure?*
  4. *What is the breakdown of active workforce vs. inactive or departed personnel?*

The goal is to replace error-prone Excel spreadsheets with a unified, high-performance, web-based Employee Salary Management System.

---

## 2. Goals & Core Features

1. **Authentication & Role-Based Access**
   - Secure login and session management tailored for the HR Manager role.
   - Access tokens stored in memory with silent token refresh via HttpOnly cookies.

2. **Executive Compensation Dashboard**
   - Real-time aggregate KPIs: Total Headcount (10,000), Active Personnel, Inactive/Terminated.
   - Compensation Averages strictly segmented by ISO currency (USD, EUR, GBP, CAD, etc.).
   - Interactive visual charts for department headcount and geographic distribution.

3. **Employee Directory (10,000 Personnel Scale)**
   - Sub-second server-side search by employee code, first name, and last name.
   - Dynamic filtering by Department and Employment Status (Active, Inactive, Terminated).
   - Multi-column sorting (Last Name, First Name, Date Joined, Code).
   - Server-side pagination (10, 25, 50, 100 rows per page).
   - Quick modal form to register new employees with validation against duplicate codes and emails.

4. **Salary Revisions & Timeline Audit Trail**
   - Detailed compensation views for every employee (Base salary, bonus, currency, total OTE).
   - **Automated Revision Workflow**: Adding a new open-ended salary revision automatically closes the previous active record as of `effective_from - 1 day` inside an atomic transaction.
   - **Strict Overlap Prevention**: Mathematical validation blocking overlapping or backwards date intervals.
   - Chronological audit table recording every salary change over time.

5. **Salary Analytics & Pay Distribution**
   - Department- and country-level salary statistics computed via database ORM aggregations.
   - Visual bar charts illustrating Min, Avg, and Max base salary spreads by department.
   - Filters for Department, Country, and Currency.

6. **High-Performance 10,000 Employee Seeder**
   - CLI command `python manage.py seed_employees --count 10000` using bulk operations.
   - Generates realistic multi-national employees with authentic multi-year salary histories.
   - 100% idempotent: safely re-executable without generating duplicates.

---

## 3. Scope & Deliberate Exclusions

| In Scope | Deliberately Out of Scope | Reasoning for Exclusion |
|---|---|---|
| HR Manager persona & workflows | Employee self-service portal | Focus is solving the HR team's operational bottleneck without inflating the authorization boundary. |
| Strict currency segregation | Automated multi-currency FX conversion | Blending international salaries with fluctuating exchange rates distorts true contractual payroll. Segregated currencies preserve exact financial truth. |
| Full employee CRUD (UI soft-status) | Hard deletion from UI | Hard deleting records destroys compensation audit compliance. Employees are transitioned to `Inactive` or `Terminated`. |
| DB-level aggregations & indexed queries | Heavy async message brokers (Celery/Redis) | With indexed columns, SQLite processes queries across 10,000 rows in <20ms. Introducing Celery/Redis would overengineer a single-developer deployment. |
| SQLite local database | Cloud-managed RDS clusters (Phase 2) | SQLite satisfies the local portability constraint while Django ORM ensures frictionless future migration to PostgreSQL. |
| Unit & Integration test suites | Complex end-to-end multi-browser CI matrices | Prioritizes deterministic, fast pytest backend suites (43 tests) and Vitest frontend suites (9 tests). |

---

## 4. Performance & Engineering Constraints

- **Scale Target**: 10,000 employees with ~18,000 historical salary records.
- **Latency Target**: <50 ms query latency for paginated list, search, and dashboard aggregations. (Achieved: **11–20 ms** in benchmark testing).
- **Security**: PBKDF2 password hashing, scoped login rate throttling (5 attempts/min), CSRF protection, and HttpOnly JWT storage.
- **Code Quality**: Zero linter errors under `ruff` (backend) and `oxlint` (frontend); 100% passing automated test suites.
