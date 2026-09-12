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

> **Status:** Sudah **terimplementasi penuh** di codebase (11 Sep 2026).

- using nextjs app router (Next.js 16.3.4, React 19.2, TypeScript 7)
- **Styling:** Tailwind CSS v4 (tanpa `tailwind.config.*` — fully CSS-driven via `globals.css`, tokens `@theme inline`, radius seragam `rounded-sm` 6px, global `button{cursor:pointer}` + `active:scale-97`)
- **UI Library:** lucide-react (ikon), sonner (toast), clsx + tailwind-merge (class utility), next-themes (dark/light)
- 1 landing page (`src/app/(marketing)/page.tsx`): Hero CTA, 3 langkah cara pakai, 3 fitur `SectionFeature` alternating dengan visual `Image` SVG terpusat (`relative flex isolate` + light `absolute left-1/2 -translate blur-2xl rounded-sm bg-primary/10`, image `max-w-[300px] rounded-sm shadow-lg`, mobile `order-1` visual di atas `order-2` teks `items-center text-center lg:items-start lg:text-left`, gap `8 sm:gap-12 lg:gap-16`), quote kreator, newsletter, footer (navbar dan footer di `(marketing)` layout — root layout hanya `html/body` + font + metadata `title: "%s: wenderdotnet"` + JSON-LD)
- 1 page untuk login/register layout split-screen brand panel di kiri form di kanan, route `/auth` (tab "Masuk" / "Daftar", tanpa navbar), SEO `metadataBase` dari `NEXT_PUBLIC_SITE_URL`
- **Server actions** sebagian di `src/server/actions/*` (`newsletter.ts` aktif), sebagian bermigrasi ke route handlers `src/app/api/*` (devices, automations, groups, login). Prinsip tetap: file UI tidak mengandung `"use server"`.

### 2.9 Struktur Folder (Aktual, 11 Sep 2026)

```
src/
├── app/
│   ├── globals.css              # tokens warna/shadow/radius (--radius-sm 6px seragam) + @theme inline + cursor global
│   ├── layout.tsx               # Root: Inter, ThemeProvider, Toaster, metadata "%s: wenderdotnet", viewport, JSON-LD
│   ├── sitemap.ts / robots.ts / icon.svg / not-found.tsx
│   ├── (marketing)/
│   │   ├── layout.tsx           # Navbar + Footer
│   │   ├── page.tsx             # Landing: hero + SectionFeature (centered SVG+light, rounded-sm)
│   │   ├── privacy/page.tsx     # TOC 270px truncate, section border-t pt-10, rounded-sm, antislop copy
│   │   └── terms/page.tsx       # sama, 09 section bernomor
│   ├── (auth)/
│   │   ├── layout.tsx           # Split-screen brand panel
│   │   └── auth/page.tsx        # Login/Register tabs
│   ├── (app)/
│   │   ├── layout.tsx           # Topbar + blur orbs
│   │   ├── devices/page.tsx     # list + stats + QR/Kode modal + 5s polling
│   │   ├── devices/[deviceId]/page.tsx # Overview/Automasi (+ Webhook UI) + group picker
│   │   └── logs/page.tsx        # timeline + filters
│   └── api/
│       ├── devices/route.ts
│       ├── devices/[deviceId]/route.ts + /status + /login + /login/code + /groups + /logout
│       ├── devices/[deviceId]/automations/route.ts + /[automationId]/route.ts
│       ├── logs/route.ts
│       ├── webhook/gowa/route.ts
│       └── auth/callback/route.ts
├── components/
│   ├── ui/                      # Button (cursor-pointer active:scale), Input, Badge, Modal, Toggle, Skeleton, EmptyState
│   ├── marketing/               # HeroPreview, NewsletterForm (FeatureVisuals ada tapi tidak dipakai, pakai Image SVG)
│   ├── navbar.tsx, topbar.tsx, footer.tsx, logo.tsx, theme-toggle.tsx, theme-provider.tsx
│   └── dashboard/               # StatCard, PageHeader
├── lib/                         # cn.ts, gowa.ts, supabase/{client,server,middleware}
├── server/actions/              # newsletter.ts (sisa), devices/rules/logs sudah di api
├── types/index.ts
└── proxy.ts                     # middleware (matcher _next/static etc)
public/
├── illustrations/               # device-stack.svg, auto-reply.svg, logs-timeline.svg, hero-chat.svg
└── opengraph.png / icon.svg
supabase/migrations/ 001_initial_schema, 002_device_isolation, 003_grants, 004_per_device_automations
```

