from .settings import *  # noqa: F403

# Disable throttling during tests
REST_FRAMEWORK["DEFAULT_THROTTLE_CLASSES"] = []  # noqa: F405
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"] = {  # noqa: F405
    "login": "1000/minute",  # High limit so tests never hit it
    "anon": "1000/hour",
    "user": "10000/hour",
}

# Use an in-memory database for speed
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}
