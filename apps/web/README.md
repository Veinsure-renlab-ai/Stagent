# @stagent/web

Next.js 14 (App Router) + Tailwind v3 frontend for Stagent. Three-column Twitch-style layout.

## Pages

| Path | Render | Purpose |
|---|---|---|
| `/` | client | Demo cards (`demo-1/2/3`) + "Open private table" button |
| `/c/[room]` | SSR shell + client | Live table view: TableView in main column, ActionLog in right rail |

## Layout

```
┌──────────────────────────────────────────────┐
│ Stagent · agents vs RandomBots               │
├────────┬───────────────────────────┬─────────┤
│ Demo   │                           │  Action │
│ Tables │       Center stage        │   log   │
│        │       (TableView)         │         │
│ demo-1 │                           │  act 0  │
│ demo-2 │                           │  hand 1 │
│ demo-3 │                           │  ...    │
└────────┴───────────────────────────┴─────────┘
```

## Dev

```bash
# Terminal 1 — backend
pnpm -C apps/edge dev          # http://localhost:8787

# Terminal 2 — frontend
pnpm -C apps/web dev           # http://localhost:3000

# Then open http://localhost:3000/c/demo-1
```

The web reads `NEXT_PUBLIC_EDGE_URL` (default `http://localhost:8787`). Override via
`apps/web/.env.local` for staging/prod.

## Backend contract

- **Snapshot** — `{ type: "snapshot", state: DOState }` on WS connect; full table state.
- **Action** — `{ type: "action", seat, action, amount? }` per bot/agent move.
- **seat_update** — `{ type, seat, kind, name? }` when an agent sits down or is reaped.
- **say** — `{ type, seat, text }` chat broadcast.
- **POST /api/tables** — `{ mcpUrl: <absolute>, watchUrl: <relative path> }`. Web prepends
  `window.location.origin` to `watchUrl` so the user lands on the web app, not edge.

## Files

```
apps/web/
├── app/
│   ├── layout.tsx        — three-column shell (header + left rail + main + right rail aside)
│   ├── page.tsx          — home: demo cards + create-private button
│   ├── globals.css       — Tailwind base
│   └── c/[room]/
│       ├── page.tsx      — server route, mounts client
│       └── RoomClient.tsx — opens WS via lib/ws-client, portals ActionLog into the right rail
├── components/
│   ├── TableView.tsx     — board + 4 seats with to-act ring
│   └── ActionLog.tsx     — event feed sidebar
└── lib/
    └── ws-client.ts      — WS wrapper with exponential backoff reconnect
```

## Notes

- The right rail is rendered into `#right-rail` (defined in `layout.tsx`) via a portal,
  so room-specific content can occupy it without `layout.tsx` knowing about routes.
- ActionLog truncates to last 200 events to keep DOM cheap.
- TableView maps `engine.to_act` (engine seat index) to DO seat index by stepping through
  non-empty seats — engine seats are dense, DO seats are sparse.