---

## 2.10 Konvensi Kode

> **Status:** Sudah **terimplementasi penuh** di codebase (11 Sep 2026).

- **Server actions / API:** `newsletter` masih di `src/server/actions/` (`"use server"`), devices/automations/groups/login/logout sudah di `src/app/api/` (proxy ke `BOT_API_URL`). Frontend tidak boleh punya `"use server"`.
- **Bot proxy:** akses ke `BOT_API_URL` hanya lewat `src/lib/gowa.ts` (fetch + Basic Auth, header `X-Device-Id` untuk groups).
- **Supabase client:** server-only `src/lib/supabase/server.ts` vs browser `client.ts`; jangan impor server di client component.
- **UI:** `src/components/ui/` named exports + `cn()`. Radius seragam `rounded-sm` (hanya `rounded-full` untuk orbs/dot), Button `cursor-pointer active:scale-97` global di `globals.css`, legal TOC `270px truncate whitespace-nowrap`, landing `SectionFeature` `max-w-[360px]` terpusat.
- **API Routes:** RESTful `GET/POST/PUT/DELETE` di `src/app/api/`.
- **Middleware:** `src/proxy.ts` (matcher `_next/static` etc) + `lib/supabase/middleware.ts` untuk `/devices` `/logs` (`/rules` sudah dihapus di 004).
- **Types:** `src/types/index.ts`.
- **React Compiler:** `babel-plugin-react-compiler` + `reactCompiler: true` di `next.config.ts`.
- **SEO:** `src/app/layout.tsx` `metadataBase` + `title template "%s: wenderdotnet"` + `sitemap.ts`/`robots.ts` + `icon.svg`.

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
9. **Konfigurasi di `/devices/[deviceId]` detail** (tab Automasi saja — Webhook per-device dihapus, tidak pengaruh automasi) — bukan `/rules` lagi. Automasi per-device (`device_automations` via `POST /api/devices/:id/automations`, trigger `prefix/contains/exact/regex` → `keyword/regex`, opsi `is_reply`/`mentions` `@everyone`/`duration`/`is_forwarded` per `openapi.yaml:1210`, target `group/private` + group picker `GET /user/my/groups` via `X-Device-Id`, cached 30s, virtual 100, duplicate per `target_jid`).
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

- **Root layout (`src/app/layout.tsx`):** `html lang="id"` + `Inter` via `next/font/google` (`--font-inter` → `--font-sans`) + `ThemeProvider` (`attribute="class" defaultTheme="system"`) + `Toaster` + `metadata` (`metadataBase NEXT_PUBLIC_SITE_URL`, `title default/template "%s: wenderdotnet"`, `openGraph/twitter` `/opengraph.png`, `robots`, `icons /icon.svg`, `verification google`, JSON-LD `SoftwareApplication`) + `viewport` themeColor. Route groups:
  - `(marketing)` → landing `/` + `/privacy` + `/terms` — Navbar + Footer
  - `(auth)` → `/auth` — split brand panel, tanpa navbar, redirect ke `/devices` jika sudah login
  - `(app)` → `/devices`, `/devices/[deviceId]`, `/logs` — Topbar + blur orbs
- **Primitives (`src/components/ui/`):** Button (`primary/secondary/danger/ghost`, `sm/md/lg`, `rounded-sm`, `cursor-pointer active:scale-[0.98]`), Input, Badge, Modal (`rounded-sm animate-modal`), Toggle (`role="switch" cursor-pointer`), EmptyState, Skeleton, Toast `sonner`.
- **Layout components:** Navbar (sticky, mobile hamburger, `rounded-sm`), Topbar (nav `Devices/Logs`, `rounded-sm`, logout `cursor-pointer`, theme toggle), Footer, ThemeToggle (sun/moon transition `grid h-9 w-9 rounded-sm cursor-pointer`).

### 5.2 Landing Page (`/`) — `src/app/(marketing)/page.tsx`

