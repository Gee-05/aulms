"""
Interactive (or scriptable) librarian account provisioning - the librarian
equivalent of `createsuperuser`, since librarians aren't self-registered
(only students are, by design).

Usage:
    python manage.py create_librarian

Non-interactive (e.g. CI/setup scripts), mirroring createsuperuser --noinput:
    DJANGO_LIBRARIAN_USERNAME=lib1 DJANGO_LIBRARIAN_PASSWORD=... \\
    DJANGO_LIBRARIAN_EMPLOYEE_ID=EMP001 python manage.py create_librarian --noinput
"""

import getpass
import os

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.management.base import BaseCommand, CommandError
from django.db import IntegrityError

from accounts.models import LibrarianProfile, User


class Command(BaseCommand):
    help = "Creates a librarian user account and librarian profile."

    def add_arguments(self, parser):
        parser.add_argument("--noinput", "--no-input", action="store_false", dest="interactive", default=True)
        parser.add_argument("--username", default=None)
        parser.add_argument("--email", default=None)
        parser.add_argument("--employee-id", default=None)

    def handle(self, *args, **options):
        interactive = options["interactive"]

        if interactive:
            username = self._prompt("Username: ", options["username"])
            email = self._prompt("Email: ", options["email"])
            employee_id = self._prompt("Employee ID: ", options["employee_id"])
            department = input("Department (optional): ").strip()
            first_name = input("First name (optional): ").strip()
            last_name = input("Last name (optional): ").strip()
            password = self._prompt_password()
        else:
            username = options["username"] or os.environ.get("DJANGO_LIBRARIAN_USERNAME")
            email = options["email"] or os.environ.get("DJANGO_LIBRARIAN_EMAIL", "")
            employee_id = options["employee_id"] or os.environ.get("DJANGO_LIBRARIAN_EMPLOYEE_ID")
            department = os.environ.get("DJANGO_LIBRARIAN_DEPARTMENT", "")
            first_name = os.environ.get("DJANGO_LIBRARIAN_FIRST_NAME", "")
            last_name = os.environ.get("DJANGO_LIBRARIAN_LAST_NAME", "")
            password = os.environ.get("DJANGO_LIBRARIAN_PASSWORD")
            if not all([username, employee_id, password]):
                raise CommandError(
                    "--noinput requires DJANGO_LIBRARIAN_USERNAME, "
                    "DJANGO_LIBRARIAN_EMPLOYEE_ID, and DJANGO_LIBRARIAN_PASSWORD."
                )

        if User.objects.filter(username=username).exists():
            raise CommandError(f'A user named "{username}" already exists.')
        if LibrarianProfile.objects.filter(employee_id=employee_id).exists():
            raise CommandError(f'Employee ID "{employee_id}" is already in use.')

        try:
            user = User.objects.create(
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name,
                role=User.Role.LIBRARIAN,
            )
            user.set_password(password)
            user.save()
            LibrarianProfile.objects.create(user=user, employee_id=employee_id, department=department)
        except IntegrityError as exc:
            raise CommandError(str(exc)) from exc

        self.stdout.write(self.style.SUCCESS(f'Librarian "{username}" created successfully.'))

    def _prompt(self, label, provided):
        if provided:
            return provided
        value = input(label).strip()
        if not value:
            raise CommandError(f"{label.strip(': ')} is required.")
        return value

    def _prompt_password(self):
        while True:
            password = getpass.getpass("Password: ")
            password2 = getpass.getpass("Password (again): ")
            if password != password2:
                self.stderr.write("Passwords didn't match. Try again.")
                continue
            try:
                validate_password(password)
            except DjangoValidationError as exc:
                self.stderr.write("\n".join(exc.messages))
                continue
            return password
