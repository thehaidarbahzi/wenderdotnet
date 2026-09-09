# wenderdotnet — Cold Start

Dokumen ini merangkum semua keputusan yang telah **disetujui** dalam proses desain produk: ide, PRD, user persona, user flow, wireframe, data schema, hingga style & mood visual. Dipakai sebagai sumber kebenaran tunggal untuk memulai pengembangan.

---

## 1. Ide & Ringkasan Produk

Web app untuk **mengatur dan mengonfigurasi bot WhatsApp** — konsep menyerupai bot Discord/Telegram, tapi untuk WhatsApp. User login → menambah device → menghubungkan via QR scan (mirip WhatsApp Web) → mengonfigurasi chat/group mana yang didengarkan, auto-read, dan aturan auto-reply.

**Model arsitektur (final):**

- **Repo ini = satu Next.js app** (App Router, TypeScript, Tailwind CSS, Supabase).
- **Bot service = entitas eksternal**, dijalankan via **podman compose** (bukan docker), image `go-whatsapp-web-multidevice` (aldinokemal2104) — **tidak dibangun di repo ini**. API-nya di-dokumentasikan di `openapi.yaml` (root repo).
- Next.js memanggil API bot via `BOT_API_URL` (HTTP `fetch`, Basic Auth).
- Bot **tidak mengeksekusi rules** — ia hanya mengirim **webhook events** (message, message.ack, dll.) ke `WHATSAPP_WEBHOOK_URL`. **Rule engine (listen/auto-read/auto-reply) hidup di Next.js** (webhook receiver).
- Supabase menangani: Auth (email + SSO Gmail), database, realtime.

**Target pasar:** Indonesia/SEA dulu (UMKM + reseller), kemudian ekspansi global (developer) secara bertahap.

---

## 2. PRD

### 2.1 Problem Statement

- Pelaku UMKM/developer butuh bot WhatsApp tapi terkendala: setup teknis rumit (Baileys, session, reconnect), tidak ada antarmuka untuk mengelola banyak nomor, tidak ada kontrol chat mana yang diproses.
- Produk sejenis (BigBlue, WAGateway, ManyChat) mahal / tertutup / tidak bisa di-self-host.
- WhatsApp tidak punya bot API publik; jalur komunitas (Baileys) kuat tapi butuh wrapping yang baik.

### 2.2 Target User

| Persona                           | Kebutuhan utama                                              |
| --------------------------------- | ------------------------------------------------------------ |
| UMKM pemilik toko (Indonesia/SEA) | Auto-reply, kirim broadcast, balas cepat, tanpa paham koding |
| Developer / reseller              | Self-host, API, integrasi, kelola banyak nomor               |
| Agen/agency                       | Kelola banyak client, white-label (Phase 3)                  |

**Struktur multi-user:** satu user punya banyak device (nomor WhatsApp). Setiap device punya konfigurasi sendiri.

### 2.3 Value Proposition

1. Setup mudah: login → tambah device → scan QR → langsung konfigurasi. Tanpa CLI.
2. Kontrol selektif: user menentukan chat/group mana yang didengarkan & di-auto-read.
3. Self-host friendly: Next.js + Supabase; bot jalan di container sendiri (podman).
4. Fondasi monetisasi: open-core (Phase 3) dengan hosting proprietary.

### 2.4 Scope

**In-scope (Phase 1 — MVP):**

- Auth & akun (Supabase Auth, email + SSO Gmail)
- Manajemen device (tambah, list, status, hapus)
- Koneksi via QR (connect/disconnect)
- Konfigurasi rules (listen/auto-read + auto-reply keyword/regex)
- Logs aktivitas bot (timeline)
- RLS per-user (privacy)

**Out-of-scope Phase 1 (nanti):**

- Pricing/billing/subscription (ditunda)
- Broadcast/blast massal terjadwal
- Webhooks & REST API publik
- Tools group (kick, anti-link, welcome)
- AI chatbot / LLM
- White-label, multi-bahasa
- Laporan/analitik

### 2.5 Roadmap

| Phase                   | Isi                                                                       | Gate                                        |
| ----------------------- | ------------------------------------------------------------------------- | ------------------------------------------- |
| 1 — MVP                 | Auth, devices+QR, rules, auto-reply, logs                                 | Validasi dengan network user; feedback loop |
| 2 — Monetisasi          | Billing, blast terjadwal, webhooks+API, tools group, AI chatbot, analitik | Revenue per-contoh; tiering                 |
| 3 — Open source & skala | Rilis core open source, white-label, multi-bahasa/mata uang               | Traksi + kontributor                        |

### 2.6 Risiko & Mitigasi

| Risiko                          | Dampak    | Mitigasi                                                    |
| ------------------------------- | --------- | ----------------------------------------------------------- |
| Nomor di-ban WhatsApp           | Churn     | Disclaimer onboarding, reconnect mudah, multi-device        |
| Ketergantungan library Baileys  | Stability | Pin version, subscribe upstream, bot dipisah (di luar repo) |
| Kompetisi mapan (BigBlue, dll.) | Akuisisi  | Diferensiasi: harga, self-host, kontrol listener, nanti AI  |
| Inbound writes via service key  | Keamanan  | Service key hanya di env server; bot = trusted service      |

### 2.7 Success Metrics (MVP)

- ≥ 10 user aktif dari network dalam 2 minggu pertama.
- ≥ 5 device terhubung stabil (tidak drop > 24 jam).
- Feedback positif pada: kemudahan connect QR & konfigurasi rules.
- ≥ 3 user menyatakan siap bayar (indikasi pricing Phase 2).

### 2.8 Project Structure

> **Status:** Sudah **terimplementasi penuh** di codebase.

