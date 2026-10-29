from typing import Any


def require_response_fields(result: dict[str, Any], **kwargs: Any) -> dict[str, Any]:
    """Mark every property of response components as required.

    Our response serializers always emit every field (nullable ones as ``null``), but DRF fields with
    model defaults are reported optional. Request components (``*Request``) are left untouched so the
    generated TypeScript client keeps optional inputs optional.
    """
    for name, schema in result.get("components", {}).get("schemas", {}).items():
        if name.endswith("Request") or schema.get("type") != "object" or "properties" not in schema:
            continue
        schema["required"] = sorted(schema["properties"])
    return result
