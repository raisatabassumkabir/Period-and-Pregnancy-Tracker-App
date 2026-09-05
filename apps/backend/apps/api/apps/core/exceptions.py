"""
RFC 9457 Problem Details ("Problem+JSON") for every error the API returns.

Wired in as REST_FRAMEWORK["EXCEPTION_HANDLER"]. Views raise DRF exceptions
(or the ones defined here); nothing hand-builds an error dict. Every error
response has:

    {
      "type":     "https://apiguide.dev/errors/<slug>",   # dereferenceable
      "title":    "Validation Failed",                      # fixed per type
      "status":   422,
      "detail":   "...",                                    # one sentence, no health values
      "instance": "/api/daily-logs/",                       # request path
      "errors":   {"field": ["message"]}                    # validation / conflict only
    }

with Content-Type: application/problem+json. Exceptions may add RFC 9457
extension members via `problem_extensions` (the 402 paywall does). The slug
catalog is in .claude/skills/api-design/errors.md; conventions in CLAUDE.md;
the client-side mirror in packages/api-contract/CONTRACT.md.

Status mapping worth knowing:
  * serializers.ValidationError is remapped from DRF's 400 to 422 (parsed
    fine, failed the rules). ParseError stays 400 (could not parse).
  * A ValidationError whose codes are all "unique" (DRF's UniqueValidator /
    UniqueTogetherValidator) becomes 409 resource-conflict.
  * Unhandled exceptions become a generic 500 problem outside DEBUG. The
    traceback is logged; it is never sent to the client.
"""

from __future__ import annotations

import logging
from typing import Any

from django.conf import settings
from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

logger = logging.getLogger(__name__)

PROBLEM_TYPE_BASE = "https://apiguide.dev/errors/"
PROBLEM_CONTENT_TYPE = "application/problem+json"

# status -> (type URL, title). Specific exception classes override these below.
DEFAULT_PROBLEM_BY_STATUS: dict[int, tuple[str, str]] = {
    400: (PROBLEM_TYPE_BASE + "malformed-request-body", "Malformed Request Body"),
    401: (PROBLEM_TYPE_BASE + "unauthorized", "Unauthorized"),
    402: ("https://apiguide.dev/status-codes/402/", "Payment Required"),
    403: (PROBLEM_TYPE_BASE + "insufficient-scope", "Insufficient Scope"),
    404: (PROBLEM_TYPE_BASE + "resource-not-found", "Resource Not Found"),
    405: (PROBLEM_TYPE_BASE + "method-not-allowed", "Method Not Allowed"),
    406: (PROBLEM_TYPE_BASE + "not-acceptable", "Not Acceptable"),
    408: (PROBLEM_TYPE_BASE + "request-timeout", "Request Timeout"),
    409: (PROBLEM_TYPE_BASE + "resource-conflict", "Resource Conflict"),
    412: (PROBLEM_TYPE_BASE + "precondition-failed", "Precondition Failed"),
    413: (PROBLEM_TYPE_BASE + "payload-too-large", "Payload Too Large"),
    415: (PROBLEM_TYPE_BASE + "unsupported-media-type", "Unsupported Media Type"),
    422: (PROBLEM_TYPE_BASE + "validation-failed", "Validation Failed"),
    429: (PROBLEM_TYPE_BASE + "rate-limit-exceeded", "Rate Limit Exceeded"),
    500: (PROBLEM_TYPE_BASE + "internal-server-error", "Internal Server Error"),
    502: (PROBLEM_TYPE_BASE + "service-unavailable", "Service Unavailable"),
    503: (PROBLEM_TYPE_BASE + "service-unavailable", "Service Unavailable"),
    504: (PROBLEM_TYPE_BASE + "gateway-timeout", "Gateway Timeout"),
}

GENERIC_DETAIL_BY_STATUS: dict[int, str] = {
    409: "The request conflicts with the current state of the resource.",
    422: "One or more fields failed validation.",
    500: "An unexpected error occurred. It has been logged.",
}


# --- Exceptions views may raise -------------------------------------------------


class ProblemException(exceptions.APIException):
    """
    Base for our own exceptions. Subclasses set `problem_type` / `problem_title`;
    instances may carry `problem_extensions` (extra top-level members).
    """

    problem_type: str = ""
    problem_title: str = ""

    def __init__(self, detail=None, code=None, *, extensions: dict[str, Any] | None = None):
        super().__init__(detail, code)
        self.problem_extensions = dict(extensions or {})