- using nextjs app router (Next.js 16.3.0, React 19, TypeScript)
- **Styling:** Tailwind CSS v4 (tanpa `tailwind.config.*` — fully CSS-driven via `globals.css`)
- **UI Library:** lucide-react (ikon), sonner (toast), clsx + tailwind-merge (class utility), next-themes (dark/light)
- 1 landing page consisting of: Hero CTA, short introduction of this project, 3 points of what is the main feature of this project not using card but with the left image right text of the title feature, short description of the feature and cta for learn more and each is reversed so first image is left and text right, second is reversed then last is reversed again, section of what the creator say about this project like kata sambutan from creator, section of subscribe to newsletter, then footer (navbar dan footer taruh di `(marketing)` layout — root layout hanya `html/body` + font)
- 1 page untuk login/register nanti di buat layout full gambar di kiri form di kanan, route `/auth` (tab "Masuk" / "Daftar", tanpa navbar)
- **Server actions tidak pernah didefinisikan di file frontend.** Semua fungsi `"use server"` (mutasi, panggilan ke bot, tulis DB) ditaruh di folder khusus, mis. `src/server/actions/*` (dibagi per domain: `devices.ts`, `rules.ts`, `logs.ts`, `auth.ts`, `newsletter.ts`). Frontend hanya memanggil method dari sana. Konsekuensi: file UI tidak mengandung `"use server"` sama sekali.

### 2.9 Struktur Folder (Aktual)

```
src/
├── app/
│   ├── globals.css              # Design tokens + Tailwind v4 config
│   ├── layout.tsx               # Root: Inter font, ThemeProvider, Toaster
│   ├── (marketing)/
│   │   ├── layout.tsx           # Navbar + Footer wrapper
│   │   └── page.tsx             # Landing page
│   ├── (auth)/
│   │   ├── layout.tsx           # Split-screen brand panel
│   │   └── auth/page.tsx        # Login/Register form
│   ├── (app)/
│   │   ├── layout.tsx           # Topbar wrapper
│   │   ├── devices/page.tsx     # Device management
│   │   ├── rules/page.tsx       # Rule CRUD
│   │   └── logs/page.tsx        # Activity log viewer
│   └── api/
│       ├── devices/             # CRUD + QR + status + logout
│       ├── rules/               # CRUD
│       ├── logs/                # Filtered list
│       └── webhook/gowa/        # Inbound webhook (HMAC verified)
├── components/
│   ├── ui/                      # Button, Input, Badge, Modal, Toggle, EmptyState, Skeleton
│   ├── marketing/               # HeroPreview, FeatureVisuals, NewsletterForm
│   ├── navbar.tsx, topbar.tsx, footer.tsx
│   ├── logo.tsx                 # WMark, LogoMark, Wordmark
│   ├── theme-provider.tsx, theme-toggle.tsx
├── lib/
│   ├── cn.ts                    # clsx + tailwind-merge
│   ├── gowa.ts                  # HTTP client for GOWA bot API
│   └── supabase/                # client.ts, server.ts, middleware.ts
├── server/actions/              # auth.ts, devices.ts, rules.ts, logs.ts, newsletter.ts
├── types/index.ts               # TypeScript interfaces
└── proxy.ts                     # Middleware entry (route protection)
```

---

## 2.10 Konvensi Kode

> **Status:** Sudah **terimplementasi penuh** di codebase.

- **Server actions:** hanya di `src/server/actions/` (`"use server"`); file frontend (komponen/page) tidak boleh berisi `"use server"` — cukup import method.
- **Bot proxy:** akses ke `BOT_API_URL` hanya lewat `src/lib/gowa.ts` (fetch + Basic Auth); dipanggil dari server action, bukan langsung dari browser.
- **Supabase client:** server-only (service key) di `src/lib/supabase/`; jangan pernah pakai service key di komponen client.
- **UI Components:** semua di `src/components/ui/` dengan named exports; menggunakan `cn()` utility untuk class merging.
- **API Routes:** semua di `src/app/api/` — RESTful pattern (GET list, POST create, PUT update, DELETE remove).
- **Middleware:** entry point di `src/proxy.ts` (bukan `middleware.ts`); melindungi route `/devices`, `/rules`, `/logs`.
- **Types:** semua TypeScript interfaces di `src/types/index.ts`.
- **React Compiler:** enabled via `babel-plugin-react-compiler` + `reactCompiler: true` di `next.config.ts`.

---

## 3. User Persona (Primary)

**Nama:** Budi Santoso
**Usia:** 34 | **Peran:** Owner Toko Online UMKM (fashion, Shopee + WhatsApp) | **Lokasi:** Indonesia, Kota

**Konteks:** Punya 1 nomor WhatsApp bisnis untuk order, komplain, dan grup komunitas pembeli. Buka chat dari HP dan laptop. Tidak paham koding, tapi melek teknologi.

**Kebutuhan:**

- Pelanggan yang tanya "masih ready?" dibalas otomatis, terutama di luar jam kerja.
- Mengetahui & merespon chat penting di grup tanpa harus scroll semua grup.
- Semua chat bisnis terpusat di satu dashboard, bisa dibalas dari laptop.
- Proses setup simpel: login, scan QR, langsung jalan.

**Masalah utama:**

- Kewalahan: puluhan chat/hari, telat balas, pelanggan kabur ke kompetitor.
- Tidak bisa hadir 24 jam; kehilangan order masuk tengah malam.
- Ingin otomatisasi tapi solusi yang ada butuh setup teknis (server/CLI/Baileys) atau mahal.
- Takut salah konfigurasi dan bikin nomornya bermasalah.

**Goal:** Nomor WhatsApp terhubung → chat dari pelanggan & grup tertentu dibalas otomatis → bisa lihat & pantau aktivitas dari dashboard.

**Syarat mau pakai:** Setup < 5 menit, tanpa istilah teknis, ada status jelas (connecting/connected), bisa disconnect kapan saja.

---

## 4. User Flow

### 4.1 Flow Utama

