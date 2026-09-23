# Personal Chat API

Next.js App Router, PostgreSQL, Drizzle, JWT, Redis, and Vercel WebSockets backend for a WhatsApp-style chat application.

## Environment

Copy `.env.example` to `.env` and set:

- `DATABASE_URL`: pooled PostgreSQL URL (use Neon Singapore on Vercel)
- `JWT_SECRET`: long random secret
- `REDIS_URL`: Upstash Redis URL required for cross-instance real-time delivery
- `CORS_ORIGIN`: frontend origin, or `*` during local development
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Cloudinary server credentials for attachments
- `MEDIA_ENCRYPTION_KEY`: 32-byte base64 key used to encrypt media before it reaches Cloudinary

## Local development

```bash
docker compose up -d
pnpm db:migrate
pnpm dev
```

REST runs at `http://localhost:3000`. Vercel's WebSocket upgrade API requires the Vercel runtime, so test sockets with:

```bash
pnpm dev:ws
```

Except for register, login, and health, REST requests require `Authorization: Bearer <token>`.

## Deploy to Vercel

1. Push the repository to GitHub and import it in Vercel.
2. Add `DATABASE_URL`, `JWT_SECRET`, `REDIS_URL`, and `CORS_ORIGIN` to the Vercel project.
3. Create Upstash Redis from the Vercel Marketplace if you do not already have Redis.
4. Run `pnpm db:migrate` against the production database.
5. Deploy. `vercel.json` places functions in Singapore and gives the socket function the Hobby-plan maximum duration.

Production URLs:

```text
https://YOUR_PROJECT.vercel.app/api/health
wss://YOUR_PROJECT.vercel.app/ws?token=JWT_TOKEN
```

Vercel periodically closes WebSockets when a function reaches its maximum duration. Clients must reconnect with exponential backoff and reuse their JWT. Send `presence.ping` every 20-30 seconds to refresh presence.

## REST API

### Authentication

- `POST /api/auth/register` - `{ username, email, password, displayName }`
- `POST /api/auth/login` - `{ email, password }`

### Users and devices

- `GET /api/users/me`
- `PATCH /api/users/me` - `{ displayName?, avatarUrl?, about? }`
- `GET /api/users?search=alex&limit=20`
- `GET /api/users/:id`
- `POST /api/users/me/devices` - `{ token, platform: "web" | "ios" | "android" }`
- `DELETE /api/users/me/devices` - `{ token }`

### Conversations

- `GET /api/conversations`
- `POST /api/conversations` - direct: `{ type: "direct", participantId }`
- `POST /api/conversations` - group: `{ type: "group", name, memberIds, description?, avatarUrl? }`
- `GET /api/conversations/:id`
- `PATCH /api/conversations/:id` - `{ name?, description?, avatarUrl?, isMuted? }`
- `POST /api/conversations/:id/members` - `{ memberIds }` (admin)
- `PATCH /api/conversations/:id/members/:userId` - `{ role: "admin" | "member" }` (admin)
- `DELETE /api/conversations/:id/members/:userId` - remove member or leave

### Messages

- `GET /api/conversations/:id/messages?limit=30&cursor=...`
- `POST /api/conversations/:id/messages`
- `POST /api/conversations/:id/read` - `{ messageId }`
- `PATCH /api/messages/:id` - `{ content }`
- `DELETE /api/messages/:id`
- `POST /api/messages/:id/reactions` - `{ emoji }`
- `DELETE /api/messages/:id/reactions` - `{ emoji }`

Message body:

```json
{
  "clientId": "client-generated-id-for-idempotency",
  "type": "text",
  "content": "Hello",
  "replyToId": "optional-message-uuid",
  "attachments": []
}
```

Upload media to object storage first. Attachment entries support `url`, `type`, `name`, `mimeType`, `size`, and `thumbnailUrl`.

### Attachments

Upload files before sending a message:

```text
POST /api/uploads
Authorization: Bearer <token>
Content-Type: multipart/form-data
file: <file>
```

The response returns `data`, an array of attachment objects. Pass that array as `attachments` in `POST /api/conversations/:id/messages`. Up to 10 files can be uploaded per request, with a maximum size of 50 MB per file. Uploads require `conversationId` and membership in that conversation.

Media is encrypted with AES-256-GCM before being uploaded as an authenticated raw Cloudinary asset. Downloads go through `GET /api/attachments`, which checks conversation membership and decrypts the content. Since this endpoint requires a bearer token, clients should fetch the file with `Authorization` and display it using a Blob URL instead of placing the attachment URL directly in an `<img>` tag.

Generate the encryption key once and keep it secret:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

This protects media from Cloudinary and unauthorized API callers, but it is not end-to-end encryption: the backend holds the encryption key and can decrypt files. True end-to-end encryption requires generating keys in the clients and securely sharing them only with conversation participants.

## WebSocket events

Client events:

- `message.send`: message body plus `conversationId`; optional top-level `requestId`
- `typing.start` / `typing.stop`: `{ conversationId }`
- `receipt.read`: `{ conversationId, messageId }`
- `presence.ping`

Server events:

- `connection.ready`, `presence.pong`, `presence.changed`
- `message.ack`, `message.new`, `message.updated`, `message.deleted`, `message.reaction`
- `receipt.ack`, `receipt.read`
- `typing.start`, `typing.stop`
- `conversation.created`, `conversation.updated`, `conversation.members_updated`, `conversation.member_removed`
- `error`

`clientId` makes message retries idempotent per sender. Redis relays events across Vercel function instances; PostgreSQL remains the durable message store.
