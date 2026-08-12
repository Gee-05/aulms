from rest_framework.routers import DefaultRouter

from books.views import BookReservationViewSet, BookViewSet, CategoryViewSet

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("reservations", BookReservationViewSet, basename="reservation")
router.register("", BookViewSet, basename="book")

urlpatterns = router.urls