1. **Buka app** → landing page (`/`): Hero CTA → `/auth`. Belum login → landing/`/auth`; route app (`/devices`, `/logs`) di-redirect ke `/auth` ( `/rules` dihapus di 004).
2. **Auth** di `/auth` — tab "Masuk" / "Daftar" (email/password atau SSO Gmail) → Supabase Auth; row `users` dibuat otomatis via trigger.
3. **Login sukses** → redirect ke `/devices` (Dashboard). List device kosong + tombol "Tambah Device".
4. **User isi nama device** → `POST {BOT_API_URL}/devices` (bisa custom `device_id`) → bot buat device slot, state `disconnected` (belum ada di DB).
5. **App panggil `GET {BOT_API_URL}/devices/{device_id}/login`** (atau `POST /login/code?phone=` untuk Kode) → balas `{qr_link, qr_duration}` / `{pair_code}` → dirender via `GET /api/devices/:id/login` (flat `qr_link`) — QR image public `http://BOT/statics/...` tanpa auth, polling auto-close.
6. **User scan QR / input Kode** pakai WhatsApp (mirip WA Web) → bot update status internal → `connecting` → `logged_in`.
7. **App listen status bot**: awal polling `GET /devices/:id/status` 3s untuk `connecting` + **global 5s `GET /api/devices` per-device** (visibility-aware, 1 call, bukan N+1) + auto-close modal ketika `logged_in`; WS `/ws?device_id` disiapkan sebagai fallback untuk instant disconnect (BOT_AUTH server-only jadi polling jadi utama).
8. **Saat status = `logged_in`** → app insert row `user_devices(name, device_key=device_id)` → device resmi masuk DB, muncul di list (auto).
9. **Konfigurasi di `/devices/[deviceId]` detail** (tab Webhook + Automasi) — bukan `/rules` lagi. Webhook per-device (`PATCH /devices/{id}/webhook` + Test dummy real), Automasi per-device (`device_automations` via `POST /api/devices/:id/automations`, trigger `prefix/contains/exact/regex` → `keyword/regex`, opsi `is_reply`/`mentions` `@everyone`/`duration`/`is_forwarded` per `openapi.yaml:1210`, target `group/private` + group picker `GET /user/my/groups` via `X-Device-Id`, cached 30s, virtual 100, duplicate per `target_jid`).
10. **Device berjalan** — bot kirim webhook events ke Next.js (`/api/webhook/gowa`); app verifikasi HMAC, evaluasi `device_automations` per `device_key`, eksekusi via `POST /send/message` (mentions/duration/forwarded), tulis `logs`; dashboard menampilkan timeline.

### 4.2 Device Lifecycle (detail)

```
1. User isi nama device
2. App → POST {BOT_API_URL}/devices → bot buat device slot (state disconnected)
3. App → GET /devices/{device_id}/login (QR) atau POST /login/code?phone= (Kode) → {qr_link/qr_duration} / {pair_code}
4. QR/Kode ditampilkan (tab QR|Kode default QR); device slot hidup di bot (BELUM ada row di DB)
5. User scan QR / input Kode di HP → bot update status internal (connecting → logged_in)
6. App LISTEN status bot (3s polling connecting + 5s global GET /api/devices per-device, visibility-aware, auto-close modal)
7. Saat status = logged_in → insert user_devices(name, device_key=device_id)
8. Device masuk DB; muncul di list Devices (auto, tanpa reload)
```

**Aturan wajib:**

- **Insert DB hanya setelah connected/logged_in** — device yang gagal/abandon tidak pernah masuk DB.
- **QR timeout pakai `qr_duration` dari bot** (default 30 dtk; expired → tombol "Muat ulang" memanggil login lagi) + tombol "Batal" memanggil `POST /devices/{device_id}/logout` → hindari slot orphan.
- **Upsert guard**: cek `device_key` sudah ada di `user_devices` user tersebut sebelum insert.

---

## 5. Wireframe & Status Implementasi

> **Status:** Semua halaman sudah **terimplementasi penuh** di `src/app/`. Wireframe di bawah sudah disesuaikan dengan aktual.

### 5.1 Elemen Global

- **Root layout (`src/app/layout.tsx`):** `html/body` + font **Inter** via `next/font/google` + `ThemeProvider` (next-themes) + `Toaster` (sonner). Route groups:
  - `(marketing)` → landing `(`/`)` — navbar + footer
  - `(auth)` → `/auth` — split layout, tanpa navbar
  - `(app)` → dashboard `/devices`, `/rules`, `/logs` — topbar app
- **Primitives (`src/components/ui/`):** Button (primary/secondary/danger/ghost), Input (label + error), Badge (success/warning/error/info/whatsapp/default), Modal (escape + backdrop close), Toggle (`role="switch"`), EmptyState, Skeleton, Toast (sonner).
- **Layout components:** Navbar (sticky, mobile hamburger), Topbar (nav links + logout), Footer, ThemeToggle (sun/moon dengan CSS transition).

### 5.2 Landing Page (`/`) — `src/app/(marketing)/page.tsx`

1. **Navbar** (logo WMark → `/devices`, nav "Fitur" → `/#fitur`, "Cara pakai" → `/#cara-pakai`, ThemeToggle, CTA "Masuk" → `/auth`)
2. **Hero:** headline "Kelola bot WhatsApp Anda dari satu dashboard" + subjudul + 2 CTA ("Buat akun gratis" → `/auth`, "Lihat cara pakai" → `#cara-pakai`) + `HeroPreview` (static mockup Devices screen)
3. **How it works (`#cara-pakai`):** 3 langkah (Masuk & tambah device → Scan QR → Buat aturan), numbered steps dengan border-kiri primary
4. **Features (`#fitur`):** 3 section alternating layout (`SectionFeature` component):
   - "Semua nomor di satu tempat" — `DeviceStackVisual` (overlapping cards)
   - "Auto-reply yang bisa dikontrol" — `AutoReplyVisual` (chat bubble mockup)
   - "Setiap aktivitas tercatat" — `LogsVisual` (timeline mockup)
5. **Creator statement (`#tentang`):** Quote block dengan avatar "W" + "Tim wenderdotnet"
6. **Newsletter (`#newsletter`):** `NewsletterForm` → server action `subscribeNewsletter()` → tabel `newsletters`
7. **Footer** — brand, nav links, copyright

