# SLife Mobile Subscriptions — React Native PaymentSheet

This guide is for the mobile team using `@stripe/stripe-react-native`.
SLife supports one subscription package and does not support upgrades or
downgrades.

## Base URL and authentication

```text
https://pro-fixer.demoappprojects.com/slife/api
```

Protected requests require:

```http
Accept: application/json
Content-Type: application/json
Authorization: Bearer {sanctum_token}
```

`GET /packages` is public. All `/subscriptions/*` endpoints are protected.

Never put the Stripe secret key or webhook secret in the mobile app. The
publishable key returned by the PaymentSheet endpoint is safe to use.

## Endpoints

- `GET /packages`
- `POST /subscriptions/payment-sheet`
- `POST /subscriptions/activate-trial`
- `GET /subscriptions/me`
- `POST /subscriptions/cancel`
- `POST /subscriptions/resume`
- `POST /subscriptions/portal`

## Complete subscription flow

1. Fetch `GET /packages` and display the single returned package.
2. Call `POST /subscriptions/payment-sheet` with its local `package_id`.
3. Initialize Stripe with the returned `publishable_key`.
4. Initialize and present PaymentSheet using the returned intent.
5. If PaymentSheet succeeds and
   `requires_subscription_activation` is `true`, call
   `POST /subscriptions/activate-trial`.
6. Poll `GET /subscriptions/me` until `is_subscribed` is `true`.
7. Refresh subscription status when the app starts or returns to the foreground.

The backend chooses one of two secure flows:

- Package without a trial: creates an incomplete Stripe subscription and
  returns its first invoice PaymentIntent.
- Package with a trial: returns a SetupIntent first. After PaymentSheet confirms
  the payment method, the activation endpoint creates the trial subscription.
  This prevents access from being granted when a user abandons PaymentSheet.

## 1. Fetch the package

```http
GET /packages
```

Example:

```json
{
  "success": true,
  "message": "Packages retrieved.",
  "packages": [
    {
      "id": 1,
      "name": "SLife Membership",
      "price": 29.99,
      "currency": "USD",
      "billing_cycle": "monthly",
      "formatted_price": "$29.99/mo",
      "trial_days": 14,
      "features": ["profile", "connections", "messaging"],
      "feature_labels": [
        "Full profile & portfolio access",
        "Unlimited member connections",
        "Direct messaging"
      ],
      "is_checkout_ready": true
    }
  ]
}
```

Disable Subscribe when `is_checkout_ready` is `false`. Send only `package_id`
to the subscription endpoint. Never send an amount, currency, Stripe Product ID,
or Stripe Price ID from the mobile app.

## 2. Initialize PaymentSheet

```http
POST /subscriptions/payment-sheet
Authorization: Bearer {sanctum_token}
Content-Type: application/json
```

Body:

```json
{
  "package_id": 1
}
```

Example for an immediately charged package:

```json
{
  "success": true,
  "message": "PaymentSheet initialized.",
  "payment_sheet": {
    "subscription_id": "sub_...",
    "setup_intent_id": null,
    "requires_subscription_activation": false,
    "intent_type": "payment",
    "intent_client_secret": "pi_..._secret_...",
    "customer_id": "cus_...",
    "customer_session_client_secret": "cuss_...",
    "publishable_key": "pk_test_..."
  }
}
```

Example for a package with trial days:

```json
{
  "success": true,
  "message": "PaymentSheet initialized.",
  "payment_sheet": {
    "subscription_id": null,
    "setup_intent_id": "seti_...",
    "requires_subscription_activation": true,
    "intent_type": "setup",
    "intent_client_secret": "seti_..._secret_...",
    "customer_id": "cus_...",
    "customer_session_client_secret": "cuss_...",
    "publishable_key": "pk_test_..."
  }
}
```

Repeated requests for an unpaid, non-trial subscription reuse its existing
PaymentIntent and return a fresh Customer Session.

## 3. React Native implementation

Install and configure `@stripe/stripe-react-native` according to its native iOS
and Android installation instructions.

```typescript
import {
  initStripe,
  useStripe,
} from '@stripe/stripe-react-native';

type PaymentSheetParams = {
  subscription_id: string | null;
  setup_intent_id: string | null;
  requires_subscription_activation: boolean;
  intent_type: 'payment' | 'setup';
  intent_client_secret: string;
  customer_id: string;
  customer_session_client_secret: string;
  publishable_key: string;
};

async function fetchPaymentSheet(
  apiBase: string,
  token: string,
  packageId: number,
): Promise<PaymentSheetParams> {
  const response = await fetch(`${apiBase}/subscriptions/payment-sheet`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({package_id: packageId}),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.message ?? 'Unable to initialize payment.');
  }

  return body.payment_sheet;
}
```

Inside the payment screen:

