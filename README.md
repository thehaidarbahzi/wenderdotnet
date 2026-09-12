# wenderdotnet

Dashboard untuk mengelola bot WhatsApp multi-device: hubungkan beberapa nomor via QR atau kode pairing, atur automasi per-device (prefix / contains / exact / regex, balasan, mention, durasi, target grup/private), dan pantau semua aktivitas dari satu tempat. Fondasi monetisasi ditunda (MVP gratis).

Dibangun dengan Next.js 16.3.4 (App Router), React 19.2, TypeScript 7, Tailwind CSS v4 (tokens di `globals.css`), Supabase (Auth + Postgres + RLS) dan container bot eksternal `go-whatsapp-web-multidevice:v9.2.2` via `podman compose`.

## Fitur saat ini

- **Auth** email + password + Google OAuth (Supabase Auth, `src/app/auth/callback/route.ts`)
- **Devices** multi-nomor: tambah, list, status live, hapus, detail per-device
- **Koneksi** QR (`GET /devices/:id/login` → `qr_link`) dan kode pairing (`POST /devices/:id/login/code` → `pair_code`), polling 5s per-device + visibility-aware, auto-close modal saat `logged_in`
- **Automasi per-device** (`device_automations`): `trigger_category` prefix/contains/exact/regex, `is_reply` / `mentions` (@everyone) / `duration` / `is_forwarded`, target `group`/`private`/`semua`, group picker lewat `GET /user/my/groups` (X-Device-Id, cache 30s, virtual 100)
- **Logs** timeline dengan filter device dan event, vertical line + dot, polling per-device
- **Landing** hero, 3 langkah cara pakai, 3 fitur alternating `SectionFeature` (visual terpusat dengan light blur, mobile selalu visual di atas teks), quote kreator, newsletter
- **Legal** `/privacy` dan `/terms` dengan layout lega, TOC sticky 270px `truncate whitespace-nowrap`, section bernomor, spacing `border-t pt-10`, copy antislop, `rounded-sm` seragam, tombol `bg-primary` yang aman di dark/light
- **Tema** dark/light via `next-themes`, `Inter` via `next/font/google`, radius dan shadow sebagai CSS variables, animasi `ScrollReveal` dan `modal-pop` dengan `prefers-reduced-motion`

## Cepat mulai

```bash
pnpm install
cp .env.example .env.local   # isi Supabase + kredensial bot (lihat docs/setup.md)
podman compose up -d         # jalankan container bot GOWA
pnpm dev --port 3001         # Next.js di 3001, bot di 3000 (lihat Port plan)
```

Instruksi lengkap: [docs/setup.md](docs/setup.md)

## Struktur

```
src/
├── app/
│   ├── layout.tsx                 # metadata (title: template "%s: wenderdotnet"), viewport, JSON-LD, Inter, Toaster
│   ├── globals.css                # tokens warna/shadow/radius + cursor global + active scale
│   ├── sitemap.ts / robots.ts / icon.svg
│   ├── (marketing)/               # Navbar + Footer, page.tsx (SectionFeature), privacy, terms
│   ├── (auth)/                    # split-screen brand panel + auth/page.tsx
│   ├── (app)/                     # Topbar + devices/page.tsx + devices/[deviceId]/page.tsx + logs/page.tsx
│   └── api/                       # devices, devices/[id]/status|login|login/code|groups|automations|logout, logs, webhook/gowa
├── components/ui/                 # Button (cursor-pointer active:scale), Input, Badge, Modal, Toggle, Skeleton
├── components/marketing/          # HeroPreview, NewsletterForm
├── lib/                           # cn.ts, gowa.ts (BOT_API_URL), supabase/*
└── supabase/migrations/           # 001_initial_schema, 002_device_isolation, 003_grants, 004_per_device_automations
```

Bot tidak dibangun di repo ini. Kontrak API ada di `openapi.yaml`, webhook di `src/app/api/webhook/gowa/route.ts` (HMAC, `session_id` → `device_key`).

## Dokumentasi

| Dokumen | Isi |
| --- | --- |
| [docs/overview.md](docs/overview.md) | Arsitektur, route map, data model |
| [docs/setup.md](docs/setup.md) | Instal, env, smoke test, troubleshooting |
| [docs/maintenance.md](docs/maintenance.md) | Konvensi, perubahan UI/DB, quality gates |
| [.agents/coldstart.md](.agents/coldstart.md) | PRD, persona, flow, wireframe aktual, schema, style |
| [DESIGN.md](DESIGN.md) | Arah desain, palet, tipografi, komponen |

## Status

MVP fase 1 — dikerjakan 11 September 2026. Migrasi `004` sudah menghapus `rules`/`device_rules` global, diganti `device_automations` per-device. Tidak terafiliasi dengan WhatsApp atau Meta.