### 5.3 `/auth` (login & register — satu halaman) — `src/app/(auth)/auth/page.tsx`

Layout: **kiri = brand panel** (bg-primary gradient, headline, capabilities list), **kanan = form**. Tanpa navbar.

**Tab "Masuk":**

1. Heading "Masuk" + subjudul
2. Input Email • Input Password • area error (role="alert")
3. Tombol "Masuk" (loading saat submit)
4. Divider "atau" • tombol "Masuk dengan Google" (Google OAuth icon)
5. Link "Daftar" → pindah ke tab "Daftar"

**Tab "Daftar":**

1. Heading "Daftar" + subjudul
2. Input Nama Lengkap • Email • Password (min 8) • Konfirmasi Password • area error
3. Tombol "Daftar" (loading saat submit) • tombol "Masuk dengan Google"
4. Link "Masuk" → pindah ke tab "Masuk"

> **Catatan:** Fitur "Lupa password?" belum diimplementasi (belum ada di UI). Device "Settings" dan assign device ke rule juga belum ada di UI (Phase lanjutan).

### 5.4 `/devices` (Dashboard) — `src/app/(app)/devices/page.tsx`

1. Topbar global (Devices | Logs, Rules dihapus di 004)
2. Heading "Devices" + subjudul "Kelola device WhatsApp Anda" + stats (Total/Terhubung/Butuh perhatian)
3. Tombol primary "+ Tambah Device"
4. Daftar kartu device (terbaru di atas), tiap kartu:
   - Status badge (Connected/Connecting/Disconnected) + JID
   - Nama device (bold, link ke `/devices/[deviceId]`) + device ID (monospace) + `Detail` link
   - Tombol aksi: Hubungkan (Plug, tab QR/Kode, `loading+disabled` guard) / Disconnect (Unplug, `loading+disabled`) + Delete (Trash2, `loading+disabled`)
   - Auto-refresh 5s per-device (visibility-aware, 1 call `GET /api/devices`, bukan N+1), auto-close QR modal ketika `logged_in`
5. Empty state: QrCode icon + "Belum ada device" + CTA tambah
6. Loading state: 3 skeleton cards

**Modal "Tambah Device":** Heading → input "Nama Device" → tombol "Buat & Hubungkan" (`loading+disabled`) + "Batal".

**Modal "QR Connect" (tab QR/Kode, default QR):** Tabs `QR Code` (QrCode) / `Kode Pairing` (KeyRound) — `role="tablist"`. QR: instruksi scan → QR image (`GET /api/devices/:id/login` `qr_link` flat+wrapper) → status + `Muat Ulang` (`loading`). Kode: Input Nomor HP (`62812…`) → `Dapatkan Kode` (`POST /api/devices/:id/login/code?phone=`, `loading+disabled`) → tampil `pair_code` besar + `Copy/Check` + `Kode Baru`.

**Modal "Hapus Device":** Konfirmasi + tombol "Hapus permanen" (`loading+disabled` anti double-click).

### 5.4b `/devices/[deviceId]` (Detail Device) — `src/app/(app)/devices/[deviceId]/page.tsx` (baru di 004)

1. Header: Back link + nama + badge + JID + actions Hubungkan/Disconnect
2. Tabs `Overview | Webhook | Automasi` (`role="tablist"`, `aria-selected`)
3. **Overview:** Status (Signal/WiFiOff), Device ID, JID, auto-refresh 5s
4. **Webhook:** Form `webhook_url*`, `webhook_secret`, `webhook_events`, `Skip TLS Verify` (`Toggle`) → `Simpan` (`PATCH /api/devices/:id/webhook` → `PATCH /devices/{id}/webhook` GOWA, `loading+disabled`) + `Test Kirim Dummy` (`POST /api/devices/:id/webhook/test` hit real `webhook_url`, tampil status/body, `loading+disabled`)
5. **Automasi:** List per-device (`GET /api/devices/:id/automations`), card: nama + `trigger_category` (prefix/contains/exact/regex) + pattern→reply + badges `target_type/target_jid`, `is_reply`/`mentions`/`duration` + `Toggle enabled` (`loading` per row) + `Edit`/`Delete` (`loading+disabled`). **Tambah/Edit Modal:** Nama, Kategori (select), Tipe Target (Semua/Group/Private) → jika Group tampil **Group Picker** (`GET /api/devices/:id/groups` via `X-Device-Id`, cached 30s, limit 500 `openapi.yaml:1074`, search debounce, virtual 100, multi-select → **duplicate per grup** 1 automasi per `target_jid`), Pola, Balasan, checkbox `Reply`/`Forwarded`, Mentions (`@everyone,628xxx` per `openapi.yaml:1244`), Duration (0/86400/604800/7776000). Simpan `POST /api/devices/:id/automations` (array `target_jids` → N rows) atau `PUT /:id/:automationId`, semua `loading+disabled`.

> **Rules global dihapus TOTAL** di `004_per_device_automations.sql` (DROP `rules`/`device_rules`), nav `Rules` dihapus dari `src/components/topbar.tsx:12`.

### 5.6 `/logs` (aktivitas bot) — `src/app/(app)/logs/page.tsx`

1. Topbar global
2. Header: heading "Logs" + subjudul
3. Filter bar: dropdown Device + dropdown Event Type (7 tipe)
4. Timeline aktivitas (terbaru di atas) dengan vertical line + dot indicator:
   - Timestamp relatif ("Baru saja", "5 menit yang lalu", dst.)
   - Event badge (Message Received, Message Sent, Auto Reply Sent, Auto Read, Session Connected, Session Disconnected, Error)
   - Deskripsi (dari API)
   - Body/isi pesan (jika ada, dalam pre/code block)
5. Empty state: "Belum ada logs"
6. Loading state: 5 skeleton cards

> **Catatan:** Inbox/percakapan 2 kolom **tidak termasuk MVP** — diganti log aktivitas. Fitur balas dari dashboard masuk Phase lanjutan.

### 5.7 Komponen Marketing (`src/components/marketing/`)

