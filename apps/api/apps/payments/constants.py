"""
Canonical billing and subscription constants for Happy Women.
"""

# Canonical store product identifiers
PRODUCT_PREMIUM_MONTHLY = "premium_monthly"
PRODUCT_PREMIUM_ANNUAL = "premium_annual"

CANONICAL_PRODUCT_IDS = (
    PRODUCT_PREMIUM_MONTHLY,
    PRODUCT_PREMIUM_ANNUAL,
)

# Canonical RevenueCat entitlement identifier
ENTITLEMENT_PREMIUM = "premium"

# Commercial planning target pricing hypotheses (USD)
# Note: Actual store prices remain authoritative and localized in Google Play Console.
TARGET_PRICE_MONTHLY_USD = "4.99"
TARGET_PRICE_ANNUAL_USD = "29.99"

# Legacy compatibility mapping for historical client or store discrepancies
LEGACY_PRODUCT_ID_MAP = {
    "premium_yearly": PRODUCT_PREMIUM_ANNUAL,
}


def resolve_canonical_product_id(product_id: str) -> str:
    """Resolve an incoming product ID to its canonical representation."""
    if not product_id:
        return ""
    normalized = product_id.strip()
    return LEGACY_PRODUCT_ID_MAP.get(normalized, normalized)
