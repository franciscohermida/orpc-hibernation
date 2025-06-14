# oRPC Hibernation Study

A minimal example demonstrating **stateless-stateful notification flow** using oRPC + Hibernation plugin, Cloudflare Workers, and Durable Objects.

## Architecture

```
[Stateless API] → [Durable Object] → [WebSocket Clients]
```

1. **Stateless Routes** (`/api/rpc`) handle CRUD operations
2. **Broadcast to Durable Object** when data changes
3. **Durable Object** maintains WebSocket connections and forwards events
4. **Clients** receive real-time notifications

## Key Files

- `server/rpc/router/todo.router.ts` - Stateless API that broadcasts events
- `server/subscriptions/dos/DurableSubscription.ts` - Stateful WebSocket handler
- `server/subscriptions/router/server.router.ts` - Internal broadcast endpoint
- `server/subscriptions/router/client.router.ts` - Client event stream

## Flow Example

1. Client calls `POST /api/rpc/todo/create`
2. Stateless handler creates todo
3. Handler calls `broadcastTodoEvent()` → Durable Object
4. Durable Object sends event to all connected WebSocket clients
5. Clients receive `todo.created` event in real-time

## Authentication

WIP not fully implemented yet

- **HTTP requests**: `x-user-id` header
- **WebSocket**: `userId` query parameter (cookies also supported)
- **User isolation**: Each user gets their own Durable Object instance

## Run

```bash
pnpm install
pnpm run dev
```

Open browser → Create/update todos → See real-time updates across tabs