| Komponen         | File               | Deskripsi                                           |
| ---------------- | ------------------ | --------------------------------------------------- |
| `HeroPreview`    | `hero-preview.tsx` | Static mockup Devices screen untuk hero section     |
| `DeviceStackVisual` | `feature-visuals.tsx` | Overlapping cards (QR panel + device list)      |
| `AutoReplyVisual`| `feature-visuals.tsx` | Chat bubble mockup auto-reply flow              |
| `LogsVisual`     | `feature-visuals.tsx` | Timeline log mockup dengan badges              |
| `NewsletterForm` | `newsletter-form.tsx` | Email form → server action → toast feedback     |

---

## 6. Data Schema

### Konvensi

- Tabel jamak `snake_case`; kolom `snake_case`; PK `id uuid` (default `gen_random_uuid()`).
- Timestamp: `created_at` + `updated_at` (`timestamptz`, default `now()`).
- **Tabel `devices` TIDAK ADA** — device dikelola bot server; status dicek live via `GET {BOT_API_URL}/devices` dan `GET /devices/{device_id}/status`.
- Referensi device di DB memakai **`device_key` text** (= **`device_id`** dari bot service, bukan `sessionId`).

### `users` (profil, 1:1 dengan `auth.users`)

| Kolom        | Tipe        | Constraint                                   |
| ------------ | ----------- | -------------------------------------------- |
| `id`         | uuid        | **PK**, FK → `auth.users.id`                 |
| `full_name`  | text        | NOT NULL                                     |
| `plan`       | text        | NOT NULL, default `'free'` (pricing ditunda) |
| `created_at` | timestamptz | NOT NULL, default `now()`                    |
| `updated_at` | timestamptz | NOT NULL, default `now()`                    |

> Identitas & email hidup di `auth.users` (Supabase Auth — enable provider Google + email). Email **tidak diduplikasi** (3NF).

### `newsletters` (subscribe landing — publik)

| Kolom        | Tipe        | Constraint                            |
| ------------ | ----------- | ------------------------------------- |
| `id`         | uuid        | **PK**                                |
| `email`      | text        | NOT NULL, **UNIQUE**                  |
| `created_at` | timestamptz | NOT NULL, default `now()`             |

_Insert publik (anon) via RLS policy `USING (true) WITH CHECK (true)`; select hanya via service key (admin). Tidak ada FK ke `auth.users` (belum login)._

### `user_devices` (junction: user ↔ device_key) — di-insert SAAT logged_in

| Kolom        | Tipe        | Constraint                                       |
| ------------ | ----------- | ------------------------------------------------ |
| `id`         | uuid        | **PK**                                           |
| `user_id`    | uuid        | NOT NULL, FK → `auth.users.id` ON DELETE CASCADE |
| `device_key` | text        | NOT NULL (= device_id bot)                       |
| `name`       | text        | NOT NULL (nama ramah dari UI)                    |
| `role`       | text        | NOT NULL, default `'owner'`                      |
| `created_at` | timestamptz | NOT NULL, default `now()`                        |

**UNIQUE `(user_id, device_key)`** • Index `(user_id)`

### `device_automations` (per-device, menggantikan `rules`+`device_rules` global — 004)

| Kolom              | Tipe        | Constraint                                                                 |
| ------------------ | ----------- | -------------------------------------------------------------------------- |
| `id`               | uuid        | **PK**                                                                     |
| `user_id`          | uuid        | NOT NULL, FK → `auth.users.id` ON DELETE CASCADE                           |
| `device_key`       | text        | NOT NULL (= device_id bot, FK implisit ke `user_devices.device_key`)       |
| `name`             | text        | NOT NULL (mis. "Balas harga di Grup A")                                    |
| `trigger_category` | text        | NOT NULL, CHECK `IN ('prefix','contains','exact','regex')` DEFAULT 'contains' |
| `trigger_type`     | text        | NOT NULL, CHECK `IN ('keyword','regex')` DEFAULT 'keyword' (derived)       |
| `pattern`          | text        | NOT NULL                                                                   |
| `reply`            | text        | NOT NULL                                                                   |
| `is_reply`         | boolean     | NOT NULL DEFAULT false (`openapi.yaml:1232` `reply_message_id`)            |
| `mentions`         | text        | NULL, comma-separated `628xxx,@everyone` (`openapi.yaml:1244`)             |
| `duration`         | integer     | NOT NULL DEFAULT 0 CHECK `IN (0,86400,604800,7776000)` (disappearing)      |
| `is_forwarded`     | boolean     | NOT NULL DEFAULT false                                                     |
| `target_type`      | text        | NULL, CHECK `IN ('group','private')` (null = semua)                       |
| `target_jid`       | text        | NULL (1 grup per row — multi grup = duplicate per `target_jid`)           |
| `enabled`          | boolean     | NOT NULL DEFAULT true                                                      |
| `created_at`       | timestamptz | NOT NULL DEFAULT now()                                                     |
| `updated_at`       | timestamptz | NOT NULL DEFAULT now()                                                     |

Index `(user_id)`, `(device_key)`, `(device_key, enabled)` • **UNIQUE `(device_key, name, target_jid, pattern)`** • RLS `user_id=auth.uid() AND user_owns_device(device_key)` (via `002` helper). Grants `authenticated, service_role`. `rules`/`device_rules` sudah **DROP TOTAL** via `004_per_device_automations.sql`.

### `logs` (aktivitas bot — append-only)

| Kolom         | Tipe        | Constraint                                                                                                                                |
| ------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `id`          | uuid        | **PK**                                                                                                                                    |
| `user_id`     | uuid        | NOT NULL, FK → `auth.users.id` ON DELETE CASCADE                                                                                          |
| `device_key`  | text        | NOT NULL                                                                                                                                  |
| `event_type`  | text        | NOT NULL, CHECK `IN ('message_sent','message_received','auto_reply_sent','auto_read','session_connected','session_disconnected','error')` |
| `chat_jid`    | text        | NULL                                                                                                                                      |
| `chat_name`   | text        | NULL                                                                                                                                      |
| `sender_jid`  | text        | NULL                                                                                                                                      |
| `sender_name` | text        | NULL                                                                                                                                      |
| `body`        | text        | NULL                                                                                                                                      |
| `metadata`    | jsonb       | NULL                                                                                                                                      |
| `created_at`  | timestamptz | NOT NULL, default `now()`                                                                                                                 |

