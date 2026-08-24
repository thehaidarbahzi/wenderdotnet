# Setup Guide

## Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| Node.js | 20+ | |
| pnpm | 11+ | `corepack enable` if missing (packageManager is pinned in `package.json`) |
| Podman | 4+ | For the WhatsApp bot container (`podman compose`). Docker also works with the same file. |
| Supabase project | — | Free tier is enough for development |

## 1. Clone and install

```bash
git clone <repo-url> wenderdotnet
cd wenderdotnet
pnpm install
```

## 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in every value:

### Supabase

| Variable | Where to find it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page, "anon public" key |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page, "service_role" key. **Server-only. Never expose to the client or commit it.** |

In the Supabase dashboard:

1. **Authentication → Providers**: enable **Email** and **Google** (SSO). For Google you need an OAuth client ID/secret from Google Cloud Console with the Supabase redirect URI.
2. **SQL Editor**: run the migration in `supabase/migrations/001_initial_schema.sql`. It creates all tables, indexes, RLS policies, and the trigger that inserts a `users` profile row on signup.

### Bot API + container

| Variable | Meaning |
| --- | --- |
| `BOT_API_URL` | Base URL of the bot service, e.g. `http://localhost:3000` |
| `BOT_AUTH` | Basic Auth credentials as `username:password` |
| `WHATSAPP_PORT` | Host port mapped to the bot container |
| `WHATSAPP_AUTH_USERNAME` / `WHATSAPP_AUTH_PASSWORD` | Must match `BOT_AUTH` |
| `WHATSAPP_WEBHOOK_URL` | Full URL the bot POSTs events to, e.g. `http://host.docker.internal:3001/api/webhook/gowa` (port = your Next.js dev port) |
| `WHATSAPP_WEBHOOK_SECRET` | Shared HMAC secret used by `/api/webhook/gowa` to verify payloads |
| `WHATSAPP_WEBHOOK_EVENTS` | Comma-separated, e.g. `message,message.ack` |

> `WHATSAPP_*` variables are consumed by `compose.yaml`; `BOT_API_URL` / `BOT_AUTH` are consumed by the Next.js app. Keep them consistent.

## 3. Start the bot container

```bash
podman compose up -d
# verify
curl http://localhost:3000/health -u username:password
```

The container stores WhatsApp sessions in the named volume `whatsapp`, so devices survive restarts.

## 4. Run the app

```bash
pnpm dev        # development on http://localhost:3000
```

Production build:

```bash
pnpm build
pnpm start
```

## 5. First-run smoke test

1. Open `http://localhost:3000` — landing page renders.
2. Go to `/auth` → register a new account → verify email if required.
3. After login you land on `/devices`.
4. Click **Tambah Device**, name it, then scan the QR with WhatsApp (Linked Devices).
5. Status should flip to **Connected**; the device now appears in the list.
6. Create a rule under `/rules` (e.g. keyword `ready` with a reply) and assign your device.
7. Message the number from another phone; watch the activity appear under `/logs`.

If step 6-7 produce no logs, check that the bot's webhook URL is reachable from inside the container and that `WHATSAPP_WEBHOOK_SECRET` matches what the app expects.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| QR never appears | `BOT_API_URL`/`BOT_AUTH` wrong, or bot container not running (`podman ps`) |
| Device connects but no logs arrive | Webhook URL unreachable from container; wrong `WHATSAPP_WEBHOOK_EVENTS`; secret mismatch |
| Login loops back to `/auth` | Cookies blocked, or `NEXT_PUBLIC_SUPABASE_URL` mismatched with the auth session |
| `users` row missing after signup | Migration not applied (the profile trigger lives there) |
