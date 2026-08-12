from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    """Normalizes DRF error responses to {"detail": str, "errors": dict|None}."""
    response = exception_handler(exc, context)

    if response is None:
        return response

    if isinstance(response.data, dict) and "detail" in response.data and len(response.data) == 1:
        response.data = {"detail": response.data["detail"], "errors": None}
    else:
        detail = response.data if isinstance(response.data, str) else "Validation failed."
        response.data = {"detail": detail, "errors": response.data}

    return response
