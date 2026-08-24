# WenderDotNet

A web application for managing and configuring WhatsApp bots: connect multiple numbers via QR, set up listen/auto-reply rules, and monitor every activity from one dashboard.

Built with Next.js (App Router), TypeScript, Tailwind CSS, and Supabase. The WhatsApp bot itself runs as an external container ([go-whatsapp-web-multidevice](https://github.com/aldinokemal2104/go-whatsapp-web-multidevice)) managed with podman compose.

## Quick start

```bash
pnpm install
cp .env.example .env.local   # fill in Supabase + bot credentials
podman compose up -d         # start the bot container
pnpm dev
```

Full instructions: [docs/setup.md](docs/setup.md)

## Documentation

| Doc | Contents |
| --- | --- |
| [docs/overview.md](docs/overview.md) | What this project is, architecture, data model |
| [docs/setup.md](docs/setup.md) | Install, environment variables, first-run smoke test |
| [docs/maintenance.md](docs/maintenance.md) | Code conventions, schema changes, quality gates |

The approved product spec (PRD, flows, schema, visual style) lives in `.agents/coldstart.md`.

## Status

Work in progress (Phase 1, MVP). Not affiliated with WhatsApp or Meta.