class Conflict(ProblemException):
    """
    409: the request is well-formed and valid but conflicts with existing state —
    a duplicate daily log for a date, a second active pregnancy, an overlapping
    cycle. Accepts the same detail shapes as ValidationError, so
    `Conflict({"date": ["A log for this date already exists."]})` yields
    field-level `errors`.
    """

    status_code = status.HTTP_409_CONFLICT
    default_detail = GENERIC_DETAIL_BY_STATUS[409]
    default_code = "conflict"
    problem_type = PROBLEM_TYPE_BASE + "resource-conflict"
    problem_title = "Resource Conflict"


class IdempotencyKeyConflict(Conflict):
    """409: same Idempotency-Key, different request payload."""

    default_detail = "This Idempotency-Key was already used with a different request."
    default_code = "idempotency_key_conflict"
    problem_type = PROBLEM_TYPE_BASE + "idempotency-key-conflict"
    problem_title = "Idempotency Key Conflict"


class StaleResourceVersion(Conflict):
    """409: the client updated from a version that is no longer current."""

    default_detail = "The resource was modified since you last fetched it. Reload and retry."
    default_code = "stale_version"
    problem_type = PROBLEM_TYPE_BASE + "stale-resource-version"
    problem_title = "Stale Resource Version"


class PreconditionFailed(ProblemException):
    """412: an If-Match / If-Unmodified-Since precondition did not hold."""

    status_code = status.HTTP_412_PRECONDITION_FAILED
    default_detail = "The precondition given in the request headers did not hold."
    default_code = "precondition_failed"
    problem_type = PROBLEM_TYPE_BASE + "precondition-failed"
    problem_title = "Precondition Failed"


class UnprocessableQuery(ProblemException):
    """422: query parameters parse but make no sense together."""

    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    default_detail = "The query parameters are not usable together."
    default_code = "unprocessable_query"
    problem_type = PROBLEM_TYPE_BASE + "unprocessable-query"
    problem_title = "Unprocessable Query"


class ServiceUnavailable(ProblemException):
    """503: a dependency (database, cache, model provider) is not reachable."""

    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = "A required service is temporarily unavailable. Retry shortly."
    default_code = "service_unavailable"
    problem_type = PROBLEM_TYPE_BASE + "service-unavailable"
    problem_title = "Service Unavailable"


class PaymentRequired(ProblemException):
    """
    402: the paywall (packages/api-contract/CONTRACT.md §402). `detail` is the
    sentence the app shows verbatim; the rest are RFC 9457 extension members the
    mobile upgrade sheet reads. `feature` must be a `PremiumFeature` key.
    """

    status_code = status.HTTP_402_PAYMENT_REQUIRED
    default_detail = "Upgrade to Premium to unlock this feature."
    default_code = "payment_required"
    problem_type = "https://apiguide.dev/status-codes/402/"
    problem_title = "Payment Required"

    def __init__(
        self,
        message: str | None = None,
        *,
        feature: str = "premium",
        current_usage: int | None = None,
        limit: int | None = None,
        resets_at: str | None = None,
        upgrade_url: str | None = None,
    ):
        extensions: dict[str, Any] = {"feature": feature}
        if current_usage is not None:
            extensions["current_usage"] = current_usage
        if limit is not None:
            extensions["limit"] = limit
        if resets_at is not None:
            extensions["resets_at"] = resets_at
        if upgrade_url is not None:
            extensions["upgrade_url"] = upgrade_url
        super().__init__(message, extensions=extensions)


# --- The handler ----------------------------------------------------------------