1. **Navbar** (`src/components/navbar.tsx`): logo WMark → `/devices`, nav "Fitur" `/#fitur` + "Cara pakai" `/#cara-pakai`, ThemeToggle `rounded-sm cursor-pointer`, CTA "Masuk" → `/auth`, mobile hamburger `rounded-sm`.
2. **Hero** (`overflow-hidden` + blur orbs `rounded-full`): headline "Kelola bot WhatsApp Anda dari satu dashboard" (`text-balance 4xl/5xl/6xl`) + sub + 2 CTA (`Button size="lg" rounded-sm`) + `HeroPreview` `animate-scale`.
3. **How it works (`#cara-pakai` `border-t bg-surface-subtle/50` + dot pattern):** 3 langkah `Masuk & tambah device → Scan QR → Buat aturan`, `ScrollReveal delay 100`, `group rounded-sm border bg-surface p-6 hover:shadow-md` dengan ikon `h-12 w-12 rounded-sm bg-primary/10`.
4. **Features (`#fitur` `border-t`):** `flex flex-col gap-20 sm:gap-28`, `SectionFeature` `grid items-center gap-8 sm:gap-12 lg:grid-cols-2`:
   - Visual `flex w-full max-w-[360px] items-center justify-center` → inner `relative flex isolate` + light `absolute left-1/2 top-1/2 -translate h-[88%] w-[88%] rounded-sm blur-2xl bg-primary/10` + `Image` `device-stack.svg / auto-reply.svg / logs-timeline.svg` `max-w-[300px] rounded-sm shadow-lg`, mobile `order-1` visual di atas `order-2` teks `items-center text-center lg:items-start lg:text-left`, `reversed` untuk alternating desktop.
   - Teks `h2 text-2xl sm:text-3xl + p leading-relaxed + Link CTA ArrowRight`.
5. **Creator (`#tentang` `bg-surface-subtle/50` + dot-pattern):** `figure max-w-2xl text-center blockquote text-lg`.
6. **Newsletter (`#newsletter` `border-t overflow-hidden` + blur orbs):** `NewsletterForm` `max-w-sm` `Input + Button rounded-sm` → `subscribeNewsletter()` → `newsletters`, `ScrollReveal`.
7. **Footer** (`src/components/footer.tsx`): brand, nav, copyright, `rounded-sm`.

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

1. Topbar global (`Devices | Logs`, `Rules` dihapus 004, Topbar `rounded-sm`, logout `cursor-pointer`)
2. `PageHeader` eyebrow `Workspace · WhatsApp` + heading `Devices` + desc + `Button` `Tambah Device` `rounded-sm`
3. Stats `StatGrid` 3 `StatCard` `rounded-sm border bg-surface p-5 shadow-sm` (`Smartphone/Signal/WifiOff`, `tone default/success/warning`, `loading` skeleton `rounded-sm`)
4. List header `Daftar device · N total` + `Refresh` `rounded-sm` `RefreshCw animate-spin`, grid `gap-3` kartu `rounded-sm border bg-surface p-5 hover:shadow-md`:
   - Ikon `h-11 w-11 rounded-sm border bg-surface-subtle`
   - Nama `link text-[15px] font-semibold hover:text-primary` + badge + JID `font-mono text-xs` + hint + `Button Detail & Automasi rounded-sm border-primary/20 bg-primary/5`
   - Aksi `Hubungkan`/`Disconnect` `Button secondary sm` + `Delete ghost h-9 w-9 p-0 rounded-sm` semua `loading+disabled` + `cursor-pointer`
   - Polling 5s per-device (`GET /api/devices` 1 call, `document.visibilityState`, `pageshow/focus`) + interval 3s untuk `connecting` + `notifiedRef` anti double toast, auto-close QR modal saat `logged_in`
5. Empty `rounded-sm border-dashed bg-surface/60` + `EmptyState` + Tips `font-mono uppercase tracking-widest`
6. Loading 3 skeleton `rounded-sm p-5`

**Modal "Tambah Device":** Heading → input "Nama Device" → tombol "Buat & Hubungkan" (`loading+disabled`) + "Batal".

**Modal "QR Connect" (tab QR/Kode, default QR):** Tabs `QR Code` (QrCode) / `Kode Pairing` (KeyRound) — `role="tablist"`. QR: instruksi scan → QR image (`GET /api/devices/:id/login` `qr_link` flat+wrapper) → status + `Muat Ulang` (`loading`). Kode: Input Nomor HP (`62812…`) → `Dapatkan Kode` (`POST /api/devices/:id/login/code?phone=`, `loading+disabled`) → tampil `pair_code` besar + `Copy/Check` + `Kode Baru`.

**Modal "Hapus Device":** Konfirmasi + tombol "Hapus permanen" (`loading+disabled` anti double-click).

