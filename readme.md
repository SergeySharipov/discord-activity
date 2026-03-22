# Hand Queue — Discord Activity

A Discord embedded activity where users can raise their hand to join a queue. Everyone in the activity sees the live queue. Anyone can lower anyone's hand.

## Architecture

```
client/   React + Vite + TypeScript
          @discord/embedded-app-sdk  — user identity inside Discord
          socket.io-client           — real-time queue updates
          idb (IndexedDB)            — local cache (survives refresh)

server/   Express + Socket.io
          Handles real-time broadcast + Discord OAuth token exchange
```

## Quick start (local dev)

```bash
# 1. Install all deps
npm run install:all

# 2. Copy and fill in env vars
cp .env.example .env
# (for local dev without Discord you can leave VITE_CLIENT_ID blank)

# 3. Run server + client in parallel
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:3001

In dev mode (outside Discord iframe) the app auto-generates a mock user per browser session, so you can open multiple tabs to simulate multiple participants.

## Discord Activity setup

1. Go to https://discord.com/developers/applications and create an app.
2. Enable **Activities** in the sidebar.
3. Set the URL map root `/` → `https://your-deployed-client.com`.
4. Add `VITE_CLIENT_ID` and `DISCORD_CLIENT_SECRET` to both `.env` files before deploying.

## Environment variables

| Variable | Where | Description |
|---|---|---|
| `VITE_CLIENT_ID` | server + client | Discord application client ID |
| `DISCORD_CLIENT_SECRET` | server only | Discord OAuth secret (never expose to client) |
| `PORT` | server | HTTP port (default 3001) |

## Features

- **Raise hand** — joins the end of the queue
- **Lower hand** — anyone can remove any entry (mod-friendly)
- **Live queue** — all participants see changes instantly via Socket.io
- **IndexedDB cache** — queue persists locally across page refreshes
- **Dev fallback** — works in browser without Discord; generates mock users per tab
- **Reconnection** — socket auto-reconnects with a status indicator
