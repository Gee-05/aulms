from django.urls import path

from reports.views import (
    BorrowHistoryReportView,
    FineReportView,
    MonthlyStatsView,
    MostBorrowedReportView,
    OverdueReportView,
    StudentActivityReportView,
    SummaryReportView,
    YearlyStatsView,
)

urlpatterns = [
    path("summary/", SummaryReportView.as_view(), name="report-summary"),
    path("overdue/", OverdueReportView.as_view(), name="report-overdue"),
    path("borrow-history/", BorrowHistoryReportView.as_view(), name="report-borrow-history"),
    path("most-borrowed/", MostBorrowedReportView.as_view(), name="report-most-borrowed"),
    path("student-activity/", StudentActivityReportView.as_view(), name="report-student-activity"),
    path("fines/", FineReportView.as_view(), name="report-fines"),
    path("monthly/", MonthlyStatsView.as_view(), name="report-monthly"),
    path("yearly/", YearlyStatsView.as_view(), name="report-yearly"),
]
