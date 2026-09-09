# wenderdotnet Overview

wenderdotnet is a web application for **managing and configuring WhatsApp bots**, conceptually similar to Discord/Telegram bot dashboards but built on WhatsApp's multi-device protocol. It targets Indonesian/SEA SMEs ("UMKM") first, then developers/resellers.

> Not affiliated with WhatsApp or Meta.

## What it does

A user logs in, adds a "device" (a WhatsApp number slot), connects it by scanning a QR code (like WhatsApp Web), then configures rules that determine which chats/groups the bot listens to, which messages get auto-read, and which trigger automatic replies. All activity is recorded in a filterable log timeline.

## Architecture

```
┌─────────────────────────────┐        ┌──────────────────────────────┐
│  This repo: Next.js app     │  HTTP  │  Bot service (external)      │
│  (App Router, TypeScript,   │◄──────►│  go-whatsapp-web-multidevice │
│  Tailwind CSS, Supabase)    │ Basic  │  run via podman compose      │
│                             │  Auth  │  NOT built in this repo      │
│  - Auth + dashboard UI      │        │  - WhatsApp connection       │
│  - Rule engine              │        │  - QR login / sessions       │
│  - Webhook receiver         │◄───────│  - Sends webhook events      │
│  - Supabase data access     │ webhook│    (message, message.ack...) │
└───────────────┬─────────────┘        └──────────────────────────────┘
                │
                ▼
┌─────────────────────────────┐
│  Supabase                   │
│  - Auth (email + Google SSO)│
│  - Postgres + RLS           │
│  - Realtime                 │
└─────────────────────────────┘
```

Key decisions (from the approved product spec in `.agents/coldstart.md`):

- **One Next.js app** owns everything user-facing: auth, devices, rules, logs.
- The **bot service is external**: image `aldinokemal2104/go-whatsapp-web-multidevice`, run with `podman compose` (see `compose.yaml` at the root). Its API contract lives in `openapi.yaml`.
- The **rule engine runs inside Next.js**. The bot does not execute rules; it only POSTs webhook events to `{APP_URL}/api/webhook/gowa`. Next.js verifies the HMAC signature, evaluates the user's rules from Supabase, executes auto-read/auto-reply via the bot's `POST /send/message`, and writes `logs`.
- Devices are **not stored as a table** while connecting. A `user_devices` row is inserted only after the bot reports `logged_in`. Device references use `device_key` = the bot's **session id** (the slot returned by `POST /devices`), which GOWA v8+ delivers in webhooks as `session_id`.

## Route map

| Route group | Route | Purpose |
| --- | --- | --- |
| `(marketing)` | `/` | Landing page (navbar/footer live in this layout) |
| `(auth)` | `/auth` | Login/register tabs, split layout, no navbar |
| `(app)` | `/devices` | Device list, add device, QR/code connect modal, 5s auto-refresh per-device + visibility-aware + auto-close on `logged_in` |
| `(app)` | `/devices/[deviceId]` | Device detail — Overview (status/JID), Webhook (per-device `webhook_*` + Test dummy real), Automasi (per-device, kategori prefix/contains/exact/regex, opsi reply/mentions/duration, group picker virtualized) |
| `(app)` | `/logs` | Activity timeline with device/event filters |
| API | `/api/devices/*` | Server-side proxy to the bot API (Basic Auth stays server-only) — `/devices`, `/devices/[id]/status`, `/devices/[id]/login`, `/devices/[id]/login/code` (pairing), `/devices/[id]/webhook` + `/test`, `/devices/[id]/groups` (X-Device-Id, cached 30s), `/devices/[id]/automations` |
| API | `/api/logs` | CRUD over Supabase |
| API | `/api/webhook/gowa` | Inbound webhook receiver from the bot (HMAC-verified). Device lookup uses webhook `session_id`; chat scope uses `payload.chat_id`, text uses `payload.body`; evaluates `device_automations` per `device_key`; see `docs/setup.md` §9 |

## Data model (Supabase)

All tables use `uuid` PKs and `timestamptz` timestamps; all child FKs cascade on delete. Migration `004` removed global `rules`/`device_rules` in favor of per-device automations.

- `users`: profile, 1:1 with `auth.users` (`full_name`, `plan`)
- `newsletters`: public landing-page signups (`email` unique)
- `user_devices`: junction `user_id` ↔ `device_key` (+ friendly `name`, per-device `webhook_url/secret/events/skip_verify`, `updated_at`)
- `device_automations`: **per-device** automations (`device_key`, `user_id`, `name`, `trigger_category` prefix/contains/exact/regex → `trigger_type` keyword/regex, `pattern`, `reply`, `is_reply`, `mentions` (@everyone/phones), `duration` 0/86400/604800/7776000, `is_forwarded`, `target_type` group/private/null, `target_jid` 1 group per row — duplicate per grup untuk multi, `enabled`). Index `device_key, enabled` + unique `(device_key, name, target_jid, pattern)`. RLS: `user_id=auth.uid() AND user_owns_device(device_key)`
- `logs`: append-only activity feed with typed `event_type`

Row Level Security scopes every table to `auth.uid()` + `user_owns_device`, except `newsletters` which allows anonymous inserts. The webhook receiver writes logs with the service-role key (server-side only). Grants fixed in `003_grants.sql`, new table granted in `004`.

## Where the design truth lives

- `.agents/coldstart.md`: approved product spec: PRD, personas, flows, schema, visual style. Single source of truth.
- `.agents/design.png`: visual mood reference.
- `docs/setup.md`: how to install and run everything.
- `docs/maintenance.md`: conventions and upkeep.
