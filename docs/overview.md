# wenderdotnet Overview

wenderdotnet adalah aplikasi web untuk **mengelola dan mengkonfigurasi bot WhatsApp**, mirip dashboard bot Discord/Telegram tapi di atas protokol multi-device WhatsApp. Target awal UMKM Indonesia/SEA, lalu developer/reseller.

> Tidak terafiliasi dengan WhatsApp atau Meta.

## Apa yang dilakukan

Pengguna masuk, menambah device (slot nomor WhatsApp), menghubungkan lewat scan QR seperti WhatsApp Web atau kode pairing 8 karakter, lalu mengatur automasi per-device yang menentukan chat/grup mana yang didengarkan dan balasan otomatis apa yang dikirim. Semua aktivitas tercatat di timeline log yang bisa difilter. Tersedia landing dengan hero, cara pakai 3 langkah, 3 fitur alternating, quote kreator, dan newsletter.

## Arsitektur

```
┌─────────────────────────────┐        ┌──────────────────────────────┐
│  Repo ini: Next.js 16.3.4   │  HTTP  │  Bot eksternal               │
│  App Router, React 19.2,    │◄──────►│  go-whatsapp-web-multidevice │
│  Tailwind v4, Supabase 2.116│ Basic  │  podman compose  v9.2.2      │
│                             │  Auth  │  BUKAN dibangun di repo      │
│  - Auth + dashboard UI      │        │  - Koneksi WhatsApp          │
│  - Rule engine              │        │  - QR / kode pairing         │
│  - Webhook receiver         │◄───────│  - Kirim webhook events      │
│  - Supabase data access     │ webhook│    (message, message.ack...) │
└───────────────┬─────────────┘        └──────────────────────────────┘
                │
                ▼
┌─────────────────────────────┐
│  Supabase                   │
│  - Auth (email + Google)    │
│  - Postgres + RLS           │
│  - Realtime                 │
└─────────────────────────────┘
```

Keputusan kunci (detail di `.agents/coldstart.md`):

- **Satu Next.js app** memegang semua yang menghadap pengguna: auth, devices, automasi, logs, marketing.
- **Bot eksternal**: image `aldinokemal2104/go-whatsapp-web-multidevice`, dijalankan dengan `podman compose` (`compose.yaml` di root). Kontrak API di `openapi.yaml`.
- **Rule engine di Next.js**. Bot tidak mengeksekusi aturan; ia hanya POST webhook ke `{APP_URL}/api/webhook/gowa`. Next.js verifikasi HMAC, evaluasi `device_automations` dari Supabase, mengeksekusi auto-reply via `POST /send/message`, dan menulis `logs`.
- Device bukan tabel saat menghubungkan. Baris `user_devices` dimasukkan hanya setelah bot melaporkan `logged_in`. Referensi device memakai `device_key` = `device_id` bot (session id).

## Route map

| Grup | Route | Tujuan |
| --- | --- | --- |
| `(marketing)` | `/` | Landing: hero, `#cara-pakai` 3 langkah, `#fitur` 3× `SectionFeature` (visual terpusat `max-w-[360px]` + light `blur-2xl` + mobile `order-1` visual di atas), `#tentang` quote, `#newsletter` form. Navbar/Footer di `src/app/(marketing)/layout.tsx` |
| `(marketing)` | `/privacy`, `/terms` | Legal, layout lega `py-14 lg:py-20` header + `py-10 lg:py-16` konten, grid `270px + 1fr` TOC sticky `rounded-sm`, section `border-t pt-10` bernomor `01..09`, copy antislop, `rounded-sm` seragam |
| `(marketing)` | `layout.tsx` | `Navbar` (sticky, hamburger) + `Footer` |
| `(auth)` | `/auth` | Tab Masuk/Daftar, split-screen brand panel, tanpa navbar. Redirect ke `/devices` jika sudah login |
| `(app)` | `/devices` | List device, tambah device, modal QR/Kode (tab `role="tablist"`), polling 5s per-device visibility-aware + auto-close `logged_in`, `Detail` link, delete confirm |
| `(app)` | `/devices/[deviceId]` | Detail: header back + badge + JID + aksi Hubungkan/Disconnect, tabs `Overview / Automasi` (group picker `GET /user/my/groups` via `X-Device-Id`, cache 30s, virtual 100, duplicate per `target_jid`), automasi CRUD per-device |
| `(app)` | `/logs` | Timeline vertikal + filter device/event, dot indicator, body `pre` |
| `(app)` | `layout.tsx` | `Topbar` + dekor blur orbs `rounded-full` + `max-w-6xl` |
| `layout.tsx` | `/`, `/icon.svg`, `/sitemap.xml`, `/robots.txt` | Root `Inter` font, `ThemeProvider`, `Toaster`, `metadata` (`title: "%s: wenderdotnet"`), viewport, JSON-LD `SoftwareApplication` |
| API | `/api/devices`, `/api/devices/[id]`, `/api/devices/[id]/status`, `/api/devices/[id]/login`, `/api/devices/[id]/login/code`, `/api/devices/[id]/groups`, `/api/devices/[id]/automations` (+ `[automationId]`), `/api/devices/[id]/logout` | Proxy server-side ke `BOT_API_URL` (Basic Auth tetap di server) |
| API | `/api/logs` | CRUD Supabase terfilter |
| API | `/api/webhook/gowa` | Penerima webhook dari bot, verifikasi `X-Hub-Signature-256`, lookup `session_id` → `device_key`, `payload.chat_id` scope, evaluasi `device_automations` |

