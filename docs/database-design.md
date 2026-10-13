# Database Design

## Models

### Department

| Field | Type | Notes |
|---|---|---|
| id | AutoField (PK) | |
| name | CharField(100) | unique |
| created_at | DateTimeField | auto_now_add |

Simple lookup table. Seeded once; HR can add via admin.

---

### Employee

| Field | Type | Notes |
|---|---|---|
| id | AutoField (PK) | |
| employee_code | CharField(20) | unique, indexed |
| first_name | CharField(100) | |
| last_name | CharField(100) | |
| email | EmailField | unique, indexed |
| department | FK → Department | on_delete=PROTECT |
| job_title | CharField(150) | |
| country | CharField(100) | indexed |
| employment_status | CharField(20) | choices: active, inactive, terminated |
| date_joined | DateField | |
| created_at | DateTimeField | auto_now_add |
| updated_at | DateTimeField | auto_now |

`employment_status` uses a TextChoices enum. `department` is protected from deletion if employees reference it.

---

### SalaryRecord

| Field | Type | Notes |
|---|---|---|
| id | AutoField (PK) | |
| employee | FK → Employee | on_delete=CASCADE, indexed |
| base_salary | DecimalField(12,2) | ≥ 0 |
| bonus | DecimalField(10,2) | ≥ 0, default 0 |
| currency | CharField(3) | ISO 4217, e.g. USD |
| effective_from | DateField | indexed |
| effective_to | DateField | nullable — null means current |
| created_at | DateTimeField | auto_now_add |
| updated_at | DateTimeField | auto_now |

**Current salary rule**: the record where `effective_to IS NULL` is the active salary. Only one such record is allowed per employee at a time — enforced in the serializer and via a partial unique constraint (`UniqueConstraint` with `condition=Q(effective_to__isnull=True)`).

**Salary revision flow**:
1. Wrap in a transaction.
2. Set `effective_to = new_effective_from - 1 day` on the current record.
3. Insert the new record with `effective_to = NULL`.

This preserves full history without duplicating salary data.

---

### User (Django built-in)

Django's `auth.User` is used for HR authentication. No custom user model is needed. HR Managers are identified by membership in the `HR Manager` group, which is created during the initial setup command.

---

## Relationships

```
Department ──< Employee ──< SalaryRecord
User (HR Manager group)
```

## Indexes Summary

| Model | Indexed Fields |
|---|---|
| Employee | employee_code, email, department_id, country, employment_status |
| SalaryRecord | employee_id, effective_from |

Django's FK fields are automatically indexed. The others are declared with `db_index=True` or listed in `Meta.indexes`.
