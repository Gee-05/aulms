from rest_framework.routers import DefaultRouter

from borrowing.views import BorrowRecordViewSet, BorrowRequestViewSet, FineViewSet

router = DefaultRouter()
router.register("requests", BorrowRequestViewSet, basename="borrow-request")
router.register("records", BorrowRecordViewSet, basename="borrow-record")
router.register("fines", FineViewSet, basename="fine")

urlpatterns = router.urls
