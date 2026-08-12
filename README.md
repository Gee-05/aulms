# AULMS — Library Management System

Full-stack library management system with separate Student, Librarian, and
Administrator experiences.

- **Backend**: Django + Django REST Framework, JWT auth (SimpleJWT), SQLite (swap-in Postgres ready)
- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Admin panel**: Django Admin (full CRUD for every model)

## Project layout

```
AULMS/
  backend/       Django project (apps: core, accounts, books, borrowing, notifications, reports)
  Frontend/      React + Vite + TypeScript app
```

## Backend setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # adjust values as needed
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser   # creates an Administrator (role auto-set)
python manage.py runserver 8000
```

- API root: `http://127.0.0.1:8000/api/`
- Swagger docs: `http://127.0.0.1:8000/api/docs/`
- Django Admin: `http://127.0.0.1:8000/admin/`

Librarian accounts are provisioned by an Administrator — either via Django
Admin (create a `User` with role `librarian`, then fill in the inline
`LibrarianProfile` — employee ID, department) or via the CLI:

```bash
python manage.py create_librarian        # interactive, like createsuperuser
```

Students self-register from the frontend `/register` page.

### Demo data

To populate categories, a spread of books (including one overdue-with-a-fine
and one returned, for realistic dashboards/reports), a librarian, and three
students in one step:

```bash
python manage.py seed_demo_data
```

Safe to re-run — everything is `get_or_create`'d. Prints the seeded login
credentials when done.

### Business rules (env-configurable, see `.env.example`)

| Setting | Default | Meaning |
|---|---|---|
| `LOAN_PERIOD_DAYS` | 14 | Default due date on approval |
| `FINE_PER_DAY` | 0.50 | Overdue fine per day, charged on return |
| `MAX_RENEWALS` | 1 | Renewals allowed per borrow |
| `RENEWAL_PERIOD_DAYS` | 7 | Days added per renewal |
| `DUE_SOON_REMINDER_DAYS` | 2 | Window for "due soon" notifications |

### Overdue sweep (cron/Celery target)

Overdue status + fine calculation happens automatically at return time. To
proactively flag overdue records and send due-soon/overdue reminders, run:

```bash
python manage.py update_overdue_status
```

In production, schedule this via cron or Celery beat (e.g. every 30 minutes).

### Switching to PostgreSQL

Replace the `DATABASES` block in `backend/config/settings.py` with a Postgres
engine (`django.db.backends.postgresql`) and the relevant `DB_*` env vars —
nothing else in the codebase depends on SQLite.

### Sending real email

Set `EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend` in `.env` and
fill in `EMAIL_HOST`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, etc. The
console backend (default) just prints emails to the terminal.

## Frontend setup

```bash
cd Frontend
npm install
cp .env.example .env   # VITE_API_BASE_URL, defaults to http://127.0.0.1:8000/api
npm run dev
```

Visit `http://localhost:5173`.

## Roles at a glance

- **Student** (`/register` to sign up): browse/search the catalog, submit
  borrow requests, cancel pending requests, view borrowed books, request
  renewals, view fines/history, edit profile, in-app + email notifications.
- **Librarian** (created by an Administrator): approve/reject requests
  (sets borrow/due dates), confirm returns, approve/reject renewals, manage
  books/categories/students, view reports.
- **Administrator** (`createsuperuser`): full Django Admin access to every
  model, plus a lightweight dashboard for system stats, activity logs, and
  reports in the React app.

## Notes on scope

- Overdue detection/fines are computed automatically (on return, and via the
  `update_overdue_status` management command) rather than through a live
  background worker — see "Overdue sweep" above for scheduling it in production.
- QR codes are generated per-book (encoding ISBN + ID) and served from `/media/`.
- Report exports (PDF via `reportlab`, Excel via `openpyxl`) are available for
  summary, borrow history, most-borrowed, student activity, fine, and
  monthly/yearly stats reports.
- Actions taken through the API are logged to `ActivityLog` explicitly (rich,
  specific action names). Actions taken through Django Admin are logged too,
  via an `AuditedAdminMixin` on each `ModelAdmin` (`core/admin_mixins.py`) —
  so the audit trail covers both surfaces without double-logging either.
