"""
Populates the database with realistic demo data so the app is ready to click
through immediately, instead of hand-building test accounts/books via the
admin or shell every time. Safe to re-run - everything is get_or_create'd.

Usage:
    python manage.py seed_demo_data
"""

from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import LibrarianProfile, StudentProfile, User
from books.models import Book, Category
from borrowing.models import BorrowRecord, BorrowRequest, Fine

CATEGORIES = [
    ("Fiction", "Novels, short stories, and other imaginative works."),
    ("Non-Fiction", "Real-world subjects: essays, memoirs, general knowledge."),
    ("Science & Technology", "Computing, engineering, and the natural sciences."),
    ("History", "Historical accounts and analysis."),
    ("Biography", "Life stories of notable people."),
]

BOOKS = [
    ("9780132350884", "Clean Code", "Robert C. Martin", "Science & Technology", "Prentice Hall", 2008, "A1-01", 3),
    ("9780201633610", "Design Patterns", "Erich Gamma et al.", "Science & Technology", "Addison-Wesley", 1994, "A1-02", 2),
    ("9780262033848", "Introduction to Algorithms", "Cormen, Leiserson, Rivest, Stein", "Science & Technology", "MIT Press", 2009, "A1-03", 2),
    ("9780451524935", "Nineteen Eighty-Four", "George Orwell", "Fiction", "Signet Classics", 1949, "B2-01", 4),
    ("9780141439518", "Pride and Prejudice", "Jane Austen", "Fiction", "Penguin Classics", 1813, "B2-02", 3),
    ("9780061120084", "To Kill a Mockingbird", "Harper Lee", "Fiction", "Harper Perennial", 1960, "B2-03", 3),
    ("9780393609394", "Sapiens", "Yuval Noah Harari", "Non-Fiction", "Harper", 2015, "C3-01", 2),
    ("9780345391803", "A Brief History of Time", "Stephen Hawking", "Science & Technology", "Bantam", 1988, "A1-04", 2),
    ("9780679783268", "Guns, Germs, and Steel", "Jared Diamond", "History", "W. W. Norton", 1997, "D4-01", 2),
    ("9780743273565", "The Great Gatsby", "F. Scott Fitzgerald", "Fiction", "Scribner", 1925, "B2-04", 3),
    ("9781501127625", "Steve Jobs", "Walter Isaacson", "Biography", "Simon & Schuster", 2011, "E5-01", 2),
    # Written ~440 BC; publication_year is a PositiveIntegerField so BC dates
    # aren't representable - left blank rather than seeding a wrong value.
    ("9780140449136", "The Histories", "Herodotus", "History", "Penguin Classics", None, "D4-02", 1),
]

STUDENTS = [
    ("student1", "Ama", "Boateng", "student1@example.com"),
    ("student2", "Kwame", "Mensah", "student2@example.com"),
    ("student3", "Efua", "Owusu", "student3@example.com"),
]


class Command(BaseCommand):
    help = "Seeds demo categories, books, a librarian, students, and sample borrow activity."

    def handle(self, *args, **options):
        categories = self._seed_categories()
        books = self._seed_books(categories)
        librarian = self._seed_librarian()
        students = self._seed_students()
        self._seed_borrow_activity(students, books, librarian)

        self.stdout.write(self.style.SUCCESS("Demo data ready."))
        self.stdout.write("  Librarian login:  librarian / Librarian123!")
        self.stdout.write("  Student logins:   student1 / Student123!  (also student2, student3)")

    def _seed_categories(self):
        categories = {}
        for name, description in CATEGORIES:
            category, _ = Category.objects.get_or_create(name=name, defaults={"description": description})
            categories[name] = category
        self.stdout.write(f"Categories: {len(categories)}")
        return categories

    def _seed_books(self, categories):
        books = {}
        for isbn, title, author, category_name, publisher, year, shelf, copies in BOOKS:
            book, _ = Book.objects.get_or_create(
                isbn=isbn,
                defaults={
                    "title": title,
                    "author": author,
                    "category": categories[category_name],
                    "publisher": publisher,
                    "publication_year": year,
                    "shelf_location": shelf,
                    "total_copies": copies,
                    "available_copies": copies,
                },
            )
            books[isbn] = book
        self.stdout.write(f"Books: {len(books)}")
        return books

    def _seed_librarian(self):
        user, created = User.objects.get_or_create(
            username="librarian",
            defaults={
                "email": "librarian@example.com",
                "first_name": "Kofi",
                "last_name": "Asante",
                "role": User.Role.LIBRARIAN,
            },
        )
        if created:
            user.set_password("Librarian123!")
            user.save()
            LibrarianProfile.objects.get_or_create(
                user=user, defaults={"employee_id": "EMP-DEMO1", "department": "Circulation"}
            )
        self.stdout.write("Librarian: 1")
        return user

    def _seed_students(self):
        students = []
        for username, first_name, last_name, email in STUDENTS:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    "email": email,
                    "first_name": first_name,
                    "last_name": last_name,
                    "role": User.Role.STUDENT,
                },
            )
            if created:
                user.set_password("Student123!")
                user.save()
                StudentProfile.objects.get_or_create(
                    user=user, defaults={"student_id": f"STU{user.id:05d}"}
                )
            students.append(user)
        self.stdout.write(f"Students: {len(students)}")
        return students

    def _seed_borrow_activity(self, students, books, librarian):
        today = timezone.now().date()
        book_list = list(books.values())
        if not book_list or not students:
            return

        # student1: an active, on-time borrow.
        self._ensure_borrow(students[0], book_list[0], librarian, today - timedelta(days=3), today + timedelta(days=11))

        # student2: an overdue borrow with an unpaid fine.
        record = self._ensure_borrow(
            students[1], book_list[1], librarian, today - timedelta(days=20), today - timedelta(days=6)
        )
        if record and record.status == BorrowRecord.Status.BORROWED:
            record.status = BorrowRecord.Status.OVERDUE
            record.save(update_fields=["status"])
            record.book.refresh_status()
            Fine.objects.get_or_create(
                record=record, defaults={"amount": 3.00, "reason": "6 day(s) overdue"}
            )

        # student3: a completed, returned borrow (history).
        record = self._ensure_borrow(
            students[2], book_list[2], librarian, today - timedelta(days=30), today - timedelta(days=16)
        )
        if record and record.status != BorrowRecord.Status.RETURNED:
            record.return_date = today - timedelta(days=18)
            record.status = BorrowRecord.Status.RETURNED
            record.save()
            record.book.available_copies = min(record.book.total_copies, record.book.available_copies + 1)
            record.book.save(update_fields=["available_copies"])
            record.book.refresh_status()

        # student1: a pending request awaiting librarian action.
        if len(book_list) > 3:
            BorrowRequest.objects.get_or_create(
                student=students[0], book=book_list[3], status=BorrowRequest.Status.PENDING
            )

    def _ensure_borrow(self, student, book, librarian, borrow_date, due_date):
        existing = BorrowRecord.objects.filter(student=student, book=book).first()
        if existing:
            return existing

        borrow_request = BorrowRequest.objects.create(
            student=student,
            book=book,
            status=BorrowRequest.Status.APPROVED,
            processed_by=librarian,
            processed_at=timezone.now(),
            borrow_date=borrow_date,
            due_date=due_date,
        )
        record = BorrowRecord.objects.create(
            request=borrow_request, student=student, book=book, borrow_date=borrow_date, due_date=due_date
        )
        book.available_copies = max(0, book.available_copies - 1)
        book.save(update_fields=["available_copies"])
        book.refresh_status()
        return record
