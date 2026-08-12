"""URL configuration for the Library Management System project."""

from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.decorators.clickjacking import xframe_options_exempt
from django.views.static import serve
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/books/", include("books.urls")),
    path("api/borrowing/", include("borrowing.urls")),
    path("api/notifications/", include("notifications.urls")),
    path("api/reports/", include("reports.urls")),
    path("api/core/", include("core.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
]

if settings.DEBUG:
    # Serve media (book covers, QR codes, ebook PDFs) with the default
    # X-Frame-Options: DENY (set globally by SecurityMiddleware) exempted -
    # otherwise browsers refuse to render the ebook PDF inside the in-app
    # <iframe> reader. Static file content isn't a clickjacking target the
    # way an interactive page is, so this is safe to exempt broadly.
    urlpatterns += [
        re_path(
            r"^media/(?P<path>.*)$",
            xframe_options_exempt(serve),
            {"document_root": settings.MEDIA_ROOT},
        ),
    ]
