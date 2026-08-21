# Mobile Subscription Implementation Decisions

Use these decisions when implementing subscriptions in the SLife mobile app.
The API contract and React Native PaymentSheet examples are documented in
[`mobile-subscriptions.md`](mobile-subscriptions.md).

## Selected options

```text
1B 2A 3A 4B 5A 6A
```

## 1. Feature gating — Option B

When `subscription.is_subscribed === false`, lock:

- Messaging and chat entry points.
- Advanced Discover filters.

Tapping a locked entry point should open `SubscriptionScreen`.

The backend currently enforces the advanced Discover restriction. Messaging
should also be enforced server-side so the mobile UI is not the only access
control.

## 2. First delivery scope — Option A

Implement the complete subscription experience:

- Package and paywall UI.
- Native Stripe PaymentSheet.
- Subscription status.
- Trial activation when required.
- Cancel and resume.
- Stripe Customer Portal.
- Messaging and advanced Discover gates.

## 3. Restore purchase — Option A

Stripe subscriptions do not use an App Store-style restore-purchase flow.

- When unsubscribed, show **Refresh status**.
- When subscribed, show **Manage billing**.
- Refresh status by invalidating/refetching `['subscription', 'me']`.

## 4. Portal return behavior — Option B

For the initial release, open Stripe Customer Portal in the browser and let the
user close it or navigate back to the app.

Continue using `slife://stripe-redirect` as PaymentSheet's `returnURL`. Do not
use that custom scheme as the Customer Portal `return_url` until it has been
verified with Stripe. Send a safe HTTPS return URL to the portal API for now.

Later, replace this with an HTTPS Universal Link/App Link that returns directly
to the subscription settings screen.

## 5. Subscription state — Option A

Use React Query as the subscription source of truth:

```text
['subscription', 'me']
```

Refetch or invalidate it:

- After login.
- When the app returns to the foreground.
- After PaymentSheet succeeds.
- After trial activation.
- After cancel or resume.
- After returning from Customer Portal.
- When the user taps Refresh status.

Do not separately mirror subscription status into Redux because duplicated
state can become stale.

## 6. Trial CTA — Option A

When `trial_days > 0`, use:

```text
Start {N}-day free trial
```

When `trial_days === 0`, use:

```text
Subscribe now
```

Show the recurring price and billing cycle near the CTA. For a trial,
communicate that billing starts after the trial unless the subscription is
cancelled.

## Acceptance checklist

- Unsubscribed users are routed to the paywall from messaging and advanced
  Discover actions.
- Subscribed users can access those features.
- PaymentSheet handles both `payment` and `setup` intent types.
- Trial activation runs only after SetupIntent PaymentSheet succeeds.
- Subscription status refreshes after every billing action.
- Cancelled users retain access during the grace period.
- Portal plan switching remains disabled.
- No Stripe secret or webhook key is included in the mobile application.