```typescript
const {initPaymentSheet, presentPaymentSheet} = useStripe();

async function subscribe(packageId: number) {
  const sheet = await fetchPaymentSheet(API_BASE, token, packageId);

  await initStripe({
    publishableKey: sheet.publishable_key,
  });

  const intent =
    sheet.intent_type === 'payment'
      ? {paymentIntentClientSecret: sheet.intent_client_secret}
      : {setupIntentClientSecret: sheet.intent_client_secret};

  const {error: initError} = await initPaymentSheet({
    merchantDisplayName: 'SLife',
    customerId: sheet.customer_id,
    customerSessionClientSecret: sheet.customer_session_client_secret,
    returnURL: 'slife://stripe-redirect',
    allowsDelayedPaymentMethods: false,
    ...intent,
  });

  if (initError) {
    throw new Error(initError.message);
  }

  const {error: paymentError} = await presentPaymentSheet();
  if (paymentError) {
    if (paymentError.code === 'Canceled') {
      return;
    }
    throw new Error(paymentError.message);
  }

  if (
    sheet.requires_subscription_activation &&
    sheet.setup_intent_id
  ) {
    await activateTrial(packageId, sheet.setup_intent_id);
  }

  await waitForSubscription();
}
```

Configure the `slife://stripe-redirect` URL scheme/App Link in both native
projects. Replace it if the mobile app uses another registered return URL.

## 4. Activate a trial after SetupIntent success

Call this only after `presentPaymentSheet()` succeeds and the PaymentSheet
response had `requires_subscription_activation: true`.

```http
POST /subscriptions/activate-trial
Authorization: Bearer {sanctum_token}
Content-Type: application/json
```

Body:

```json
{
  "package_id": 1,
  "setup_intent_id": "seti_..."
}
```

The backend retrieves the SetupIntent directly from Stripe and verifies:

- It succeeded.
- It belongs to the authenticated user's Stripe Customer.
- Its metadata matches the authenticated user and selected package.
- It contains a saved payment method.

The response contains the full subscription status. The endpoint is safe to
retry after a network timeout.

## 5. Read subscription status

```http
GET /subscriptions/me
Authorization: Bearer {sanctum_token}
```

Example:

```json
{
  "success": true,
  "message": "Subscription status retrieved.",
  "subscription": {
    "is_subscribed": true,
    "on_trial": false,
    "on_grace_period": false,
    "status": "active",
    "trial_ends_at": null,
    "ends_at": null,
    "package": {
      "id": 1,
      "name": "SLife Membership",
      "price": 29.99,
      "currency": "USD",
      "billing_cycle": "monthly"
    },
    "payment_method": {
      "type": "visa",
      "last_four": "4242"
    }
  }
}
```

Use `is_subscribed` as the main access flag. A successful PaymentSheet result
means Stripe accepted the confirmation flow, but the webhook remains the
authoritative source for the final subscription state.

Poll status immediately after success, then every 2 seconds for up to 30
seconds. If it still has not updated, show a pending message and refresh when
the app resumes.

## 6. Cancel and resume

Cancel at the end of the current billing period:

```http
POST /subscriptions/cancel
Authorization: Bearer {sanctum_token}
```

While cancelled, expect `on_grace_period: true`, `status: "cancelled"`, and an
`ends_at` value. Access continues until that date.

Resume during the grace period:

```http
POST /subscriptions/resume
Authorization: Bearer {sanctum_token}
```

Both endpoints require no request body and return the updated subscription
object.

## 7. Billing portal

```http
POST /subscriptions/portal
Authorization: Bearer {sanctum_token}
Content-Type: application/json
```

Body:

```json
{
  "return_url": "https://your-mobile-domain.example/settings/subscription"
}
```

Open the returned `portal_url` in a browser. Configure Stripe Customer Portal
for payment-method and invoice management only. Keep subscription switching
disabled because SLife supports only one package.

## Error handling

- `401`: clear the invalid Sanctum token and return to sign-in.
- `404`: package does not exist.
- `422`: invalid input, package unavailable, billing unavailable, incomplete
  SetupIntent, or user already subscribed.
- `429`: API rate limited; retry after a delay.
- `502`: Stripe request failed; show a retry action.

For a Laravel validation error, read `message` and `errors`:

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "package_id": ["You already have an active subscription."]
  }
}
```

## Test checklist

1. Confirm `GET /packages` returns one package with
   `is_checkout_ready: true`.
2. Initialize PaymentSheet using the returned intent type.
3. In Stripe test mode use card `4242 4242 4242 4242`, any future expiry,
   and any CVC.
4. Confirm a no-trial package returns `intent_type: "payment"`.
5. Confirm a trial package returns `intent_type: "setup"` and call
   `/subscriptions/activate-trial` after PaymentSheet succeeds.
6. Confirm `GET /subscriptions/me` becomes subscribed.
7. Confirm another PaymentSheet request returns `422`.
8. Test PaymentSheet cancellation and ensure no trial is activated.
9. Test subscription cancellation and resume.
10. Open the billing portal and return to the app.
