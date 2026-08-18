# SLife Mobile Chat — React Native Integration

This is the version 1 one-to-one text chat implementation.

## Rules

- Only users with an **accepted connection** can start/send messages.
- Messaging is disabled if either user blocks the other.
- Messaging is disabled after disconnect, but old history stays visible.
- Reconnecting reopens the same conversation and preserves its history.
- Both users must still be available (not rejected).
- Messages are text-only, max 2,000 characters.
- Each send requires a client UUID to make mobile retries idempotent.

## Delivery architecture

- REST API: conversations, history, send and read state
- Pusher Channels: live messages and read receipts
- FCM: background/offline “sent you a message” notification
- Database: permanent message history and unread state

Laravel Echo runs in the React Native application. Shared hosting does **not**
need a Node.js process.

## Backend environment

Create a Pusher Channels app and configure:

```dotenv
BROADCAST_CONNECTION=pusher
PUSHER_APP_ID=
PUSHER_APP_KEY=
PUSHER_APP_SECRET=
PUSHER_APP_CLUSTER=
```

After deployment:

```bash
php artisan migrate --force
php artisan config:clear
php artisan queue:work --tries=3
```

On shared hosting without a permanent worker, configure a cron job that runs
`php artisan queue:work --stop-when-empty --tries=3` every minute.

## Authentication

REST and Pusher private-channel authentication use the same Sanctum token:

```http
Authorization: Bearer {token}
Accept: application/json
```

Pusher auth endpoint:

```text
POST /api/broadcasting/auth
```

## REST APIs

### Open or reuse a conversation

`POST /chats`

```json
{
  "user_id": 9
}
```

This returns the existing conversation for the pair or creates one. It returns
`422` unless the connection is accepted and neither side is blocked.

### List conversations

`GET /chats?per_page=20`

Each conversation includes:

- `other_user`
- `connection_status`
- `last_message`
- `unread_count`
- `last_read_message_id`
- `is_blocked`
- `can_send`

Disconnected or blocked conversations remain in this list with
`can_send: false`.

### Load message history

`GET /chats/{conversation_id}/messages?limit=30&before_id=500`

Messages are returned newest first. For the first page, omit `before_id`.
For the next page, send `meta.next_before_id`.

History remains available after disconnect/block.

### Send a message

`POST /chats/{conversation_id}/messages`

```json
{
  "client_message_id": "7ec62541-26dc-4667-9bd1-437bc6456ee9",
  "body": "Hello there"
}
```

Generate one UUID when the user presses send. Reuse that UUID if the network
request is retried. The backend returns the original message rather than
creating a duplicate.

Chat sends are limited to 30 requests/minute/user.

### Mark messages read

`POST /chats/{conversation_id}/read`

```json
{
  "last_message_id": 501
}
```

Omit `last_message_id` to mark through the latest message.

## Blocking APIs

```text
GET    /blocked-users
POST   /users/{user_id}/block
DELETE /users/{user_id}/block
```

Blocking is idempotent. It prevents messages in either direction but does not
delete the connection, conversation or old messages.

## React Native Echo

Install these packages in the **mobile app project**:

```bash
npm install laravel-echo pusher-js
```

Example setup:

```javascript
import Echo from 'laravel-echo';
import Pusher from 'pusher-js/react-native';

global.Pusher = Pusher;

export function createEcho(apiOrigin, token, pusherKey, cluster) {
  return new Echo({
    broadcaster: 'pusher',
    key: pusherKey,
    cluster,
    forceTLS: true,
    authEndpoint: `${apiOrigin}/api/broadcasting/auth`,
    auth: {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  });
}
```

`apiOrigin` is the site origin without the trailing `/api`, for example:

```text
https://pro-fixer.demoappprojects.com/slife
```

Subscribe after opening a conversation:

```javascript
const channel = echo.private(`chat.${conversationId}`);

channel.listen('.message.sent', ({ message }) => {
  // Deduplicate by message.id or client_message_id, then add to the thread.
});

channel.listen('.conversation.read', (receipt) => {
  // receipt.user_id
  // receipt.last_read_message_id
  // receipt.read_at
});
```

Leave the channel when closing the thread or logging out:

```javascript
echo.leave(`chat.${conversationId}`);
echo.disconnect();
```

## FCM payload for background chat

```json
{
  "type": "chat_message",
  "conversation_id": "12",
  "message_id": "884",
  "sender_id": "8"
}
```

On notification tap:

1. Open the conversation screen.
2. Fetch the conversation/messages from REST.
3. Do not use the push body as the message source of truth.

The lock-screen body is deliberately generic (`Sent you a message.`) for
privacy.

## Pusher events

Private channel:

```text
private-chat.{conversation_id}
```

Events:

```text
.message.sent
.conversation.read
```

Only conversation participants can authenticate to the private channel.

## Not included in version 1

- Attachments
- Typing indicators
- Online presence
- Message editing/reactions
- Delete/unsend UI
- Voice/video calling
- Group chat
