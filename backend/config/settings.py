"""
Django settings for the Library Management System project.
"""

from datetime import timedelta
from pathlib import Path

from decouple import Csv, config

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config(
    "SECRET_KEY",
    default="django-insecure-)se2eh2gclir^o4n!-z5tbu(dz_qdenl212=h-^q#0&lvt)a($",
)

DEBUG = config("DEBUG", default=True, cast=bool)

ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="localhost,127.0.0.1", cast=Csv())

# Application definition

INSTALLED_APPS = [
    # jazzmin must be listed before django.contrib.admin - it overrides the
    # admin's templates.
    "jazzmin",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # third-party
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_filters",
    "drf_spectacular",
    "import_export",
    # local apps
    "core",
    "accounts",
    "books",
    "borrowing",
    "notifications",
    "reports",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


# Database
# Kept isolated so switching to PostgreSQL later only requires changing this
# block (and the DATABASE_URL / DB_* env vars), nothing else in the codebase.
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


# Internationalization

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True


# Static / media files

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# Django REST Framework

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_PAGINATION_CLASS": "core.pagination.StandardResultsSetPagination",
    "PAGE_SIZE": 10,
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ),
    "EXCEPTION_HANDLER": "core.exceptions.custom_exception_handler",
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    "TOKEN_OBTAIN_SERIALIZER": "accounts.serializers.CustomTokenObtainPairSerializer",
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Library Management System API",
    "DESCRIPTION": "REST API for the AULMS Library Management System (students, librarians, administrators).",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}


# Django Admin (Jazzmin theme + django-import-export)
# Renames/reskins the built-in Django Admin - the same URLs (/admin/), just
# a friendlier UI. This is the Administrator's "Advanced Settings" panel per
# the app's own nav link.

JAZZMIN_SETTINGS = {
    "site_title": "Advanced Settings",
    "site_header": "Advanced Settings",
    "site_brand": "Advanced Settings",
    "welcome_sign": "Welcome to AULMS Advanced Settings",
    "copyright": "AULMS Library",
    "search_model": ["books.Book", "accounts.User"],
    "show_sidebar": True,
    "navigation_expanded": True,
    "changeform_format": "horizontal_tabs",
    "icons": {
        "auth.Group": "fas fa-users-cog",
        "accounts.User": "fas fa-user",
        "accounts.StudentProfile": "fas fa-user-graduate",
        "accounts.LibrarianProfile": "fas fa-user-tie",
        "books.Book": "fas fa-book",
        "books.Category": "fas fa-tags",
        "books.BookReservation": "fas fa-bookmark",
        "borrowing.BorrowRequest": "fas fa-file-signature",
        "borrowing.BorrowRecord": "fas fa-exchange-alt",
        "borrowing.Fine": "fas fa-money-bill-wave",
        "notifications.Notification": "fas fa-bell",
        "core.ActivityLog": "fas fa-history",
        "core.LibraryPolicy": "fas fa-sliders-h",
    },
    "order_with_respect_to": ["accounts", "books", "borrowing", "notifications", "core", "auth"],
}

JAZZMIN_UI_TWEAKS = {
    "navbar": "navbar-dark",
    "accent": "accent-primary",
    "sidebar": "sidebar-dark-primary",
    "brand_colour": "navbar-indigo",
    "theme": "flatly",
    "default_theme_mode": "auto",
    "sidebar_nav_flat_style": True,
}

# Atomic bulk imports via django-import-export (Book/Category/etc. admin
# list views get Import/Export buttons for CSV/Excel/JSON).
IMPORT_EXPORT_USE_TRANSACTIONS = True


# CORS - frontend dev server (Vite)

CORS_ALLOWED_ORIGINS = config(
    "CORS_ALLOWED_ORIGINS",
    default="http://localhost:5173,http://127.0.0.1:5173",
    cast=Csv(),
)
CORS_ALLOW_CREDENTIALS = True


# Email - console backend by default. Point EMAIL_BACKEND at
# django.core.mail.backends.smtp.EmailBackend + the EMAIL_HOST_* vars below
# to send real email in production.
EMAIL_BACKEND = config(
    "EMAIL_BACKEND", default="django.core.mail.backends.console.EmailBackend"
)
EMAIL_HOST = config("EMAIL_HOST", default="")
EMAIL_PORT = config("EMAIL_PORT", default=587, cast=int)
EMAIL_HOST_USER = config("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD", default="")
EMAIL_USE_TLS = config("EMAIL_USE_TLS", default=True, cast=bool)
DEFAULT_FROM_EMAIL = config("DEFAULT_FROM_EMAIL", default="library@example.com")


# Library business rules

LOAN_PERIOD_DAYS = config("LOAN_PERIOD_DAYS", default=14, cast=int)
FINE_PER_DAY = config("FINE_PER_DAY", default=0.50, cast=float)
MAX_RENEWALS = config("MAX_RENEWALS", default=1, cast=int)
RENEWAL_PERIOD_DAYS = config("RENEWAL_PERIOD_DAYS", default=7, cast=int)
DUE_SOON_REMINDER_DAYS = config("DUE_SOON_REMINDER_DAYS", default=2, cast=int)

# NOTE: these four are now also editable at runtime via LibraryPolicy
# (core app, Admin-only /api/core/policy/) - these settings just seed its
# defaults on first access. Left in place as the pre-DB fallback / for
# management commands that run before any request has touched the policy row.

# Base URL of the React frontend, used to build links in outgoing emails
# (e.g. the password reset link).
FRONTEND_URL = config("FRONTEND_URL", default="http://localhost:5173")
