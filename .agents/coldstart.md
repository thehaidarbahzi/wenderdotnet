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

- using nextjs app router
- 1 landing page consisting of: Hero CTA, short introduction of this project, 3 points of what is the main feature of this project not using card but with the left image right text of the title feature, short description of the feature and cta for learn more and each is reversed so first image is left and text right, second is reversed then last is reversed again, section of what the creator say about this project like kata sambutan from creator, section of subscribe to newsletter, then footer (navbar dan footer taruh di `(marketing)` layout — root layout hanya `html/body` + font)
- 1 page untuk login/register nanti di buat layout full gambar di kiri form di kanan, route `/auth` (tab "Masuk" / "Daftar", tanpa navbar)
- **Server actions tidak pernah didefinisikan di file frontend.** Semua fungsi `"use server"` (mutasi, panggilan ke bot, tulis DB) ditaruh di folder khusus, mis. `src/server/actions/*` (dibagi per domain: `devices.ts`, `rules.ts`, `logs.ts`, `auth.ts`, `newsletter.ts`). Frontend hanya memanggil method dari sana. Konsekuensi: file UI tidak mengandung `"use server"` sama sekali.

---

## 2.9 Konvensi Kode

- **Server actions:** hanya di `src/server/actions/` (`"use server"`); file frontend (komponen/page) tidak boleh berisi `"use server"` — cukup import method.
- **Bot proxy:** akses ke `BOT_API_URL` hanya lewat `src/lib/gowa.ts` (fetch + Basic Auth); dipanggil dari server action, bukan langsung dari browser.
- **Supabase client:** server-only (service key) di `src/lib/supabase/`; jangan pernah pakai service key di komponen client.

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

1. **Buka app** → landing page (`/`): Hero CTA → `/auth`. Belum login → landing/`/auth`; route app (`/devices`, `/rules`, `/logs`) di-redirect ke `/auth`.
2. **Auth** di `/auth` — tab "Masuk" / "Daftar" (email/password atau SSO Gmail) → Supabase Auth; row `users` dibuat otomatis via trigger.
3. **Login sukses** → redirect ke `/devices` (Dashboard). List device kosong + tombol "Tambah Device".
4. **User isi nama device** → `POST {BOT_API_URL}/devices` (bisa custom `device_id`) → bot buat device slot, state `disconnected` (belum ada di DB).
5. **App panggil `GET {BOT_API_URL}/devices/{device_id}/login`** → balas `{qr_link, qr_duration}` → QR dirender di browser via **proxy server-side** (bot pakai Basic Auth, tidak bisa di-fetch langsung dari browser).
6. **User scan QR** pakai WhatsApp (mirip WA Web) → bot update status internal → `connecting` → `logged_in`.
7. **App listen status bot** (polling `GET /devices/{device_id}/status` tiap 2–3 detik; upgrade ke WebSocket `/ws?device_id=<id>` nanti).
8. **Saat status = `logged_in`** → app insert row `user_devices(name, device_key=device_id)` → device resmi masuk DB, muncul di list.
9. **Konfigurasi rules** di `/rules` (global, bisa di-assign ke banyak device).
10. **Device berjalan** — bot kirim webhook events ke Next.js (`/api/webhook/gowa`); app verifikasi HMAC, evaluasi rules dari Supabase, eksekusi auto-read/auto-reply via `POST /send/message`, tulis `logs`; dashboard menampilkan timeline.

### 4.2 Device Lifecycle (detail)

```
1. User isi nama device
2. App → POST {BOT_API_URL}/devices → bot buat device slot (state disconnected)
3. App → GET /devices/{device_id}/login → {qr_link, qr_duration}
4. QR ditampilkan (proxy server-side); device slot hidup di bot (BELUM ada row di DB)
5. User scan → bot update status internal (connecting → logged_in)
6. App LISTEN status bot (polling /devices/{device_id}/status, tiap 2–3 detik)
7. Saat status = logged_in → insert user_devices(name, device_key=device_id)
8. Device masuk DB; muncul di list Devices
```

