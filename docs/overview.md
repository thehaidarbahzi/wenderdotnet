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
| `(app)` | `/devices` | Device list, add device, QR connect modal |
| `(app)` | `/rules` | Global per-user rules (listen / auto_reply), assigned to devices |
| `(app)` | `/logs` | Activity timeline with device/event filters |
| API | `/api/devices/*` | Server-side proxy to the bot API (Basic Auth stays server-only) |
| API | `/api/rules/*`, `/api/logs` | CRUD over Supabase |
| API | `/api/webhook/gowa` | Inbound webhook receiver from the bot (HMAC-verified). Device lookup uses webhook `session_id`; chat scope uses `payload.chat_id`, text uses `payload.body`; see `docs/setup.md` §9 |

## Data model (Supabase)

All tables use `uuid` PKs and `timestamptz` timestamps; all child FKs cascade on delete.

- `users`: profile, 1:1 with `auth.users` (`full_name`, `plan`)
- `newsletters`: public landing-page signups (`email` unique)
- `user_devices`: junction `user_id` ↔ `device_key` (+ friendly `name`)
- `rules`: one table for both action types: `listen` (with optional `auto_read`) and `auto_reply` (`trigger_type`: keyword/regex, `pattern`, `reply`); scoping via nullable `target_type` / `target_jid`
- `device_rules`: junction `device_key` ↔ `rule_id`
- `logs`: append-only activity feed with typed `event_type`

Row Level Security scopes every table to `auth.uid()`, except `newsletters` which allows anonymous inserts. The webhook receiver writes logs with the service-role key (server-side only).

## Where the design truth lives

- `.agents/coldstart.md`: approved product spec: PRD, personas, flows, schema, visual style. Single source of truth.
- `.agents/design.png`: visual mood reference.
- `docs/setup.md`: how to install and run everything.
- `docs/maintenance.md`: conventions and upkeep.
