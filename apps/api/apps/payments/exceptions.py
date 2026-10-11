"""
Payments and RevenueCat integration exception classes.
"""


class PaymentsError(Exception):
    """Base exception for all payments errors."""


class RevenueCatConfigurationError(PaymentsError):
    """Raised when server credentials or configuration are missing."""


class RevenueCatNetworkError(PaymentsError):
    """Raised on connection timeout or network transport failure."""


class RevenueCatServiceError(PaymentsError):
    """Raised when RevenueCat responds with 5xx or rate limit 429."""


class RevenueCatAuthenticationError(PaymentsError):
    """Raised when RevenueCat returns 401 or 403."""


class RevenueCatClientError(PaymentsError):
    """Raised on 4xx client errors other than 404."""
