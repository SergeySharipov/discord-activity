---
name: Hand Queue Discord Activity
description: Discord embedded activity for raising hands in a queue - project context
type: project
---

Real-time hand-raise queue built as a Discord embedded Activity.

**Why:** For use in Discord voice/text channels as an embedded activity.

**Stack:**
- Client: React + Vite + TypeScript at `client/`
- Server: Express + Socket.io + TypeScript at `server/`
- Local DB: IndexedDB via `idb` library
- Discord: `@discord/embedded-app-sdk` (with dev fallback — auto-generates mock users via sessionStorage)

**How to apply:** Run `npm run dev` from root to start both server (port 3001) and client (port 5173) concurrently. In dev mode (outside Discord iframe), mock users are automatically created per browser session. Open multiple tabs to simulate multiple participants.

**Key files:**
- `client/src/discord.ts` — Discord SDK init + dev fallback
- `client/src/db.ts` — IndexedDB queue persistence
- `client/src/socket.ts` — Socket.io singleton
- `client/src/useQueue.ts` — Main queue hook
- `server/src/index.ts` — Socket.io server + token exchange endpoint
- `.env.example` — Required env vars (VITE_CLIENT_ID, DISCORD_CLIENT_SECRET)
