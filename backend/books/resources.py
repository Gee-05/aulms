from import_export import fields, resources
from import_export.widgets import ForeignKeyWidget

from books.models import Book, Category


class CategoryResource(resources.ModelResource):
    class Meta:
        model = Category
        fields = ("id", "name", "description")
        export_order = fields


class BookResource(resources.ModelResource):
    # Import/export by category *name* rather than raw PK, so a CSV/Excel
    # file is human-editable without needing to know internal category IDs.
    category = fields.Field(
        column_name="category",
        attribute="category",
        widget=ForeignKeyWidget(Category, field="name"),
    )

    class Meta:
        model = Book
        # Deliberately excludes cover_image/ebook_file/qr_code - those are
        # binary uploads, not spreadsheet-editable data, and qr_code is
        # auto-generated on save anyway.
        fields = (
            "id",
            "isbn",
            "title",
            "author",
            "category",
            "description",
            "publisher",
            "publication_year",
            "total_copies",
            "available_copies",
            "shelf_location",
            "status",
        )
        export_order = fields
        import_id_fields = ("isbn",)