### 5.4b `/devices/[deviceId]` (Detail Device) — `src/app/(app)/devices/[deviceId]/page.tsx` (004, 11 Sep 2026)

1. Header: back `← Kembali` + kartu header `rounded-sm border p-5` nama + badge `Connected/Connecting` + JID `font-mono` + aksi `Hubungkan (Plug) / Disconnect (Unplug)` `Button rounded-sm loading+disabled` + `h-12 w-12 rounded-sm` ikon
2. Tabs `Overview | Webhook | Automasi` `role="tab" border-b-2 -mb-px aria-selected` `rounded-sm` (Webhook UI masih ada: `webhook_url/secret/events/skip_verify` via `src/lib/gowa.ts` `PATCH /devices/:id/webhook` + `Test Kirim Dummy`)
3. **Overview:** 3 kartu `rounded-sm border p-4` Status/Device ID/JID, `rounded` `bg-surface-subtle` code block, auto-refresh 5s + 3s untuk `connecting`
4. **Automasi:** `Stat: Automasi untuk device ini` + `Tambah` `Button`. List `GET /automations` kartu `rounded-sm border p-4`: nama + `trigger_category` + `pattern→reply` + pills `rounded-full` `target_type/target_jid` `is_reply/mentions/duration` + `Toggle enabled` `h-6 w-11 rounded-full` `cursor-pointer` + `Edit/Delete ghost h-8 w-8 p-0 rounded-sm`. **Tambah/Edit Modal** (`Modal rounded-sm animate-modal`): Nama, Kategori `select h-10 rounded-sm` (Kata depan/contains/exact/regex), Target `Semua/Group/Private` → Group Picker `GET /groups` `X-Device-Id` cached 30s limit 500 `openapi.yaml:1074` search debounce virtual 100 multi-select `rounded-sm border p-3`, Balasan `textarea min-h-[100px] rounded-sm`, `Reply/Forwarded` checkbox, Mentions `@everyone,628xxx` `openapi.yaml:1244`, Duration `select rounded-sm` (0/86400/604800/7776000). Simpan `POST /automations` (array `target_jids` → N rows duplicate per grup) / `PUT /:id/:automationId`.
5. **Connect Modal** `Hubungkan WhatsApp` `rounded-sm`: `grid grid-cols-2 gap-1 rounded-sm bg-surface-subtle p-1` tabs `QR/Kode` `rounded-sm`, QR `qr_link` `h-64 w-64 rounded-sm border bg-white p-2`, Kode `Input Nomor HP` + `Dapatkan Kode` `POST /login/code` → `pair_code` `font-mono text-3xl tracking-[0.2em]` + `Copy/Check h-8 w-8 rounded-sm`.

> **Rules global dihapus TOTAL** di `004_per_device_automations.sql` (DROP `rules`/`device_rules`), nav `Rules` dihapus dari `src/components/topbar.tsx:12`.

### 5.6 `/logs` (aktivitas bot) — `src/app/(app)/logs/page.tsx`

1. Topbar global (`rounded-full` orbs di `(app)/layout.tsx`)
2. Header `PageHeader` `Logs` + filter bar `rounded-sm border p-4 shadow-sm` dropdown `Device` + `Event Type` (7 tipe) `h-10 rounded-sm border bg-surface px-3`
3. Timeline `relative` vertical line `left-[13px] w-px bg-border` + dot `h-3 w-3 rounded-full border-2` + blur `h-6 w-6 rounded-full blur 6px` + kartu `rounded-sm border bg-surface p-4 sm:p-5 hover:shadow-md`:
   - Header `flex items-center gap-2` badge `rounded-full` + timestamp `font-mono text-xs` + `h-1 w-1 rounded-full bg-border`
   - Deskripsi `text-sm` + body `pre max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-sm border bg-surface-subtle p-3`
4. Empty `rounded-sm border-dashed bg-surface/60` + `EmptyState`
5. Loading 5 skeleton `h-2.5 w-2.5 rounded-full` + `rounded-sm border p-5` + `h-5 w-28 rounded-full`

> **Catatan:** Inbox/percakapan 2 kolom **tidak termasuk MVP** — diganti log aktivitas. Fitur balas dari dashboard masuk Phase lanjutan.

### 5.7 Komponen Marketing (`src/components/marketing/`)