def problem_exception_handler(exc: Exception, context: dict[str, Any]) -> Response | None:
    response = drf_exception_handler(exc, context)
    request = context.get("request")

    if response is None:
        # Not a DRF/Django exception the default handler knows. In DEBUG let
        # Django show its traceback page; otherwise answer with a generic 500
        # problem so the mobile client always gets JSON.
        if settings.DEBUG:
            return None
        logger.exception("Unhandled exception in %s", getattr(request, "path", "?"))
        response = Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    original_data = response.data
    if isinstance(exc, exceptions.ValidationError) and response.status_code == 400:
        response.status_code = 409 if _is_uniqueness_failure(original_data) else 422

    type_url, title = _problem_type(exc, response.status_code, request)
    problem: dict[str, Any] = {
        "type": type_url,
        "title": title,
        "status": response.status_code,
        "detail": _detail(exc, original_data, response.status_code),
    }
    if request is not None:
        problem["instance"] = request.path
    errors = _field_errors(exc, original_data)
    if errors:
        problem["errors"] = errors
    for key, value in getattr(exc, "problem_extensions", {}).items():
        problem.setdefault(key, value)

    if response.status_code == 405:
        allowed = getattr(context.get("view"), "allowed_methods", None)
        if allowed:
            response["Allow"] = ", ".join(allowed)

    response.data = problem
    response.content_type = PROBLEM_CONTENT_TYPE
    return response


# --- helpers --------------------------------------------------------------------


def _problem_type(exc: Exception, status_code: int, request: Any) -> tuple[str, str]:
    type_url = getattr(exc, "problem_type", "")
    title = getattr(exc, "problem_title", "")
    if type_url and title:
        return type_url, title

    if isinstance(exc, exceptions.ParseError):
        return DEFAULT_PROBLEM_BY_STATUS[400]
    if isinstance(exc, exceptions.AuthenticationFailed) and _mentions_expiry(exc):
        return (
            PROBLEM_TYPE_BASE + "expired-authentication-token",
            "Expired Authentication Token",
        )
    if (
        isinstance(exc, exceptions.NotFound)
        and request is not None
        and "cursor" in getattr(request, "query_params", {})
    ):
        return PROBLEM_TYPE_BASE + "invalid-pagination-cursor", "Invalid Pagination Cursor"

    return DEFAULT_PROBLEM_BY_STATUS.get(status_code, DEFAULT_PROBLEM_BY_STATUS[500])


def _mentions_expiry(exc: exceptions.AuthenticationFailed) -> bool:
    return "expired" in _flatten_messages(exc.detail).lower()


def _detail(exc: Exception, data: Any, status_code: int) -> str:
    """
    One human sentence. For validation/conflict errors: the non-field message
    when there is exactly one, else a generic summary — field messages live in
    `errors`. Never the exception text of an unhandled error.
    """
    if not isinstance(exc, exceptions.APIException):
        return GENERIC_DETAIL_BY_STATUS[500]
    if isinstance(exc, exceptions.ValidationError | Conflict):
        non_field = _non_field_messages(data)
        if len(non_field) == 1:
            return non_field[0]
        return GENERIC_DETAIL_BY_STATUS.get(status_code, GENERIC_DETAIL_BY_STATUS[422])
    if isinstance(data, dict) and "detail" in data:
        return str(data["detail"])
    return str(exc.default_detail)


def _field_errors(exc: Exception, data: Any) -> dict[str, Any] | None:
    """DRF's error dict, minus non_field_errors (which became `detail`), as plain JSON."""
    if not isinstance(exc, exceptions.ValidationError | Conflict):
        return None
    if isinstance(data, dict):
        cleaned = {k: _plain(v) for k, v in data.items() if k not in ("non_field_errors", "detail")}
        return cleaned or None
    return None


def _non_field_messages(data: Any) -> list[str]:
    if isinstance(data, dict):
        raw = data.get("non_field_errors", data.get("detail", []))
    else:
        raw = data
    if not isinstance(raw, list):
        raw = [raw]
    return [str(m) for m in raw]


def _is_uniqueness_failure(data: Any) -> bool:
    codes = _codes(data)
    return bool(codes) and all(code == "unique" for code in codes)


def _codes(data: Any) -> list[str]:
    if isinstance(data, exceptions.ErrorDetail):
        return [data.code]
    if isinstance(data, dict):
        return [c for v in data.values() for c in _codes(v)]
    if isinstance(data, list):
        return [c for v in data for c in _codes(v)]
    return []


def _plain(value: Any) -> Any:
    if isinstance(value, dict):
        return {k: _plain(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_plain(v) for v in value]
    return str(value)


def _flatten_messages(value: Any) -> str:
    if isinstance(value, dict):
        return " ".join(_flatten_messages(v) for v in value.values())
    if isinstance(value, list):
        return " ".join(_flatten_messages(v) for v in value)
    return str(value)
