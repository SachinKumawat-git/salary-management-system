from rest_framework.permissions import BasePermission


class IsHRManager(BasePermission):
    """
    Grants full access to HR Manager group members and System Administrators (staff/superusers).
    Access is denied for regular non-HR users.
    """

    message = "You must be an HR Manager or Administrator to access this resource."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.user.is_superuser
                or request.user.is_staff
                or request.user.groups.filter(name="HR Manager").exists()
            )
        )
