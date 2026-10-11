# WatchTogether — YouTube Watch Party

Watch YouTube videos together in real time. Create a room, share the code, and everyone in the room sees the same video, play/pause state and seek position. The host decides who can control playback.

**Live app:** https://watchtogether.utkrsh.online
**Backend (API + WebSocket server):** https://watchtogether-tzj7.onrender.com

> The backend runs on Render's free tier, so the first request after a period of inactivity can take up to ~50 seconds while the service wakes up.

---

## Features

- **Accounts** — sign up / log in / log out (JWT stored in an httpOnly cookie, passwords hashed with bcrypt)
- **Rooms** — create a room and get a 6-character code; join with the code or the room link
- **YouTube sync** — embedded YouTube IFrame player kept in sync for everyone in the room
  - play / pause
  - seek (scrubbing)
  - change video (paste a YouTube URL)
  - late joiners start at the correct position
- **Role-based access control**
  - **Host** — the room creator; full control, can assign roles and remove participants
  - **Moderator** — can play/pause, seek and change the video
  - **Participant** — watch only (default for joiners)
- **Host controls** — promote a participant to Moderator (and back), remove a participant from the room
- **Live participant list** with roles, plus join/leave notifications
- **Server-side permission checks** — every playback or admin event is validated on the backend, not just hidden in the UI

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Backend | Node.js, Express 5, TypeScript |
| Real-time | WebSockets using the [`ws`](https://github.com/websockets/ws) library |
| Database | PostgreSQL (accessed with `pg`) |
| Video | YouTube IFrame Player API |
| Auth | JWT (`jsonwebtoken`), `bcrypt`, `cookie-parser` |
| Hosting | Vercel (frontend), Render (backend + PostgreSQL) |

---

## Project structure

```
watchtogether/
├── backend/
│   └── src/
│       ├── index.ts              # Express app + HTTP server, attaches the WS server
│       ├── config/db.config.ts   # PostgreSQL connection pool
│       ├── sql/schema.sql        # users and rooms tables
│       ├── routes/               # /api/auth and /api/rooms
│       ├── controllers/          # signup/login/me/ws-ticket, create/join room
│       ├── middlewares/          # cookie JWT auth for REST routes
│       └── ws-server/
│           ├── index.ts          # HTTP "upgrade" handler + connection lifecycle
│           ├── auth.ts           # verifies the WS ticket
│           ├── eventHandler.ts   # handles every WebSocket event
│           ├── guard.ts          # requireRole(): role check before an event runs
│           ├── room.ts           # Room class (participants, playback state, broadcast)
│           ├── state.ts          # in-memory maps of rooms and sessions
│           └── types.ts
└── frontend/
    ├── app/                      # pages: home, login, signup, room/[code]
    └── src/
        ├── hooks/useRoom.tsx     # WebSocket connection, reconnect logic, room state
        ├── hooks/useAuth.tsx
        ├── components/room/      # VideoPlayer, PeoplePanel, VideoInput, JoinGate
        ├── components/ui/        # Button, Input, Menu, Toast, icons
        └── lib/                  # api.ts, ws.ts (typed events), youtube.ts, types.ts
```

---

## Running locally

### Prerequisites

- Node.js 22 or newer
- PostgreSQL 13 or newer (the schema uses `gen_random_uuid()`)

### 1. Database

```bash
createdb watchtogether
psql watchtogether -f backend/src/sql/schema.sql
```

### 2. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
DATABASE_URL=postgres://USER:PASSWORD@localhost:5432/watchtogether
JWT_SECRET=pick-a-long-random-string
CLIENT_ORIGIN=http://localhost:3001
```

Build and start:

```bash
npx tsc
node dist/index.js
```

The backend listens on **http://localhost:3000** (REST under `/api`, WebSocket on the same port).

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs on **http://localhost:3001**. No env file is needed locally: the frontend defaults to `http://localhost:3000` for the API proxy and `ws://localhost:3000` for the WebSocket.

### 4. Try it

1. Open http://localhost:3001 and sign up.
2. Create a room and copy the code.
3. Open a second browser (or a private window), sign up as another user, and join with the code.
4. Paste a YouTube link as the host and press play. Both windows stay in sync.
5. As the host, open **Manage** next to the other user to make them a Moderator or remove them.

---

## Environment variables

### Backend

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign login tokens and WebSocket tickets |
| `CLIENT_ORIGIN` | Frontend origin allowed by CORS (e.g. `https://watchtogether.utkrsh.online`) |
| `NODE_ENV` | Set to `production` in deployment so the auth cookie is marked `secure` |

### Frontend

| Variable | Purpose |
|---|---|
| `BACKEND_URL` | Backend base URL used by the Next.js `/api` rewrite (e.g. `https://watchtogether-tzj7.onrender.com`) |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL, using `wss://` in production (e.g. `wss://watchtogether-tzj7.onrender.com`). Baked in at build time, so redeploy after changing it |

---

## Architecture overview

```
 Browser (Next.js)                         Backend (Express + ws)               PostgreSQL
 ─────────────────                         ──────────────────────               ──────────
 1. POST /api/auth/login  ─────────────►   verify password, set cookie  ───────► users
 2. POST /api/rooms/create ────────────►   generate code, store room    ───────► rooms
 3. GET  /api/auth/ws-ticket ──────────►   issue 30-second ticket (JWT)
 4. new WebSocket(wss://…?ticket=…) ───►   "upgrade" handler verifies ticket
 5. { event: "join_room", code } ──────►   Room created in memory, role assigned
 6.                                ◄─────  sync_state (participants, video, time)
 7. { event: "play" | "pause" | "seek" | "change_video" } ─► requireRole(Host/Moderator)
 8.                                ◄─────  broadcast to every socket in the room
```

### How real-time sync works

HTTP is request/response, so it can't push updates. A **WebSocket** keeps one connection open per user in both directions. When the host presses play, the browser sends a small JSON message `{ event: "play" }`. The server validates it, updates the room's state, and **broadcasts** the new state to every connection in that room. Each client then calls the YouTube player API to match.

### Why the data is split between REST and WebSocket

- **REST (`/api`)** handles accounts and creating/joining rooms. These are one-off requests.
- **WebSocket** handles everything live: playback events, roles and the participant list.
- **PostgreSQL** stores users and room records (code, host, video id). Live room state (who is connected, current playback position) is kept in memory on the server, since it changes constantly.

### Server-authoritative playback time

The server never stores "the current position" as a number that goes stale. It stores `currentTime` plus `updatedAt` (when that value was set) and the `playState`. While the room is playing, the real position is `currentTime + (now − updatedAt)`. Anyone who joins late gets this computed value in `sync_state` and starts at the right spot.

### Role-based access control

Roles are held on the server in the `Room` object. Before any protected event runs, `requireRole(socket, [...allowedRoles])` in `guard.ts`:

1. finds the socket's session, then the room and participant,
2. checks the participant's role against the allowed list,
3. replies with an `error` event and stops if the role is not allowed.

| Event | Allowed roles |
|---|---|
| `play`, `pause`, `seek`, `change_video` | Host, Moderator |
| `assign_role`, `remove_participant` | Host only |
| `join_room`, `leave_room` | any authenticated user |

Role changes are broadcast (`role_assigned`, `participant_removed`) with the full updated participant list, so every client updates its UI. The UI also hides controls the user doesn't have, but the server check is the real enforcement.

### WebSocket authentication (the "ticket")

The login cookie is stored for the **frontend's domain**, but the WebSocket connects to the **backend's domain**, and browsers don't send a cookie across domains. So:

1. The frontend calls `GET /api/auth/ws-ticket` (a normal request through the Next.js proxy, which does carry the cookie).
2. The backend returns a short-lived JWT (30 seconds, `purpose: "ws"`).
3. The frontend opens `wss://backend/?ticket=<jwt>`.
4. In the HTTP `upgrade` handler the server verifies the ticket **before** the WebSocket is created. Invalid tickets get a `401` and the connection is destroyed.

### Client reconnection

`useRoom.tsx` reconnects automatically with exponential backoff (1s, 2s, 4s … up to 10s). Each attempt fetches a fresh ticket. If the session has expired (401), the user is sent to the login page.

### WebSocket events

| Event | Direction | Payload |
|---|---|---|
| `join_room` | client → server | `{ code }` |
| `leave_room` | client → server | – |
| `play` / `pause` | client → server | – |
| `seek` | client → server | `{ time }` |
| `change_video` | client → server | `{ videoId }` |
| `assign_role` | client → server | `{ userId, role }` |
| `remove_participant` | client → server | `{ userId }` |
| `sync_state` | server → client | `{ participants, playState, videoId, currentTime }` |
| `user_joined` / `user_left` | server → clients | `{ userId, username, role?, participants }` |
| `play` / `pause` / `seek` / `change_video` | server → clients | `{ playState, currentTime, videoId }` |
| `role_assigned` | server → clients | `{ userId, username, role, participants }` |
| `participant_removed` | server → clients | `{ userId, participants }` |
| `error` | server → client | message string |

### Keeping players in sync on the client

- A flag marks changes caused by a server update so the player's own events are not echoed back to the server (prevents feedback loops).
- Every few seconds the client compares its player position to the expected server position and corrects it if it has drifted by more than about 1.5 seconds.
- If the browser blocks autoplay, the user sees a prompt to start playback.

---

## REST API

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | – | Create an account |
| POST | `/api/auth/login` | – | Log in (sets httpOnly cookie) |
| POST | `/api/auth/logout` | cookie | Log out |
| GET | `/api/auth/me` | cookie | Current user |
| GET | `/api/auth/ws-ticket` | cookie | Short-lived ticket for the WebSocket |
| POST | `/api/rooms/create` | cookie | Create a room (caller becomes Host) |
| POST | `/api/rooms/join` | cookie | Look up a room by code |

---

## Deployment

### Backend (Render, Web Service)

- **Root directory:** `backend`
- **Build command:** `npm install --include=dev && npx tsc`
  (`--include=dev` is needed because Render sets `NODE_ENV=production`, which would otherwise skip the TypeScript and `@types/*` dev dependencies that the build needs)
- **Start command:** `node dist/index.js`
- **Environment:** `DATABASE_URL`, `JWT_SECRET`, `CLIENT_ORIGIN`, `NODE_ENV=production`
- Run `backend/src/sql/schema.sql` once against the Render PostgreSQL database.

### Frontend (Vercel)

- **Root directory:** `frontend` (the repo is a monorepo, so Vercel must be pointed at this folder)
- **Environment:** `BACKEND_URL`, `NEXT_PUBLIC_WS_URL`
- Redeploy after changing `NEXT_PUBLIC_*` variables, since they are inlined at build time.

### Deployment notes and trade-offs

- **Cross-domain cookies:** solved with the WebSocket ticket described above rather than loosening cookie settings.
- **`secure` cookie:** enabled only in production so local HTTP development still works.
- **Free-tier cold starts:** Render free services sleep when idle; the client's retry logic handles the delay.

---

## Known limitations and future work

- Live room state is in memory, so it is lost if the backend restarts, and moderator assignments reset once a room becomes empty. Persisting roles and the current video in PostgreSQL would fix this.
- There is no server-side ping/pong heartbeat. Hosting proxies can drop a WebSocket that stays idle for a long time; if that happens, refreshing or rejoining the room opens a fresh connection. Adding a periodic `ping()` from the server (and terminating sockets that don't answer) would fix this.
- The backend runs as a single instance. Scaling horizontally would need a Redis pub/sub layer so broadcasts reach sockets on other instances.
- Not implemented: transfer host, in-room chat, emoji reactions, and a "request approval from host/moderator" flow for participants.
- The WebSocket server logic lives in a handful of modules (`Room` class plus functions). It could be refactored further into `Participant` and `MessageHandler` classes.