`sitemap.ts` dan `robots.ts` memakai `NEXT_PUBLIC_SITE_URL` (fallback `https://wenderdotnet.vercel.app`), `robots` allow `/` disallow `/api/` `/devices/` `/logs/` `/auth/callback`.

## Data model (Supabase)

Semua tabel pakai `uuid` PK dan `timestamptz`; FK cascade. Migrasi `004` menghapus `rules`/`device_rules` global.

- `users`: profil 1:1 dengan `auth.users` (`full_name`, `plan` default `free`)
- `newsletters`: signup landing publik (`email` unique, insert anon `USING true`)
- `user_devices`: junction `user_id` ↔ `device_key` (+ `name`, `role` default `owner`, `created_at`, unique `(user_id, device_key)`)
- `device_automations`: automasi per-device (`device_key`, `user_id`, `name`, `trigger_category` prefix/contains/exact/regex → `trigger_type`, `pattern`, `reply`, `is_reply`, `mentions`, `duration` 0/86400/604800/7776000, `is_forwarded`, `target_type` group/private/null, `target_jid` 1 grup per baris — duplicate per grup, `enabled`). Index `(device_key, enabled)`, unique `(device_key, name, target_jid, pattern)`. RLS `user_id=auth.uid() AND user_owns_device(device_key)` via helper `002`
- `logs`: append-only (`device_key`, `event_type` check `message_sent|message_received|auto_reply_sent|auto_read|session_connected|session_disconnected|error`, `chat_jid`, `sender_jid`, `body`, `metadata` jsonb, index `(user_id, created_at DESC)`)

RLS membatasi semua tabel ke `auth.uid()` + `user_owns_device`, kecuali `newsletters`. Webhook menulis `logs` dengan service-role key. Grants diperbaiki di `003_grants.sql`.

## Desain

- Token warna/shadow/radius di `src/app/globals.css` (`--primary #34D399`, `--radius-sm 6px` seragam, semua kartu/input/modal `rounded-sm`, hanya orbs/dot `rounded-full`), mapping ke Tailwind v4 `@theme inline`.
- Tipografi `Inter` variable, mono `ui-monospace`. Legal `text-[15px] leading-7`, header `text-xl / sm:text-[22px]`.
- Button global `cursor-pointer hover:cursor-pointer active:scale-97`, komponen `Button` `cursor-pointer active:scale-[0.98]`.
- TOC legal `270px sticky`, item `truncate whitespace-nowrap` untuk mencegah 2 baris.
- Landing `SectionFeature` terpusat, light `blur-2xl`, mobile `order-1` visual.
- Dark/light via `next-themes`, `prefers-reduced-motion` dihormati.

## Sumber kebenaran desain

- `.agents/coldstart.md`: PRD, persona, flow, schema, style yang disetujui.
- `.agents/design.png`: referensi mood.
- `DESIGN.md`: arah palet/tipografi/komponen saat ini.
- `docs/setup.md`: cara instal dan jalan.
- `docs/maintenance.md`: konvensi dan pemeliharaan.
