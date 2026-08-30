# Setup Guide

Step-by-step instructions for standing up wenderdotnet on a development machine,
aligned with the **latest** third-party services this project integrates with:

- **Supabase** (auth + Postgres + RLS): `@supabase/supabase-js ^2.112`, `@supabase/ssr ^0.12`
- **go-whatsapp-web-multidevice** (the WhatsApp bot): docker image pinned to `v9.2.2` (2026-08-23)

Links to the authoritative upstream docs are listed at the end
([References](#references)). If a step looks stale, confirm against those first.

## Architecture recap

```
Next.js app (this repo)  ◄──HTTP/Basic Auth──►  WhatsApp bot container
  - Auth + dashboard UI                          (GOWA, port 3000)
  - Rule engine                                  - QR login / sessions
  - Webhook receiver   ◄──webhook POST────────────  - sends events
  - Supabase data access                           - signed X-Hub-Signature-256
```

- The app **talks to the bot** via `BOT_API_URL` + `BOT_AUTH` (Basic Auth), all through `src/lib/gowa.ts`.
- The **bot talks to the app** by POSTing webhook events to `WHATSAPP_WEBHOOK_URL`
  (→ `POST /api/webhook/gowa`), signed with an HMAC-SHA256 secret.
- Supabase holds auth sessions and all data; the browser uses the anon key, server-side code and the webhook use the service-role key.

## 0. Port plan

The bot container and the Next.js dev server both default to port `3000`, so they
cannot both listen locally at the same time. This guide uses:

| Service | Local URL | Port |
| --- | --- | --- |
| WhatsApp bot container (`GOWA`) | `http://localhost:3000` | 3000 |
| Next.js dev server | `http://localhost:3001` | 3001 |

(Adjust `pnpm dev --port <n>` and `WHATSAPP_WEBHOOK_URL` together; they must agree.)

## 1. Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| Node.js | 20+ | LTS |
| pnpm | 11+ | Lockfile is pnpm |
| Podman | 4+ | `podman compose`. Docker Compose works with the same `compose.yaml`; everywhere below "podman" works as "docker compose". |
| Supabase account | Any | Free tier is enough |
| Google Cloud Console account | Any | Only if you want Google SSO (recommended) |

## 2. Clone and install

```bash
git clone <repo-url> wenderdotnet
cd wenderdotnet
pnpm install
```

## 3. Create the Supabase project

1. Open the [Supabase Dashboard](https://supabase.com/dashboard) → **New project**.
2. Set a strong database password and pick a region close to your users.
3. After creation, note three values from **Project Settings → API**:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (**server-only; never expose to the client or commit it**)

## 4. Load the database schema

Run the initial migration exactly as-is. Two options:

**Option A: SQL editor (simplest)**
1. In the dashboard, open **SQL Editor → New query**.
2. Paste the full contents of `supabase/migrations/001_initial_schema.sql`.
3. Run it. It creates `users`, `newsletters`, `user_devices`, `rules`, `device_rules`, `logs`, all indexes and RLS policies, plus the `handle_new_user` trigger that inserts a `users` profile row on signup. The trigger function is registered as `security definer` inside the migration.

**Option B: Supabase CLI (repeatable)**

```bash
pnpm dlx supabase login
pnpm dlx supabase link --project-ref <project-ref>
pnpm dlx supabase db push
```

> If signups later create no `users` row, the migration was not applied; the profile-row trigger lives in that file.

## 5. Configure Supabase Auth

Auth is fully hosted on Supabase (email passwords + Google SSO), so you manage sign-in methods, users, and policies in one place. The app only calls the Supabase client; there is no external auth provider.

### 5.1 Email provider

- Open **Sign In / Providers** and enable **Email**.
- Keep the general toggles on that page as they are: **Allow new users to sign up** (default on) lets anyone register, and **Confirm email** (under the Email provider's own settings) sends a verification link before the first login.
- Review the confirmation template under **Emails** if you want to customize it.

### 5.2 Google provider (SSO)

Google sign-in uses an OAuth *web* client from Google Cloud:

1. [Google Cloud Console](https://console.cloud.google.com) → create/select a project.
2. **APIs & Services → OAuth consent screen**: configure app name, support email; add `supabase.co` domain and your app domain under **Authorized domains**.
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID → Web application**.
4. Set the **Authorized redirect URI** to:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
5. Copy the **Client ID** and **Client secret**.
6. Back in Supabase: **Sign In / Providers → Google**, enable it, paste the **Client ID** and **Client secret**, save.

### 5.3 URL Configuration (critical for login redirects)

Dashboard → **URL Configuration**:

| Setting | Value (dev) | Value (production) |
| --- | --- | --- |
| Site URL | `http://localhost:3001` | `https://your-domain.com` |
| Redirect URLs | add `http://localhost:3001/**` (or `http://localhost:3001`, `http://localhost:3001/devices`, `http://localhost:3001/auth/callback`) | add `https://your-domain.com/**` |

OAuth and email-verification redirects point at the app's callback route
(`/auth/callback`), which exchanges the auth code server-side and forwards to
`/devices`. So the **Redirect URLs allowlist must cover the `/devices` and
`/auth/callback` paths** (use the `/**` wildcard). A mismatched allowlist causes
Google SSO to bounce or the "signs in but lands back on /auth" symptom below.

## 6. Configure environment variables

```bash
cp .env.example .env.local
```

### 6.1 Supabase block

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL from §3 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` key from §3 |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key from §3 (server-only) |

### 6.2 Bot API (consumed by the Next.js app)

| Variable | Value | Meaning |
| --- | --- | --- |
| `BOT_API_URL` | `http://localhost:3000` | Base URL of the bot REST API |
| `BOT_AUTH` | `username:password` | Basic Auth credentials for the bot |

### 6.3 WhatsApp container (consumed by `compose.yaml`)

`compose.yaml` maps each `WHATSAPP_*` variable onto the bot's own env vars.

| Variable | Maps to (container) | Recommended value | Meaning |
| --- | --- | --- | --- |
| `WHATSAPP_PORT` | host port → `3000` | `3000` | Host port the bot listens on (must equal the port in `BOT_API_URL`) |
| `WHATSAPP_AUTH_USERNAME` | `APP_BASIC_AUTH` (user part) | must match `BOT_AUTH` | Bot Basic Auth user |
| `WHATSAPP_AUTH_PASSWORD` | `APP_BASIC_AUTH` (password part) | **must match `BOT_AUTH`** | Bot Basic Auth password |
| `WHATSAPP_ENABLE_DEBUG` | `APP_DEBUG` | `false` | Bot verbose logs |
| `WHATSAPP_DEVICE_NAME` | `APP_OS` | `GOWA` | Reported device label |
| `WHATSAPP_ENABLE_AUTO_READ` | `WHATSAPP_AUTO_MARK_READ` | `false` | Bot-wide auto mark-read (rules use app-level auto-read instead) |
| `WHATSAPP_ENABLE_AUTO_DOWNLOAD_MEDIA` | `WHATSAPP_AUTO_DOWNLOAD_MEDIA` | `false` | Auto-download media to bot storage |
| `WHATSAPP_WEBHOOK_URL` | `WHATSAPP_WEBHOOK` | `http://host.docker.internal:3001/api/webhook/gowa` | URL the bot POSTs to (host port **must be your Next.js port**) |
| `WHATSAPP_WEBHOOK_SECRET` | `WHATSAPP_WEBHOOK_SECRET` | long random string | HMAC secret. GOWA defaults to `secret` if unset, so always set a strong value |
| `WHATSAPP_WEBHOOK_SKIP_HTTPS` | `WHATSAPP_WEBHOOK_INSECURE_SKIP_VERIFY` | `false` | Set `true` only for a self-signed HTTPS webhook target |
| `WHATSAPP_WEBHOOK_EVENTS` | `WHATSAPP_WEBHOOK_EVENTS` | `message,message.ack` | Comma-separated event whitelist |

> **Keep `BOT_AUTH` == `WHATSAPP_AUTH_USERNAME`:`WHATSAPP_AUTH_PASSWORD`** and **the
> webhook-URL port == the `pnpm dev --port` number**. These two pairs are the most
> common cause of "QR never appears" and "no logs arrive".

## 7. Start the WhatsApp bot container

The bot image is pinned in `compose.yaml` to
`docker.io/aldinokemal2104/go-whatsapp-web-multidevice:v9.2.2` (the image's default
command is the `rest` server; no explicit `command:` is needed).

```bash
podman compose up -d
podman ps                       # container-whatsapp should be Up
curl http://localhost:3000/health -u username:password
```

Expected: `200 OK` (GOWA responds with `"pong"`-style health body when healthy).

Notes:

- Sessions persist in the named volume `whatsapp:/app/storages`, so devices survive restarts.
- **Webhook reachability**: from inside the container `localhost` is the *container*,
  not your machine. `host.docker.internal` works on Docker Desktop (macOS/Windows) and
  `podman machine`. On Linux rootless Podman the special name is usually
  `host.containers.internal`; if neither resolves, use the host's LAN IP or add a
  compose network with the host gateway. `WHATSAPP_WEBHOOK_URL` is a
  **comma-separated list** in GOWA, so you can add both candidates.
- Webhook signature: GOWA sends `X-Hub-Signature-256: sha256=<hex>` where `<hex>` is
  HMAC-SHA256 of the raw request body with `WHATSAPP_WEBHOOK_SECRET`. This matches
  exactly what `POST /api/webhook/gowa` verifies; a mismatch returns `401`.

## 8. Run the app

Development (on port 3001, see §0):

```bash
pnpm dev --port 3001
# open http://localhost:3001
```

Production:

```bash
pnpm build
pnpm start --port 3001
```

## 9. First-run smoke test

1. Open `http://localhost:3001`; the landing page renders.
2. `/auth` → register → confirm email if required → you land on `/devices`.
3. Test Google SSO once: the OAuth dance should land you back on `/devices`.
4. Click **Tambah Device**, name it, save, then scan the QR (WhatsApp → Linked Devices) in the opened modal.
5. The device status should flip to **Connected** (the `user_devices` row is created only after the bot reports logged in).
6. Under `/rules` create a rule with keyword `ready` + a reply, and assign your device.
7. Message the number from *another* phone; watch the activity under `/logs`.

Webhook payload contract (as the receiver now expects, matching GOWA v9):

```jsonc
{
  "event": "message",           // or "message.ack", ...
  "device_id": "62812@s.whatsapp.net",   // the account JID
  "session_id": "my-device-id",           // the slot id from POST /devices; user_devices.device_key stores this
  "payload": {
    "id": "wamid...",
    "chat_id": "6281234@s.whatsapp.net", // sender|group JID; chat scope for rules
    "from": "6281234@s.whatsapp.net",    // always the sender JID
    "sender_display_name": "Jane",       // sender/chat display name
    "body": "ready"                      // message text (ack uses payload.ids instead)
  }
}
```

## 10. Deploy to Vercel

Deploying moves the Next.js app to Vercel while the bot container stays on your server. Only three places change: Supabase URL config, Vercel environment variables, and the bot's webhook target. Auth does not change, because Google only talks to Supabase (via `https://<ref>.supabase.co/auth/v1/callback`), never to Vercel.

### 10.1 Supabase URL Configuration

Supabase Dashboard → Authentication → **URL Configuration**:

- **Site URL**: `https://<your-app>.vercel.app`
- **Redirect URLs**: keep `http://localhost:3000/**` for local dev, and add `https://<your-app>.vercel.app/**` for production. Add each Vercel preview URL as a separate entry if you also want auth to work on preview deployments.

### 10.2 Google OAuth console

No change. The Authorized redirect URI stays `https://<ref>.supabase.co/auth/v1/callback`. The hand-off is Google → Supabase → your app; Vercel never appears in Google's config.

### 10.3 Vercel environment variables

Project → Settings → Environment Variables. Set these for Production (and Preview if you want the bot to work there too):

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key from Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-only; never expose on the client) |
| `BOT_API_URL` | Public URL of the bot, e.g. `https://bot.example.com` or `http://<vps-ip>:3000`. `localhost` will not work here, because the bot runs on your server, not on Vercel |
| `BOT_AUTH` | Same `username:password` as the bot's `APP_BASIC_AUTH` |
| `WHATSAPP_WEBHOOK_SECRET` | Same secret used on the bot host |

Do not set the container-only variables (`WHATSAPP_PORT`, `WHATSAPP_AUTH_*`, `WHATSAPP_WEBHOOK_URL`, `WHATSAPP_WEBHOOK_EVENTS`) on Vercel. The container still runs from `compose.yaml` on your server.

Deployment needs no extra build config: Vercel detects Next.js automatically (build command `pnpm build`). The middleware in `src/proxy.ts` runs unchanged.

### 10.4 Bot host changes

Edit the `.env` used by `compose.yaml`:

- `WHATSAPP_WEBHOOK_URL=https://<your-app>.vercel.app/api/webhook/gowa` (replaces `host.docker.internal` / `host.containers.internal`)
- `WHATSAPP_WEBHOOK_SECRET`: must equal the Vercel value
- `WHATSAPP_WEBHOOK_SKIP_HTTPS=false` (Vercel serves HTTPS)
- Publish the bot on a public address: bind `0.0.0.0:3000` and keep `APP_BASIC_AUTH` set

### 10.5 Production flow check

Bot (your server) → `POST https://<your-app>.vercel.app/api/webhook/gowa` → Vercel verifies the HMAC with `WHATSAPP_WEBHOOK_SECRET` → runs your rules → calls the bot back at `BOT_API_URL`. Webhook calls are authorized with `BOT_AUTH` / `APP_BASIC_AUTH`. A mismatch in either secret shows up as `401`s in the rules or device logs.

## Troubleshooting

| Symptom | Likely cause / fix |
| --- | --- |
| QR never appears on `/devices` | Bot down (`podman ps`), or `BOT_API_URL`/`BOT_AUTH` mismatch with the container's `APP_BASIC_AUTH` (§7 curl is the fast check) |
| Device connects but no logs arrive | `WHATSAPP_WEBHOOK_URL` unreachable from the container (`host.docker.internal` vs `host.containers.internal`, §7); wrong `WHATSAPP_WEBHOOK_EVENTS`; webhook secret mismatch → receiver returns `401` |
| Google SSO redirects but never completes / loops to `/auth` | `redirectTo` not covered by the **Redirect URLs allowlist** (§5.3), so `/auth/callback` never runs; or wrong Google **Authorized redirect URI** (§5.2). It must be exactly `https://<ref>.supabase.co/auth/v1/callback` |
| Signs in with Google, then lands back on `/auth` instead of `/devices` | The OAuth code was exchanged after your middleware bounced the page, so no redirect followed. Run the callback route (`src/app/auth/callback/route.ts`); it exchanges the code server-side and forwards to `/devices` |
| Login loop after password sign-in | Cookies/session cookies blocked, or `NEXT_PUBLIC_SUPABASE_URL` mismatches the project (re-login after URL changes) |
| `users` row missing after signup | Migration §4 not applied (trigger lives there) |
| `401` from `/api/webhook/gowa` | HMAC mismatch: `WHATSAPP_WEBHOOK_SECRET` differs on the two sides, or a per-device webhook secret was set on the device (that secret overrides the global one) |
| Rule replies go to the wrong chat in groups | You are on an old receiver. Before the `chat_id` fix, group replies targeted the sender. Run the current receiver (uses `payload.chat_id` for group/private scope) |

## Upstream references (verify versions here)

- GOWA: <https://github.com/aldinokemal/go-whatsapp-web-multidevice> (releases, Dockerfile, `docs/webhook-payload.md`, README env-var table)
- GOWA image: <https://hub.docker.com/r/aldinokemal2104/go-whatsapp-web-multidevice>
- Supabase SSR client: <https://supabase.com/docs/guides/auth/server-side/creating-a-client>
- Supabase Next.js quickstart: <https://supabase.com/docs/guides/auth/quickstarts/nextjs>
- Supabase Google provider: <https://supabase.com/docs/guides/auth/social-login/auth-google>
- Supabase migrations: <https://supabase.com/docs/guides/migrations>

### Version matrix (as written)

| Dependency | Version | Notes |
| --- | --- | --- |
| `next` | 16.3.0 | App Router; middleware is `src/proxy.ts` in this codebase |
| `react` | 19.2.8 | |
| `@supabase/supabase-js` | ^2.112.3 | Keep in lockstep with `@supabase/ssr` |
| `@supabase/ssr` | ^0.12.4 | Cookie-based SSR clients |
| GOWA image | `v9.2.2` (2026-08-23) | Pinned in `compose.yaml` |