_Append-only (tanpa `updated_at`)._ Index `(user_id, created_at DESC)`

### ERD

```
auth.users 1──1 users
auth.users 1──N user_devices          (device_key = device_id bot)
user_devices 1──N device_automations  (device_key, per-device, 1 row = 1 target_jid)
users      1──N logs
newsletters  (standalone — tanpa FK)
— rules/device_rules DROPPED di 004 (migrasi ke device_automations)
```

**Semua FK anak: ON DELETE CASCADE.**

### RLS & Bot

- `users`: baris sendiri (`id = auth.uid()`)
- `newsletters`: insert publik (anon); select hanya service key
- `user_devices`: `user_id = auth.uid()` (+ `webhook_*` columns dari `002`)
- `device_automations`: `user_id = auth.uid() AND user_owns_device(device_key)` (via `002` helper)
- `logs`: `user_id = auth.uid()`
- **Next.js (webhook receiver) tulis `logs` via service key** (bypass RLS) saat memproses webhook events dari bot (`device_automations` per `device_key`). Bot **tidak** menulis ke Supabase.

### API Contract — yang Next.js asumsikan dari Bot Service

Merujuk ke `openapi.yaml` (root repo) — endpoint berikut dipakai di MVP. Semua panggilan pakai **Basic Auth** (`BOT_API_URL` + `BOT_AUTH`).

| Method + Path                          | Request → Response                                 |
| -------------------------------------- | -------------------------------------------------- |
| `POST /devices`                        | `{ device_id?, webhook_url?, ... }` → device slot  |
| `GET /devices`                         | → `[{ id, display_name, state, jid }]`             |
| `GET /devices/{device_id}`             | → info device                                      |
| `DELETE /devices/{device_id}`          | → hapus slot (logout + clear data)                 |
| `GET /devices/{device_id}/login`       | → `{ device_id, qr_link, qr_duration }` (QR = URL) |
| `POST /devices/{device_id}/login/code` | `?phone=` → `{ pair_code }` (sambung tanpa scan)   |
| `GET /devices/{device_id}/status`      | → `{ is_connected, is_logged_in }`                 |
| `POST /devices/{device_id}/logout`     | → logout, slot dipertahankan                       |
| `POST /devices/{device_id}/reconnect`  | → reconnect ke WhatsApp                            |
| `POST /send/message`                   | `{ phone, message, reply_message_id?, ... }` → ack |
| `GET /health`                          | → health check                                     |

**Webhook events (inbound, dari bot → Next.js):**

- Bot dikonfigurasi `WHATSAPP_WEBHOOK_URL` → `{APP_URL}/api/webhook/gowa`, `WHATSAPP_WEBHOOK_SECRET` utk sign HMAC, `WHATSAPP_WEBHOOK_EVENTS` (mis. `message,message.ack`).
- Event `message` membawa payload chat/sender/isi pesan. Next.js (rule engine) verifikasi signature → evaluasi `rules` user → auto-read (bila rule listen + auto_read) & auto-reply (via `POST /send/message`) → insert `logs`.
- Status per-device juga bisa didapatkan via **WebSocket** `/ws?device_id=<id>` (upgrade nanti).

---

## 7. Style & Mood Visual

**Mood:** Clean & professional. **Dark + light mode** (keduanya didukung, toggle persisten via `next-themes`).

> **Status implementasi:** Bagian ini sudah **terimplementasi penuh** di `src/app/globals.css` dengan CSS custom properties yang di-map ke Tailwind v4 via `@theme inline`.

### 7.1 Prinsip Warna — aturan 80/20

80% permukaan netral + teks (kesan "clean"), 20% warna untuk aksi & status (kesan "professional").

| Peran          | Warna   | Hex (Light / Dark)                                   | Keterangan                         | Status         |
| -------------- | ------- | ---------------------------------------------------- | ---------------------------------- | -------------- |
| Neutral (80%)  | Slate   | bg `#F8FAFC` / `#0F172A`; text `#0F172A` / `#F1F5F9` | Kontras ≥ 12:1 (AAA)               | ✅ Implemented |
| Primary (20%)  | Emerald | `#34D399` (kedua mode)                               | Rasio ~4.5:1 di bg terang (AA)     | ✅ Implemented |
| Primary Hover  | Emerald | `#2C9771`                                            | State hover tombol/link            | ✅ Implemented |
| Success        | Emerald | `#34D399` / strong `#1E4D3B` (light) / `#6EE7B7` (dark) | Status connected/sukses       | ✅ Implemented |
| Warning        | Amber   | `#D97706` (light) / `#FBBF24` (dark)                 | Status connecting/warning          | ✅ Implemented |
| Error          | Rose    | `#E11D48` (light) / `#FB7185` (dark)                 | Error/hapus                        | ✅ Implemented |
| Info           | Blue    | `#2563EB` (light) / `#60A5FA` (dark)                 | Badge listen/rule                  | ✅ Implemented |
| Badge WhatsApp | Hijau   | `#25D366`                                            | Badge "connected" (konteks produk) | ✅ Implemented |

> **Catatan desain:** Referensi `design.png` menunjukkan skema warna hijau tua/teal untuk brand "Slick". Implementasi wenderdotnet menggunakan Emerald (`#34D399`) sebagai primary — selaras dengan nuansa hijau WhatsApp produk.

### 7.2 Tipografi

- **UI:** **Inter** (variable font) via `next/font/google`, self-host — konsisten antar OS, kesan SaaS pro. Default system font TIDAK dipakai.
- **Kode/pattern/log:** `ui-monospace` (font bawaan) — tidak butuh font khusus.
- Aksesibilitas: kontras ≥ AA; status selalu disertai teks/ikon, bukan warna saja.
- **Implementasi:** Variable `--font-inter` di CSS, di-map ke `--font-sans` di `@theme inline`.

