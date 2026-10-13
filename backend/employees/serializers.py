from rest_framework import serializers

from .models import Department, Employee, SalaryRecord


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ["id", "name"]


class SalaryRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalaryRecord
        fields = [
            "id",
            "employee",
            "base_salary",
            "bonus",
            "currency",
            "effective_from",
            "effective_to",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_base_salary(self, value):
        if value < 0:
            raise serializers.ValidationError("Base salary cannot be negative.")
        return value

    def validate_bonus(self, value):
        if value < 0:
            raise serializers.ValidationError("Bonus cannot be negative.")
        return value

    def validate(self, data):
        employee = data.get("employee") or (self.instance.employee if self.instance else None)
        effective_from = data.get("effective_from")
        effective_to = data.get("effective_to")

        if effective_to and effective_from and effective_to <= effective_from:
            raise serializers.ValidationError({"effective_to": "effective_to must be after effective_from."})

        if effective_from and employee:
            self.check_overlap(employee, effective_from, effective_to)

        return data

    def check_overlap(self, employee, effective_from, effective_to):
        """Reject records whose effective period overlaps an existing one."""
        qs = SalaryRecord.objects.filter(employee=employee)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)

        for record in qs:
            if effective_to is None:
                # New record is open-ended
                if record.effective_to is None:
                    # Both are open-ended: if new starts after existing, it's a valid revision
                    # which will close the existing record. If it starts on/before, it overlaps.
                    if effective_from <= record.effective_from:
                        raise serializers.ValidationError(
                            {"effective_from": "This period overlaps an existing salary record."}
                        )
                else:
                    # Existing record has an end date; overlaps if it ends on or after effective_from
                    if record.effective_to >= effective_from:
                        raise serializers.ValidationError(
                            {"effective_from": "This period overlaps an existing salary record."}
                        )
            else:
                # New record has a defined end date [effective_from, effective_to]
                if record.effective_to is None:
                    # Existing record is open-ended [record.effective_from, inf)
                    # Overlaps if new record ends on or after record.effective_from
                    if effective_to >= record.effective_from:
                        raise serializers.ValidationError(
                            {"effective_from": "This period overlaps an existing salary record."}
                        )
                else:
                    # Both have defined intervals
                    if record.effective_from <= effective_to and record.effective_to >= effective_from:
                        raise serializers.ValidationError(
                            {"effective_from": "This period overlaps an existing salary record."}
                        )


class EmployeeListSerializer(serializers.ModelSerializer):
    """Lightweight serializer used for list/search results."""

    department_name = serializers.CharField(source="department.name", read_only=True)
    current_salary = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = [
            "id",
            "employee_code",
            "first_name",
            "last_name",
            "email",
            "department",
            "department_name",
            "job_title",
            "country",
            "employment_status",
            "date_joined",
            "current_salary",
        ]

    def get_current_salary(self, obj):
        # Uses prefetched data if available (avoids N+1)
        salaries = getattr(obj, "prefetched_salaries", None)
        if salaries is not None:
            current = next((s for s in salaries if s.effective_to is None), None)
        else:
            current = obj.salaries.filter(effective_to__isnull=True).first()

        if current is None:
            return None
        return {
            "base_salary": str(current.base_salary),
            "bonus": str(current.bonus),
            "currency": current.currency,
            "effective_from": current.effective_from,
        }


class EmployeeDetailSerializer(serializers.ModelSerializer):
    """Full serializer used for create/retrieve/update."""

    department_name = serializers.CharField(source="department.name", read_only=True)
    current_salary = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = [
            "id",
            "employee_code",
            "first_name",
            "last_name",
            "email",
            "department",
            "department_name",
            "job_title",
            "country",
            "employment_status",
            "date_joined",
            "current_salary",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_current_salary(self, obj):
        current = obj.salaries.filter(effective_to__isnull=True).first()
        if current is None:
            return None
        return {
            "id": current.id,
            "base_salary": str(current.base_salary),
            "bonus": str(current.bonus),
            "currency": current.currency,
            "effective_from": current.effective_from,
        }

    def validate_employee_code(self, value):
        qs = Employee.objects.filter(employee_code=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("An employee with this code already exists.")
        return value