**Aturan wajib:**

- **Insert DB hanya setelah connected/logged_in** — device yang gagal/abandon tidak pernah masuk DB.
- **QR timeout pakai `qr_duration` dari bot** (default 30 dtk; expired → tombol "Muat ulang" memanggil login lagi) + tombol "Batal" memanggil `POST /devices/{device_id}/logout` → hindari slot orphan.
- **Upsert guard**: cek `device_key` sudah ada di `user_devices` user tersebut sebelum insert.

---

## 5. Wireframe

### 5.1 Elemen Global

- **Root layout (`layout.tsx`):** hanya `html/body` + font **Inter** + theme base. Route groups:
  - `(marketing)` → landing `(`/`)` — navbar (logo → `/`, CTA "Masuk" → `/auth`) + footer.
  - `(auth)` → `/auth` — split layout, tanpa navbar.
  - `(app)` → dashboard `/devices`, `/rules`, `/logs` — topbar app: logo "wenderdotnet" (klik → `/devices`), toggle dark/light (persisten), user menu (avatar, nama, Logout).
- **Primitives:** Button (primary/secondary/danger), Input, Textarea, Select, Toggle, Badge, Modal, Tab, Skeleton (loading), Empty state, Toast.

### 5.2 Landing Page (`/`)

1. Navbar (logo, CTA "Masuk" → `/auth`)
2. Hero: headline + subjudul + CTA (→ `/auth`)
3. Intro singkat proyek
4. 3 section fitur utama (bukan card): image kiri + teks kanan → terbalik (image kanan) → terbalik lagi (image kiri); tiap section: judul fitur, deskripsi singkat, CTA "Pelajari lebih lanjut" (scroll/section)
5. Kata sambutan creator
6. Subscribe newsletter (input email + tombol; simpan ke tabel `newsletters`)
7. Footer

### 5.3 `/auth` (login & register — satu halaman)

Layout: **kiri = full gambar** (brand/hero visual), **kanan = form**. Tanpa navbar. Dua tab: "Masuk" / "Daftar".

**Tab "Masuk":**

1. Heading "Masuk" + subjudul
2. Input Email • Input Password • area error
3. Tombol "Masuk" (loading saat submit)
4. Link "Lupa password?" • divider "atau" • tombol SSO Gmail
5. Link "Daftar akun baru" → pindah ke tab "Daftar"

**Tab "Daftar":**

1. Heading "Daftar"
2. Input Nama lengkap • Email • Password (min 8) • Konfirmasi password • area error
3. Tombol "Daftar" • tombol SSO Gmail
4. Link "Sudah punya akun? Masuk" → pindah ke tab "Masuk"

### 5.4 `/devices` (Dashboard)

1. Top bar global
2. Heading "Devices" + subjudul
3. Tombol primary "+ Tambah Device"
4. Daftar kartu device (terbaru di atas), tiap kartu:
   - Status badge (connected/connecting/disconnected)
   - Nama device (bold) + info kecil (tanggal dibuat, JID jika connected)
   - Tombol aksi: Connect / Disconnect
   - Menu: Settings → `/rules` (assigned), Delete (konfirmasi)
5. Empty state: ilustrasi + "Belum ada device" + CTA tambah

**Modal "Tambah Device":** Heading → input Nama device → tombol "Buat" + "Batal".

**Modal "QR Connect":** Heading "Hubungkan WhatsApp" → instruksi scan → kotak QR (auto-refresh, expired → "Muat ulang") → status "Menunggu scan…"/"Connected ✓" → tombol "Batal".

### 5.5 `/rules` (Rules — global per user)

