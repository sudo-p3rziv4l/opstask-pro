# Proposal: OpsTask Pro Core Architecture

## Context
OpsTask is upgrading to a professional SaaS architecture using Next.js 14 App Router, moving away from a disconnected React + Express setup.

## Proposed Solution
- Frontend and Backend APIs unified in Next.js.
- Clean database layer using raw `pg` (Node Postgres) to avoid Prisma node engine conflicts, connecting to `opstask_pro_db`.
- UI re-styled to match Leantime's signature "soft floating card" look: light blue-green background, big border radius, and clean typography.
- Implementation of `dnd-kit` for a true drag-and-drop Kanban experience.