### 7.3 Design Tokens (CSS Custom Properties)

Semua token sudah diimplementasi di `src/app/globals.css`:

**Shadow tokens:** `--shadow-xs`, `--shadow-sm`, `--shadow-md`, `--shadow-lg` (opacity berbeda per theme)

**Border radius tokens:** `--radius-sm: 6px`, `--radius-md: 8px`, `--radius-lg: 12px`, `--radius-xl: 16px`

**Penggunaan di komponen:** `rounded-[var(--radius-lg)]`, `shadow-[var(--shadow-md)]`, dst.

### 7.4 Referensi Mood

- [Linear](https://linear.app) — neutral + indigo, dark mode ikonik
- [Stripe](https://stripe.com) — putih bersih, aksen indigo/blue
- [Notion](https://www.notion.so) — monokrom dominan, warna hanya utk status/aksi
- **design.png** — referensi visual SaaS landing page dengan skema hijau tua, dashboard preview, feature sections dengan ikon

---

## 8. Log Keputusan (Approved)

| No  | Keputusan                                                                                                                                                                                       | Status      |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| 1   | Nama produk **wenderdotnet**                                                                                                                                                                    | ✅ Approved |
| 2   | Satu Next.js app; bot eksternal via **podman compose**; compose untuk bot di luar repo                                                                                                          | ✅ Approved |
| 3   | Supabase untuk akun (email + **SSO Gmail**) & database; auth/users id di `auth.users`                                                                                                           | ✅ Approved |
| 4   | Normalisasi 3NF: junction `user_devices` & `device_rules`; `rules` satu tabel penuh                                                                                                             | ✅ Approved |
| 5   | Tabel `devices` **tidak ada**; status live dari bot `GET /devices`; referensi pakai `device_key`                                                                                                | ✅ Approved |
| 6   | **Insert `user_devices` hanya setelah logged_in/connected** (listen status bot → baru masuk DB)                                                                                                 | ✅ Approved |
| 7   | Listeners + auto_reply_rules → digabung tabel `rules`; inbox → tabel `logs` (fitur balas dashboard TIDAK di MVP)                                                                                | ✅ Approved |
| 8   | Listener input manual di MVP; integrasi `/chats` bot ditunda                                                                                                                                    | ✅ Approved |
| 9   | Rules = milik user (global), assignable ke banyak device                                                                                                                                        | ✅ Approved |
| 10  | Pricing/billing ditunda (late)                                                                                                                                                                  | ✅ Approved |
| 11  | Dark + light mode (keduanya)                                                                                                                                                                    | ✅ Approved |
| 12  | Mood clean & professional; **Emerald** primary (`#34D399`) + slate neutral + semantic colors; **Inter** via `next/font/google`                                                                    | ✅ Approved |
| 13  | Status device di-polling (3 detik) dari bot (`GET /devices/{id}/status`); upgrade WebSocket `/ws` nanti                                                                                         | ✅ Approved |
| 14  | Bot service = image **`go-whatsapp-web-multidevice`** (API di `openapi.yaml`); device slot pakai `device_id`                                                                                    | ✅ Approved |
| 15  | **Rule engine dijalankan di Next.js** (webhook receiver `/api/webhook/gowa`): verify HMAC → evaluasi rules → auto-reply via `POST /send/message` → tulis `logs`. Bot hanya kirim webhook events | ✅ Approved |
| 16  | QR login = `qr_link` (URL) dari `GET /devices/{id}/login`; dirender via **proxy server-side** (Basic Auth); ada opsi pairing code                                                               | ✅ Approved |
| 17  | Landing page (`/`) + auth gabung di `/auth` (split layout, tab Masuk/Daftar); route group `(marketing)` / `(auth)` / `(app)`; newsletter → tabel `newsletters` (insert publik)                    | ✅ Approved |
| 18  | **Server actions hanya di `src/server/actions/`** (`"use server"`); file frontend tidak boleh berisi `"use server"` — cukup panggil method                                                               | ✅ Approved |
| 19  | Tailwind CSS v4 (tanpa config file); CSS custom properties sebagai design tokens; `@theme inline` untuk mapping ke utility classes                                                              | ✅ Approved |
| 20  | React Compiler enabled via `babel-plugin-react-compiler` + `reactCompiler: true` di `next.config.ts`                                                                                            | ✅ Approved |
| 21  | Middleware entry point: `src/proxy.ts` (bukan `middleware.ts` bawaan Next.js)                                                                                                                    | ✅ Approved |
| 22  | Toast notification pakai **sonner** (bukan sonner-as-toast atau library lain)                                                                                                                   | ✅ Approved |

---

## 9. Status Implementasi (Codebase Audit)

> Dokumen ini di-update pada **27 Agustus 2026** berdasarkan analisis menyeluruh terhadap codebase aktual.

### 9.1 Fitur MVP — Status (diupdate 004)

| Fitur                         | Status         | Lokasi                              | Catatan                                           |
| ----------------------------- | -------------- | ----------------------------------- | ------------------------------------------------- |
| Auth (email + password)       | ✅ Implemented | `(auth)/auth/page.tsx`              | Login + Register, tab switcher, `loading+disabled` guard |
| Auth (Google OAuth)           | ✅ Implemented | `(auth)/auth/page.tsx`              | `signInWithOAuth` → redirect `/devices`, `oauthLoading` guard |
| Route protection (middleware) | ✅ Implemented | `src/proxy.ts` + `lib/supabase/middleware.ts` | Protects `/devices`, `/logs` (`/rules` dihapus 004) |
| Landing page                  | ✅ Implemented | `(marketing)/page.tsx`              | Hero, features, how-it-works, creator, newsletter |
| Navbar (marketing)            | ✅ Implemented | `components/navbar.tsx`             | Sticky, mobile hamburger, ThemeToggle             |
| Footer (marketing)            | ✅ Implemented | `components/footer.tsx`             | Static footer                                      |
| Theme toggle (dark/light)     | ✅ Implemented | `components/theme-toggle.tsx`       | `next-themes`, CSS transitions                    |
| Device list                   | ✅ Implemented | `(app)/devices/page.tsx`            | CRUD, badges, **5s per-device polling** (visibility-aware, 1 call), auto-close QR/code modal, `Detail` link, anti double-click |
| Device add + QR/Code connect  | ✅ Implemented | `(app)/devices/page.tsx`            | Modal tab **QR** (`qr_link`) / **Kode** (`pair_code`), `loading+disabled` guard, auto-refresh |
| Device detail                 | ✅ Implemented | `(app)/devices/[deviceId]/page.tsx` | Tabs **Overview/Webhook/Automasi**, status 5s polling, WS fallback |
| Device Webhook                | ✅ Implemented | `/api/devices/[id]/webhook` + `/test` | Per-device `webhook_*` (PATCH GOWA), Test dummy real, guard |
| Device Automasi               | ✅ Implemented | `/api/devices/[id]/automations` + `/[aid]` + `page.tsx` | Per-device `device_automations` (prefix/contains/exact/regex → keyword/regex, `is_reply`/`mentions` `@everyone`/duration/`is_forwarded`, `target_jid` 1 per row duplicate per grup), group picker `GET /groups` (X-Device-Id, cached 30s, search, virtual 100), guard |
| Group picker                  | ✅ Implemented | `page.tsx` `GroupItem` | `GET /user/my/groups` 500 limit, cached, search debounce, multi-select |
| Device delete                 | ✅ Implemented | `(app)/devices/page.tsx` + `[deviceId]` | Confirmation modal `loading+disabled` |
| Rules (legacy)                | ❌ Removed     | `004_per_device_automations.sql` | **DROP TOTAL** `rules`/`device_rules`, diganti `device_automations` |
| Logs timeline                 | ✅ Implemented | `(app)/logs/page.tsx`               | Timeline + filters, Refresh `loading+disabled` |
| Newsletter subscription       | ✅ Implemented | `components/marketing/newsletter-form.tsx` | Server action → `newsletters` table         |
| GOWA bot proxy                | ✅ Implemented | `lib/gowa.ts`                       | Basic Auth, X-Device-Id header                    |
| Webhook receiver              | ✅ Implemented | `api/webhook/gowa/route.ts`         | HMAC, `device_automations` per `device_key`, mentions/duration/forwarded |
| UI primitives                 | ✅ Implemented | `components/ui/`                     | Button (`loading` → `disabled`), Input, Badge, Modal, Toggle, etc. |
| Design tokens (CSS)           | ✅ Implemented | `globals.css`                       | Shadow, radius, color, font variables             |
| Supabase RLS                  | ✅ Implemented | `supabase/migrations/001-004`       | All tables RLS + `user_owns_device`, Grants `003` |
| Database schema               | ✅ Implemented | `supabase/migrations/004`           | `users`, `newsletters`, `user_devices`, `device_automations`, `logs` (rules di-drop) |

### 9.2 Fitur yang Belum Diimplementasi (dari Spec) — update 004

| Fitur                          | Status           | Catatan                                                  |
| ------------------------------ | ---------------- | -------------------------------------------------------- |
| "Lupa password?" link          | ❌ Not in UI     | Belum ada di auth page; bisa ditambahkan via Supabase Auth |
| Device role display            | ❌ Not in UI     | Kolom `role` ada di DB, tidak ditampilkan di UI          |
| Zod validation                 | ⚠️ Installed     | `zod@4.4.3` sudah install tapi belum dipakai di code    |
| WebSocket for status realtime  | ⚠️ Partial       | Polling 5s per-device + visibility-aware sudah, WS proxy disiapkan (BOT_AUTH server-only jadi polling utama) |
| Device Settings → Rules assign | ✅ Implemented   | Sekarang per-device `device_automations` di `/devices/[id]` Automasi tab (prefix/contains/exact/regex, mentions, group picker) |
| Pairing code login             | ✅ Implemented   | Tab QR/Kode di `devices/page.tsx` + `[deviceId]/page.tsx` (`POST /login/code`) |

### 9.3 Ketidaksesuaian Spec vs Implementasi

| Item Spec                      | Implementasi Aktual                                      |
| ------------------------------ | -------------------------------------------------------- |
| Primary warna **Indigo** `#4F46E5` | Primary warna **Emerald** `#34D399` (lebih cocok untuk brand WhatsApp) |
| Auth: "Lupa password?" link    | Tidak ada di UI                                           |
| Device: "Settings" menu        | Tidak ada — hanya Connect/Disconnect/Delete               |
| Device: "tanggal dibuat"       | Tidak ditampilkan; hanya nama + device ID                 |
| Rules: "assign ke device"      | Tidak ada di UI (hanya ada di DB schema)                  |
| Landing: "Intro singkat proyek" | Diganti menjadi "How it works" (3 langkah)              |
| Landing: Hero preview          | Ditambahkan `HeroPreview` (mockup Devices screen) — tidak disebut di spec lama |

### 9.4 Design Reference (`design.png`)

File `design.png` di `.agents/` menunjukkan desain landing page untuk produk "Slick — SaaS Management Made Simple" dengan:

- **Skema warna:** Dark green/teal (selaras dengan primary Emerald `#34D399` yang diimplementasi)
- **Layout:** Hero dengan dashboard preview, features dengan ikon, pricing, testimonials, FAQ
- **Karakter:** SaaS clean, professional, modern — sesuai mood "clean & professional" di spec

> **Kesimpulan:** `design.png` adalah referensi visual/inspirasi, bukan wireframe eksak untuk wenderdotnet. Implementasi aktual mengikuti spec coldstart.md dengan penyesuaian warna (Emerald bukan Indigo) dan beberapa deviation yang tercatat di atas.

---

_Dokumen ini adalah sumber kebenaran (source of truth) pengembangan wenderdotnet. Ubah hanya melalui proses persetujuan eksplisit._