1. Top bar global
2. Header: heading "Rules" + tombol "+ Tambah Rule"
3. Daftar rule (tiap item):
   - Badge action type (`listen` / `auto_reply`)
   - Nama rule
   - Ringkasan: target (grup/private), pattern, reply (truncate)
   - Toggle Enabled • Toggle Auto-read (untuk listen)
   - Tombol Edit + Hapus (konfirmasi)
   - Kolom "Device" (list device yang di-assign)
4. Empty state: "Belum ada rule"

**Modal "Tambah/Edit Rule":**

1. Input Nama rule
2. Select Action type (`listen` / `auto_reply`)
3. Select Target type (`group` / `private`, opsional — kosong = semua)
4. Input Target JID (opsional, kosong = semua dari target type)
5. (auto_reply) Select Trigger type (`keyword`/`regex`) + Input Pattern + Textarea Reply
6. (listen) Toggle Auto-read (default off)
7. Toggle Enabled (default on)
8. Assign ke device (checkbox/select)
9. Tombol "Simpan" + "Batal"

### 5.6 `/logs` (aktivitas bot — per device atau global)

1. Top bar global
2. Header: heading "Logs" + filter device + filter event type
3. Timeline aktivitas (terbaru di atas), tiap item:
   - Timestamp
   - Event badge (`message_sent`, `message_received`, `auto_reply_sent`, `auto_read`, `session_connected`, `session_disconnected`, `error`)
   - Deskripsi: "bot kirim pesan ke grup _Promo_", "auto-read di PC _Budi_", dst.
   - Body/isi pesan (jika ada)
4. Empty state: "Belum ada aktivitas"

> Catatan: Inbox/percakapan 2 kolom **tidak termasuk MVP** — diganti log aktivitas (keputusan disetujui). Fitur balas dari dashboard masuk Phase lanjutan.

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

### `rules` (satu tabel penuh aturan, scoped per user)

| Kolom          | Tipe        | Constraint                                            |
| -------------- | ----------- | ----------------------------------------------------- |
| `id`           | uuid        | **PK**                                                |
| `user_id`      | uuid        | NOT NULL, FK → `auth.users.id` ON DELETE CASCADE      |
| `name`         | text        | NOT NULL (mis. "Auto-read grup promo")                |
| `action_type`  | text        | NOT NULL, CHECK `IN ('listen','auto_reply')`          |
| `target_type`  | text        | NULL, CHECK `IN ('group','private')`                  |
| `target_jid`   | text        | NULL (**null = semua** chat dari target_type)         |
| `trigger_type` | text        | NULL, CHECK `IN ('keyword','regex')` (utk auto_reply) |
| `pattern`      | text        | NULL (utk auto_reply)                                 |
| `reply`        | text        | NULL (utk auto_reply)                                 |
| `auto_read`    | boolean     | NOT NULL, default `false` (utk listen)                |
| `enabled`      | boolean     | NOT NULL, default `true`                              |
| `created_at`   | timestamptz | NOT NULL, default `now()`                             |
| `updated_at`   | timestamptz | NOT NULL, default `now()`                             |

Index `(user_id)`

### `device_rules` (junction: rule ↔ device_key)

| Kolom        | Tipe        | Constraint                                  |
| ------------ | ----------- | ------------------------------------------- |
| `id`         | uuid        | **PK**                                      |
| `device_key` | text        | NOT NULL (= device_id bot)                  |
| `rule_id`    | uuid        | NOT NULL, FK → `rules.id` ON DELETE CASCADE |
| `enabled`    | boolean     | NOT NULL, default `true`                    |
| `created_at` | timestamptz | NOT NULL, default `now()`                   |

