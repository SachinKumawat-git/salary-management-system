from rest_framework.permissions import BasePermission


class IsHRManager(BasePermission):
    """
    Grants full access to HR Manager group members.
    Read-only access is denied for non-HR users — all routes require HR role.
    """

    message = "You must be an HR Manager to access this resource."

    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and request.user.groups.filter(name="HR Manager").exists()
        )
