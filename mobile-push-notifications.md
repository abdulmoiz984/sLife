# SLife Mobile Push Notifications — Firebase Foundation

This document covers the initial Firebase Cloud Messaging (FCM) integration.
It provides device registration and test delivery only. Product events that
should notify users will be decided and implemented separately.

## Architecture

The flow follows the same general mobile pattern used by apps such as Zoom:

1. The mobile app asks the operating system for notification permission.
2. Firebase returns an FCM registration token for that app installation.
3. After SLife login, the app registers that token with the SLife API.
4. The backend sends through the FCM HTTP v1 API to all devices owned by a user.
5. The app routes a notification using the string values in `data`.
6. The app unregisters the token on logout; refreshed tokens are registered again.

One SLife user can have multiple Android/iOS devices. One FCM token belongs to
only one SLife user at a time.

## Backend setup

### 1. Create the Firebase project

In Firebase Console:

- Create/select the SLife project.
- Add the Android application and download `google-services.json`.
- Add the iOS application and download `GoogleService-Info.plist`.
- For iOS, configure the APNs authentication key in Firebase Cloud Messaging.
- Ensure the **Firebase Cloud Messaging API (HTTP v1)** is enabled.

The Android/iOS config files belong in their respective mobile projects, not in
this Laravel repository.

### 2. Create backend credentials

Firebase Console → Project settings → Service accounts → Generate new private key.

Save the JSON on the Laravel server outside `public/`, for example:

```text
storage/app/firebase/service-account.json
```

Never commit or expose this file. Configure:

```dotenv
FIREBASE_CREDENTIALS=storage/app/firebase/service-account.json
FIREBASE_PROJECT_ID=your-firebase-project-id
```

The backend uses the Firebase Admin SDK and short-lived OAuth credentials for
the FCM HTTP v1 API. Do not use the deprecated legacy FCM server key.

### 3. Deploy database changes

```bash
php artisan migrate --force
php artisan config:clear
```

## API conventions

Base URL:

```text
https://pro-fixer.demoappprojects.com/slife/api
```

All endpoints below are protected:

```http
Accept: application/json
Content-Type: application/json
Authorization: Bearer {sanctum_token}
```

## Register or refresh a device

`POST /push/register`

Call this:

- after login;
- after Firebase provides/refreshed a token;
- when the app version changes;
- when the same installation changes SLife account.

```json
{
  "token": "firebase-registration-token",
  "platform": "android",
  "device_id": "stable-app-installation-id",
  "app_version": "1.0.0"
}
```

`platform` must be `android` or `ios`. `device_id` is an app-installation ID,
not advertising ID or other sensitive hardware identifier.

Success `200`:

```json
{
  "success": true,
  "message": "Device registered for push notifications.",
  "device": {
    "id": 1,
    "platform": "android",
    "device_id": "stable-app-installation-id",
    "app_version": "1.0.0"
  }
}
```

## Unregister a device

`DELETE /push/unregister`

Call before logout when possible:

```json
{
  "token": "firebase-registration-token"
}
```

Success `200`:

```json
{
  "success": true,
  "message": "Device unregistered from push notifications."
}
```

This operation is idempotent. It succeeds if the token was already absent.

## Send a test notification

`POST /push/test`

This sends only to the authenticated user's registered devices:

```json
{
  "title": "SLife test",
  "body": "Push notifications are connected.",
  "data": {
    "screen": "home"
  }
}
```

Success `200`:

```json
{
  "success": true,
  "message": "Test push notification processed.",
  "delivery": {
    "attempted": 1,
    "sent": 1,
    "failed": 0,
    "removed_tokens": 0
  }
}
```

Errors:

- `401`: missing/invalid Sanctum token
- `422`: no registered device or invalid request
- `502`: Firebase rejected or could not deliver the request
- `503`: backend Firebase credentials are not configured

The backend automatically deletes invalid or unknown FCM tokens reported by
Firebase.

## Mobile lifecycle requirements

### Android

- Add Firebase Messaging to the Android app.
- Request notification permission on Android 13+.
- Handle both foreground messages and notification taps.
- Register every token received by `onNewToken`.

### iOS

- Add Firebase Messaging and configure APNs.
- Request notification permission.
- Forward the APNs token to Firebase Messaging.
- Handle foreground notifications and notification taps.
- Register every refreshed FCM token.

### Logout and account switching

Recommended order:

1. `DELETE /push/unregister` using the current FCM token.
2. `POST /logout`.
3. Clear local SLife auth state.

If unregister cannot complete, registering the same token after the next login
reassigns it to the current SLife user.

## Payload contract for future events

When business notifications are added, `data` values must be strings. Use a
stable `type` and IDs rather than sending private domain data:

```json
{
  "type": "connection_request",
  "connection_id": "42",
  "sender_id": "8"
}
```

The mobile app should switch on `type` and fetch current API data before opening
the destination screen. Do not treat push payloads as the source of truth.

## Not implemented yet

- Connection request/accept notifications
- Membership approval/rejection notifications
- Profile verification notifications
- Subscription/payment notifications
- Notification preferences
- In-app notification inbox
- Topic/broadcast notifications
