# Maintenance Guide

## Non-negotiable conventions

These come from the approved spec (`.agents/coldstart.md` §2.9). Breaking them breaks the architecture:

1. **Server actions live only in `src/server/actions/`** (`auth.ts`, `devices.ts`, `rules.ts`, `logs.ts`, `newsletter.ts`). Frontend files must never contain `"use server"`; they import and call the methods.
2. **All bot API access goes through `src/lib/gowa.ts`** (fetch + Basic Auth). Never call `BOT_API_URL` directly from a route handler, action, or (worse) client code.
3. **Supabase service-role client is server-only** (`src/lib/supabase/server.ts`). The browser uses the anon client (`src/lib/supabase/client.ts`). Never import the server module from a client component.
4. **A device row is inserted only after the bot reports logged in.** Never create `user_devices` entries for disconnected/abandoned slots; guard inserts with a `(user_id, device_key)` upsert check.

## Common tasks

### Changing UI

- Design tokens (colors, radii, shadows) are CSS variables in `src/app/globals.css`, exposed to Tailwind v4 via `@theme inline`. Change values there, not in components.
- Semantic text colors use the `-strong` variants (`text-success-strong`, etc.) because the base semantic colors fail WCAG AA on light surfaces when used as small text.
- Dark mode is class-based via `next-themes`; every new surface must look correct in both themes (the app ships both).
- Keep copy in Indonesian (`lang="id"`), matching the existing tone.

### Adding a page or section

- Marketing pages get navbar/footer automatically from `src/app/(marketing)/layout.tsx`.
- App pages get the topbar from `src/app/(app)/layout.tsx`.
- Every data-driven view needs empty, loading (skeleton), and error states — see `/devices` for the pattern.
- Any link you add must point to something that exists.

### Database changes

1. Add a new file `supabase/migrations/00N_description.sql`.
2. Apply it via the Supabase SQL editor (or CLI: `supabase db push` if linked).
3. Update the schema section in `docs/overview.md` and `.agents/coldstart.md` §6 only through an explicit approval decision.

### Modifying the rule engine / webhook

The receiver is `src/app/api/webhook/gowa/route.ts`. Flow: verify HMAC signature → resolve user by device → load enabled rules for that device → for `listen` rules optionally auto-read; for `auto_reply` rules match keyword/regex and send via `POST /send/message` → append to `logs`.

When touching it:

- Keep HMAC verification first; reject unsigned payloads early.
- Wrap rule evaluation so one failing rule cannot block logging of the event.
- Respect the event-type contract in the `logs.event_type` CHECK constraint.

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
| `src/app/(app)/` | Devices, rules, logs dashboard pages |
| `src/app/api/` | Route handlers (bot proxy, rules/logs CRUD, webhook) |
| `src/components/marketing/` | Landing-only sections (hero preview, visuals, newsletter form) |
| `src/components/ui/` | Primitives: button, input, badge, modal, toggle, skeleton, empty state |
| `src/server/actions/` | All `"use server"` functions |
| `src/lib/gowa.ts` | Single gateway to the bot API |
| `supabase/migrations/` | SQL schema + RLS |
| `.agents/coldstart.md` | Approved product spec (source of truth) |