| Komponen         | File               | Deskripsi                                           |
| ---------------- | ------------------ | --------------------------------------------------- |
| `HeroPreview`    | `hero-preview.tsx` | Mockup Devices `rounded-sm border shadow-md`, stats, animasi `reveal` |
| `FeatureVisuals` | `feature-visuals.tsx` | `DeviceStackVisual`/`AutoReplyVisual`/`LogsVisual` masih ada (`rounded-sm` seragam) tapi landing `#fitur` sekarang pakai `Image` SVG `device-stack/auto-reply/logs-timeline.svg` `rounded-sm shadow-lg` + light `blur-2xl` |
| `NewsletterForm` | `newsletter-form.tsx` | `form max-w-sm` `Input + Button rounded-sm` `h-10 flex-1 rounded-sm` → `subscribeNewsletter()` `zod` validasi, `loading+disabled` guard, success `rounded-sm border-success/30 bg-success/10` |
| `ScrollReveal`   | `scroll-reveal.tsx` | `IntersectionObserver` `animate-reveal/up/left/right/scale` + `delay-100..500` |

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

Semua token di `src/app/globals.css` (`@theme inline`):

**Shadow tokens:** `--shadow-xs/sm/md/lg` opacity berbeda light vs dark.

**Radius tokens:** `--radius-sm 6px` (seragam), `--radius-md 8px`, `--radius-lg 12px`, `--radius-xl 16px` (token tetap ada tapi komponen sekarang seragam `rounded-sm`, hanya orbs/dot `rounded-full`).

**Cursor:** `@layer base { button:not(:disabled){cursor:pointer} button:disabled{cursor:not-allowed} }` + `@media (prefers-reduced-motion){ button:active{transform:scale(0.97)} }`, `Button` `cursor-pointer active:scale-[0.98]`.

**Penggunaan sekarang:** `rounded-sm` (`rounded-[var(--radius-sm)]` dinormalisasi), `shadow-sm`, focus `ring-primary/40`, legal `TOC 270px truncate whitespace-nowrap`.

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

> Dokumen ini di-update pada **11 September 2026** (sinkron dengan `next 16.3.4`, `supabase-js 2.116.0`, `zod 4.5.4`).

### 9.1 Fitur MVP — Status (diupdate 11 Sep 2026)

