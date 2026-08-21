# Mobile Subscription Content Gating

This document defines the subscription-based content restrictions shared by the
SLife backend and mobile application.

## Access rule

Use the subscription object returned by:

```http
GET /api/subscriptions/me
```

`subscription.is_subscribed` is the primary mobile access flag.

Access is granted when the user has:

- An active subscription.
- An active trial.
- A cancelled subscription that is still within its grace period.

Access is denied when the subscription is missing, incomplete, expired, or
fully cancelled.

## Locked content

Unsubscribed users cannot access:

- Chat list.
- Opening a conversation.
- Conversation messages.
- Sending messages.
- Marking conversations as read.
- Real-time private chat channels.
- Full member profile/details screens.
- Advanced Discover filters.

## Content that remains available

Unsubscribed users can still access:

- Basic Discover/member cards.
- Recommended matches.
- Connection request and management actions.
- Their own profile and onboarding.
- Package and subscription APIs.
- Notifications and application settings.

The mobile app should show enough basic member information to demonstrate the
network’s value, then open the paywall when the user requests full details.

## Protected backend endpoints

All chat endpoints require subscription access:

```text
GET  /api/chats
POST /api/chats
GET  /api/chats/{conversation}/messages
POST /api/chats/{conversation}/messages
POST /api/chats/{conversation}/read
```

Full member profile requires subscription access:

```text
GET /api/members/{user}
```

Basic member discovery remains available:

```text
GET /api/members
GET /api/members/matches
```

`GET /api/members` returns a subscription error only when the request includes
an advanced filter.

Advanced filters include:

- `industry`
- `professional_role`
- `organization_size`
- `location`
- `verification_badge`
- `min_years`
- `max_years`
- `interests`
- `networking_goals`

## Subscription-required response

Protected content returns HTTP `422`:

```json
{
  "success": false,
  "message": "An active subscription is required to access this content.",
  "code": "SUBSCRIPTION_REQUIRED",
  "errors": {
    "subscription": [
      "Subscribe to unlock member profiles, advanced discovery, and messaging."
    ]
  }
}
```

Mobile must use `code === "SUBSCRIPTION_REQUIRED"` rather than comparing the
human-readable message.

## Mobile behavior

Use React Query as the subscription source of truth:

```text
['subscription', 'me']
```

### Proactive gating

When cached `is_subscribed` is `false`:

- Chat tab or chat action → open `SubscriptionScreen`.
- Member card “View profile” → open `SubscriptionScreen`.
- Advanced filter interaction → open `SubscriptionScreen`.
- Show a lock icon or premium badge on restricted actions.

Basic Discover cards and connection actions must remain usable.

### Server fallback

The cached status can become stale. Add a global API error handler:

```typescript
if (error.response?.data?.code === 'SUBSCRIPTION_REQUIRED') {
  queryClient.invalidateQueries({
    queryKey: ['subscription', 'me'],
  });

  navigation.navigate('SubscriptionScreen');
}
```

Avoid showing both an error toast and the paywall for this response.

## Status refresh points

Refetch `['subscription', 'me']`:

- After login.
- When the app returns to the foreground.
- After PaymentSheet succeeds.
- After trial activation.
- After cancel or resume.
- After returning from Stripe Customer Portal.
- When the user taps Refresh status.
- After receiving `SUBSCRIPTION_REQUIRED`.

## Trial and grace-period UX

Trial users have full subscribed access.

Grace-period users also retain full access until `ends_at`. Show that their
subscription is cancelled and display the access end date, but do not lock
content early.

Once the grace period ends and status refreshes, restricted content should open
the paywall.

## Real-time chat

The backend denies private chat-channel authorization for unsubscribed users.
Mobile should also avoid subscribing to chat channels while unsubscribed.

After subscription activation:

1. Refetch subscription status.
2. Mount or reconnect the chat real-time client.
3. Refresh conversations and unread counts.

After access expires:

1. Leave private chat channels.
2. Clear chat queries from active screens.
3. Route chat screens to the paywall.

Existing message history remains stored and becomes available again after the
user subscribes.

## Acceptance checklist

- Unsubscribed user can browse basic member cards.
- Unsubscribed user can manage connections.
- Full member profile opens the paywall.
- Every chat entry point opens the paywall.
- Advanced filters open the paywall.
- Direct protected API calls return `SUBSCRIPTION_REQUIRED`.
- Active subscribers can access all protected content.
- Trial users can access all protected content.
- Grace-period users retain access until `ends_at`.
- Expired users lose access after status refresh.
- Unsubscribed users cannot authorize private chat channels.
- Mobile never relies only on UI hiding for access control.
