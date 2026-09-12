# Maintenance Guide

## Non-negotiable conventions

These come from the approved spec (`.agents/coldstart.md` §2.9). Breaking them breaks the architecture:

1. **Mutasi server di `src/app/api/` dan `src/server/actions/`**: `newsletter.ts` tetap di `src/server/actions/`, tetapi `devices`/`automations`/`groups`/`login` sekarang lewat route handlers `src/app/api/devices/*` (proxy ke `BOT_API_URL`). Frontend tidak boleh punya `"use server"`; panggil via API atau server action.
2. **All bot API access goes through `src/lib/gowa.ts`** (fetch + Basic Auth). Never call `BOT_API_URL` directly from a route handler, action, or (worse) client code.
3. **Supabase service-role client is server-only** (`src/lib/supabase/server.ts`). The browser uses the anon client (`src/lib/supabase/client.ts`). Never import the server module from a client component.
4. **A device row is inserted only after the bot reports logged_in.** Never create `user_devices` entries for disconnected/abandoned slots; guard inserts with a `(user_id, device_key)` upsert check.
5. **SEO single source**: `src/app/layout.tsx` `metadata` (`title: "%s: wenderdotnet"` dengan colon, `metadataBase` dari `NEXT_PUBLIC_SITE_URL`, `openGraph`/`twitter` `/opengraph.png`, `sitemap.ts`/`robots.ts`). Jangan duplikasi di halaman lain kecuali per-page `title` spesifik.

## Common tasks

### Changing UI

- Design tokens (colors, radii, shadows) are CSS variables in `src/app/globals.css`, exposed to Tailwind v4 via `@theme inline`. Change values there, not in components.
- Radius seragam `rounded-sm` (6px `--radius-sm`) untuk semua kartu/input/modal — jangan pakai `rounded-xl/lg/md` lagi (hanya `rounded-full` untuk orbs blur dan dot). `Button` punya global `@layer base { button{cursor:pointer} }` + `active:scale-97`; jangan hilangkan.
- Semantic text colors use the `-strong` variants (`text-success-strong`, etc.) because the base semantic colors fail WCAG AA on light surfaces when used as small text.
- Dark mode is class-based via `next-themes`; every new surface must look correct in both themes (the app ships both). Tombol kontak di legal memakai `bg-primary text-white` agar kontras di light dan dark (jangan `bg-text-primary text-white`).
- Legal pages (`/privacy`, `/terms`) punya header `py-14 lg:py-20`, konten `py-10 lg:py-16`, grid TOC `270px + 1fr`, item `truncate whitespace-nowrap`, section `border-t pt-10` dengan nomor mono `01..09`, copy antislop tanpa em dash dan tanpa buzzword.
- Landing `SectionFeature` harus `max-w-[360px]` terpusat, light `blur-2xl` `left-1/2 -translate`, `rounded-sm`, mobile `order-1` visual di atas teks `order-2` `text-center lg:text-left`.
- Keep copy in Indonesian (`lang="id"`), matching the existing tone, antislop (no AI slop, no fabricated stats).

### Adding a page or section

- Marketing pages get navbar/footer automatically from `src/app/(marketing)/layout.tsx`.
- App pages get the topbar from `src/app/(app)/layout.tsx`.
- Every data-driven view needs empty, loading (skeleton), and error states; see `/devices` for the pattern.
- Any link you add must point to something that exists.

### Database changes

1. Add a new file `supabase/migrations/00N_description.sql`.
2. Apply it via the Supabase SQL editor (or CLI: `supabase db push` if linked).
3. Update the schema section in `docs/overview.md` and `.agents/coldstart.md` §6 only through an explicit approval decision.

### Modifying the rule engine / webhook

The receiver is `src/app/api/webhook/gowa/route.ts`. Flow: verify HMAC signature → resolve user by device (`session_id`, falling back to `device_id`) → load enabled **device_automations** for that `device_key` (per-device, not global `rules`) → match `trigger_category`/`trigger_type`+`pattern` (prefix/contains/exact/regex) → send via `POST /send/message` with `is_reply`/`mentions`/`duration`/`is_forwarded` per openapi `openapi.yaml:1210` → append to `logs`. Duplicate per grup: 1 automasi = 1 `target_jid`.

When touching it:

- Keep HMAC verification first; reject unsigned payloads early.
- Wrap automasi evaluation so one failing automasi cannot block logging of the event.
- Respect the event-type contract in the `logs.event_type` CHECK constraint.
- Keep it aligned with the **current** GOWA webhook payload (v8+): device key = `session_id`, chat scope = `payload.chat_id`, sender = `payload.from`, text = `payload.body` (ack receipts carry `payload.ids` + `payload.receipt_type`). Re-check against `openapi.yaml`/upstream `docs/webhook-payload.md` before changing field names.

### Updating dependencies

```bash
pnpm outdated
pnpm update --latest   # review the diff carefully
pnpm build && pnpm lint
```

Pin with care around: `next` (App Router behavior shifts), `@supabase/supabase-js` + `@supabase/ssr` (must move together), and anything touching React Compiler flags in `next.config.ts`.

## Quality gates before shipping

```bash
pnpm lint     # eslint
pnpm build    # type-checks via tsc and catches server/client boundary leaks
```

Also manually verify:

- Both light and dark themes (toggle in the topbar).
- Mobile width (~375px): no horizontal scroll, nav row usable.
- Empty states: fresh account with no devices/rules/logs.
- Newsletter form success + duplicate-email paths.

## Known risks (from the spec's risk register)

| Risk | Mitigation in place |
| --- | --- |
| WhatsApp bans bot-linked numbers | Onboarding disclaimer, easy reconnect, multi-device spread |
| Baileys library instability (upstream of the bot image) | Bot runs as an isolated container; pin its image version |
| Service-key abuse | Key exists only in server env vars; RLS everywhere else |

## Where things live (quick index)

| Path | Contents |
| --- | --- |
| `src/app/(marketing)/` | Landing page + marketing layout (navbar/footer) |
| `src/app/(auth)/` | Login/register split layout |
| `src/app/(app)/` | Devices (+ `[deviceId]` detail with webhook/automasi/groups), logs dashboard pages |
| `src/app/api/` | Route handlers (bot proxy, device automations/groups/webhook, logs CRUD, webhook) |
| `src/components/marketing/` | Landing-only sections (hero preview, visuals, newsletter form) |
| `src/components/ui/` | Primitives: button, input, badge, modal, toggle, skeleton, empty state |
| `src/server/actions/` | All `"use server"` functions |
| `src/lib/gowa.ts` | Single gateway to the bot API |
| `supabase/migrations/` | SQL schema + RLS |
| `.agents/coldstart.md` | Approved product spec (source of truth) |