| Fitur                         | Status         | Lokasi                              | Catatan                                           |
| ----------------------------- | -------------- | ----------------------------------- | ------------------------------------------------- |
| Auth (email + password)       | ✅ Implemented | `(auth)/auth/page.tsx`              | Login + Register, tab, `loading+disabled` + OAuth guard |
| Auth (Google OAuth)           | ✅ Implemented | `(auth)/auth/page.tsx`              | `signInWithOAuth` → `/devices`, icon Google |
| Route protection (middleware) | ✅ Implemented | `src/proxy.ts` + `lib/supabase/middleware.ts` | Protects `/devices`, `/logs`, `sitemap`/`robots` |
| Landing page                  | ✅ Implemented | `(marketing)/page.tsx`              | Hero + `HeroPreview`, `#cara-pakai` 3 steps `rounded-sm`, `#fitur` `SectionFeature` centered SVG+light `blur-2xl rounded-sm max-w-[360px]` mobile `order-1` top, `#tentang`, `#newsletter`, Footer |
| SEO                           | ✅ Implemented | `app/layout.tsx` + `sitemap.ts`/`robots.ts`/`icon.svg` | `metadataBase` `NEXT_PUBLIC_SITE_URL`, `title "%s: wenderdotnet"` colon, `openGraph/twitter` `/opengraph.png`, `robots` disallow `/api/` `/devices/` `/logs/` |
| Legal pages                   | ✅ Implemented | `(marketing)/privacy` + `/terms`    | Header `py-14 lg:py-20`, grid `270px+1fr`, TOC `truncate whitespace-nowrap rounded-sm`, section `border-t pt-10` bernomor `01..09`, copy antislop, `rounded-sm` seragam, button `bg-primary` dark/light |
| Navbar (marketing)            | ✅ Implemented | `components/navbar.tsx`             | Sticky, hamburger `rounded-sm cursor-pointer` |
| Topbar (app)                  | ✅ Implemented | `components/topbar.tsx`             | `Devices/Logs`, logout `cursor-pointer active:scale` |
| Theme toggle (dark/light)     | ✅ Implemented | `components/theme-toggle.tsx`       | `next-themes`, `rounded-sm cursor-pointer`, sun/moon |
| Device list                   | ✅ Implemented | `(app)/devices/page.tsx`            | `rounded-sm` seragam, polling 5s visibility-aware 1 call, auto-close QR/kode, `Detail` link |
| Device QR/Kode connect        | ✅ Implemented | `(app)/devices/page.tsx`            | Modal `rounded-sm animate-modal` tabs QR/Kode `rounded-sm`, `qr_link` / `pair_code`, `Copy/Check` |
| Device detail                 | ✅ Implemented | `(app)/devices/[deviceId]/page.tsx` | Tabs `Overview/Webhook/Automasi` `rounded-sm`, group picker virtual 100, duplicate per `target_jid` |
| Device Automasi               | ✅ Implemented | `/api/devices/[id]/automations`     | `trigger_category` prefix/contains/exact/regex, `is_reply`/`mentions`/`duration`/`is_forwarded`, `rounded-sm` forms |
| Group picker                  | ✅ Implemented | `page.tsx` `GroupItem` | `GET /user/my/groups` 500 limit cache 30s, search debounce, `rounded-sm` |
| Device delete                 | ✅ Implemented | `(app)/devices/page.tsx`            | `Modal rounded-sm` `loading+disabled` |
| Rules (legacy)                | ❌ Removed     | `004` | DROP `rules`/`device_rules` → `device_automations` |
| Logs timeline                 | ✅ Implemented | `(app)/logs/page.tsx`               | `rounded-sm` cards, filters `h-10 rounded-sm`, dot `rounded-full` blur, `loading+disabled` |
| Newsletter                    | ✅ Implemented | `marketing/newsletter-form.tsx`     | `h-10 flex-1 rounded-sm` + `Button rounded-sm`, `zod` validasi |
| GOWA proxy                    | ✅ Implemented | `lib/gowa.ts`                       | Basic Auth, `X-Device-Id` |
| Webhook receiver              | ✅ Implemented | `api/webhook/gowa/route.ts`         | HMAC `X-Hub-Signature-256`, `session_id`→`device_key`, `chat_id` scope |
| UI primitives                 | ✅ Implemented | `components/ui/`                     | `Button rounded-sm cursor-pointer active:scale`, `Input rounded-sm`, `Badge rounded-full`, `Modal rounded-sm`, `Toggle rounded-full` |
| Design tokens                 | ✅ Implemented | `globals.css`                       | `--radius-sm 6px` seragam, `--shadow-*`, `@theme inline`, global cursor `active:scale-97` |
| Supabase RLS                  | ✅ Implemented | `supabase/migrations/001-004`       | `user_owns_device`, grants `003` |
| Comments cleanup              | ✅ Implemented | 11 Sep 2026 | Hapus `//` dan `{/* */}` + `{}` kosong, `privacy/terms` dikecualikan awal tapi sekarang dibersihkan, TOC `truncate` |

### 9.2 Fitur yang Belum Diimplementasi (dari Spec) — 11 Sep 2026

| Fitur                          | Status           | Catatan                                                  |
| ------------------------------ | ---------------- | -------------------------------------------------------- |
| "Lupa password?" link          | ❌ Not in UI     | Belum ada di auth page; bisa via Supabase Auth |
| Device role display            | ❌ Not in UI     | Kolom `role` ada di DB, tidak ditampilkan |
| Zod validation                 | ✅ Partial       | `zod@4.5.4` dipakai di `newsletter-form.tsx`, belum di semua forms |
| WebSocket realtime             | ⚠️ Partial       | Polling 5s + visibility-aware utama, WS `/ws` disiapkan fallback |
| Rules assign (legacy)          | ✅ Implemented   | `device_automations` per-device di detail Automasi tab |
| Pairing code login             | ✅ Implemented   | QR/Kode tabs `POST /login/code` di devices + detail |

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

_Update 2026-09-11:_ Landing `SectionFeature` centering (`max-w-[360px]` + light `blur-2xl rounded-sm` + mobile `order-1`/`order-2`) • Semua button `cursor-pointer active:scale` + `rounded-sm` seragam (hanya `rounded-full` untuk orbs/dot) • Privacy/Terms rewrite: hapus pill `Dokumen legal`, TOC `270px truncate whitespace-nowrap` tanpa ikon, section `border-t pt-10` bernomor `01..09`, copy antislop, button `bg-primary` dark/light • Comment cleanup `{/* */}` + `{}` kosong • `title` colon `"%s: wenderdotnet"` • Build 16.3.4 `pnpm build` pass.
