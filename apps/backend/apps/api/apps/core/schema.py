"""
drf-spectacular post-processing hook: publish the Problem+JSON shape once as a
component and attach the error responses every endpoint can produce, so the
generated mobile client gets a typed `ProblemDetail` instead of `unknown`.
"""

from __future__ import annotations

from typing import Any

PROBLEM_DETAIL_SCHEMA: dict[str, Any] = {
    "type": "object",
    "description": "RFC 9457 Problem Details. `type` is a dereferenceable apiguide.dev URL.",
    "required": ["type", "title", "status", "detail"],
    "properties": {
        "type": {"type": "string", "format": "uri"},
        "title": {"type": "string"},
        "status": {"type": "integer"},
        "detail": {"type": "string"},
        "instance": {"type": "string"},
        "errors": {
            "type": "object",
            "description": "Field name -> list of messages (validation and conflict errors).",
            "additionalProperties": True,
        },
    },
    "additionalProperties": True,
}

_PROBLEM_REF = {"$ref": "#/components/schemas/ProblemDetail"}
_HTTP_METHODS = {"get", "post", "put", "patch", "delete", "head", "options", "trace"}

_COMMON: dict[str, str] = {
    "401": "Missing, invalid or expired bearer token.",
    "402": "Paywall: free quota exhausted or premium-only feature. Extension members: "
    "feature, current_usage, limit, resets_at.",
    "404": "Not found — including another user's resource.",
    "405": "Method not allowed on this resource.",
    "429": "Rate limit exceeded; honour Retry-After.",
    "500": "Unexpected server error.",
}
_ON_WRITE: dict[str, str] = {
    "400": "Malformed request body.",
    "409": "Conflicts with existing state (duplicate, stale version).",
    "415": "Unsupported media type.",
    "422": "Validation failed; see `errors`.",
}


def add_problem_responses(result: dict, generator: Any, request: Any, public: bool) -> dict:
    schemas = result.setdefault("components", {}).setdefault("schemas", {})
    schemas.setdefault("ProblemDetail", PROBLEM_DETAIL_SCHEMA)

    for path_item in result.get("paths", {}).values():
        for method, operation in path_item.items():
            if method.lower() not in _HTTP_METHODS or not isinstance(operation, dict):
                continue
            responses = operation.setdefault("responses", {})
            wanted = dict(_COMMON)
            if method.lower() in {"post", "put", "patch"}:
                wanted.update(_ON_WRITE)
            for code, description in wanted.items():
                responses.setdefault(
                    code,
                    {
                        "description": description,
                        "content": {"application/problem+json": {"schema": _PROBLEM_REF}},
                    },
                )
    return result