**UNIQUE `(device_key, rule_id)`** • Index `(rule_id)`

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
auth.users 1──N user_devices    (device_key = device_id bot)
users      1──N rules
rules      1──N device_rules    (device_key = device_id bot)
users      1──N logs
newsletters  (standalone — tanpa FK)
```

**Semua FK anak: ON DELETE CASCADE.**

### RLS & Bot

- `users`: baris sendiri (`id = auth.uid()`)
- `newsletters`: insert publik (anon); select hanya service key
- `user_devices`: `user_id = auth.uid()`
- `rules`: `user_id = auth.uid()`; `device_rules`: via `rules.user_id`
- `logs`: `user_id = auth.uid()`
- **Next.js (webhook receiver) tulis `logs` via service key** (bypass RLS) saat memproses webhook events dari bot. Bot **tidak** menulis ke Supabase.

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

**Mood:** Clean & professional. **Dark + light mode** (keduanya didukung, toggle persisten).

### 7.1 Prinsip Warna — aturan 80/20

80% permukaan netral + teks (kesan "clean"), 20% warna untuk aksi & status (kesan "professional").

| Peran          | Warna   | Hex (Light / Dark)                                   | Keterangan                         |
| -------------- | ------- | ---------------------------------------------------- | ---------------------------------- |
| Neutral (80%)  | Slate   | bg `#F8FAFC` / `#0F172A`; text `#0F172A` / `#F1F5F9` | Kontras ≥ 12:1 (AAA)               |
| Primary (20%)  | Indigo  | `#4F46E5` (bg terang) • `#818CF8` (aksen utk dark)   | Rasio ~6.3:1 di bg terang (AA)     |
| Semantic       | Emerald | `#10B981` — connected/sukses                         | Status device & rule               |
| Semantic       | Amber   | `#F59E0B` — connecting/warning                       |                                    |
| Semantic       | Rose    | `#F43F5E` — error                                    |                                    |
| Badge WhatsApp | Hijau   | `#25D366`                                            | Badge "connected" (konteks produk) |

### 7.2 Tipografi

- **UI:** **Inter** (variable font) via `next/font`, self-host — konsisten antar OS, kesan SaaS pro. Default system font TIDAK dipakai.
- **Kode/pattern/log:** `ui-monospace` (font bawaan) — tidak butuh font khusus.
- Aksesibilitas: kontras ≥ AA; status selalu disertai teks/ikon, bukan warna saja.

### 7.3 Referensi Mood

- [Linear](https://linear.app) — neutral + indigo, dark mode ikonik
- [Stripe](https://stripe.com) — putih bersih, aksen indigo/blue
- [Notion](https://www.notion.so) — monokrom dominan, warna hanya utk status/aksi

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
| 12  | Mood clean & professional; slate 80% + indigo 20% + semantic; **Inter** via `next/font`                                                                                                         | ✅ Approved |
| 13  | Status device di-polling (2–3 dtk) dari bot (`GET /devices/{id}/status`); upgrade WebSocket `/ws` nanti                                                                                         | ✅ Approved |
| 14  | Bot service = image **`go-whatsapp-web-multidevice`** (API di `openapi.yaml`); device slot pakai `device_id`                                                                                    | ✅ Approved |
| 15  | **Rule engine dijalankan di Next.js** (webhook receiver `/api/webhook/gowa`): verify HMAC → evaluasi rules → auto-reply via `POST /send/message` → tulis `logs`. Bot hanya kirim webhook events | ✅ Approved |
| 16  | QR login = `qr_link` (URL) dari `GET /devices/{id}/login`; dirender via **proxy server-side** (Basic Auth); ada opsi pairing code                                                               | ✅ Approved |
| 17  | Landing page (`/`) + auth gabung di `/auth` (split layout, tab Masuk/Daftar); route group `(marketing)` / `(auth)` / `(app)`; newsletter → tabel `newsletters` (insert publik)                    | ✅ Approved |
| 18  | **Server actions hanya di `src/server/actions/`** (`"use server"`); file frontend tidak boleh berisi `"use server"` — cukup panggil method                                                               | ✅ Approved |

---

_Dokumen ini adalah sumber kebenaran (source of truth) pengembangan wenderdotnet. Ubah hanya melalui proses persetujuan eksplisit._
