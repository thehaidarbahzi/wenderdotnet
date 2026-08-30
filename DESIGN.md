# Design Direction — wenderdotnet

## Identity

**wenderdotnet** is a WhatsApp bot management platform for Indonesian SMEs. The design must feel **practical, trustworthy, and local** — not like a generic SaaS tool, but like something built specifically for UMKM owners who need automation without complexity.

## Visual Language

- **Mood:** Clean & professional. Not flashy, not sterile. The design should feel like a well-built tool, not a marketing site.
- **Personality:** Helpful, straightforward, no-nonsense. Like a knowledgeable friend who knows tech but explains it simply.
- **Audience:** Indonesian UMKM owners (primary), developers/resellers (secondary). The design must work for both — simple enough for non-technical users, powerful enough for developers.

## Palette

- **Primary:** Emerald (`#34D399`) — trust, growth, WhatsApp association
- **Neutral:** Slate (80% of surfaces) — clean, professional, readable
- **Semantic:** Success (emerald), Warning (amber), Error (red), Info (blue), WhatsApp (green)
- **Dark mode:** Deep navy backgrounds with emerald accents

## Typography

- **Font:** Inter (variable, self-hosted via next/font/google)
- **Reason:** Clean, readable, professional. Works well at all sizes. Neutral enough to not impose personality, but has enough character to feel human.
- **Mono:** ui-monospace for code/patterns/logs

## Layout Principles

- **Max width:** 6xl (1152px) for content areas
- **Spacing:** Consistent padding (px-4 sm:px-6 lg:px-8)
- **Sections:** Clear visual separation with borders or subtle background changes
- **Mobile-first:** All layouts must work on 320px+ screens

## Component Patterns

- **Cards:** Subtle borders, minimal shadows, consistent radius (var(--radius-lg))
- **Buttons:** Primary (emerald), Secondary (outline), Danger (red), Ghost (no border)
- **Forms:** Labeled inputs with error states, consistent height (h-10)
- **Modals:** Escape/backdrop close, consistent padding, clear actions
- **Badges:** Status indicators with semantic colors

## Motion

- **Hover:** Subtle color transitions (200ms)
- **Focus:** Visible ring (2px primary)
- **Modals:** Scale + fade entrance (180ms)
- **Reduced motion:** Respect prefers-reduced-motion

## What This Is NOT

- Not a Linear/Vercel clone (no dark-by-default, no geometric patterns)
- Not a generic SaaS template (no "Get Started" CTAs, no fake stats)
- Not a marketing-first site (function over flash)
- Not AI-generated slop (every decision has a reason)
