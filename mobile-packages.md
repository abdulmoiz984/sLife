# SLife Mobile Packages

This document describes the package-list contract for the mobile application.
Subscription payment and PaymentSheet behavior remain documented in
[`mobile-subscriptions.md`](mobile-subscriptions.md).

## Package rules

- Admins can create multiple packages.
- The mobile app receives every active package.
- A user selects one package before opening PaymentSheet.
- A user can have only one active subscription.
- Upgrades and downgrades are not currently supported.
- All packages unlock the same protected content.
- Package descriptions are display-only bullet items entered by an admin.

## Package list endpoint

```http
GET /api/packages
Accept: application/json
```

Authentication is not required.

Production URL:

```text
https://pro-fixer.demoappprojects.com/slife/api/packages
```

Example response:

```json
{
  "success": true,
  "message": "Packages retrieved.",
  "packages": [
    {
      "id": 1,
      "name": "Monthly Membership",
      "description": [
        "Flexible monthly billing",
        "Cancel at the end of your billing period"
      ],
      "price": 29.99,
      "currency": "USD",
      "billing_cycle": "monthly",
      "formatted_price": "$29.99/mo",
      "trial_days": 14,
      "features": [
        "profile",
        "connections",
        "messaging",
        "search",
        "events",
        "verification",
        "priority",
        "analytics"
      ],
      "feature_labels": [
        "Full profile & portfolio access",
        "Unlimited member connections",
        "Direct messaging",
        "Advanced search filters",
        "Event & webinar access",
        "Verification badge eligibility",
        "Priority support",
        "Profile analytics dashboard"
      ],
      "is_checkout_ready": true
    },
    {
      "id": 2,
      "name": "Annual Membership",
      "description": [
        "Best annual value",
        "One payment per year"
      ],
      "price": 299.99,
      "currency": "USD",
      "billing_cycle": "yearly",
      "formatted_price": "$299.99/yr",
      "trial_days": 14,
      "features": [
        "profile",
        "connections",
        "messaging",
        "search",
        "events",
        "verification",
        "priority",
        "analytics"
      ],
      "feature_labels": [
        "Full profile & portfolio access",
        "Unlimited member connections",
        "Direct messaging",
        "Advanced search filters",
        "Event & webinar access",
        "Verification badge eligibility",
        "Priority support",
        "Profile analytics dashboard"
      ],
      "is_checkout_ready": true
    }
  ]
}
```

## Field reference

- `id`: Local package ID. Send this value as `package_id`.
- `name`: Admin-entered package name.
- `description`: Ordered list of admin-entered bullet items.
- `price`: Numeric recurring price.
- `currency`: Three-letter currency code.
- `billing_cycle`: `monthly` or `yearly`.
- `formatted_price`: Display-ready price.
- `trial_days`: Number of trial days; `0` means no trial.
- `features`: Stable machine-readable global entitlement keys.
- `feature_labels`: Stable display labels for the global entitlements.
- `is_checkout_ready`: Whether the package is active and linked to Stripe.

## Description rendering

Render each `description` item as a separate checked bullet, in the order
returned by the API.

```typescript
package.description.map((item) => (
  <FeatureRow key={item} icon="check">
    {item}
  </FeatureRow>
));
```

Descriptions can differ between packages because they explain pricing,
billing, or promotional details. They do not grant or remove application
permissions.

## Global entitlements

`features` and `feature_labels` are identical for every package. The backend
does not use a package's description to authorize content.

Every valid subscription unlocks:

- Full member profile and portfolio details.
- Member connections.
- Direct messaging and chat.
- Advanced Discover filters.
- Events and webinars.
- Verification badge eligibility.
- Priority support.
- Profile analytics.

See [`mobile-subscription-content-gating.md`](mobile-subscription-content-gating.md)
for the enforced API restrictions.

## Starting PaymentSheet

When the user chooses a package, send only its local ID:

```http
POST /api/subscriptions/payment-sheet
Authorization: Bearer {sanctum_token}
Content-Type: application/json
```

```json
{
  "package_id": 2
}
```

Never send the amount, currency, Stripe Product ID, or Stripe Price ID from the
mobile app. The backend resolves all Stripe billing information from
`package_id`.

Disable the subscription button when `is_checkout_ready` is `false`.

## Admin behavior

Each package supports:

- Name.
- Description list with up to 20 items.
- Maximum 160 characters per description item.
- Price and currency.
- Monthly or yearly billing.
- Trial days.
- Active/inactive status.
- Automatic Stripe Product and Price synchronization.

Changing package description updates the Stripe Product description. Changing
price, currency, or billing cycle creates a new Stripe Price because Stripe
Prices are immutable.

## Mobile acceptance checklist

- All active packages are displayed.
- Inactive packages are not expected from the endpoint.
- Description items render as individual checked bullets.
- Global feature labels remain the same for all packages.
- Subscribe is disabled when `is_checkout_ready` is false.
- The selected local `id` is sent as `package_id`.
- The mobile app never calculates or submits the payment amount.
- An already subscribed user cannot purchase another package.
