# SLife Mobile — Subscription Upgrade & Downgrade

This guide covers changing packages on an existing Stripe subscription.
Initial checkout remains documented in [`mobile-subscriptions.md`](mobile-subscriptions.md).

Plan changes follow Stripe Billing proration through Laravel Cashier:

- Upgrade / higher plan → Cashier `swapAndInvoice()` when prorations are enabled
- Downgrade / lower plan → same Stripe swap path; unused time becomes credit
- When prorations are disabled in admin settings → Cashier `noProrate()->swap()`

## Rules

- The user must already have a valid subscription.
- The user must not have an outstanding incomplete payment.
- The target package must be active and Stripe-linked (`is_checkout_ready: true`).
- The user cannot select their current package again.
- Changing plans does **not** use PaymentSheet unless Stripe requires SCA.
- `POST /subscriptions/payment-sheet` still rejects users who are already subscribed.
- A cancelled subscription that is still in its grace period can be swapped;
  Stripe/Cashier clears the scheduled cancellation when the price is swapped.

## Endpoint

```http
POST /api/subscriptions/change-plan
Authorization: Bearer {sanctum_token}
Content-Type: application/json
```

Body:

```json
{
  "package_id": 2
}
```

Send only the local package ID. Never send Stripe Product IDs, Price IDs,
amounts, or currencies from the mobile app.

## Success response

```json
{
  "success": true,
  "message": "Subscription upgraded.",
  "change_type": "upgrade",
  "requires_action": false,
  "payment_intent_client_secret": null,
  "subscription": {
    "is_subscribed": true,
    "status": "active",
    "message_allowance": {
      "limit": 20,
      "used": 1,
      "remaining": 19,
      "unlimited": false,
      "resets_at": "2026-11-06T00:00:00+00:00"
    },
    "package": {
      "id": 2,
      "name": "Growth",
      "description": [
        "View Professional Profile and Messages up to 20 per day"
      ],
      "daily_message_limit": 20,
      "message_limit_label": "Up to 20 messages per day"
    }
  }
}
```

`subscription.package` uses the same shape as `GET /packages`.

### `change_type`

Calculated from monthly-equivalent package price:

- `upgrade` — new package costs more per month
- `downgrade` — new package costs less per month
- `switch` — monthly-equivalent price is the same

Yearly packages are normalized as `price / 12` for the comparison.

## Stripe payment confirmation (SCA)

If Stripe needs additional authentication after the swap, the API still updates
the package and returns:

```json
{
  "success": true,
  "message": "Plan updated. Additional payment confirmation is required.",
  "change_type": "upgrade",
  "requires_action": true,
  "payment_intent_client_secret": "pi_..._secret_...",
  "subscription": {}
}
```

Mobile handling:

1. Call `initStripe` with the publishable key from a previous PaymentSheet
   response or from your app config.
2. Confirm the PaymentIntent with
   `confirmPayment(payment_intent_client_secret, ...)` from
   `@stripe/stripe-react-native`.
3. After confirmation succeeds, refetch `GET /subscriptions/me`.

If `requires_action` is `false`, the plan change is already complete.

## Recommended mobile flow

1. Fetch `GET /packages` and `GET /subscriptions/me`.
2. Highlight the user's current package.
3. Let the user choose another package.
4. Confirm the change with clear upgrade/downgrade copy.
5. Call `POST /subscriptions/change-plan`.
6. If `requires_action`, complete the PaymentIntent.
7. Invalidate/refetch `['subscription', 'me']`.
8. Refresh message allowance UI from the new package.

Suggested confirmation copy:

- Upgrade: "You'll move to this plan immediately. Stripe will prorate the
  unused time on your current plan and charge the difference when required."
- Downgrade: "You'll move to this plan immediately. Stripe will credit unused
  time toward future invoices when prorations are enabled."

## Error cases

| Situation | Result |
|-----------|--------|
| Not subscribed | `422` validation on `subscription` |
| Outstanding incomplete payment | `422` validation on `subscription` |
| Same package selected | `422` validation on `package_id` |
| Inactive / unlinked package | `422` validation on `package_id` |
| Stripe API failure | `502` with a retryable message |
| Missing/invalid token | `401` |

Example validation response:

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "package_id": ["You are already subscribed to this package."]
  }
}
```

## Admin / Stripe behavior notes

- Admin setting `subscription.prorate_upgrades` controls proration:
  - enabled → `swapAndInvoice`
  - disabled → `noProrate()->swap`
- Stripe Prices are immutable. Existing subscribers keep their Stripe Price
  until they change plans.
- After a successful change, local `package_id`, Stripe price, and
  message allowance follow the new package.
- Do not open Customer Portal for package switching; use this API.

## Acceptance checklist

- Subscribed user can move from a cheaper package to a higher one.
- Subscribed user can move from a higher package to a cheaper one.
- Selecting the current package returns validation error.
- Unsubscribed users cannot call change-plan.
- Successful change returns the new package description and message limit.
- SCA path returns `requires_action` plus a PaymentIntent client secret.
- After confirmation, `GET /subscriptions/me` reflects the new package.
- Message allowance immediately follows the new package limit.
