# Design Direction — wenderdotnet

## Identity

**wenderdotnet** adalah platform manajemen bot WhatsApp untuk UMKM Indonesia. Desain harus terasa praktis, terpercaya, dan lokal, bukan SaaS generik, untuk pemilik UMKM yang butuh automasi tanpa kompleksitas.

## Visual Language

- **Mood:** Clean dan professional. Bukan mencolok, bukan steril. Seperti alat yang dibangun dengan baik.
- **Personality:** Membantu, langsung, tanpa basa-basi. Menjelaskan teknis dengan sederhana.
- **Audience:** UMKM Indonesia (primer), developer/reseller (sekunder). Sederhana untuk non-teknis, cukup kuat untuk developer.

## Palette

- **Primary:** Emerald `#34D399` (kepercayaan, growth, asosiasi WhatsApp) — sama di light/dark
- **Primary Hover:** `#2C9771`
- **Neutral:** Slate — `bg #F8FAFC` / `#0F172A`, teks `#0F172A` / `#F1F5F9` (kontras ≥12:1 AAA)
- **Semantic:** Success emerald, Warning amber, Error rose, Info blue, WhatsApp `#25D366`
- **Dark:** navy `#0F172A` background dengan aksen emerald, shadow opacity lebih tinggi

## Typography

- **UI:** Inter variable via `next/font/google` (`--font-inter` → `--font-sans`), self-hosted, konsisten antar OS.
- **Mono:** `ui-monospace` untuk kode/pola/log.
- **Legal pages:** `text-[15px] leading-7` untuk isi, `text-xl / sm:text-[22px] font-semibold tracking-tight` untuk `h2` bernomor dengan `border-b`, mono `text-xs tracking-widest text-primary` untuk nomor, `text-pretty` / `text-balance` untuk hero.
- **Aksesibilitas:** kontras ≥AA, status selalu dengan teks/ikon, bukan warna saja. `scroll-mt-28` untuk anchor.

## Layout Principles

- **Max width:** `max-w-6xl` (1152px) untuk semua konten.
- **Horisontal padding:** `px-4 sm:px-6 lg:px-8` konsisten.
- **Vertikal rhythm:** `py-14 sm:py-16 lg:py-20` untuk header legal, `py-10 sm:py-12 lg:py-16` untuk konten, `gap-10 lg:gap-14 xl:gap-16` antar kolom, `pt-10 mt-10 border-t` antar section bernomor.
- **Section separation:** border tipis atau `bg-surface-subtle/30` / `bg-surface-subtle/50`, bukan cuma flip warna.
- **Mobile-first:** 320px+, tanpa horizontal overflow, tap target ≥44px, `overflow-x: hidden` di `html`.

## Component Patterns

- **Radius:** seragam `rounded-sm` (6px, `--radius-sm`) untuk semua kartu, input, modal, badge container. Hanya `rounded-full` untuk orbs dekoratif blur (`h-80 w-80 rounded-full`) dan dot indikator (`h-2 w-2 rounded-full`). Tidak ada `rounded-xl/lg/md` lagi.
- **Cards:** `border border-border bg-surface shadow-sm rounded-sm p-5 sm:p-6`, hover `hover:shadow-md hover:border-primary/20`. Legal: TOC `sticky top-28 rounded-sm border p-6`, ringkasan `rounded-sm border-primary/15 bg-primary/5`, section cards `rounded-sm`.
- **Buttons:** `Button` (`primary/secondary/danger/ghost`, `sm/md/lg`, `rounded-sm`) dengan `cursor-pointer hover:cursor-pointer active:cursor-pointer active:scale-[0.98] disabled:cursor-not-allowed`. Global di `globals.css` `@layer base { button:not(:disabled){cursor:pointer} }` + `@media (prefers-reduced-motion: no-preference){ button:active{transform:scale(0.97)} }`. Raw `<button>` dan `[role="button"]` ikut aturan yang sama (Topbar, Navbar, ThemeToggle, Toggle, Modal close).
- **Forms:** `Input` label+error, `h-9/h-10 rounded-sm border`, focus `ring-primary/40`, placeholder `text-text-muted`.
- **Modals:** `rounded-sm border bg-surface shadow-lg animate-modal`, tutup via Escape/backdrop, `h-8 w-8 rounded-sm` untuk close.
- **Badges:** `inline-flex gap-1.5 rounded-full px-2.5 py-0.5 text-xs` dengan dot `h-1.5 w-1.5 rounded-full`, varian success/warning/error/info/whatsapp.
- **TOC (legal):** `w-[270px]` sticky, `rounded-sm border`, item `block truncate whitespace-nowrap rounded-sm px-3 py-2 text-sm leading-none` + `title` untuk ellipsis, tanpa ikon campur — semua bernomor `01. ... 09.` konsisten.
- **Landing SectionFeature:** `grid items-center gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16`, wrapper visual `flex w-full max-w-[360px] items-center justify-center`, inner `relative flex w-full items-center justify-center isolate` + light `absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[88%] w-[88%] rounded-sm blur-2xl bg-primary/10`, image `block h-auto w-full max-w-[300px] mx-auto rounded-sm shadow-lg`, mobile `order-1` visual di atas, `order-2` teks `items-center text-center lg:items-start lg:text-left`.

## Motion

- **Hover:** transisi warna 150-200ms.
- **Focus:** ring `2px primary` + `outline-offset 2px`.
- **Modal:** `modal-pop` scale 0.96 → 1 + fade 180ms `ease-out`.
- **ScrollReveal:** `reveal-up/left/right/scale` 0.5-0.6s `cubic-bezier(0.16,1,0.3,1)`, delay 100-500ms, intersection observer.
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` mematikan animasi.

## SEO & Metadata

- `src/app/layout.tsx` `metadataBase` dari `NEXT_PUBLIC_SITE_URL`, `title: { default: "wenderdotnet: Kelola Bot WhatsApp UMKM dari Satu Dashboard", template: "%s: wenderdotnet" }` (colon tanpa spasi sebelum), `description`, `keywords`, `openGraph`/`twitter` dengan `/opengraph.png`, `robots` index/follow, `icons: {icon: "/icon.svg"}`, `verification.google` dari env, `viewport` themeColor light/dark, JSON-LD `SoftwareApplication`.
- `sitemap.ts` / `robots.ts` pakai `base` yang sama, `robots` allow `/` disallow `/api/` `/devices/` `/logs/` `/auth/callback`.

## What This Is NOT

- Bukan clone Linear/Vercel (tidak dark-by-default, tidak grid background)
- Bukan template SaaS generik (tidak ada CTA Get Started, tidak ada fake stats)
- Bukan marketing-first (fungsi di atas flash)
- Bukan slop AI (setiap teknik punya alasan tertulis, copy antislop, palet terbatas 2-3 warna + 1 aksen)
